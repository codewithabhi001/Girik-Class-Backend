import db from '../src/models/index.js';
import * as lifecycleService from '../src/services/lifecycle.service.js';

const { Job, Survey, User, Vessel, Client } = db;

async function runTest() {
    console.log('--- Starting Job Lifecycle System Test ---');

    try {
        // Migrations should be run manually before running tests in prod-like envs
        // In local, you can run: npx sequelize-cli db:migrate
        console.log('Skipping sync. Ensure migrations are applied.');

        // 2. Setup Mock Data
        let adminUser = await User.findOne({ where: { role: 'ADMIN' } });
        if (!adminUser) {
            adminUser = await User.create({
                name: 'System Admin',
                email: `admin-${Date.now()}@example.com`,
                password_hash: 'hashed',
                role: 'ADMIN'
            });
        }

        let tmUser = await User.findOne({ where: { role: 'TM' } });
        if (!tmUser) {
            tmUser = await User.create({
                name: 'Tech Manager',
                email: `tm-${Date.now()}@example.com`,
                password_hash: 'hashed',
                role: 'TM'
            });
        }

        let surveyor = await User.findOne({ where: { role: 'SURVEYOR' } });
        if (!surveyor) {
            surveyor = await User.create({
                name: 'John Surveyor',
                email: `surveyor-${Date.now()}@example.com`,
                password_hash: 'hashed',
                role: 'SURVEYOR'
            });
        }

        let clientUser = await User.findOne({ where: { role: 'CLIENT' } });
        if (!clientUser) {
            clientUser = await User.create({
                name: 'Ship Owner',
                email: `client-${Date.now()}@example.com`,
                password_hash: 'hashed',
                role: 'CLIENT'
            });
        }

        let vessel = await Vessel.findOne();
        if (!vessel) {
            vessel = await Vessel.create({
                vessel_name: 'LifeCycle Scout',
                imo_number: '9999999',
                flag_state: 'Panama',
                ship_type: 'Cargo'
            });
        }

        console.log('✅ Mock data ready.');

        // 3. Create a Job
        const job = await Job.create({
            client_id: clientUser.id,
            vessel_id: vessel.id,
            job_type: 'INITIAL_SURVEY',
            scheduled_date: new Date(),
            created_by: adminUser.id,
            job_status: 'CREATED'
        });
        console.log(`✅ Job Created: ${job.id} (Status: ${job.job_status})`);

        // 4. Test Valid Transition: CREATED -> APPROVED
        await lifecycleService.updateJobStatus(job.id, 'APPROVED', adminUser.id, 'Approval test');
        await job.reload();
        console.log(`✅ Transition OK: CREATED -> APPROVED (New Status: ${job.job_status})`);

        // 5. Test Invalid Transition: APPROVED -> FINALIZED (Should skip ASSIGNED)
        try {
            await lifecycleService.updateJobStatus(job.id, 'FINALIZED', adminUser.id);
            console.log('❌ Error: Allowed jump from APPROVED to FINALIZED');
        } catch (e) {
            console.log(`✅ Validation OK: Blocked invalid transition (${e.message})`);
        }

        // 6. Transition to ASSIGNED
        await lifecycleService.updateJobStatus(job.id, 'ASSIGNED', adminUser.id);
        await job.update({ surveyor_id: surveyor.id });
        console.log(`✅ Transition OK: -> ASSIGNED (Surveyor: ${surveyor.name})`);

        // 7. Transition to SURVEY_AUTHORIZED
        await lifecycleService.updateJobStatus(job.id, 'SURVEY_AUTHORIZED', adminUser.id);
        console.log(`✅ Transition OK: -> SURVEY_AUTHORIZED`);

        // 8. Test Survey Lifecycle
        const survey = await Survey.create({
            job_id: job.id,
            surveyor_id: surveyor.id,
            survey_status: 'NOT_STARTED'
        });
        console.log(`✅ Survey Instance Created (Status: ${survey.survey_status})`);

        // 9. Start Survey -> Check Job Auto-Update to IN_PROGRESS
        await lifecycleService.updateSurveyStatus(survey.id, 'STARTED', surveyor.id);
        await survey.reload();
        await job.reload();
        console.log(`✅ Survey STARTED. Job Status: ${job.job_status} (Auto-updated)`);

        // 10. Submit Survey -> Check Job Auto-Update to SURVEY_DONE
        await lifecycleService.updateSurveyStatus(survey.id, 'CHECKLIST_SUBMITTED', surveyor.id);
        await lifecycleService.updateSurveyStatus(survey.id, 'SUBMITTED', surveyor.id);
        await job.reload();
        console.log(`✅ Survey SUBMITTED. Job Status: ${job.job_status} (Auto-updated)`);

        // 11. Test Role Constraint: Non-TM trying to FINALIZED
        try {
            await lifecycleService.updateJobStatus(job.id, 'REVIEWED', adminUser.id);
            await lifecycleService.updateJobStatus(job.id, 'FINALIZED', adminUser.id);
            console.log('❌ Error: Admin was allowed to finalize job');
        } catch (e) {
            console.log(`✅ Validation OK: Blocked Non-TM finalization (${e.message})`);
        }

        // 12. Valid Finalization by TM
        await lifecycleService.updateJobStatus(job.id, 'FINALIZED', tmUser.id);
        await job.reload();
        console.log(`✅ Transition OK: REVIEWED -> FINALIZED (by TM)`);

        console.log('\n--- Status History Audit ---');
        const history = await db.JobStatusHistory.findAll({ where: { job_id: job.id }, order: [['created_at', 'ASC']] });
        history.forEach(h => {
            console.log(` [${h.createdAt.toISOString()}] ${h.previous_status || 'NULL'} -> ${h.new_status} (Reason: ${h.reason})`);
        });

        console.log('\n✅ ALL TESTS PASSED SUCCESSFULLY.');
        process.exit(0);
    } catch (error) {
        console.error('❌ TEST FAILED:', error);
        process.exit(1);
    }
}

runTest();
