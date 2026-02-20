import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:3000/api/v1';
const SURVEYOR_EMAIL = 'surveyor@girik.com';
const PASSWORD = 'Password@123';
const JOB_ID = '019c7a6f-af92-737a-8f89-86e0bbc5f688';

axios.defaults.timeout = 10000;

async function testSurveyorFlow() {
    console.log('--- Starting Surveyor API Integration Test ---');
    let token = '';

    try {
        // 1. LOGIN
        console.log('\n[1] Testing Login...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: SURVEYOR_EMAIL,
            password: PASSWORD
        });
        token = loginRes.data.accessToken;
        console.log('✅ Login successful. Token obtained.');

        const authHeader = { headers: { Authorization: `Bearer ${token}` } };

        // 2. GET JOBS
        console.log('\n[2] Testing Get Jobs...');
        const jobsRes = await axios.get(`${BASE_URL}/jobs?status=SURVEY_AUTHORIZED`, authHeader);
        const myJob = jobsRes.data.data.jobs.find(j => j.id === JOB_ID);
        if (myJob) {
            console.log('✅ Job found in assigned list.');
        } else {
            console.log('❌ Job NOT found in assigned list. (Might be filtered out)');
        }

        // 3. START SURVEY (CHECK-IN)
        console.log('\n[3] Testing Start Survey (Check-in)...');
        const startRes = await axios.post(`${BASE_URL}/surveys/start`, {
            job_id: JOB_ID,
            latitude: 1.3521,
            longitude: 103.8198
        }, authHeader);
        console.log('✅ Survey started. Message:', startRes.data.message);

        // 4. SUBMIT CHECKLIST
        console.log('\n[4] Testing Submit Checklist...');
        const checklistRes = await axios.put(`${BASE_URL}/checklists/jobs/${JOB_ID}/checklist`, {
            items: [
                {
                    question_code: 'TEST-01',
                    question_text: 'Is the API testing successful?',
                    answer: 'YES',
                    remarks: 'Automated test'
                }
            ]
        }, authHeader);
        console.log('✅ Checklist submitted.');

        // 5. UPLOAD PROOF
        console.log('\n[5] Testing Upload Proof...');
        const form = new FormData();
        const dummyFile = Buffer.from('dummy proof content');
        form.append('proof', dummyFile, { filename: 'test_proof.txt', contentType: 'text/plain' });

        const proofRes = await axios.post(`${BASE_URL}/surveys/jobs/${JOB_ID}/proof`, form, {
            headers: {
                ...authHeader.headers,
                ...form.getHeaders()
            }
        });
        console.log('✅ Proof uploaded. URL:', proofRes.data.data.url);

        // 6. STREAM LOCATION
        console.log('\n[6] Testing Stream Location...');
        const locRes = await axios.post(`${BASE_URL}/surveys/jobs/${JOB_ID}/location`, {
            latitude: 1.3522,
            longitude: 103.8199
        }, authHeader);
        console.log('✅ Location streamed.');

        // 7. GET TIMELINE
        console.log('\n[7] Testing Get Timeline...');
        const timelineRes = await axios.get(`${BASE_URL}/surveys/jobs/${JOB_ID}/timeline`, authHeader);
        console.log('✅ Timeline fetched. Points:', timelineRes.data.data.gps_trace.length);

        // 8. SUBMIT SURVEY REPORT (CHECK-OUT)
        console.log('\n[8] Testing Submit Survey Report (Check-out)...');
        const reportForm = new FormData();
        reportForm.append('job_id', JOB_ID);
        reportForm.append('gps_latitude', 1.3525);
        reportForm.append('gps_longitude', 103.8200);
        reportForm.append('survey_statement', 'All systems clear. Testing complete.');
        reportForm.append('photo', Buffer.from('fake photo data'), { filename: 'selfie.jpg', contentType: 'image/jpeg' });

        const reportRes = await axios.post(`${BASE_URL}/surveys`, reportForm, {
            headers: {
                ...authHeader.headers,
                ...reportForm.getHeaders()
            }
        });
        console.log('✅ Final report submitted. Status:', reportRes.data.data.survey_status);

        // 9. TEST MESSAGING
        console.log('\n[9] Testing Messaging...');
        const msgRes = await axios.post(`${BASE_URL}/jobs/${JOB_ID}/messages`, {
            message_type: 'TEXT',
            content: 'Hello from surveyor test script'
        }, authHeader);
        console.log('✅ Message sent.');

        // 10. TEST NC CREATION
        console.log('\n[10] Testing Non-Conformity Creation...');
        const ncRes = await axios.post(`${BASE_URL}/non-conformities`, {
            job_id: JOB_ID,
            description: 'Minor test finding',
            severity: 'MINOR'
        }, authHeader);
        console.log('✅ NC created.');

        console.log('\n--- All Surveyor API Tests Passed Successfully! ---');

    } catch (error) {
        console.error('\n❌ Test Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testSurveyorFlow();
