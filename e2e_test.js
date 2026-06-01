import db from './src/models/index.js';
import * as jobService from './src/modules/jobs/job.service.js';
import * as surveyService from './src/modules/surveys/survey.service.js';
import * as checklistService from './src/modules/checklists/checklist.service.js';
import * as certificateService from './src/modules/certificates/certificate.service.js';
import * as lifecycleService from './src/services/lifecycle.service.js';

const adminId = '019e682e-10b6-71c8-b828-868627f9e191';
const tmId = '019e6858-7b36-73ef-bab2-574e9770abbe';
const surveyorId = '019e6858-14bd-7347-9d86-d1acffa36a5c';
const clientId = '019e6837-7823-70ee-a14f-47a914f0067f';
const vesselId = '019e683c-1992-77c4-9ec1-881d687c1087';
const certTypeIds = [
    '019e6844-1adb-70ee-823e-b7c580eb715f',
    '019e6844-1adb-70ee-823e-b7c580eb715f'
];

async function runTest() {
    try {
        console.log('--- STARTING E2E TEST ---');
        
        const clientUser = await db.User.findByPk(clientId);
        const tmUser = await db.User.findByPk(tmId);
        const adminUser = await db.User.findByPk(adminId);
        const surveyorUser = await db.User.findByPk(surveyorId);

        // 1. Create Job with multiple certificates
        console.log('\n[1] Creating Job...');
        const createPayload = {
            vessel_id: vesselId,
            target_port: 'Test Port',
            target_date: new Date(),
            certificates: certTypeIds.map(id => ({
                certificate_type_id: id,
                uploaded_documents: [
                    { required_document_id: '019e6844-1b12-73b2-8964-fb46e0cdf809', file_url: 'https://test.com/doc1.pdf' },
                    { required_document_id: '019e6844-1b12-73b2-8964-fdfb6e89e057', file_url: 'https://test.com/doc2.pdf' }
                ]
            }))
        };
        const job = await jobService.createJob(createPayload, clientUser.id, { skipMandatoryDocumentCheck: true });
        console.log(`Job Created! ID: ${job.id} Status: ${job.job_status}`);

        // 2. Document Verification
        console.log('\n[2] Verifying Documents...');
        const verifyResult = await jobService.verifyAllJobDocuments(job.id, { approved: true }, adminUser);
        console.log(verifyResult.message);
        
        let currentJob = await db.JobRequest.findByPk(job.id);
        console.log(`Job Status after Document Verify: ${currentJob.job_status}`);
        
        // 3. Approve Request
        console.log('\n[3] Approving Request...');
        await jobService.approveRequest(job.id, 'LGTM', adminUser);
        currentJob = await db.JobRequest.findByPk(job.id);
        console.log(`Job Status after Approval: ${currentJob.job_status}`);

        // 4. Assign Surveyor
        console.log('\n[4] Assigning Surveyor...');
        await jobService.assignSurveyor(job.id, surveyorId, adminUser);
        currentJob = await db.JobRequest.findByPk(job.id);
        console.log(`Job Status after Assignment: ${currentJob.job_status}`);

        // 5. Authorize Survey
        console.log('\n[5] Authorizing Survey...');
        await jobService.authorizeAllSurveysForJob(job.id, 'Go ahead', tmUser);
        currentJob = await db.JobRequest.findByPk(job.id);
        console.log(`Job Status after Auth: ${currentJob.job_status}`);

        // 6. Surveyor Starts Survey
        console.log('\n[6] Surveyor Starts Survey (Job Level)...');
        await surveyService.startSurvey({ job_id: job.id, latitude: '40.0', longitude: '-70.0' }, surveyorUser.id);
        currentJob = await db.JobRequest.findByPk(job.id);
        console.log(`Job Status after Start: ${currentJob.job_status}`);

        // 7. Surveyor Fills Checklist per Certificate
        console.log('\n[7] Surveyor Filling Checklists (Certificate Level)...');
        const certs = await db.JobCertificate.findAll({ where: { job_request_id: job.id } });
        for (const cert of certs) {
            console.log(`  Filling checklist for cert ${cert.id}...`);
            await checklistService.submitChecklist(
                job.id, 
                [{ question_code: 'Q1', answer: 'Yes', remark: 'Ok' }], 
                surveyorUser, 
                ['https://test.com/signed.pdf'], 
                cert.id
            );
        }

        // 8. Surveyor Uploads Proof (Job Level)
        console.log('\n[8] Surveyor Uploads Evidence Proof (Job Level)...');
        await surveyService.uploadProof(job.id, null, { fileKey: 'https://test.com/photo.png' }, surveyorUser.id);
        
        // 9. Surveyor Submits Survey Report (Job Level)
        console.log('\n[9] Surveyor Submits Final Report (Job Level)...');
        await surveyService.submitSurveyReport({ 
            job_id: job.id, 
            skip_validation: false, 
            submit_latitude: '40.0', 
            submit_longitude: '-70.0',
            photoKey: 'https://test.com/photo.png'
        }, [], surveyorUser.id);
        currentJob = await db.JobRequest.findByPk(job.id);
        console.log(`Job Status after Submit: ${currentJob.job_status}`);

        // 10. TM Finalizes Survey
        console.log('\n[10] TM Finalizes Survey...');
        await surveyService.finalizeSurvey(job.id, tmUser);
        currentJob = await db.JobRequest.findByPk(job.id);
        console.log(`Job Status after Finalize: ${currentJob.job_status}`);
        const generated = [];
        for (const cert of certs) {
            const draft = await certificateService.generateCertificate({ job_certificate_id: cert.id, validity_years: 1, skip_validation: true }, adminUser);
            const result = await certificateService.issueCertificate(draft.id, adminUser);
            generated.push(result);
            console.log(`  Certificate ${cert.id} issued. Status: ${result.status}`);
        }
        
        currentJob = await db.JobRequest.findByPk(job.id);
        console.log(`\nFinal Job Status: ${currentJob.job_status}`);
        console.log('--- TEST PASSED SUCCESSFULLY ---');

    } catch (e) {
        console.error('\n--- TEST FAILED ---');
        console.error(e.message || e);
    } finally {
        process.exit();
    }
}

runTest();
