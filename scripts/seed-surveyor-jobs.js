/**
 * Seed Script: Create Jobs → Assign Surveyor → SURVEY_AUTHORIZED
 *
 * Surveyor: 019c79a4-4930-71fd-aa73-887301791935
 *
 * Lifecycle per job:
 *   CREATED → DOCUMENT_VERIFIED → APPROVED → ASSIGNED → SURVEY_AUTHORIZED
 *
 * Usage:
 *   node scripts/seed-surveyor-jobs.js
 */

import 'dotenv/config';
import db from '../src/models/index.js';
import * as lifecycleService from '../src/services/lifecycle.service.js';

const SURVEYOR_ID = '019c79a4-4930-71fd-aa73-887301791935';

// Number of jobs to create
const JOB_COUNT = 3;

// Ports for variety
const PORTS = ['Singapore', 'Rotterdam', 'Mumbai'];

async function run() {
    try {
        await db.sequelize.authenticate();
        console.log('✅  Database connected.\n');

        // ── Resolve required users ────────────────────────────────────
        const surveyor = await db.User.findByPk(SURVEYOR_ID);
        if (!surveyor || surveyor.role !== 'SURVEYOR') {
            throw new Error(`Surveyor ${SURVEYOR_ID} not found or is not a SURVEYOR.`);
        }
        console.log(`👤  Surveyor: ${surveyor.first_name} ${surveyor.last_name} (${surveyor.email})\n`);

        const admin = await db.User.findOne({ where: { role: 'ADMIN' } });
        if (!admin) throw new Error('No ADMIN user found in the database.');

        // ── Resolve a Certificate Type that requires survey ───────────
        const certType = await db.CertificateType.findOne({ where: { requires_survey: true } });
        if (!certType) throw new Error('No CertificateType with requires_survey=true found.');

        // ── Resolve or create a Client company ───────────────────────
        let client = await db.User.findOne({
            where: { role: 'CLIENT', client_id: { [db.Sequelize.Op.not]: null } }
        });

        if (!client) {
            console.log('⚙️   No CLIENT found — creating a dummy client...');
            const clientCompany = await db.Client.create({
                company_name: 'Seed Shipping Co.',
                country: 'Singapore'
            });
            client = await db.User.create({
                first_name: 'Seed', last_name: 'Client',
                email: `seed_client_${Date.now()}@test.com`,
                password_hash: 'seed_pwd',
                role: 'CLIENT',
                client_id: clientCompany.id
            });
        }

        // ── Resolve a FlagAdministration ─────────────────────────────
        const flagAdmin = await db.FlagAdministration.findOne();
        if (!flagAdmin) throw new Error('No FlagAdministration found. Please seed one first.');

        // ── Seed Jobs ─────────────────────────────────────────────────
        console.log(`🚢  Creating ${JOB_COUNT} vessel(s) and job(s)...\n`);

        for (let i = 0; i < JOB_COUNT; i++) {
            const idx = i + 1;
            const port = PORTS[i % PORTS.length];

            // 1. Create Vessel
            const imoNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
            const vesselName = `Seed Vessel ${idx} – ${imoNumber}`;
            console.log(`[${idx}] Creating vessel: ${vesselName}`);

            const vessel = await db.Vessel.create({
                client_id: client.client_id,
                vessel_name: vesselName,
                imo_number: imoNumber,
                flag_administration_id: flagAdmin.id,
                ship_type: 'Cargo',
                class_status: 'ACTIVE'
            });

            // 2. Create Job (status starts as CREATED)
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 30 + i * 7); // stagger dates

            const job = await db.JobRequest.create({
                vessel_id: vessel.id,
                certificate_type_id: certType.id,
                requested_by_user_id: client.id,
                job_status: 'CREATED',
                is_survey_required: true,
                target_date: targetDate,
                target_port: port
            });

            await db.JobStatusHistory.create({
                job_id: job.id,
                old_status: null,
                new_status: 'CREATED',
                changed_by: admin.id,
                change_reason: 'Initial creation (seed)'
            });

            console.log(`[${idx}] Job created (ID: ${job.id}) – status: CREATED`);

            // 3. CREATED → DOCUMENT_VERIFIED
            await lifecycleService.updateJobStatus(
                job.id, 'DOCUMENT_VERIFIED', admin.id, 'Documents verified by TO (seed)'
            );
            console.log(`[${idx}] Status → DOCUMENT_VERIFIED`);

            // 4. DOCUMENT_VERIFIED → APPROVED
            await lifecycleService.updateJobStatus(
                job.id, 'APPROVED', admin.id, 'Request approved by GM (seed)'
            );
            await job.update({ approved_by_user_id: admin.id });
            console.log(`[${idx}] Status → APPROVED`);

            // 5. APPROVED → ASSIGNED (set surveyor on job first)
            await job.reload();
            await job.update({
                assigned_surveyor_id: SURVEYOR_ID,
                assigned_by_user_id: admin.id
            });
            await lifecycleService.updateJobStatus(
                job.id, 'ASSIGNED', admin.id,
                `Assigned to surveyor ${SURVEYOR_ID} (seed)`
            );
            console.log(`[${idx}] Status → ASSIGNED (Surveyor: ${surveyor.first_name})`);

            // 6. ASSIGNED → SURVEY_AUTHORIZED
            await lifecycleService.updateJobStatus(
                job.id, 'SURVEY_AUTHORIZED', admin.id, 'Survey authorized by TM (seed)'
            );
            await job.reload();
            await job.update({ approved_by_user_id: admin.id });
            console.log(`[${idx}] Status → SURVEY_AUTHORIZED ✅`);
            console.log(`[${idx}] Done. Port: ${port} | Target Date: ${targetDate.toISOString().split('T')[0]}\n`);
        }

        console.log('─'.repeat(60));
        console.log(`🎉  Successfully created ${JOB_COUNT} job(s).`);
        console.log(`    All assigned to surveyor: ${surveyor.first_name} ${surveyor.last_name}`);
        console.log(`    All at status: SURVEY_AUTHORIZED`);
        console.log('─'.repeat(60));
    } catch (err) {
        console.error('\n❌  Seed failed:', err.message || err);
        if (err.errors) err.errors.forEach(e => console.error('  •', e.message));
    } finally {
        await db.sequelize.close();
        process.exit(0);
    }
}

run();
