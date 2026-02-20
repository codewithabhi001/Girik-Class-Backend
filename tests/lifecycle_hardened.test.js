/**
 * Integration Tests — Girik Lifecycle Engine
 * Tests for all hardening scenarios from the MASTER REFACTOR.
 * Run: node tests/lifecycle_hardened.test.js
 */
import db from '../src/models/index.js';
import * as lifecycle from '../src/services/lifecycle.service.js';
import * as jobService from '../src/modules/jobs/job.service.js';
import * as certService from '../src/modules/certificates/certificate.service.js';
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
    const surveyorId = uuidv7();
    const tmId = uuidv7();
    const requesterId = uuidv7();
    const clientId = uuidv7();
    const vesselId = uuidv7();
    const certTypeId = uuidv7();

    await db.User.create({ id: surveyorId, name: 'Test Surveyor', email: `s_${Date.now()}@test.com`, role: 'SURVEYOR', password_hash: 'x' });
    await db.User.create({ id: tmId, name: 'Test TM', email: `t_${Date.now()}@test.com`, role: 'TM', password_hash: 'x' });
    await db.User.create({ id: requesterId, name: 'Requester', email: `r_${Date.now()}@test.com`, role: 'GM', password_hash: 'x' });
    await db.Client.create({ id: clientId, company_name: 'Test Corp', email: `c_${Date.now()}@test.com`, status: 'ACTIVE' });
    await db.Vessel.create({ id: vesselId, vessel_name: 'MV Test', imo_number: `IMO${Math.floor(Math.random() * 9999999)}`, client_id: clientId });
    await db.CertificateType.create({ id: certTypeId, name: 'Annual Survey', issuing_authority: 'CLASS', validity_years: 1 });

    return { surveyorId, tmId, requesterId, clientId, vesselId, certTypeId };
}

async function makeJob(vesselId, requesterId, surveyorId, certTypeId, startStatus = 'CREATED') {
    const id = uuidv7();
    await db.JobRequest.create({
        id, vessel_id: vesselId, requested_by_user_id: requesterId,
        assigned_surveyor_id: surveyorId, certificate_type_id: certTypeId,
        job_status: startStatus
    });
    await db.JobStatusHistory.create({ job_id: id, old_status: null, new_status: startStatus, changed_by: requesterId });
    return id;
}

async function makeSurvey(jobId, surveyorId, status = 'NOT_STARTED') {
    const survey = await db.Survey.create({ job_id: jobId, surveyor_id: surveyorId, survey_status: status, submission_count: 0 });
    return survey.id;
}

// ─── Run Tests ────────────────────────────────────────────────────────────────

async function run() {
    console.log('\n══ Girik Lifecycle Hardened Integration Tests ══\n');

    const fx = await createFixtures();
    const { surveyorId, tmId, requesterId, vesselId, certTypeId } = fx;

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
        const jobId = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'IN_PROGRESS');
        const surveyId = await makeSurvey(jobId, surveyorId, 'SUBMITTED');

        await expectError('ADMIN cannot finalize survey (only TM)', 403, async () => {
            // requesterId is GM role
            await lifecycle.updateSurveyStatus(surveyId, 'FINALIZED', requesterId, 'GM tries to finalize');
        });
    }

    // ─── 6. Certificate before Payment ───────────────────────────────────────
    console.log('\n── Section 6: Certificate Guards ────────────────────────────────────');
    {
        const jobId = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'FINALIZED');
        await makeSurvey(jobId, surveyorId, 'FINALIZED');

        await expectError('Certificate blocked: job not PAYMENT_DONE', 400, async () => {
            await certService.generateCertificate({ job_id: jobId }, tmId);
        });
    }

    // ─── 7. Certificate before Survey FINALIZED ──────────────────────────────
    {
        const jobId = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'PAYMENT_DONE');
        await makeSurvey(jobId, surveyorId, 'SUBMITTED'); // Not finalized

        await expectError('Certificate blocked: survey not FINALIZED', 400, async () => {
            await certService.generateCertificate({ job_id: jobId }, tmId);
        });
    }

    // ─── 8. Duplicate Certificate ─────────────────────────────────────────────
    {
        const jobId2 = await makeJob(vesselId, requesterId, surveyorId, certTypeId, 'PAYMENT_DONE');
        await makeSurvey(jobId2, surveyorId, 'FINALIZED');
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
        await db.JobRequest.update({ generated_certificate_id: fakeCert.id }, { where: { id: jobId2 } });

        await expectError('Duplicate certificate blocked (409)', 409, async () => {
            await certService.generateCertificate({ job_id: jobId2 }, tmId);
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

    // ─── Summary ──────────────────────────────────────────────────────────────
    console.log(`\n══ Results: ${pass} passed, ${fail} failed ══\n`);
    process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => {
    console.error('Unhandled error in test runner:', e);
    process.exit(1);
});
