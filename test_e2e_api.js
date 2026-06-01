import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

async function login(email, password = 'Password@123') {
    const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
    return res.data.accessToken;
}

function getClient(token) {
    return axios.create({
        baseURL: BASE_URL,
        headers: { Authorization: `Bearer ${token}` }
    });
}

async function runTest() {
    try {
        console.log('Logging in users...');
        const clientToken = await login('arun@grclass.com');
        const toToken = await login('to@grclass.com');
        const tmToken = await login('tm@grclass.com');
        const gmToken = await login('gm@grclass.com');
        const adminToken = await login('admin@grclass.com');
        const surveyorToken = await login('abhivishwkarmaa52@gmail.com');

        const clientApi = getClient(clientToken);
        const toApi = getClient(toToken);
        const tmApi = getClient(tmToken);
        const gmApi = getClient(gmToken);
        const adminApi = getClient(adminToken);
        const surveyorApi = getClient(surveyorToken);

        console.log('--- 1. Client creates a job ---');
        // Need to get a vessel id first
        const db = (await import('./src/models/index.js')).default;
        const vessel = await db.Vessel.findOne();
        const vesselId = vessel.id;
        
        // Fetch templates to get valid certificate type IDs
        const templates = await db.CertificateTemplate.findAll();
        if (!templates || templates.length === 0) {
            throw new Error('No templates found. Cannot create job.');
        }
        const typeIds = templates.map(t => t.certificate_type_id);

        const jobRes = await clientApi.post('/jobs', {
            vessel_id: vesselId,
            target_port: 'Singapore',
            target_date: new Date().toISOString(),
            certificates: typeIds.map(id => ({ certificate_type_id: id })),
            reason: 'E2E Testing Job'
        });
        const jobId = jobRes.data.data.id;
        console.log(`Job Created: ${jobId}`);

        console.log('--- 2. TO verifies documents ---');
        await toApi.put(`/jobs/${jobId}/verify-all-documents`, { remarks: 'Looks good', approved: true });
        console.log('Documents verified.');

        console.log('--- 2.5. GM Approves Request ---');
        await gmApi.put(`/jobs/${jobId}/approve-request`, { remarks: 'Approved' });
        console.log('Request approved.');

        console.log('--- 3. GM Assigns Surveyor ---');
        const surveyors = await adminApi.get('/users?role=SURVEYOR');
        const surveyorsArray = Array.isArray(surveyors.data.data) ? surveyors.data.data : surveyors.data.data.rows;
        const surveyorId = surveyorsArray.find(s => s.email === 'abhivishwkarmaa52@gmail.com').id;
        await gmApi.put(`/jobs/${jobId}/assign`, { surveyor_id: surveyorId });
        console.log(`Surveyor assigned: ${surveyorId}`);

        console.log('--- 3.5. TM Authorizes Surveys ---');
        await tmApi.put(`/jobs/${jobId}/authorize-all-surveys`, { remarks: 'Authorized' });
        console.log('Surveys authorized.');

        console.log('--- 4. Surveyor Starts the Job ---');
        await surveyorApi.post(`/surveys/start`, {
            job_id: jobId,
            latitude: 1.23,
            longitude: 4.56
        });
        console.log('Survey Started');

        // Fetch Certificates
        const jobDetail = await surveyorApi.get(`/jobs/${jobId}`);
        const certs = jobDetail.data.data.certificates;
        console.log(`Found ${certs.length} certificates for the job.`);

        console.log('--- 5. Surveyor uploads proof and submits for each certificate ---');
        for (const cert of certs) {
            console.log(`\nProcessing Certificate: ${cert.CertificateType.type_name} (ID: ${cert.id})`);
            
            // Get Checklist
            console.log('Fetching Checklist...');
            const clRes = await surveyorApi.get(`/checklists/job-certificates/${cert.id}`);
            const checklistItems = clRes.data.data.items;
            const itemsToSave = checklistItems.map(item => ({
                question_code: item.question_code,
                question_text: item.question_text,
                answer: 'YES',
                remarks: 'E2E Check'
            }));

            if (itemsToSave.length === 0) {
                itemsToSave.push({
                    question_code: 'Q1',
                    question_text: 'Dummy Question',
                    answer: 'YES',
                    remarks: 'E2E Check'
                });
            }

            console.log('Saving Checklist...');
            await surveyorApi.put(`/checklists/job-certificates/${cert.id}`, {
                items: itemsToSave,
                signed_checklist_files: ['dummy-signed-checklist.pdf']
            });

            // Upload proof
            console.log('Uploading Proof...');
            await surveyorApi.post(`/surveys/${cert.id}/proof`, {
                fileKey: 'dummy-proof-s3-key.pdf'
            });

            console.log('Submitting Report for Certificate...');
            await surveyorApi.post(`/surveys/${cert.id}/submit`, {
                submit_latitude: 1.23,
                submit_longitude: 4.56,
                survey_statement: 'Survey completed successfully.',
                photoKey: 'dummy-photo-key.jpg',
                signatureKey: 'dummy-signature-key.png'
            });
            console.log('Submitted.');
        }

        console.log('\n--- 6. TM Finalizes Survey ---');
        await tmApi.put(`/surveys/jobs/${jobId}/finalize`, { skip_validation: true });
        console.log('Survey Finalized');

        console.log('--- 7. TM issues statements ---');
        const finalizeJob = await adminApi.get(`/jobs/${jobId}`);
        for (const cert of finalizeJob.data.data.certificates) {
            await tmApi.post(`/surveys/jobs/${jobId}/statement/issue`, {
                job_certificate_id: cert.id,
                statementFileKey: 'dummy-statement.pdf'
            });
            console.log(`Statement issued for ${cert.id}`);
        }

        console.log('--- 8. Generate + Issue Certificates (GM) ---');
        for (const cert of certs) {
            // Step 8a: Draft the certificate (TM or GM)
            const draftRes = await gmApi.post(`/certificates`, {
                job_certificate_id: cert.id,
                validity_years: 5,
                issue_date: new Date().toISOString().split('T')[0],
                expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split('T')[0],
                custom_notes: 'E2E Generated'
            });
            const certDraftId = draftRes.data.data?.id;
            console.log(`Certificate Drafted: ${certDraftId}`);

            // Step 8b: Issue the certificate (GM only)
            if (certDraftId) {
                await gmApi.post(`/certificates/${certDraftId}/issue`, {});
                console.log(`Certificate Issued for ${cert.id}`);
            }
        }

        console.log('\n✅ E2E Test Completed Successfully!');
    } catch (error) {
        console.error('❌ E2E Test Failed:');
        if (error.response) {
            console.error(error.response.status, error.response.config.method.toUpperCase(), error.response.config.url);
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error);
        }
    }
}

runTest();
