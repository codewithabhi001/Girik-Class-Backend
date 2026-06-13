/**
 * Full multi-certificate job E2E: doc reject/re-upload → GM approve → assign →
 * authorize → dual survey (B then A) → pass A / rework B → issue A → reassign B →
 * surveyor2 completes B → job CERTIFIED.
 *
 * Run: node test_full_job_flow_e2e.js
 */
import 'dotenv/config';
import db from './src/models/index.js';
import * as jobService from './src/modules/jobs/job.service.js';
import * as surveyService from './src/modules/surveys/survey.service.js';
import * as checklistService from './src/modules/checklists/checklist.service.js';
import * as certificateService from './src/modules/certificates/certificate.service.js';
import * as s3Service from './src/services/s3.service.js';

const DUMMY_DOC_URL = 'https://dummy-bucket.s3.amazonaws.com/test-doc.pdf';
const DUMMY_DOC_URL_REUPLOAD = 'https://dummy-bucket.s3.amazonaws.com/test-doc-reupload.pdf';

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function completeSurveyForCertificate({
    jobId,
    jobCertificateId,
    surveyorId,
    certLabel,
    questionCode,
    questionText,
    statementText,
}) {
    const existing = await db.Survey.findOne({ where: { job_certificate_id: jobCertificateId } });
    if (!existing || existing.survey_status === 'NOT_STARTED') {
        await surveyService.startSurvey(
            { job_certificate_id: jobCertificateId, latitude: 18.92, longitude: 72.83 },
            surveyorId
        );
    }

    await checklistService.submitChecklist(
        jobId,
        [{
            question_code: questionCode,
            question_text: questionText,
            answer: 'SATISFACTORY',
            remarks: `${certLabel} OK`,
            job_certificate_id: jobCertificateId,
        }],
        surveyorId,
        null,
        jobCertificateId
    );

    const proofKey = await s3Service.uploadFile(
        Buffer.from(`dummy-evidence-${certLabel}`),
        `evidence-${certLabel}.jpg`,
        'image/jpeg',
        s3Service.UPLOAD_FOLDERS.SURVEYS_PROOF
    );
    await surveyService.uploadProof(
        jobId,
        null,
        { fileKey: proofKey, job_certificate_id: jobCertificateId },
        surveyorId
    );

    const signedKey = await s3Service.uploadFile(
        Buffer.from('%PDF-1.4 scan'),
        `scan-${certLabel}.pdf`,
        'application/pdf',
        'surveys/signed-checklists'
    );
    await surveyService.updateSignedChecklist(jobId, [signedKey], surveyorId, jobCertificateId);

    const photoKey = await s3Service.uploadFile(
        Buffer.from(`attendance-${certLabel}`),
        `attendance-${certLabel}.jpg`,
        'image/jpeg',
        s3Service.UPLOAD_FOLDERS.SURVEYS_PHOTO
    );
    await surveyService.submitSurveyReport(
        {
            job_certificate_id: jobCertificateId,
            submit_latitude: 18.92,
            submit_longitude: 72.83,
            survey_statement: statementText,
            photoKey,
        },
        {},
        surveyorId
    );

    const jc = await db.JobCertificate.findByPk(jobCertificateId);
    assert(jc.status === 'SURVEY_DONE', `${certLabel}: expected SURVEY_DONE after submit, got ${jc.status}`);
}

async function issueCertificateForJobCert({
    jobId,
    jobCertificateId,
    tmUser,
    issuerUser,
    authorityWithLogo,
    flagWithLogo,
}) {
    await surveyService.issueSurveyStatement(jobId, null, { job_certificate_id: jobCertificateId }, tmUser);
    await surveyService.finalizeSurvey(jobId, tmUser, { job_certificate_id: jobCertificateId });

    const draft = await certificateService.generateCertificate(
        {
            job_certificate_id: jobCertificateId,
            validity_years: 1,
            certificate_authority_id: authorityWithLogo.id,
            flag_administration_id: flagWithLogo?.id || null,
            certificate_term: 'FULL_TERM',
        },
        issuerUser
    );
    await certificateService.issueCertificate(draft.id, issuerUser);

    const jc = await db.JobCertificate.findByPk(jobCertificateId);
    assert(jc.status === 'ISSUED', `Expected ISSUED for cert ${jobCertificateId}, got ${jc.status}`);
}

async function resolveSeedData() {
    const { Op } = db.Sequelize;

    const vessel = await db.Vessel.findOne({ where: { class_status: 'ACTIVE' } });
    const allTypes = await db.CertificateType.findAll({
        where: { status: 'ACTIVE', requires_survey: true }
    });
    const certTypes = [];
    for (const t of allTypes) {
        const hasTemplate = await db.CertificateTemplate.findOne({ where: { certificate_type_id: t.id, is_active: true } });
        const hasChecklist = await db.ChecklistTemplate.findOne({ where: { certificate_type_id: t.id, status: 'ACTIVE' } });
        if (hasTemplate && hasChecklist) {
            certTypes.push(t);
        }
    }
    const surveyors = await db.User.findAll({
        where: { role: 'SURVEYOR', status: 'ACTIVE' },
        limit: 2,
    });
    const toUser = await db.User.findOne({ where: { role: 'TO', status: 'ACTIVE' } });
    const gmUser = await db.User.findOne({ where: { role: 'GM', status: 'ACTIVE' } });
    const tmUser = await db.User.findOne({ where: { role: 'TM', status: 'ACTIVE' } });
    const adminUser = await db.User.findOne({ where: { role: 'ADMIN', status: 'ACTIVE' } });
    const clientUser = vessel
        ? await db.User.findOne({
            where: { role: 'CLIENT', client_id: vessel.client_id, status: 'ACTIVE' },
        })
        : null;

    const flagWithLogo = await db.FlagAdministration.findOne({
        where: { status: 'ACTIVE', logo_url: { [Op.ne]: null } },
    });

    assert(vessel, 'Missing ACTIVE vessel');
    assert(certTypes.length >= 2, 'Need >= 2 ACTIVE certificate types with requires_survey');
    assert(surveyors.length >= 2, 'Need >= 2 ACTIVE surveyors');
    assert(toUser && gmUser && tmUser && adminUser, 'Missing TO, GM, TM, or ADMIN user');

    const certTypeA = certTypes[0];
    const certTypeB = certTypes[1];
    const surveyor1 = surveyors[0];
    const surveyor2 = surveyors[1];

    const authCerts = [certTypeA.name, certTypeB.name];
    const authShipTypes = [vessel.ship_type];

    async function ensureSurveyorProfile(surveyor) {
        let profile = await db.SurveyorProfile.findOne({ where: { user_id: surveyor.id } });
        const payload = {
            status: 'ACTIVE',
            is_available: true,
            authorized_ship_types: authShipTypes,
            authorized_certificates: authCerts,
            license_number: profile?.license_number || `E2E-${surveyor.id.slice(0, 8)}`,
        };
        if (profile) {
            await profile.update(payload);
        } else {
            profile = await db.SurveyorProfile.create({
                user_id: surveyor.id,
                ...payload,
            });
        }
        return profile;
    }

    await ensureSurveyorProfile(surveyor1);
    await ensureSurveyorProfile(surveyor2);

    return {
        vessel,
        certTypeA,
        certTypeB,
        surveyor1,
        surveyor2,
        toUser,
        gmUser,
        tmUser,
        adminUser,
        clientUser,
        flagWithLogo,
        authorityWithLogo: { id: '00000000-0000-0000-0000-000000000000', name: 'GR CLASS' },
    };
}

async function buildJobPayload(vessel, certTypeA, certTypeB) {
    const jobData = {
        vessel_id: vessel.id,
        target_port: 'Mumbai',
        target_date: '2026-12-15',
        reason: 'Full E2E multi-cert flow test',
        certificates: [
            { certificate_type_id: certTypeA.id, uploaded_documents: [] },
            { certificate_type_id: certTypeB.id, uploaded_documents: [] },
        ],
    };

    for (const cert of jobData.certificates) {
        const reqDocs = await db.CertificateRequiredDocument.findAll({
            where: { certificate_type_id: cert.certificate_type_id, is_mandatory: true },
        });
        cert.uploaded_documents = reqDocs.map((rd) => ({
            required_document_id: rd.id,
            file_url: DUMMY_DOC_URL,
        }));
    }
    return jobData;
}

async function runTest() {
    console.log('=== Full Multi-Certificate Job Flow E2E Test ===\n');
    let exitCode = 0;

    try {
        const seed = await resolveSeedData();
        const {
            vessel,
            certTypeA,
            certTypeB,
            surveyor1,
            surveyor2,
            toUser,
            gmUser,
            tmUser,
            adminUser,
            clientUser,
            flagWithLogo,
            authorityWithLogo,
        } = seed;

        console.log('[Seed] OK');
        console.log(`  Vessel: ${vessel.vessel_name}`);
        console.log(`  Cert A: ${certTypeA.name} | Cert B: ${certTypeB.name}`);
        console.log(`  Surveyor1: ${surveyor1.email || surveyor1.id}`);
        console.log(`  Surveyor2: ${surveyor2.email || surveyor2.id}`);
        console.log(`  Client for re-upload: ${clientUser ? clientUser.email || clientUser.id : '(using ADMIN)'}`);

        // Phase 1 — Create job
        console.log('\n[Phase 1] Create job with 2 certificates');
        const job = await jobService.createJob(
            await buildJobPayload(vessel, certTypeA, certTypeB),
            adminUser.id
        );
        assert(job.job_status === 'CREATED', `Expected CREATED, got ${job.job_status}`);

        const certs = await db.JobCertificate.findAll({ where: { job_request_id: job.id } });
        const jcA = certs.find((c) => c.certificate_type_id === certTypeA.id);
        const jcB = certs.find((c) => c.certificate_type_id === certTypeB.id);
        assert(jcA && jcB, 'Missing job certificates');

        console.log(`  Job ID: ${job.id}`);
        console.log(`  jcA: ${jcA.id} | jcB: ${jcB.id}`);

        // Phase 2 — Reject one doc on cert A
        console.log('\n[Phase 2] TO rejects one document on cert A');
        const docsA = await db.JobDocument.findAll({
            where: { job_certificate_id: jcA.id, verification_status: 'PENDING' },
        });
        assert(docsA.length > 0, 'Cert A needs at least one PENDING document to reject');

        const docToReject = docsA[0];
        await jobService.verifyJobCertificateDocuments(
            jcA.id,
            {
                approved: false,
                rejected_documents: [{ document_id: docToReject.id, reason: 'Blurry scan — E2E test' }],
            },
            toUser
        );

        await docToReject.reload();
        assert(docToReject.verification_status === 'REJECTED', 'Doc should be REJECTED');
        await jcA.reload();
        assert(jcA.status === 'PENDING', 'Cert A should stay PENDING after partial reject');

        // Phase 3 — Re-upload (creates new PENDING row; rejected row kept for audit)
        console.log('\n[Phase 3] Client re-uploads rejected document');
        const reuploadUser = clientUser || adminUser;
        const newDoc = await jobService.reuploadJobDocument(
            job.id,
            docToReject.id,
            { file_url: DUMMY_DOC_URL_REUPLOAD },
            reuploadUser
        );
        assert(newDoc.verification_status === 'PENDING', 'New upload row should be PENDING');
        await docToReject.reload();
        assert(docToReject.verification_status === 'REJECTED', 'Original rejected row preserved for audit');

        // Phase 4 — Verify both certs
        console.log('\n[Phase 4] TO approves documents on both certificates');
        await jobService.verifyJobCertificateDocuments(jcA.id, { approved: true }, toUser);
        await jobService.verifyJobCertificateDocuments(jcB.id, { approved: true }, toUser);
        await jcA.reload();
        await jcB.reload();
        let updatedJob = await db.JobRequest.findByPk(job.id);
        assert(jcA.status === 'DOCUMENT_VERIFIED' && jcB.status === 'DOCUMENT_VERIFIED', 'Both certs DOCUMENT_VERIFIED');
        assert(updatedJob.job_status === 'IN_PROGRESS', `Job should be IN_PROGRESS, got ${updatedJob.job_status}`);

        // Phase 5 — GM approve
        console.log('\n[Phase 5] GM approve-request');
        await jobService.approveRequest(job.id, 'GM approved — full E2E', gmUser);
        updatedJob = await db.JobRequest.findByPk(job.id);
        assert(updatedJob.approved_by_user_id, 'approved_by_user_id must be set');
        assert(updatedJob.job_status === 'IN_PROGRESS', 'Multi-cert job stays IN_PROGRESS after GM approve');

        // Phase 6 — Assign surveyor1 to both
        console.log('\n[Phase 6] GM assigns Surveyor1 to both certificates');
        await jobService.assignSurveyorToCertificate(jcA.id, surveyor1.id, gmUser);
        await jobService.assignSurveyorToCertificate(jcB.id, surveyor1.id, gmUser);

        // Phase 7 — Authorize both
        console.log('\n[Phase 7] TM authorizes survey for both certificates');
        await jobService.authorizeSurveyForCertificate(jcA.id, 'Authorized A', tmUser);
        await jobService.authorizeSurveyForCertificate(jcB.id, 'Authorized B', tmUser);
        await jcA.reload();
        await jcB.reload();
        assert(jcA.status === 'SURVEY_AUTHORIZED' && jcB.status === 'SURVEY_AUTHORIZED', 'Both SURVEY_AUTHORIZED');

        // Phase 8 — Surveyor1: B first, then A
        console.log('\n[Phase 8] Surveyor1 completes cert B, then cert A');
        await completeSurveyForCertificate({
            jobId: job.id,
            jobCertificateId: jcB.id,
            surveyorId: surveyor1.id,
            certLabel: 'B',
            questionCode: 'E2B01',
            questionText: 'Cert B checklist item',
            statementText: 'Cert B survey complete (first in order).',
        });
        await completeSurveyForCertificate({
            jobId: job.id,
            jobCertificateId: jcA.id,
            surveyorId: surveyor1.id,
            certLabel: 'A',
            questionCode: 'E2A01',
            questionText: 'Cert A checklist item',
            statementText: 'Cert A survey complete (second in order).',
        });

        // Phase 9 — Pass A, rework B
        console.log('\n[Phase 9] TO passes cert A; TM requests rework on cert B');
        await jobService.reviewJobCertificate(jcA.id, 'TO approved cert A', toUser);
        await surveyService.requestRework(job.id, 'Checklist gaps on cert B — E2E', tmUser.id, jcB.id);

        await jcA.reload();
        await jcB.reload();
        updatedJob = await db.JobRequest.findByPk(job.id);
        const surveyB = await db.Survey.findOne({ where: { job_certificate_id: jcB.id } });
        assert(jcA.status === 'SURVEY_DONE', `Cert A should stay SURVEY_DONE, got ${jcA.status}`);
        assert(jcB.status === 'REWORK_REQUESTED', `Cert B REWORK_REQUESTED, got ${jcB.status}`);
        assert(surveyB.survey_status === 'REWORK_REQUIRED', `Survey B REWORK_REQUIRED, got ${surveyB.survey_status}`);

        // Phase 10 — Issue cert A only
        console.log('\n[Phase 10] Finalize and issue certificate for cert A');
        await issueCertificateForJobCert({
            jobId: job.id,
            jobCertificateId: jcA.id,
            tmUser,
            issuerUser: gmUser,
            authorityWithLogo,
            flagWithLogo,
        });
        await jcA.reload();
        updatedJob = await db.JobRequest.findByPk(job.id);
        assert(jcA.status === 'ISSUED', 'Cert A ISSUED');
        assert(updatedJob.job_status !== 'CERTIFIED', 'Job must not be CERTIFIED until cert B is issued');

        // Phase 11 — Reassign B to surveyor2
        console.log('\n[Phase 11] GM reassigns cert B to Surveyor2');
        await jobService.reassignSurveyorToCertificate(
            jcB.id,
            surveyor2.id,
            'Surveyor2 takes rework cert B — E2E',
            gmUser
        );
        await jcB.reload();
        assert(jcB.assigned_surveyor_id === surveyor2.id, 'Cert B assigned to surveyor2');
        const surveyBAfterReassign = await db.Survey.findOne({ where: { job_certificate_id: jcB.id } });
        assert(surveyBAfterReassign.surveyor_id === surveyor2.id, 'Survey B surveyor_id updated');

        // Phase 12 — Surveyor2 completes rework on B
        console.log('\n[Phase 12] Surveyor2 resubmits cert B after rework');
        await completeSurveyForCertificate({
            jobId: job.id,
            jobCertificateId: jcB.id,
            surveyorId: surveyor2.id,
            certLabel: 'B-rework',
            questionCode: 'E2B02',
            questionText: 'Cert B rework checklist',
            statementText: 'Cert B rework survey complete.',
        });

        await jobService.reviewJobCertificate(jcB.id, 'TO approved cert B after rework', toUser);

        console.log('\n[Phase 12b] Issue certificate for cert B');
        await issueCertificateForJobCert({
            jobId: job.id,
            jobCertificateId: jcB.id,
            tmUser,
            issuerUser: gmUser,
            authorityWithLogo,
            flagWithLogo,
        });

        await jcB.reload();
        updatedJob = await db.JobRequest.findByPk(job.id);
        assert(jcB.status === 'ISSUED', 'Cert B ISSUED');
        assert(updatedJob.job_status === 'CERTIFIED', `Job must be CERTIFIED, got ${updatedJob.job_status}`);

        console.log('\n=== Full Multi-Certificate Job Flow E2E Test PASSED ===');
        console.log('\n--- UAT reference (automated run) ---');
        console.log(`Job ID:          ${job.id}`);
        console.log(`JobCertificate A: ${jcA.id} (${certTypeA.name}) → ISSUED`);
        console.log(`JobCertificate B: ${jcB.id} (${certTypeB.name}) → ISSUED`);
        console.log(`Final job status: ${updatedJob.job_status}`);
    } catch (error) {
        exitCode = 1;
        console.error('\n!!! Full Job Flow E2E Test FAILED !!!');
        console.error(error);
        if (error.statusCode) {
            console.error(`Status Code: ${error.statusCode}, Message: ${error.message}`);
        }
    } finally {
        process.exit(exitCode);
    }
}

runTest();
