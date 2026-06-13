import db from './src/models/index.js';
import * as jobService from './src/modules/jobs/job.service.js';
import * as surveyService from './src/modules/surveys/survey.service.js';
import * as checklistService from './src/modules/checklists/checklist.service.js';
import * as certificateService from './src/modules/certificates/certificate.service.js';
import * as lifecycleService from './src/services/lifecycle.service.js';
import * as s3Service from './src/services/s3.service.js';

async function runTest() {
    console.log('=== Starting Certificate-Centric Multi-Certificate Flow Test ===');
    try {
        const { Op } = db.Sequelize;

        // 1. Resolve seed data
        const vessel = await db.Vessel.findOne({ where: { class_status: 'ACTIVE' } });
        // Find two distinct certificate types that require survey
        const allTypes = await db.CertificateType.findAll({ where: { status: 'ACTIVE', requires_survey: true } });
        const activeTypes = [];
        for (const t of allTypes) {
            const hasTemplate = await db.CertificateTemplate.findOne({ where: { certificate_type_id: t.id, is_active: true } });
            const hasChecklist = await db.ChecklistTemplate.findOne({ where: { certificate_type_id: t.id, status: 'ACTIVE' } });
            if (hasTemplate && hasChecklist) {
                activeTypes.push(t);
            }
        }
        if (activeTypes.length < 2) {
            throw new Error('Not enough active certificate types with both templates and checklists. Need at least 2.');
        }
        const certTypeA = activeTypes[0];
        const certTypeB = activeTypes[1];

        // Find two distinct surveyors
        const surveyors = await db.User.findAll({ where: { role: 'SURVEYOR', status: 'ACTIVE' }, limit: 2 });
        if (surveyors.length < 2) {
            throw new Error('Not enough active surveyors in seed data for testing split assignment. Need at least 2.');
        }
        const surveyorA = surveyors[0];
        const surveyorB = surveyors[1];

        const toUser = await db.User.findOne({ where: { role: 'TO', status: 'ACTIVE' } });
        const gmUser = await db.User.findOne({ where: { role: 'GM', status: 'ACTIVE' } });
        const tmUser = await db.User.findOne({ where: { role: 'TM', status: 'ACTIVE' } });
        const adminUser = await db.User.findOne({ where: { role: 'ADMIN', status: 'ACTIVE' } });

        const authorityWithLogo = { id: '00000000-0000-0000-0000-000000000000', name: 'GR CLASS' };
        const flagWithLogo = await db.FlagAdministration.findOne({
            where: {
                status: 'ACTIVE',
                logo_url: { [Op.ne]: null }
            }
        });

        if (!vessel || !toUser || !gmUser || !tmUser || !adminUser) {
            throw new Error('Missing basic seed data (Vessel, TO, GM, TM, or Admin)');
        }

        console.log(`Using Vessel: ${vessel.vessel_name}`);
        console.log(`Cert Type A: ${certTypeA.name}, Surveyor A: ${surveyorA.name}`);
        console.log(`Cert Type B: ${certTypeB.name}, Surveyor B: ${surveyorB.name}`);

        // Update profiles to make sure they are eligible
        const profileA = await db.SurveyorProfile.findOne({ where: { user_id: surveyorA.id } });
        if (profileA) {
            await profileA.update({
                status: 'ACTIVE',
                is_available: true,
                authorized_ship_types: JSON.stringify([vessel.ship_type]),
                authorized_certificates: JSON.stringify([certTypeA.name])
            });
        }
        const profileB = await db.SurveyorProfile.findOne({ where: { user_id: surveyorB.id } });
        if (profileB) {
            await profileB.update({
                status: 'ACTIVE',
                is_available: true,
                authorized_ship_types: JSON.stringify([vessel.ship_type]),
                authorized_certificates: JSON.stringify([certTypeB.name])
            });
        }

        // 2. Create Job Request with two certificates
        console.log('\n[Step 1] Creating Job Request with 2 Certificates...');
        const jobData = {
            vessel_id: vessel.id,
            target_port: 'Mumbai',
            target_date: '2026-12-01',
            reason: 'Dual Multi-Certificate Inspection',
            certificates: [
                { certificate_type_id: certTypeA.id, uploaded_documents: [] },
                { certificate_type_id: certTypeB.id, uploaded_documents: [] }
            ]
        };

        // Populate mandatory documents for both certificates to pass checks
        for (const cert of jobData.certificates) {
            const reqDocs = await db.CertificateRequiredDocument.findAll({
                where: { certificate_type_id: cert.certificate_type_id, is_mandatory: true }
            });
            cert.uploaded_documents = reqDocs.map(rd => ({
                required_document_id: rd.id,
                file_url: 'https://dummy-bucket.s3.amazonaws.com/test-doc.pdf'
            }));
        }

        const job = await jobService.createJob(jobData, adminUser.id);
        console.log(`Job Created! ID: ${job.id}, Status: ${job.job_status}`);

        // Fetch the created Job Certificates
        let certs = await db.JobCertificate.findAll({ where: { job_request_id: job.id } });
        console.log(`Associated Job Certificates count: ${certs.length}`);
        const jc1 = certs.find(c => c.certificate_type_id === certTypeA.id);
        const jc2 = certs.find(c => c.certificate_type_id === certTypeB.id);

        if (!jc1 || !jc2) throw new Error('Failed to find both JobCertificates.');

        console.log(`JobCertificate A ID: ${jc1.id}, Status: ${jc1.status}`);
        console.log(`JobCertificate B ID: ${jc2.id}, Status: ${jc2.status}`);

        // 3. Verify Documents for Certificate A (TO)
        console.log('\n[Step 2] Verifying Documents for Certificate A...');
        await jobService.verifyJobCertificateDocuments(jc1.id, { approved: true }, toUser);
        
        await jc1.reload();
        await jc2.reload();
        let updatedJob = await db.JobRequest.findByPk(job.id);
        console.log(`JobCertificate A Status: ${jc1.status} (expected: DOCUMENT_VERIFIED)`);
        console.log(`JobCertificate B Status: ${jc2.status} (expected: PENDING)`);
        console.log(`Parent Job Status: ${updatedJob.job_status} (expected: IN_PROGRESS)`);

        if (jc1.status !== 'DOCUMENT_VERIFIED') throw new Error('Cert A verification failed.');
        if (jc2.status !== 'PENDING') throw new Error('Cert B status should remain PENDING.');
        if (updatedJob.job_status !== 'IN_PROGRESS') throw new Error('Parent job status should be IN_PROGRESS.');

        // 4. Assign Surveyor A to Cert A, Surveyor B to Cert B (Dual Assignment)
        console.log('\n[Step 3] Assigning Surveyor A to Certificate A and Surveyor B to Certificate B...');
        await jobService.assignSurveyorToCertificate(jc1.id, surveyorA.id, gmUser);
        await jobService.assignSurveyorToCertificate(jc2.id, surveyorB.id, gmUser);

        await jc1.reload();
        await jc2.reload();
        console.log(`JobCertificate A Surveyor: ${jc1.assigned_surveyor_id} (expected: ${surveyorA.id})`);
        console.log(`JobCertificate B Surveyor: ${jc2.assigned_surveyor_id} (expected: ${surveyorB.id})`);

        if (jc1.assigned_surveyor_id !== surveyorA.id) throw new Error('Surveyor A assignment failed.');
        if (jc2.assigned_surveyor_id !== surveyorB.id) throw new Error('Surveyor B assignment failed.');

        // Surveyor B can access job via cert-only assignment (not job.assigned_surveyor_id)
        console.log('\n[Step 3b] Surveyor B access via JobCertificate assignment...');
        const surveyorBCanAccess = await jobService.surveyorCanAccessJob(job.id, surveyorB.id);
        if (!surveyorBCanAccess) throw new Error('Surveyor B should access job via cert assignment.');
        await jobService.getJobById(job.id, {}, surveyorB);

        // Verify both certs then GM approve (IN_PROGRESS + all DOCUMENT_VERIFIED)
        console.log('\n[Step 3c] Verifying Certificate B and GM approve-request...');
        await jobService.verifyJobCertificateDocuments(jc2.id, { approved: true }, toUser);
        await jc1.reload();
        await jc2.reload();
        updatedJob = await db.JobRequest.findByPk(job.id);
        if (jc1.status !== 'DOCUMENT_VERIFIED' || jc2.status !== 'DOCUMENT_VERIFIED') {
            throw new Error('Both certificates should be DOCUMENT_VERIFIED before approve.');
        }
        await jobService.approveRequest(job.id, 'GM approved multi-cert job', gmUser);
        updatedJob = await db.JobRequest.findByPk(job.id);
        console.log(`Parent Job Status after approve: ${updatedJob.job_status} (expected: IN_PROGRESS with approval recorded)`);
        if (updatedJob.job_status !== 'IN_PROGRESS') throw new Error('approve-request should keep IN_PROGRESS for multi-cert jobs.');
        if (!updatedJob.approved_by_user_id) throw new Error('approve-request should set approved_by_user_id.');

        // 5. Authorize Survey for Certificate A (TM)
        console.log('\n[Step 4] Authorizing Survey for Certificate A...');
        await jobService.authorizeSurveyForCertificate(jc1.id, 'Radio survey authorized', tmUser);
        
        await jc1.reload();
        console.log(`JobCertificate A Status: ${jc1.status} (expected: SURVEY_AUTHORIZED)`);
        if (jc1.status !== 'SURVEY_AUTHORIZED') throw new Error('Authorization for Cert A failed.');

        // 6. Complete Survey Workflow for Certificate A
        console.log('\n[Step 5] Starting Survey A check-in...');
        await surveyService.startSurvey({ job_certificate_id: jc1.id, latitude: 18.92, longitude: 72.83 }, surveyorA.id);
        const surveyA = await db.Survey.findOne({ where: { job_certificate_id: jc1.id } });
        console.log(`Survey A status: ${surveyA.survey_status} (expected: STARTED)`);

        console.log('Submitting checklist A...');
        const checklistItemsA = [
            { question_code: 'R01', question_text: 'Radio battery condition', answer: 'SATISFACTORY', remarks: 'Good voltage', job_certificate_id: jc1.id }
        ];
        await checklistService.submitChecklist(job.id, checklistItemsA, surveyorA.id, null, jc1.id);

        console.log('Uploading evidence proof A...');
        const proofKeyA = await s3Service.uploadFile(
            Buffer.from('dummy-evidence-radio'),
            'evidence-radio.jpg',
            'image/jpeg',
            s3Service.UPLOAD_FOLDERS.SURVEYS_PROOF
        );
        await surveyService.uploadProof(job.id, null, { fileKey: proofKeyA, job_certificate_id: jc1.id }, surveyorA.id);

        console.log('Uploading signed checklist scan A...');
        const signedKeyA = await s3Service.uploadFile(
            Buffer.from('%PDF-1.4 scan-radio'),
            'scan-radio.pdf',
            'application/pdf',
            'surveys/signed-checklists'
        );
        await surveyService.updateSignedChecklist(job.id, [signedKeyA], surveyorA.id, jc1.id);

        console.log('Submitting Final Survey Report A...');
        const photoKeyA = await s3Service.uploadFile(
            Buffer.from('attendance-radio'),
            'attendance-radio.jpg',
            'image/jpeg',
            s3Service.UPLOAD_FOLDERS.SURVEYS_PHOTO
        );
        await surveyService.submitSurveyReport({
            job_certificate_id: jc1.id,
            submit_latitude: 18.92,
            submit_longitude: 72.83,
            survey_statement: 'Safe Radio survey complete.',
            photoKey: photoKeyA
        }, {}, surveyorA.id);

        await jc1.reload();
        console.log(`JobCertificate A Status: ${jc1.status} (expected: SURVEY_DONE)`);
        if (jc1.status !== 'SURVEY_DONE') throw new Error('Cert A submission failed.');

        // 7. TO reviews and TM finalizes survey A
        console.log('\n[Step 6] TO Review and TM Finalization for Certificate A...');
        await jobService.reviewJobCertificate(jc1.id, 'TO approved radio checklist', toUser);
        console.log('Issuing Survey Statement A...');
        await surveyService.issueSurveyStatement(job.id, null, { job_certificate_id: jc1.id }, tmUser);

        await surveyService.finalizeSurvey(job.id, tmUser, { job_certificate_id: jc1.id });
        
        await surveyA.reload();

        // 8. Generate Draft and Issue Certificate A
        console.log('\n[Step 7] Generating Draft and Issuing Certificate A...');
        const certDraftA = await certificateService.generateCertificate({
            job_certificate_id: jc1.id,
            validity_years: 1,
            certificate_authority_id: authorityWithLogo.id,
            flag_administration_id: flagWithLogo?.id || null,
            certificate_term: 'FULL_TERM'
        }, adminUser);

        const certIssuedA = await certificateService.issueCertificate(certDraftA.id, adminUser);
        
        await jc1.reload();
        updatedJob = await db.JobRequest.findByPk(job.id);
        console.log(`JobCertificate A status: ${jc1.status} (expected: ISSUED)`);
        console.log(`Parent Job status (should stay IN_PROGRESS): ${updatedJob.job_status} (expected: IN_PROGRESS)`);

        if (jc1.status !== 'ISSUED') throw new Error('Cert A issuance failed.');
        if (updatedJob.job_status !== 'IN_PROGRESS') throw new Error('Parent job must stay IN_PROGRESS until Cert B is done.');

        // Open NC scoped to cert A — must not block cert B finalize/issue
        console.log('\n[Step 7b] Per-certificate NC on cert A...');
        const ncService = await import('./src/modules/non_conformities/nc.service.js');
        await ncService.createNC(
            { job_id: job.id, job_certificate_id: jc1.id, description: 'Minor finding on radio cert only', severity: 'MINOR' },
            toUser
        );

        // 9. Repeat entire workflow for Certificate B
        console.log('\n[Step 8] Starting entire workflow for Certificate B...');

        console.log('Authorizing survey for B...');
        await jobService.authorizeSurveyForCertificate(jc2.id, 'Load Line authorized', tmUser);

        console.log('Starting survey B...');
        await surveyService.startSurvey({ job_certificate_id: jc2.id, latitude: 18.92, longitude: 72.83 }, surveyorB.id);
        const surveyB = await db.Survey.findOne({ where: { job_certificate_id: jc2.id } });

        console.log('Submitting checklist B...');
        const checklistItemsB = [
            { question_code: 'L01', question_text: 'Load Line mark condition', answer: 'SATISFACTORY', remarks: 'Clearly visible', job_certificate_id: jc2.id }
        ];
        await checklistService.submitChecklist(job.id, checklistItemsB, surveyorB.id, null, jc2.id);

        console.log('Uploading evidence proof B...');
        const proofKeyB = await s3Service.uploadFile(
            Buffer.from('dummy-evidence-loadline'),
            'evidence-loadline.jpg',
            'image/jpeg',
            s3Service.UPLOAD_FOLDERS.SURVEYS_PROOF
        );
        await surveyService.uploadProof(job.id, null, { fileKey: proofKeyB, job_certificate_id: jc2.id }, surveyorB.id);

        console.log('Uploading signed checklist scan B...');
        const signedKeyB = await s3Service.uploadFile(
            Buffer.from('%PDF-1.4 scan-loadline'),
            'scan-loadline.pdf',
            'application/pdf',
            'surveys/signed-checklists'
        );
        await surveyService.updateSignedChecklist(job.id, [signedKeyB], surveyorB.id, jc2.id);

        console.log('Submitting Final Survey Report B...');
        const photoKeyB = await s3Service.uploadFile(
            Buffer.from('attendance-loadline'),
            'attendance-loadline.jpg',
            'image/jpeg',
            s3Service.UPLOAD_FOLDERS.SURVEYS_PHOTO
        );
        await surveyService.submitSurveyReport({
            job_certificate_id: jc2.id,
            submit_latitude: 18.92,
            submit_longitude: 72.83,
            survey_statement: 'Load Line survey complete.',
            photoKey: photoKeyB
        }, {}, surveyorB.id);

        console.log('TO Review and TM Finalization for B...');
        await jobService.reviewJobCertificate(jc2.id, 'TO approved load line checklist', toUser);
        console.log('Issuing Survey Statement B...');
        await surveyService.issueSurveyStatement(job.id, null, { job_certificate_id: jc2.id }, tmUser);

        const openNcOnA = await db.NonConformity.count({
            where: { job_id: job.id, job_certificate_id: jc1.id, status: 'OPEN' },
        });
        console.log(`Open NCs scoped to Cert A: ${openNcOnA} (should be >= 1)`);
        console.log('Finalizing Cert B survey while Cert A has open NC (must succeed)...');
        await surveyService.finalizeSurvey(job.id, tmUser, { job_certificate_id: jc2.id });

        console.log('Generating Draft and Issuing Certificate B...');
        const certDraftB = await certificateService.generateCertificate({
            job_certificate_id: jc2.id,
            validity_years: 1,
            certificate_authority_id: authorityWithLogo.id,
            flag_administration_id: flagWithLogo?.id || null,
            certificate_term: 'FULL_TERM'
        }, adminUser);

        const certIssuedB = await certificateService.issueCertificate(certDraftB.id, adminUser);

        await jc2.reload();
        updatedJob = await db.JobRequest.findByPk(job.id);
        console.log(`JobCertificate B status: ${jc2.status} (expected: ISSUED)`);
        console.log(`Parent Job status (should now be CERTIFIED): ${updatedJob.job_status} (expected: CERTIFIED)`);

        if (jc2.status !== 'ISSUED') throw new Error('Cert B issuance failed.');
        if (updatedJob.job_status !== 'CERTIFIED') throw new Error('Parent job must automatically transition to CERTIFIED when all certs are ISSUED.');

        console.log('\n=== Certificate-Centric Multi-Certificate Flow Test Completed Successfully! ===');

    } catch (error) {
        console.error('\n!!! Integration Test Failed !!!');
        console.error(error);
        if (error.statusCode) console.error(`Status Code: ${error.statusCode}, Message: ${error.message}`);
    } finally {
        process.exit();
    }
}

runTest();
