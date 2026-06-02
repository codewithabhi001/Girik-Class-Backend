import db from './src/models/index.js';

async function checkJob() {
  const jobs = await db.JobRequest.findAll({ where: { job_status: 'REWORK_REQUESTED' } });
  for (const job of jobs) {
    const certs = await db.JobCertificate.findAll({ where: { job_request_id: job.id } });
    const surveys = await db.Survey.findAll({ where: { job_certificate_id: certs.map(c => c.id) } });
    const hasRework = surveys.some(s => s.survey_status === 'REWORK_REQUIRED');
    console.log(`Job ${job.id}: hasRework=${hasRework}, surveys:`, surveys.map(s => s.survey_status));
  }
  process.exit(0);
}
checkJob();
