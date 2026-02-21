import 'dotenv/config';
import db from './src/models/index.js';
import * as lifecycleService from './src/services/lifecycle.service.js';
import * as s3Service from './src/services/s3.service.js';
import axios from 'axios';

// Sample real image URL to download as buffer
const SAMPLE_IMG_URL = 'https://picsum.photos/200';

async function uploadDummyFile(entityType, folderName) {
    console.log(`Downloading dummy image for ${entityType}...`);
    const response = await axios.get(SAMPLE_IMG_URL, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const buffer = Buffer.from(response.data, 'binary');
    const folder = `${s3Service.UPLOAD_FOLDERS.DOCUMENTS}/${folderName}`;
    const url = await s3Service.uploadFile(buffer, `test-image-${Date.now()}.jpg`, 'image/jpeg', folder);
    return url;
}

async function run() {
    try {
        console.log('--- Starting Full E2E Flow Seed ---');

        const admin = await db.User.findOne({ where: { role: 'ADMIN' } });
        let tm = await db.User.findOne({ where: { role: 'TM' } });
        if (!tm) {
            console.log('Creating a dummy TM user for survey finalization...');
            tm = await db.User.create({
                first_name: 'Test', last_name: 'TM', email: `tm_${Date.now()}@test.com`, password_hash: 'pwd', role: 'TM'
            });
        }

        const surveyorId = '019c79a4-4930-71fd-aa73-887301791935';
        const surveyor = await db.User.findByPk(surveyorId);
        let client = await db.User.findOne({
            where: {
                role: 'CLIENT',
                client_id: { [db.Sequelize.Op.not]: null }
            }
        });

        if (!admin || !surveyor) {
            throw new Error('Missing Admin or Surveyor in DB.');
        }

        if (!client) {
            console.log('Creating dummy Client Company & User...');
            const clientCompany = await db.Client.create({ company_name: 'Test Co', country: 'Singapore' });
            client = await db.User.create({
                first_name: 'Test', last_name: 'Client', email: `client_${Date.now()}@test.com`, password_hash: 'pwd', role: 'CLIENT', client_id: clientCompany.id
            });
        }

        const flagAdmin = await db.FlagAdministration.findOne();
        if (!flagAdmin) throw new Error('No Flag Administration found.');

        for (let i = 1; i <= 3; i++) {
            console.log(`\n--- Iteration ${i} ---`);

            // 1. Upload Document via S3 directly
            const vesselDocUrl = await uploadDummyFile('VESSEL', `vessels/test_${i}`);
            console.log(`Vessel Document Uploaded: ${vesselDocUrl}`);

            // 2. Create Vessel
            const vesselName = "Girik Voyager " + Math.floor(Math.random() * 1000) + ` (Fleet ${i})`;
            console.log(`Creating Vessel: ${vesselName}`);

            let vessel;
            const vesselTxn = await db.sequelize.transaction();
            try {
                vessel = await db.Vessel.create({
                    client_id: client.client_id || client.id, // Ensure we use the company ID, fallback just in case
                    vessel_name: vesselName,
                    imo_number: Math.floor(1000000 + Math.random() * 9000000).toString(),
                    flag_administration_id: flagAdmin.id,
                    ship_type: "Cargo",
                    class_status: "ACTIVE"
                }, { transaction: vesselTxn });

                await db.VesselDocument.create({
                    vessel_id: vessel.id,
                    file_url: vesselDocUrl,
                    document_type: 'REGISTRY_CERTIFICATE',
                    description: 'Initial Registry (Seed)',
                    uploaded_by: admin.id
                }, { transaction: vesselTxn });

                await vesselTxn.commit();
            } catch (e) {
                await vesselTxn.rollback();
                throw e;
            }

            // 3. Create Job
            console.log('Creating Job...');
            const certType = await db.CertificateType.findOne({ where: { requires_survey: true } });
            const reqDocs = await db.CertificateRequiredDocument.findAll({ where: { certificate_type_id: certType.id } });

            let job;
            const jobTxn = await db.sequelize.transaction();
            try {
                job = await db.JobRequest.create({
                    vessel_id: vessel.id,
                    certificate_type_id: certType.id,
                    requested_by_user_id: client.id,
                    job_status: 'CREATED',
                    is_survey_required: true,
                    target_date: new Date()
                }, { transaction: jobTxn });

                for (const rd of reqDocs) {
                    const docUrl = await uploadDummyFile('JOB', 'jobs');
                    await db.JobDocument.create({
                        job_id: job.id,
                        required_document_id: rd.id,
                        file_url: docUrl,
                        document_type: rd.document_name,
                        status: 'UPLOADED',
                        uploaded_by: client.id
                    }, { transaction: jobTxn });
                }
                await jobTxn.commit();
            } catch (e) {
                await jobTxn.rollback();
                throw e;
            }

            console.log(`Job Created (ID: ${job.id}). Updating life cycles...`);

            // Navigate Job Lifecycles
            await lifecycleService.updateJobStatus(job.id, 'DOCUMENT_VERIFIED', admin.id, 'Docs look great.');
            console.log('Status: DOCUMENT_VERIFIED');

            await lifecycleService.updateJobStatus(job.id, 'APPROVED', admin.id, 'Approved by GM.');
            console.log('Status: APPROVED');

            // Assign To Surveyor
            job.assigned_surveyor_id = surveyor.id;
            job.assigned_by_user_id = admin.id;
            await job.save();
            await lifecycleService.updateJobStatus(job.id, 'ASSIGNED', admin.id, 'Assigned to specialized surveyor.');
            console.log(`Status: ASSIGNED (To Surveyor: ${surveyor.first_name} ${surveyor.last_name})`);

            // Fast forward Job to Authorized & In Progress
            await lifecycleService.updateJobStatus(job.id, 'SURVEY_AUTHORIZED', admin.id, 'Payment bypassed, authorized.');
            console.log('Status: SURVEY_AUTHORIZED');

            await lifecycleService.updateJobStatus(job.id, 'IN_PROGRESS', surveyor.id, 'Surveyor started work.');
            console.log('Status: IN_PROGRESS');

            // Create Survey Record
            const survey = await db.Survey.create({
                job_id: job.id,
                surveyor_id: surveyor.id,
                survey_status: 'NOT_STARTED',
                port_name: 'Test Port'
            });

            console.log('Survey Record Created. Simulating Survey process...');

            await lifecycleService.updateSurveyStatus(survey.id, 'STARTED', surveyor.id, 'On board.');
            await lifecycleService.updateSurveyStatus(survey.id, 'CHECKLIST_SUBMITTED', surveyor.id, 'All checks done.');
            await lifecycleService.updateSurveyStatus(survey.id, 'PROOF_UPLOADED', surveyor.id, 'Images attached.');
            await lifecycleService.updateSurveyStatus(survey.id, 'SUBMITTED', surveyor.id, 'Submitted to Manager.');

            // Finalize by TM
            await lifecycleService.updateSurveyStatus(survey.id, 'FINALIZED', tm.id, 'Everything checks out.');

            // Refetch job
            const finalJob = await db.JobRequest.findByPk(job.id);
            console.log(`Survey Status: FINALIZED.`);
            console.log(`Job Final Status: ${finalJob.job_status}`);
            console.log(`Iteration ${i} successfully completed! Vessel, Job, and Survey created and assigned to ${surveyor.first_name}.\n`);
        }

        console.log(`\n🎉 E2E Flow successfully completed for Surveyor ID: ${surveyorId} (${surveyor.first_name})`);

    } catch (error) {
        console.error('Error simulating flow:', error);
    } finally {
        process.exit(0);
    }
}

run();
