import db from './src/models/index.js';

async function checkJob() {
  try {
    const jobs = await db.JobRequest.findAll({
      where: { job_status: 'REWORK_REQUESTED' },
      include: [
        { model: db.JobCertificate, as: 'certificates' }
      ]
    });
    console.log("Jobs in REWORK_REQUESTED:", jobs.map(j => ({
      id: j.id,
      job_status: j.job_status,
      certificates: j.certificates.map(c => ({ id: c.id, status: c.status }))
    })));

    for (const job of jobs) {
      for (const cert of job.certificates) {
        const survey = await db.Survey.findOne({ where: { job_certificate_id: cert.id } });
        console.log(`Job ${job.id} Cert ${cert.id} Survey:`, survey ? survey.survey_status : 'None');
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkJob();
