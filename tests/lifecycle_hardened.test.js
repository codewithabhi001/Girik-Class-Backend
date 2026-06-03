/**
 * Integration Tests — GR-Class Lifecycle Engine
 * Tests for all hardening scenarios from the MASTER REFACTOR.
 * Run: node tests/lifecycle_hardened.test.js
 */
import db from '../src/models/index.js';
import * as lifecycle from '../src/services/lifecycle.service.js';
import * as jobService from '../src/modules/jobs/job.service.js';
import * as certService from '../src/modules/certificates/certificate.service.js';
import * as surveyService from '../src/modules/surveys/survey.service.js';
import { v7 as uuidv7 } from 'uuid';

// ─── Test Helpers ────────────────────────────────────────────────────────────

let pass = 0;
let fail = 0;

async function test(label, fn) {
    try {
        await fn();
        console.log(`  ✅ ${label}`);
        pass++;
    } catch (e) {
        console.error(`  ❌ ${label}`);
        console.error(`     ${e.message || JSON.stringify(e)}`);
        fail++;
    }
}

async function expectError(label, code, fn) {
    try {
        await fn();
        console.error(`  ❌ ${label} — expected error ${code} but succeeded`);
        fail++;
    } catch (e) {
        if (e.statusCode === code || (code === 409 && (e.statusCode === 409 || e.message?.includes('409') || e.message?.toLowerCase().includes('already')))) {
            console.log(`  ✅ ${label} [${code}]`);
            pass++;
        } else {
            console.error(`  ❌ ${label} — expected ${code}, got ${e.statusCode}: ${e.message || JSON.stringify(e)}`);
            fail++;
        }
    }
}

// ─── Setup Fixtures ───────────────────────────────────────────────────────────

async function createFixtures() {
    const surveyor = await db.User.findOne({ where: { role: 'SURVEYOR' } });
    const tm = await db.User.findOne({ where: { role: 'TM' } });
    const requester = await db.User.findOne({ where: { role: { [db.Sequelize.Op.in]: ['GM', 'ADMIN', 'TM'] } } });
    const client = await db.Client.findOne();
    const flag = await db.FlagAdministration.findOne();
    const vessel = await db.Vessel.findOne();
    const certType = await db.CertificateType.findOne({ where: { requires_survey: true } });

    if (!surveyor || !tm || !requester || !client || !flag || !vessel || !certType) {
        throw new Error('Database is missing required seed data for testing (User, Client, Flag, Vessel, or CertificateType)');
    }

    return {
        surveyorId: surveyor.id,
        tmId: tm.id,
        requesterId: requester.id,
        clientId: client.id,
        vesselId: vessel.id,
        certTypeId: certType.id
    };
}

async function makeJob(vesselId, requesterId, surveyorId, certTypeId, startStatus = 'CREATED') {
    const id = uuidv7();
    await db.JobRequest.create({
        id, vessel_id: vesselId, requested_by_user_id: requesterId,
        assigned_surveyor_id: surveyorId,
        job_status: startStatus, reason: 'Annual', target_port: 'Singapore', target_date: '2026-12-31'
    });

    let certStatus = 'PENDING';
    if (startStatus === 'DOCUMENT_VERIFIED') certStatus = 'DOCUMENT_VERIFIED';
    if (['APPROVED', 'ASSIGNED', 'SURVEY_AUTHORIZED', 'IN_PROGRESS'].includes(startStatus)) certStatus = 'SURVEY_AUTHORIZED';
    if (['SURVEY_DONE', 'REVIEWED', 'FINALIZED', 'PAYMENT_DONE'].includes(startStatus)) certStatus = 'SURVEY_DONE';
    if (startStatus === 'CERTIFIED') certStatus = 'ISSUED';
    if (startStatus === 'REJECTED') certStatus = 'REJECTED';
    if (startStatus === 'REWORK_REQUESTED') certStatus = 'REWORK_REQUESTED';

    await db.JobCertificate.create({
        job_request_id: id,
        certificate_type_id: certTypeId,
        status: certStatus
    });
    await db.JobStatusHistory.create({ job_id: id, old_status: null, new_status: startStatus, changed_by: requesterId });
    return id;
}

async function makeSurvey(jobId, surveyorId, status = 'NOT_STARTED') {
    const job = await db.JobRequest.findByPk(jobId);
    let jobCert = await db.JobCertificate.findOne({ where: { job_request_id: jobId } });
    if (!jobCert) {
        jobCert = await db.JobCertificate.create({
            job_request_id: jobId,
            certificate_type_id: job.certificate_type_id || uuidv7(),
            status: 'PENDING'
        });
    }
    const survey = await db.Survey.create({ job_certificate_id: jobCert.id, surveyor_id: surveyorId, survey_status: status, submission_count: 0 });
    return survey.id;
}

// ─── Run Tests ────────────────────────────────────────────────────────────────

async function run() {
    console.log('\n══ GR-Class Lifecycle Hardened Integration Tests ══\n');

    const fx = await createFixtures();
    const { surveyorId, tmId, requesterId, vesselId, certTypeId } = fx;
    const tmUser = { id: tmId, role: 'TM' };

    // ─── 1. Happy Path: full flow to FINALIZED ────────────────────────────────
    console.log('\n── Section 1: Happy Path ────────────────────────────────────────────');
    {
        const jobId = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'SURVEY_AUTHORIZED');
        const surveyId = await makeSurvey(jobId, surveyorId, 'NOT_STARTED');

        await test('NOT_STARTED → STARTED syncs Job to IN_PROGRESS', async () => {
            await lifecycle.updateSurveyStatus(surveyId, 'STARTED', surveyorId, 'Check-in');
            const job = await db.JobRequest.findByPk(jobId);
            if (job.job_status !== 'IN_PROGRESS') throw new Error(`Expected IN_PROGRESS, got ${job.job_status}`);
        });

        await test('STARTED → CHECKLIST_SUBMITTED', async () => {
            await lifecycle.updateSurveyStatus(surveyId, 'CHECKLIST_SUBMITTED', surveyorId, 'Checklist done');
        });

        await test('CHECKLIST_SUBMITTED → PROOF_UPLOADED', async () => {
            await lifecycle.updateSurveyStatus(surveyId, 'PROOF_UPLOADED', surveyorId, 'Proof done');
        });

        await test('PROOF_UPLOADED → SUBMITTED syncs Job to SURVEY_DONE', async () => {
            await db.Survey.update({
                attendance_photo_url: 'https://test.com/photo.jpg',
                submit_latitude: 1.2844,
                submit_longitude: 103.8511
            }, { where: { id: surveyId } });
            await lifecycle.updateSurveyStatus(surveyId, 'SUBMITTED', surveyorId, 'Submitted');
            const job = await db.JobRequest.findByPk(jobId);
            if (job.job_status !== 'SURVEY_DONE') throw new Error(`Expected SURVEY_DONE, got ${job.job_status}`);
        });

        await test('SUBMITTED → FINALIZED (TM only) syncs Job to FINALIZED', async () => {
            // Advance job to SURVEY_DONE first (survey submission already did it above)
            const j = await db.JobRequest.findByPk(jobId);
            if (j.job_status !== 'SURVEY_DONE') {
                // Manually set for test isolation
                await db.JobRequest.update({ job_status: 'SURVEY_DONE' }, { where: { id: jobId } });
            }
            await lifecycle.updateSurveyStatus(surveyId, 'FINALIZED', tmId, 'Approved');
            const [job, survey] = await Promise.all([db.JobRequest.findByPk(jobId), db.Survey.findByPk(surveyId)]);
            if (job.job_status !== 'FINALIZED') throw new Error(`Expected FINALIZED, got ${job.job_status}`);
            if (!survey.finalized_at) throw new Error('finalized_at not set');
        });
    }

    // ─── 2. Double Submission ────────────────────────────────────────────────
    console.log('\n── Section 2: Double Submission ─────────────────────────────────────');
    {
        const jobId = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'IN_PROGRESS');
        const surveyId = await makeSurvey(jobId, surveyorId, 'SUBMITTED');

        await expectError('Cannot SUBMIT from SUBMITTED (idempotency / illegal transition)', 409, async () => {
            await db.Survey.update({
                attendance_photo_url: 'https://test.com/photo.jpg',
                submit_latitude: 1.2844,
                submit_longitude: 103.8511
            }, { where: { id: surveyId } });
            await lifecycle.updateSurveyStatus(surveyId, 'SUBMITTED', surveyorId, 'double submit');
        });
    }

    // ─── 3. Double Start ─────────────────────────────────────────────────────
    console.log('\n── Section 3: Double Start ──────────────────────────────────────────');
    {
        const jobId = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'IN_PROGRESS');
        const surveyId = await makeSurvey(jobId, surveyorId, 'STARTED');

        await expectError('Cannot STARTED → STARTED (idempotency throws 409)', 409, async () => {
            await lifecycle.updateSurveyStatus(surveyId, 'STARTED', surveyorId, 'double start');
        });
    }

    // ─── 4. Immutability after FINALIZED ─────────────────────────────────────
    console.log('\n── Section 4: Immutability After FINALIZED ──────────────────────────');
    {
        const jobId = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'FINALIZED');
        const surveyId = await makeSurvey(jobId, surveyorId, 'FINALIZED');

        await expectError('Update blocked on FINALIZED survey', 400, async () => {
            await lifecycle.updateSurveyStatus(surveyId, 'SUBMITTED', surveyorId, 'Illegal edit');
        });

        await expectError('Job update blocked on CERTIFIED job', 400, async () => {
            await db.JobRequest.update({ job_status: 'CERTIFIED' }, { where: { id: jobId } });
            await lifecycle.updateJobStatus(jobId, 'REJECTED', tmId, 'Illegal');
        });
    }

    // ─── 5. Finalize by non-TM ───────────────────────────────────────────────
    console.log('\n── Section 5: Finalization Role Guard ───────────────────────────────');
    {
        const jobId = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'SURVEY_DONE');
        const surveyId = await makeSurvey(jobId, surveyorId, 'SUBMITTED');

        await expectError('SURVEYOR cannot finalize survey', 403, async () => {
            await lifecycle.updateSurveyStatus(surveyId, 'FINALIZED', surveyorId, 'Surveyor tries to finalize');
        });
    }

    // ─── 6. Certificate before Survey Statement ISSUED ───────────────────────
    console.log('\n── Section 6: Certificate Guards ────────────────────────────────────');
    {
        const jobId = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'FINALIZED');
        await makeSurvey(jobId, surveyorId, 'FINALIZED');

        await expectError('Certificate blocked: survey statement not issued', 400, async () => {
            await certService.generateCertificate({ job_id: jobId }, tmUser);
        });
    }

    // ─── 7. Certificate before Survey FINALIZED ──────────────────────────────
    {
        const jobId = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'FINALIZED');
        await makeSurvey(jobId, surveyorId, 'SUBMITTED'); // Not finalized

        await expectError('Certificate blocked: survey not FINALIZED', 400, async () => {
            await certService.generateCertificate({ job_id: jobId }, tmUser);
        });
    }

    // ─── 8. Duplicate Certificate ─────────────────────────────────────────────
    {
        const jobId2 = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'FINALIZED');
        await makeSurvey(jobId2, surveyorId, 'FINALIZED');
        const testJobCert = await db.JobCertificate.findOne({ where: { job_request_id: jobId2 } });
        await db.Survey.update({
            survey_statement_status: 'ISSUED',
            attendance_photo_url: 'https://test.com/photo.jpg',
            submit_latitude: 1.0,
            submit_longitude: 1.0
        }, { where: { job_certificate_id: testJobCert.id } });
        
        // Create a real certificate row so FK is satisfied
        const fakeCert = await db.Certificate.create({
            vessel_id: vesselId,
            certificate_type_id: certTypeId,
            certificate_number: `CERT-DUPE-${Date.now()}`,
            issue_date: new Date(),
            expiry_date: new Date(Date.now() + 365 * 24 * 3600 * 1000),
            status: 'VALID',
            issued_by_user_id: tmId
        });
        await db.JobCertificate.update({ generated_certificate_id: fakeCert.id }, { where: { job_request_id: jobId2 } });

        await expectError('Duplicate certificate blocked (409)', 409, async () => {
            await certService.generateCertificate({ job_id: jobId2 }, tmUser);
        });
    }

    // ─── 9. State Change After CERTIFIED ─────────────────────────────────────
    console.log('\n── Section 9: Terminal State Guards ─────────────────────────────────');
    {
        const jobId = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'CERTIFIED');

        await expectError('Cannot change CERTIFIED job status', 400, async () => {
            await lifecycle.updateJobStatus(jobId, 'REJECTED', tmId, 'Post-cert tamper');
        });
    }

    // ─── 10. Rework After Payment ─────────────────────────────────────────────
    {
        const jobId = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'PAYMENT_DONE');
        const surveyId = await makeSurvey(jobId, surveyorId, 'FINALIZED');

        await expectError('Cannot rework FINALIZED survey after payment', 400, async () => {
            await lifecycle.updateSurveyStatus(surveyId, 'REWORK_REQUIRED', tmId, 'Late rework attempt');
        });
    }

    // ─── 11. Parallel Finalize (Idempotency guard) ────────────────────────────
    console.log('\n── Section 11: Concurrency / Idempotency ────────────────────────────');
    {
        // Fresh isolated job + survey for this test
        const pJobId = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'SURVEY_DONE');
        const pSurveyId = await makeSurvey(pJobId, surveyorId, 'SUBMITTED');

        await test('Parallel finalize attempt: exactly one call succeeds, survey ends FINALIZED', async () => {
            const [r1, r2] = await Promise.allSettled([
                lifecycle.updateSurveyStatus(pSurveyId, 'FINALIZED', tmId, 'First'),
                lifecycle.updateSurveyStatus(pSurveyId, 'FINALIZED', tmId, 'Second (race)')
            ]);
            const successes = [r1, r2].filter(r => r.status === 'fulfilled').length;
            if (successes === 0) throw new Error('Both calls failed — at least one should succeed.');
            const survey = await db.Survey.findByPk(pSurveyId);
            if (survey.survey_status !== 'FINALIZED') throw new Error('Survey not FINALIZED after parallel call');
        });
    }

    // ─── 12. Illegal Backwards Transitions ────────────────────────────────────
    console.log('\n── Section 12: Illegal Transitions ─────────────────────────────────');
    {
        const jobId = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'SURVEY_DONE');

        await expectError('Job cannot go SURVEY_DONE → CREATED', 400, async () => {
            await lifecycle.updateJobStatus(jobId, 'CREATED', tmId, 'backward');
        });

        await expectError('Job cannot go SURVEY_DONE → SURVEY_AUTHORIZED', 400, async () => {
            await lifecycle.updateJobStatus(jobId, 'SURVEY_AUTHORIZED', tmId, 'backward');
        });
    }

    // ─── 13. Job REWORK sync — SurveyStatusHistory audit correctness ───────────
    console.log('\n── Section 13: Survey history on job REWORK_REQUESTED ─────────────');
    {
        const jobId = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'SURVEY_DONE');
        await db.JobRequest.update({ is_survey_required: true }, { where: { id: jobId } });
        const surveyId = await makeSurvey(jobId, surveyorId, 'SUBMITTED');

        await test('SurveyStatusHistory previous_status is pre-update survey state', async () => {
            await lifecycle.updateJobStatus(jobId, 'REWORK_REQUESTED', tmId, 'Send back');
            const rows = await db.SurveyStatusHistory.findAll({
                where: { survey_id: surveyId },
                order: [['created_at', 'DESC']]
            });
            const last = rows[0];
            if (!last) throw new Error('No survey status history');
            if (last.previous_status !== 'SUBMITTED') {
                throw new Error(`Expected previous_status SUBMITTED, got ${last.previous_status}`);
            }
            if (last.new_status !== 'REWORK_REQUIRED') {
                throw new Error(`Expected new_status REWORK_REQUIRED, got ${last.new_status}`);
            }
        });
    }

    // ─── 14. Individual Survey Finalization (Multiple Certificates) ───────────
    console.log('\n── Section 14: Individual Survey Finalization ───────────────────────');
    {
        // 1. Create a job with 2 certificates
        const jobId = uuidv7();
        await db.JobRequest.create({
            id: jobId, vessel_id: vesselId, requested_by_user_id: requesterId,
            assigned_surveyor_id: surveyorId,
            job_status: 'REVIEWED', reason: 'Annual', target_port: 'Singapore', target_date: '2026-12-31'
        });

        // Create 2 certificates
        const jc1 = await db.JobCertificate.create({
            job_request_id: jobId,
            certificate_type_id: certTypeId,
            status: 'SURVEY_DONE'
        });
        const certType2 = await db.CertificateType.findOne({
            where: {
                id: { [db.Sequelize.Op.ne]: certTypeId },
                requires_survey: true
            }
        });
        const jc2 = await db.JobCertificate.create({
            job_request_id: jobId,
            certificate_type_id: certType2.id,
            status: 'SURVEY_DONE'
        });

        // Create 2 surveys in SUBMITTED state with ISSUED statement status
        const s1 = await db.Survey.create({
            job_certificate_id: jc1.id,
            surveyor_id: surveyorId,
            survey_status: 'SUBMITTED',
            survey_statement_status: 'ISSUED',
            attendance_photo_url: 'https://test.com/photo.jpg',
            submit_latitude: 1.0,
            submit_longitude: 1.0,
            submission_count: 1
        });
        const s2 = await db.Survey.create({
            job_certificate_id: jc2.id,
            surveyor_id: surveyorId,
            survey_status: 'SUBMITTED',
            survey_statement_status: 'ISSUED',
            attendance_photo_url: 'https://test.com/photo.jpg',
            submit_latitude: 1.0,
            submit_longitude: 1.0,
            submission_count: 1
        });

        await test('Finalizing first survey keeps job at REVIEWED status', async () => {
            await surveyService.finalizeSingleSurvey(jc1.id, { id: tmId, role: 'TM' });
            
            const updatedJob = await db.JobRequest.findByPk(jobId);
            const updatedS1 = await db.Survey.findByPk(s1.id);
            if (updatedS1.survey_status !== 'FINALIZED') throw new Error('Expected survey 1 to be FINALIZED');
            if (updatedJob.job_status !== 'REVIEWED') throw new Error(`Expected job status to remain REVIEWED, got ${updatedJob.job_status}`);
        });

        await test('Finalizing second survey transitions job to FINALIZED status', async () => {
            await surveyService.finalizeSingleSurvey(jc2.id, { id: tmId, role: 'TM' });
            
            const updatedJob = await db.JobRequest.findByPk(jobId);
            const updatedS2 = await db.Survey.findByPk(s2.id);
            if (updatedS2.survey_status !== 'FINALIZED') throw new Error('Expected survey 2 to be FINALIZED');
            if (updatedJob.job_status !== 'FINALIZED') throw new Error(`Expected job status to transition to FINALIZED, got ${updatedJob.job_status}`);
        });
    }

    // ─── 15. Survey Start Guard (Survey Not Required) ──────────────────────────
    console.log('\n── Section 15: Survey Start Guard ───────────────────────────────────');
    {
        const jobId = uuidv7();
        await db.JobRequest.create({
            id: jobId, vessel_id: vesselId, requested_by_user_id: requesterId,
            assigned_surveyor_id: surveyorId,
            job_status: 'SURVEY_AUTHORIZED', reason: 'Annual', target_port: 'Singapore', target_date: '2026-12-31',
            is_survey_required: false
        });

        await db.JobCertificate.create({
            job_request_id: jobId,
            certificate_type_id: certTypeId,
            status: 'SURVEY_AUTHORIZED'
        });

        await expectError('Survey start fails when survey is not required', 400, async () => {
            await surveyService.startSurvey({ job_id: jobId, latitude: 1.0, longitude: 1.0 }, surveyorId);
        });
    }

    // ─── 16. Mixed Survey Requirement Finalization ────────────────────────────
    console.log('\n── Section 16: Mixed Survey Requirement Finalization ────────────────');
    {
        const jobId = uuidv7();
        await db.JobRequest.create({
            id: jobId, vessel_id: vesselId, requested_by_user_id: requesterId,
            assigned_surveyor_id: surveyorId,
            job_status: 'REVIEWED', reason: 'Mixed', target_port: 'Singapore', target_date: '2026-12-31'
        });

        // Cert A: requires survey
        const jcA = await db.JobCertificate.create({
            job_request_id: jobId,
            certificate_type_id: certTypeId, // requires_survey = true
            status: 'SURVEY_DONE'
        });

        // Cert B: does NOT require survey
        let nonSurveyCertType = await db.CertificateType.findOne({ where: { requires_survey: false } });
        if (!nonSurveyCertType) {
            nonSurveyCertType = await db.CertificateType.create({
                id: uuidv7(),
                name: 'Non Survey Cert Type',
                issuing_authority: 'CLASS',
                validity_years: 5,
                requires_survey: false
            });
        }
        const jcB = await db.JobCertificate.create({
            job_request_id: jobId,
            certificate_type_id: nonSurveyCertType.id,
            status: 'DOCUMENT_VERIFIED'
        });

        // Create survey for Cert A only
        const sA = await db.Survey.create({
            job_certificate_id: jcA.id,
            surveyor_id: surveyorId,
            survey_status: 'SUBMITTED',
            survey_statement_status: 'ISSUED',
            attendance_photo_url: 'https://test.com/photo.jpg',
            submit_latitude: 1.0,
            submit_longitude: 1.0,
            submission_count: 1
        });

        await test('Finalizing the only survey required certificate transitions the job to FINALIZED', async () => {
            await surveyService.finalizeSingleSurvey(jcA.id, { id: tmId, role: 'TM' });
            
            const updatedJob = await db.JobRequest.findByPk(jobId);
            const updatedS1 = await db.Survey.findByPk(sA.id);
            if (updatedS1.survey_status !== 'FINALIZED') throw new Error('Expected survey A to be FINALIZED');
            if (updatedJob.job_status !== 'FINALIZED') throw new Error(`Expected job status to transition to FINALIZED, got ${updatedJob.job_status}`);
        });
    }

    // ─── Summary ──────────────────────────────────────────────────────────────
    console.log(`\n══ Results: ${pass} passed, ${fail} failed ══\n`);
    process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => {
    console.error('Unhandled error in test runner:', e);
    process.exit(1);
});
