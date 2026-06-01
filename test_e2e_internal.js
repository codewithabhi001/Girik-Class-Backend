import db from './src/models/index.js';
import * as jobService from './src/modules/jobs/job.service.js';

async function run() {
    await db.sequelize.authenticate();
    console.log('DB Connected');
    
    const clientUser = await db.User.findOne({ where: { role: 'CLIENT', status: 'ACTIVE' } });
    const toUser = await db.User.findOne({ where: { role: 'TO', status: 'ACTIVE' } });
    const gmUser = await db.User.findOne({ where: { role: 'GM', status: 'ACTIVE' } });
    const surveyorUser = await db.User.findOne({ where: { role: 'SURVEYOR', status: 'ACTIVE' } });
    
    const vessel = await db.Vessel.findOne();
    const templates = await db.CertificateTemplate.findAll();
    const typeIds = templates.map(t => t.certificate_type_id);

    console.log('Creating Job...');
    const jobData = {
        vessel_id: vessel.id,
        target_port: 'Singapore',
        target_date: new Date().toISOString(),
        certificates: typeIds.map(id => ({ certificate_type_id: id })),
        reason: 'Internal Service E2E Test'
    };

    const job = await jobService.createJob(jobData, clientUser.id);
    console.log('Job Created:', job.id);

    console.log('Verifying Documents...');
    const verifyRes = await jobService.verifyAllJobDocuments(job.id, { approved: true, remarks: 'Good' }, toUser);
    console.log('Verified:', verifyRes.message);

    console.log('Assigning Surveyor...');
    await jobService.assignSurveyor(job.id, { surveyor_id: surveyorUser.id }, gmUser);
    console.log('Surveyor assigned');

    console.log('Done!');
    process.exit(0);
}

run().catch(err => {
    console.error('Failed:', err);
    process.exit(1);
});
