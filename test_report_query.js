import db from './src/models/index.js';
import { getSurveyStatusReportData } from './src/modules/reports/report.service.js';

async function testQuery() {
    try {
        console.log('Testing survey status report query...');
        const job = await db.JobRequest.findOne();
        if (!job) {
            console.log('No job found in DB, testing sample mode...');
            const sampleResult = await getSurveyStatusReportData({ sample: 'true' });
            console.log('Sample report generated successfully! Length:', sampleResult.html.length);
            process.exit(0);
        }

        console.log(`Found job ID: ${job.id}`);
        const result = await getSurveyStatusReportData({ job_id: job.id });
        console.log('✅ Job survey status report generated successfully! HTML length:', result.html.length);
        process.exit(0);
    } catch (err) {
        console.error('❌ Query failed:', err);
        process.exit(1);
    }
}

testQuery();
