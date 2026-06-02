import db from './src/models/index.js';

async function fix() {
  const jobId = '019e870c-98e6-7509-b7cf-dff4f4ddcf56';
  const job = await db.JobRequest.findByPk(jobId);
  await job.update({ job_status: 'SURVEY_DONE' });
  console.log("Fixed job status");
  process.exit(0);
}
fix();
