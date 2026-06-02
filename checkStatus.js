import db from './src/models/index.js';

async function checkStatus() {
  const jobs = await db.JobRequest.findAll({ order: [['createdAt', 'DESC']], limit: 5 });
  for (const job of jobs) {
    const history = await db.JobStatusHistory.findAll({ where: { job_id: job.id }, order: [['createdAt', 'ASC']] });
    console.log(`Job ${job.id} history:`, history.map(h => `${h.previous_status} -> ${h.new_status} (${h.reason})`).join(', '));
  }
  process.exit(0);
}
checkStatus();
