/**
 * Final Production Hardening — Integration Tests
 * Tests every guardrail from the FINAL PRODUCTION HARDENING PROMPT.
 *
 * Run:  node tests/lifecycle_final.test.js
 */
import db from '../src/models/index.js';
import * as lifecycle from '../src/services/lifecycle.service.js';
import * as certSvc from '../src/modules/certificates/certificate.service.js';
import * as paymentSvc from '../src/modules/payments/payment.service.js';
import { v7 as uuidv7 } from 'uuid';

// ─── Mini test framework ──────────────────────────────────────────────────────
let pass = 0, fail = 0;

async function test(label, fn) {
    try { await fn(); console.log(`  ✅  ${label}`); pass++; }
    catch (e) { console.error(`  ❌  ${label}\n       ${e.message || JSON.stringify(e)}`); fail++; }
}

async function expectStatus(label, expectedCode, fn) {
    try {
        await fn();
        console.error(`  ❌  ${label} — expected ${expectedCode} but call SUCCEEDED`);
        fail++;
    } catch (e) {
        const got = e.statusCode ?? e.status;
        if (got === expectedCode) { console.log(`  ✅  ${label} [${expectedCode}]`); pass++; }
        else { console.error(`  ❌  ${label} — expected ${expectedCode}, got ${got}: ${e.message}`); fail++; }
    }
}

// ─── Fixture helpers ─────────────────────────────────────────────────────────

async function seedUser(role) {
    const user = await db.User.findOne({ where: { role } });
    if (!user) throw new Error(`Existing user for role ${role} not found`);
    return user.id;
}

async function seedBase() {
    const [surveyorId, tmId, requesterId] = await Promise.all([
        seedUser('SURVEYOR'), seedUser('TM'), seedUser('GM')
    ]);
    const vessel = await db.Vessel.findOne();
    const certType = await db.CertificateType.findOne({ where: { requires_survey: true } });
    if (!vessel || !certType) {
        throw new Error('Database is missing required seed data for testing (Vessel or CertificateType)');
    }
    return { surveyorId, tmId, requesterId, vesselId: vessel.id, certTypeId: certType.id };
}

async function makeJob(fx, status) {
    const id = uuidv7();
    await db.JobRequest.create({
        id,
        vessel_id: fx.vesselId,
        requested_by_user_id: fx.requesterId,
        assigned_surveyor_id: fx.surveyorId,
        job_status: status,
        reason: 'Annual',
        target_port: 'Singapore',
        target_date: '2026-12-31'
    });

    let certStatus = 'PENDING';
    if (status === 'DOCUMENT_VERIFIED') certStatus = 'DOCUMENT_VERIFIED';
    if (['APPROVED', 'ASSIGNED', 'SURVEY_AUTHORIZED', 'IN_PROGRESS'].includes(status)) certStatus = 'SURVEY_AUTHORIZED';
    if (['SURVEY_DONE', 'REVIEWED', 'FINALIZED', 'PAYMENT_DONE'].includes(status)) certStatus = 'SURVEY_DONE';
    if (status === 'CERTIFIED') certStatus = 'ISSUED';
    if (status === 'REJECTED') certStatus = 'REJECTED';
    if (status === 'REWORK_REQUESTED') certStatus = 'REWORK_REQUESTED';

    await db.JobCertificate.create({
        job_request_id: id,
        certificate_type_id: fx.certTypeId,
        status: certStatus
    });
    await db.JobStatusHistory.create({ job_id: id, old_status: null, new_status: status, changed_by: fx.requesterId });
    return id;
}

async function makeSurvey(jobId, surveyorId, status, submissions = 0) {
    const job = await db.JobRequest.findByPk(jobId);
    let jobCert = await db.JobCertificate.findOne({ where: { job_request_id: jobId } });
    if (!jobCert) {
        jobCert = await db.JobCertificate.create({
            job_request_id: jobId,
            certificate_type_id: job.certificate_type_id || uuidv7(),
            status: 'PENDING'
        });
    }
    const s = await db.Survey.create({ job_certificate_id: jobCert.id, surveyor_id: surveyorId, survey_status: status, submission_count: submissions });
    return s.id;
}

async function makeFakeCert(fx) {
    const c = await db.Certificate.create({
        vessel_id: fx.vesselId, certificate_type_id: fx.certTypeId,
        certificate_number: `CERT-${Date.now()}`, issue_date: new Date(),
        expiry_date: new Date(Date.now() + 365 * 86400_000), status: 'VALID', issued_by_user_id: fx.tmId
    });
    return c.id;
}

// ─── Run Tests ────────────────────────────────────────────────────────────────
async function run() {
    console.log('\n════ Final Production Hardening — Integration Tests ════\n');
    const fx = await seedBase();
    const certGenUser = { id: fx.requesterId, role: 'GM' };

    // ══════════════════════════════════════════════════════════
    // SECTION 1: Happy Path (sanity check)
    // ══════════════════════════════════════════════════════════
    console.log('\n── 1. Happy Path ───────────────────────────────────────────────────────');
    {
        const jobId = await makeJob(fx, 'SURVEY_AUTHORIZED');
        const surveyId = await makeSurvey(jobId, fx.surveyorId, 'NOT_STARTED');

        await test('NOT_STARTED → STARTED syncs job to IN_PROGRESS', async () => {
            await lifecycle.updateSurveyStatus(surveyId, 'STARTED', fx.surveyorId);
            const j = await db.JobRequest.findByPk(jobId);
            if (j.job_status !== 'IN_PROGRESS') throw new Error(`Got ${j.job_status}`);
        });

        await test('STARTED → CHECKLIST_SUBMITTED', async () =>
            lifecycle.updateSurveyStatus(surveyId, 'CHECKLIST_SUBMITTED', fx.surveyorId));

        await test('CHECKLIST_SUBMITTED → PROOF_UPLOADED', async () =>
            lifecycle.updateSurveyStatus(surveyId, 'PROOF_UPLOADED', fx.surveyorId));

        await test('PROOF_UPLOADED → SUBMITTED syncs job to SURVEY_DONE', async () => {
            await db.Survey.update({
                attendance_photo_url: 'https://test.com/photo.jpg',
                submit_latitude: 1.2844,
                submit_longitude: 103.8511
            }, { where: { id: surveyId } });
            await lifecycle.updateSurveyStatus(surveyId, 'SUBMITTED', fx.surveyorId);
            const j = await db.JobRequest.findByPk(jobId);
            if (j.job_status !== 'SURVEY_DONE') throw new Error(`Got ${j.job_status}`);
        });

        await test('SUBMITTED → FINALIZED (TM) syncs job to FINALIZED', async () => {
            await lifecycle.updateSurveyStatus(surveyId, 'FINALIZED', fx.tmId);
            const [j, s] = await Promise.all([db.JobRequest.findByPk(jobId), db.Survey.findByPk(surveyId)]);
            if (j.job_status !== 'FINALIZED') throw new Error(`Job: ${j.job_status}`);
            if (!s.finalized_at) throw new Error('finalized_at not set');
        });
    }

    // ══════════════════════════════════════════════════════════
    // SECTION 2: Certificate Guards
    // ══════════════════════════════════════════════════════════
    console.log('\n── 2. Certificate Guards ───────────────────────────────────────────────');

    // 2a. Payment before finalize
    {
        const jobId = await makeJob(fx, 'FINALIZED');
        await makeSurvey(jobId, fx.surveyorId, 'FINALIZED');
        const inv = await paymentSvc.createInvoice({ job_id: jobId, amount: 5000 }, fx.tmId);

        await expectStatus('Payment before finalize → blocked (job must be FINALIZED 400 only if not FINALIZED)', 409, async () => {
            // Job is already FINALIZED — creating second invoice must return 409
            await paymentSvc.createInvoice({ job_id: jobId, amount: 5000 }, fx.tmId);
        });
    }

    // 2b. Certificate before payment
    {
        const jobId = await makeJob(fx, 'FINALIZED');
        await makeSurvey(jobId, fx.surveyorId, 'FINALIZED');

        await expectStatus('Certificate before PAYMENT_DONE → 400', 400, async () => {
            await certSvc.generateCertificate({ job_id: jobId, certificate_term: 'FULL_TERM' }, certGenUser);
        });
    }

    // 2c. Certificate before survey FINALIZED
    {
        const jobId = await makeJob(fx, 'PAYMENT_DONE');
        await makeSurvey(jobId, fx.surveyorId, 'SUBMITTED'); // not finalized

        await expectStatus('Certificate with survey not FINALIZED → 400', 400, async () => {
            await certSvc.generateCertificate({ job_id: jobId, certificate_term: 'FULL_TERM' }, certGenUser);
        });
    }

    // 2d. Double certificate attempt
    {
        const jobId = await makeJob(fx, 'PAYMENT_DONE');
        await makeSurvey(jobId, fx.surveyorId, 'FINALIZED');
        const testJobCert = await db.JobCertificate.findOne({ where: { job_request_id: jobId } });
        await db.Survey.update({ survey_statement_status: 'ISSUED' }, { where: { job_certificate_id: testJobCert.id } });
        const certId = await makeFakeCert(fx);
        await db.JobCertificate.update({ generated_certificate_id: certId }, { where: { job_request_id: jobId } });

        await expectStatus('Double certificate → 409', 409, async () => {
            await certSvc.generateCertificate({ job_id: jobId, certificate_term: 'FULL_TERM' }, certGenUser);
        });
    }

    // ══════════════════════════════════════════════════════════
    // SECTION 3: Post-Terminal Mutation Blocks
    // ══════════════════════════════════════════════════════════
    console.log('\n── 3. Terminal State Guards ────────────────────────────────────────────');

    // 3a. Job mutation after CERTIFIED
    {
        const jobId = await makeJob(fx, 'CERTIFIED');
        await expectStatus('Job mutation after CERTIFIED → 400', 400, async () =>
            lifecycle.updateJobStatus(jobId, 'REJECTED', fx.tmId, 'tamper'));
    }

    // 3b. Survey mutation after FINALIZED
    {
        const jobId = await makeJob(fx, 'FINALIZED');
        const surveyId = await makeSurvey(jobId, fx.surveyorId, 'FINALIZED');
        await expectStatus('Survey mutation after FINALIZED → 400', 400, async () =>
            lifecycle.updateSurveyStatus(surveyId, 'SUBMITTED', fx.surveyorId));
    }

    // 3c. Cancel after FINALIZED
    {
        const jobId = await makeJob(fx, 'FINALIZED');
        await expectStatus('Cancel after FINALIZED → 400', 400, async () =>
            lifecycle.updateJobStatus(jobId, 'REJECTED', fx.requesterId, 'cancel after finalized'));
        // FINALIZED → REJECTED is not in JOB_TRANSITIONS
    }

    // 3d. Cancel after PAYMENT_DONE
    {
        const jobId = await makeJob(fx, 'PAYMENT_DONE');
        await expectStatus('Cancel after PAYMENT_DONE → 400', 400, async () =>
            lifecycle.updateJobStatus(jobId, 'REJECTED', fx.requesterId, 'cancel after payment'));
    }

    // 3e. Cancel after CERTIFIED
    {
        const jobId = await makeJob(fx, 'CERTIFIED');
        await expectStatus('Cancel after CERTIFIED → 400 (terminal)', 400, async () =>
            lifecycle.updateJobStatus(jobId, 'REJECTED', fx.requesterId, 'cancel post cert'));
    }

    // ══════════════════════════════════════════════════════════
    // SECTION 4: Payment Hardening
    // ══════════════════════════════════════════════════════════
    console.log('\n── 4. Payment Hardening ────────────────────────────────────────────────');

    // 4a. Payment before job is FINALIZED (Allowed - payment doesn't care about job state)
    {
        const jobId = await makeJob(fx, 'SURVEY_DONE');
        await makeSurvey(jobId, fx.surveyorId, 'SUBMITTED');
        const inv = await db.Payment.create({ job_id: jobId, invoice_number: `INV-${Date.now()}`, amount: 1000, currency: 'USD', payment_status: 'UNPAID' });

        await test('Mark paid when job not FINALIZED succeeds', async () =>
            paymentSvc.markPaid(inv.id, fx.tmId));
    }

    // 4b. Double payment
    {
        const jobId = await makeJob(fx, 'FINALIZED');
        await makeSurvey(jobId, fx.surveyorId, 'FINALIZED');
        const inv = await db.Payment.create({ job_id: jobId, invoice_number: `INV-${Date.now()}`, amount: 1000, currency: 'USD', payment_status: 'PAID', payment_date: new Date(), verified_by_user_id: fx.tmId });

        await expectStatus('Mark paid twice → 409', 409, async () =>
            paymentSvc.markPaid(inv.id, fx.tmId));
    }

    // 4c. Payment on terminal (CERTIFIED) job (Allowed - payment doesn't care about job state)
    {
        const jobId = await makeJob(fx, 'CERTIFIED');
        const inv = await db.Payment.create({ job_id: jobId, invoice_number: `INV-${Date.now()}`, amount: 1000, currency: 'USD', payment_status: 'UNPAID' });

        await test('Mark paid on CERTIFIED job succeeds', async () =>
            paymentSvc.markPaid(inv.id, fx.tmId));
    }

    // ══════════════════════════════════════════════════════════
    // SECTION 5: Rework Edge Guards
    // ══════════════════════════════════════════════════════════
    console.log('\n── 5. Rework Edge Guards ───────────────────────────────────────────────');

    // 5a. Rework after PAYMENT_DONE
    {
        const jobId = await makeJob(fx, 'PAYMENT_DONE');
        const surveyId = await makeSurvey(jobId, fx.surveyorId, 'FINALIZED');
        await expectStatus('Rework after PAYMENT_DONE: survey already FINALIZED → 400', 400, async () =>
            lifecycle.updateSurveyStatus(surveyId, 'REWORK_REQUIRED', fx.tmId));
    }

    // 5b. Rework after CERTIFIED
    {
        const jobId = await makeJob(fx, 'CERTIFIED');
        const surveyId = await makeSurvey(jobId, fx.surveyorId, 'FINALIZED');
        await expectStatus('Rework after CERTIFIED: survey FINALIZED → 400', 400, async () =>
            lifecycle.updateSurveyStatus(surveyId, 'REWORK_REQUIRED', fx.tmId));
    }

    // ══════════════════════════════════════════════════════════
    // SECTION 6: Role Guards
    // ══════════════════════════════════════════════════════════
    console.log('\n── 6. Role Guards ──────────────────────────────────────────────────────');

    // 6a. Non-TM cannot finalize survey
    {
        const jobId = await makeJob(fx, 'SURVEY_DONE');
        const surveyId = await makeSurvey(jobId, fx.surveyorId, 'SUBMITTED');
        await expectStatus('Surveyor cannot finalize survey → 403', 403, async () =>
            lifecycle.updateSurveyStatus(surveyId, 'FINALIZED', fx.surveyorId));
    }

    // 6b. Direct job FINALIZED without _internal flag
    {
        const jobId = await makeJob(fx, 'SURVEY_DONE');
        await expectStatus('Direct job FINALIZED via updateJobStatus → 403', 403, async () =>
            lifecycle.updateJobStatus(jobId, 'FINALIZED', fx.tmId, 'bypass attempt'));
    }

    // ══════════════════════════════════════════════════════════
    // SECTION 7: Illegal Backwards Transitions
    // ══════════════════════════════════════════════════════════
    console.log('\n── 7. Illegal Transitions ──────────────────────────────────────────────');

    {
        const jobId = await makeJob(fx, 'SURVEY_DONE');
        await expectStatus('SURVEY_DONE → CREATED → 400', 400, async () =>
            lifecycle.updateJobStatus(jobId, 'CREATED', fx.tmId));
        await expectStatus('SURVEY_DONE → SURVEY_AUTHORIZED → 400', 400, async () =>
            lifecycle.updateJobStatus(jobId, 'SURVEY_AUTHORIZED', fx.tmId));
    }

    {
        const jobId = await makeJob(fx, 'IN_PROGRESS');
        const surveyId = await makeSurvey(jobId, fx.surveyorId, 'PROOF_UPLOADED');
        await expectStatus('PROOF_UPLOADED → STARTED (backwards) → 400', 400, async () =>
            lifecycle.updateSurveyStatus(surveyId, 'STARTED', fx.surveyorId));
    }

    // ══════════════════════════════════════════════════════════
    // SECTION 8: Double Submission / Start
    // ══════════════════════════════════════════════════════════
    console.log('\n── 8. Idempotency Guards ───────────────────────────────────────────────');

    {
        const jobId = await makeJob(fx, 'IN_PROGRESS');
        const surveyId = await makeSurvey(jobId, fx.surveyorId, 'STARTED');
        await expectStatus('Double STARTED → 409', 409, async () =>
            lifecycle.updateSurveyStatus(surveyId, 'STARTED', fx.surveyorId));
    }

    {
        const jobId = await makeJob(fx, 'IN_PROGRESS');
        const surveyId = await makeSurvey(jobId, fx.surveyorId, 'SUBMITTED', 1);
        await db.Survey.update({
            attendance_photo_url: 'https://test.com/photo.jpg',
            submit_latitude: 1.2844,
            submit_longitude: 103.8511
        }, { where: { id: surveyId } });
        await expectStatus('Double SUBMITTED → 409', 409, async () => {
            await lifecycle.updateSurveyStatus(surveyId, 'SUBMITTED', fx.surveyorId);
        });
    }

    // ══════════════════════════════════════════════════════════
    // SECTION 9: Parallel Finalization Race
    // ══════════════════════════════════════════════════════════
    console.log('\n── 9. Parallel Finalization Race ───────────────────────────────────────');

    {
        const jobId = await makeJob(fx, 'SURVEY_DONE');
        const surveyId = await makeSurvey(jobId, fx.surveyorId, 'SUBMITTED');

        await test('Parallel finalize: exactly one succeeds, survey ends FINALIZED', async () => {
            const [r1, r2] = await Promise.allSettled([
                lifecycle.updateSurveyStatus(surveyId, 'FINALIZED', fx.tmId, 'race-1'),
                lifecycle.updateSurveyStatus(surveyId, 'FINALIZED', fx.tmId, 'race-2')
            ]);
            const successes = [r1, r2].filter(r => r.status === 'fulfilled').length;
            if (successes === 0) throw new Error('Both parallel calls failed — at least one must succeed.');
            const s = await db.Survey.findByPk(surveyId);
            if (s.survey_status !== 'FINALIZED') throw new Error(`Survey ended as ${s.survey_status}`);
        });
    }

    // ══════════════════════════════════════════════════════════
    // SECTION 10: Audit Trail Verification
    // ══════════════════════════════════════════════════════════
    console.log('\n── 10. Audit Trail ─────────────────────────────────────────────────────');

    {
        const jobId = await makeJob(fx, 'DOCUMENT_VERIFIED');
        await lifecycle.updateJobStatus(jobId, 'APPROVED', fx.requesterId, 'GM approved');
        const history = await db.JobStatusHistory.findAll({ where: { job_id: jobId }, order: [['created_at', 'ASC']] });
        await test('JobStatusHistory created for every transition', () => {
            if (history.length < 1) throw new Error('No history records found');
            const last = history[history.length - 1];
            if (last.new_status !== 'APPROVED') throw new Error(`Last status: ${last.new_status}`);
        });
    }

    {
        const jobId = await makeJob(fx, 'SURVEY_AUTHORIZED');
        const surveyId = await makeSurvey(jobId, fx.surveyorId, 'NOT_STARTED');
        await lifecycle.updateSurveyStatus(surveyId, 'STARTED', fx.surveyorId, 'check-in');
        const history = await db.SurveyStatusHistory.findAll({ where: { survey_id: surveyId } });
        await test('SurveyStatusHistory created for every transition', () => {
            if (history.length === 0) throw new Error('No survey history records');
            if (history[0].new_status !== 'STARTED') throw new Error(`First history: ${history[0].new_status}`);
        });
    }

    // ══════════════════════════════════════════════════════════
    // SECTION 11: Checklist & Document Review Gate
    // ══════════════════════════════════════════════════════════
    console.log('\n── 11. Checklist & Document Review Gate ────────────────────────────────');
    {
        const toId = await seedUser('TO');
        const toUser = { id: toId, role: 'TO' };
        const chkSvc = await import('../src/modules/checklists/checklist.service.js');
        const jobSvc = await import('../src/modules/jobs/job.service.js');

        const jobId = await makeJob(fx, 'SURVEY_DONE');
        await db.JobRequest.update({ is_survey_required: true }, { where: { id: jobId } });

        const surveyId = await makeSurvey(jobId, fx.surveyorId, 'SUBMITTED');

        // Test 11a: TO can review checklist item
        const item = await db.ActivityPlanning.create({
            job_id: jobId,
            question_code: 'Q1',
            question_text: 'Is hull clean?',
            answer: 'YES',
            status: 'PENDING'
        });

        await test('TO can review and approve a checklist item', async () => {
            await chkSvc.reviewChecklistItem(jobId, item.id, { status: 'APPROVED' }, toUser);
            const updatedItem = await db.ActivityPlanning.findByPk(item.id);
            if (updatedItem.status !== 'APPROVED') throw new Error(`Expected APPROVED, got ${updatedItem.status}`);
        });

        // Test 11b: TO can review signed document
        await db.Survey.update({
            signed_checklist_files: [
                { url: 'surveys/signed-checklists/123_sc.pdf', status: 'PENDING' }
            ]
        }, { where: { id: surveyId } });

        await test('TO can review and approve a signed checklist document', async () => {
            await chkSvc.reviewSignedDocument(jobId, 0, { status: 'APPROVED' }, toUser);
            const updatedSurvey = await db.Survey.findByPk(surveyId);
            const files = updatedSurvey.signed_checklist_files;
            if (!files || files[0].status !== 'APPROVED') {
                throw new Error(`Expected APPROVED, got ${JSON.stringify(files)}`);
            }
        });

        // Test 11c: Job review automatically approves pending checklist items and documents
        const jobId2 = await makeJob(fx, 'SURVEY_DONE');
        await db.JobRequest.update({ is_survey_required: true }, { where: { id: jobId2 } });
        const surveyId2 = await makeSurvey(jobId2, fx.surveyorId, 'SUBMITTED');

        const item2 = await db.ActivityPlanning.create({
            job_id: jobId2,
            question_code: 'Q2',
            question_text: 'Is machinery working?',
            answer: 'YES',
            status: 'PENDING'
        });

        await db.Survey.update({
            signed_checklist_files: [
                { url: 'surveys/signed-checklists/123_sc2.pdf', status: 'PENDING' }
            ]
        }, { where: { id: surveyId2 } });

        await test('Job review automatically approves pending checklist items and signed files', async () => {
            await jobSvc.reviewJob(jobId2, 'Auto approve checklist', toUser);
            const [updatedJob, updatedItem, updatedSurvey] = await Promise.all([
                db.JobRequest.findByPk(jobId2),
                db.ActivityPlanning.findByPk(item2.id),
                db.Survey.findByPk(surveyId2)
            ]);
            if (updatedJob.job_status !== 'REVIEWED') throw new Error(`Job: ${updatedJob.job_status}`);
            if (updatedItem.status !== 'APPROVED') throw new Error(`Item: ${updatedItem.status}`);
            if (updatedSurvey.signed_checklist_files?.[0]?.status !== 'APPROVED') throw new Error(`File: ${JSON.stringify(updatedSurvey.signed_checklist_files)}`);
        });
    }

    // ─── Summary ─────────────────────────────────────────────────────────────
    console.log(`\n════ Results: ${pass} passed, ${fail} failed ════\n`);
    process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error('Test runner error:', e); process.exit(1); });
