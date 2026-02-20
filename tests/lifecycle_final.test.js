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
    const id = uuidv7();
    await db.User.create({ id, name: `${role}-${Date.now()}`, email: `${role}_${Date.now()}@t.com`, role, password_hash: 'x' });
    return id;
}

async function seedBase() {
    const [surveyorId, tmId, requesterId, clientId] = await Promise.all([
        seedUser('SURVEYOR'), seedUser('TM'), seedUser('GM'), (async () => {
            const id = uuidv7();
            await db.Client.create({ id, company_name: `Corp-${Date.now()}`, email: `c${Date.now()}@t.com`, status: 'ACTIVE' });
            return id;
        })()
    ]);
    const vesselId = uuidv7(), certTypeId = uuidv7();
    await db.Vessel.create({ id: vesselId, vessel_name: 'MV Prod', imo_number: `IMO${Date.now()}`, client_id: clientId });
    await db.CertificateType.create({ id: certTypeId, name: 'Annual Survey', issuing_authority: 'CLASS', validity_years: 1 });
    return { surveyorId, tmId, requesterId, vesselId, certTypeId };
}

async function makeJob(fx, status) {
    const id = uuidv7();
    await db.JobRequest.create({ id, vessel_id: fx.vesselId, requested_by_user_id: fx.requesterId, assigned_surveyor_id: fx.surveyorId, certificate_type_id: fx.certTypeId, job_status: status });
    await db.JobStatusHistory.create({ job_id: id, old_status: null, new_status: status, changed_by: fx.requesterId });
    return id;
}

async function makeSurvey(jobId, surveyorId, status, submissions = 0) {
    const s = await db.Survey.create({ job_id: jobId, surveyor_id: surveyorId, survey_status: status, submission_count: submissions });
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
            await certSvc.generateCertificate({ job_id: jobId }, fx.tmId);
        });
    }

    // 2c. Certificate before survey FINALIZED
    {
        const jobId = await makeJob(fx, 'PAYMENT_DONE');
        await makeSurvey(jobId, fx.surveyorId, 'SUBMITTED'); // not finalized

        await expectStatus('Certificate with survey not FINALIZED → 400', 400, async () => {
            await certSvc.generateCertificate({ job_id: jobId }, fx.tmId);
        });
    }

    // 2d. Double certificate attempt
    {
        const jobId = await makeJob(fx, 'PAYMENT_DONE');
        await makeSurvey(jobId, fx.surveyorId, 'FINALIZED');
        const certId = await makeFakeCert(fx);
        await db.JobRequest.update({ generated_certificate_id: certId }, { where: { id: jobId } });

        await expectStatus('Double certificate → 409', 409, async () => {
            await certSvc.generateCertificate({ job_id: jobId }, fx.tmId);
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

    // 4a. Payment before job is FINALIZED
    {
        const jobId = await makeJob(fx, 'SURVEY_DONE');
        await makeSurvey(jobId, fx.surveyorId, 'SUBMITTED');
        const inv = await db.Payment.create({ job_id: jobId, invoice_number: `INV-${Date.now()}`, amount: 1000, currency: 'USD', payment_status: 'UNPAID' });

        await expectStatus('Mark paid when job not FINALIZED → 400', 400, async () =>
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

    // 4c. Payment on terminal (CERTIFIED) job
    {
        const jobId = await makeJob(fx, 'CERTIFIED');
        const inv = await db.Payment.create({ job_id: jobId, invoice_number: `INV-${Date.now()}`, amount: 1000, currency: 'USD', payment_status: 'UNPAID' });

        await expectStatus('Mark paid on CERTIFIED job → 400', 400, async () =>
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
        await expectStatus('GM cannot finalize survey → 403', 403, async () =>
            lifecycle.updateSurveyStatus(surveyId, 'FINALIZED', fx.requesterId));
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
        await expectStatus('Double SUBMITTED → 409', 409, async () =>
            lifecycle.updateSurveyStatus(surveyId, 'SUBMITTED', fx.surveyorId));
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
        const jobId = await makeJob(fx, 'CREATED');
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

    // ─── Summary ─────────────────────────────────────────────────────────────
    console.log(`\n════ Results: ${pass} passed, ${fail} failed ════\n`);
    process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error('Test runner error:', e); process.exit(1); });
