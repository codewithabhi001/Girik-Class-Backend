import db from './src/models/index.js';
import { getSurveyStatusReportData } from './src/modules/reports/report.service.js';

async function testQuery() {
    try {
        console.log('Testing survey status report query...');
        const targetJobId = '019f4767-6322-755a-a83a-8cda864827c1';
        console.log(`Testing job ID from screenshot: ${targetJobId}`);
        const result = await getSurveyStatusReportData({ job_id: targetJobId });
        console.log('✅ Specific job survey status report generated successfully! HTML length:', result.html.length);
        process.exit(0);

    } catch (err) {
        console.error('❌ Query failed:', err);
        process.exit(1);
    }
}

testQuery();
