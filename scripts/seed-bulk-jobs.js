/**
 * Bulk Seed Script
 * ─────────────────────────────────────────────────────────────
 * 1. Ensures EVERY certificate type (requires_survey=true) has
 *    at least one ACTIVE checklist template.
 * 2. Creates 25 jobs spread across those cert types.
 * 3. Assigns all jobs to surveyor 019c79a4-4930-71fd-aa73-887301791935.
 * 4. Advances each job: CREATED → DOCUMENT_VERIFIED → APPROVED
 *                        → ASSIGNED → SURVEY_AUTHORIZED
 *
 * Usage:
 *   node scripts/seed-bulk-jobs.js
 */

import 'dotenv/config';
import db from '../src/models/index.js';
import * as lifecycleService from '../src/services/lifecycle.service.js';

const SURVEYOR_ID = '019c79a4-4930-71fd-aa73-887301791935';
const TOTAL_JOBS = 25;

// ── Port/date variety helpers ────────────────────────────────
const PORTS = [
    'Singapore', 'Rotterdam', 'Shanghai', 'Dubai', 'Mumbai',
    'Hamburg', 'Busan', 'Los Angeles', 'Antwerp', 'Colombo',
    'Port Klang', 'Piraeus', 'Felixstowe', 'Jeddah', 'Tanjung Pelepas'
];
const SHIP_TYPES = ['Cargo', 'Tanker', 'Bulk Carrier', 'Container Ship', 'General Cargo'];

// ── Checklist template builder ───────────────────────────────
const buildTemplate = (certType, admin) => ({
    name: `${certType.name} – Survey Checklist`,
    code: `AUTO-${certType.id.replace(/-/g, '').substring(0, 12).toUpperCase()}`,
    description: `Auto-generated survey checklist for ${certType.name}`,
    certificate_type_id: certType.id,
    status: 'ACTIVE',
    created_by: admin.id,
    updated_by: admin.id,
    metadata: {
        version: '1.0',
        auto_generated: true,
        applicable_vessel_types: ['Cargo', 'Tanker', 'Bulk Carrier', 'Container Ship'],
        regulatory_reference: certType.issuing_authority === 'CLASS' ? 'SOLAS' : 'MARPOL'
    },
    sections: [
        {
            title: 'General Vessel Condition',
            items: [
                { code: 'GVC001', text: 'Vessel is accessible and crew cooperative?', type: 'YES_NO_NA' },
                { code: 'GVC002', text: 'Vessel particulars match certificate records?', type: 'YES_NO_NA' },
                { code: 'GVC003', text: 'Previous survey deficiencies rectified?', type: 'YES_NO_NA' },
                { code: 'GVC004', text: 'General observations / remarks', type: 'TEXT' }
            ]
        },
        {
            title: `${certType.name} – Specific Checks`,
            items: [
                { code: 'SPE001', text: 'All relevant equipment present and operational?', type: 'YES_NO_NA' },
                { code: 'SPE002', text: 'Documentation up-to-date and accessible on board?', type: 'YES_NO_NA' },
                { code: 'SPE003', text: 'Number of items inspected', type: 'NUMBER' },
                { code: 'SPE004', text: 'Deficiencies found (describe)', type: 'TEXT' },
                { code: 'SPE005', text: 'Recommended follow-up action', type: 'TEXT' }
            ]
        },
        {
            title: 'Survey Completion',
            items: [
                { code: 'SVC001', text: 'Survey completed without significant findings?', type: 'YES_NO_NA' },
                { code: 'SVC002', text: 'Captain / officer signature obtained?', type: 'YES_NO_NA' },
                { code: 'SVC003', text: 'Final remarks', type: 'TEXT' }
            ]
        }
    ]
});

// ── Main ─────────────────────────────────────────────────────
async function run() {
    try {
        await db.sequelize.authenticate();
        console.log('✅  Database connected.\n');

        // ── Resolve actors ────────────────────────────────────
        const surveyor = await db.User.findByPk(SURVEYOR_ID);
        if (!surveyor || surveyor.role !== 'SURVEYOR') {
            throw new Error(`Surveyor ${SURVEYOR_ID} not found or not SURVEYOR role.`);
        }
        console.log(`👤  Surveyor : ${surveyor.name || surveyor.email}`);

        const admin = await db.User.findOne({ where: { role: 'ADMIN' } });
        if (!admin) throw new Error('No ADMIN user found.');
        console.log(`👤  Admin    : ${admin.name || admin.email}`);

        // ── Resolve or create client ──────────────────────────
        let clientUser = await db.User.findOne({
            where: { role: 'CLIENT', client_id: { [db.Sequelize.Op.not]: null } }
        });
        if (!clientUser) {
            console.log('⚙️   No CLIENT found – creating dummy client…');
            const co = await db.Client.create({ company_name: 'Bulk Seed Co.', country: 'Singapore' });
            clientUser = await db.User.create({
                first_name: 'Bulk', last_name: 'Client',
                email: `bulk_client_${Date.now()}@seed.com`,
                password_hash: 'seed', role: 'CLIENT', client_id: co.id
            });
        }
        console.log(`👤  Client   : ${clientUser.name || clientUser.email}\n`);

        // ── Resolve flag admin ────────────────────────────────
        const flagAdmin = await db.FlagAdministration.findOne();
        if (!flagAdmin) throw new Error('No FlagAdministration found.');

        // ── Load ALL certificate types that require survey ────
        const allCertTypes = await db.CertificateType.findAll({
            where: { status: 'ACTIVE', requires_survey: true }
        });
        if (allCertTypes.length === 0) throw new Error('No active survey-required certificate types found.');
        console.log(`📜  Found ${allCertTypes.length} survey-required certificate type(s).\n`);

        // ── Ensure every cert type has a checklist template ───
        console.log('🔧  Ensuring checklist templates exist for every certificate type…');
        for (const ct of allCertTypes) {
            const existing = await db.ChecklistTemplate.findOne({
                where: { certificate_type_id: ct.id, status: 'ACTIVE' }
            });
            if (existing) {
                console.log(`   ✅  "${ct.name}" → template: "${existing.name}"`);
            } else {
                const tmpl = await db.ChecklistTemplate.create(buildTemplate(ct, admin));
                console.log(`   🆕  "${ct.name}" → created template: "${tmpl.name}"`);
            }
        }
        console.log();

        // ── Create 25 jobs ────────────────────────────────────
        console.log(`🚢  Creating ${TOTAL_JOBS} jobs…\n`);
        const createdJobs = [];

        for (let i = 0; i < TOTAL_JOBS; i++) {
            // Round-robin across cert types
            const certType = allCertTypes[i % allCertTypes.length];
            const port = PORTS[i % PORTS.length];
            const shipType = SHIP_TYPES[i % SHIP_TYPES.length];

            // Target date: staggered over next 90 days
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 15 + (i * 3));

            // ── 1. Create Vessel ──
            const imoNumber = Math.floor(1000000 + Math.random() * 9000000).toString();
            const vessel = await db.Vessel.create({
                client_id: clientUser.client_id,
                vessel_name: `MV Bulk Seed ${String(i + 1).padStart(2, '0')} – ${imoNumber}`,
                imo_number: imoNumber,
                flag_administration_id: flagAdmin.id,
                ship_type: shipType,
                class_status: 'ACTIVE'
            });

            // ── 2. Create Job ──
            const job = await db.JobRequest.create({
                vessel_id: vessel.id,
                certificate_type_id: certType.id,
                requested_by_user_id: clientUser.id,
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
                change_reason: 'Initial creation (bulk seed)'
            });

            // ── 3. Lifecycle transitions ──
            await lifecycleService.updateJobStatus(
                job.id, 'DOCUMENT_VERIFIED', admin.id, 'Docs verified (bulk seed)'
            );
            await lifecycleService.updateJobStatus(
                job.id, 'APPROVED', admin.id, 'Approved (bulk seed)'
            );
            await job.update({ approved_by_user_id: admin.id });

            await job.reload();
            await job.update({
                assigned_surveyor_id: SURVEYOR_ID,
                assigned_by_user_id: admin.id
            });
            await lifecycleService.updateJobStatus(
                job.id, 'ASSIGNED', admin.id, `Assigned to surveyor (bulk seed)`
            );

            await lifecycleService.updateJobStatus(
                job.id, 'SURVEY_AUTHORIZED', admin.id, 'Survey authorized (bulk seed)'
            );

            createdJobs.push({ jobId: job.id, certType: certType.name, port, vessel: vessel.vessel_name });
            console.log(
                `  [${String(i + 1).padStart(2, '0')}/${TOTAL_JOBS}] ` +
                `Job ${job.id.substring(0, 8)}… | ${certType.name.substring(0, 30).padEnd(30)} | ${port}`
            );
        }

        // ── Summary ───────────────────────────────────────────
        console.log('\n' + '─'.repeat(70));
        console.log(`🎉  Done! ${TOTAL_JOBS} jobs created & advanced to SURVEY_AUTHORIZED.`);
        console.log(`    Assigned surveyor: ${surveyor.name || surveyor.email} (${SURVEYOR_ID})`);
        console.log(`    Certificate types covered: ${[...new Set(createdJobs.map(j => j.certType))].length} / ${allCertTypes.length}`);
        console.log(`    Ports used: ${[...new Set(createdJobs.map(j => j.port))].join(', ')}`);
        console.log('─'.repeat(70));

    } catch (err) {
        console.error('\n❌  Seed failed:', err.message || err);
        if (err.errors) err.errors.forEach(e => console.error('   •', e.message));
    } finally {
        await db.sequelize.close();
        process.exit(0);
    }
}

run();
