import db from '../src/models/index.js';
import logger from '../src/utils/logger.js';

async function repairSystem() {
    try {
        console.log('--- Starting Certificate System Repair ---');

        // 1. Ensure Flag Administrations exist
        const flags = [
            { flag_state_name: 'Panama', country: 'Panama', authority_name: 'Panama Maritime Authority', contact_email: 'panama@grclass.com' },
            { flag_state_name: 'Liberia', country: 'Liberia', authority_name: 'Liberian Ship Registry', contact_email: 'liberia@grclass.com' },
            { flag_state_name: 'India', country: 'India', authority_name: 'DG Shipping India', contact_email: 'india@grclass.com' },
            { flag_state_name: 'Marshall Islands', country: 'Marshall Islands', authority_name: 'Marshall Islands Administration', contact_email: 'marshallislands@grclass.com' },
            { flag_state_name: 'Bahamas', country: 'Bahamas', authority_name: 'Bahamas Maritime Authority', contact_email: 'bahamas@grclass.com' }
        ];

        for (const flag of flags) {
            const [item, created] = await db.FlagAdministration.findOrCreate({
                where: { flag_state_name: flag.flag_state_name },
                defaults: { ...flag, status: 'ACTIVE' }
            });
            if (created) console.log(`[Flag] Created: ${flag.flag_state_name}`);
        }

        // 2. Ensure Certificate Authorities exist
        const authorities = [
            { name: 'Liberian International Ship & Corporate Registry', code: 'LISCR', country: 'Liberia' },
            { name: 'Autoridad Marítima de Panamá', code: 'AMP', country: 'Panama' },
            { name: 'Directorate General of Shipping', code: 'DGS', country: 'India' },
            { name: 'Marshall Islands Maritime Administrator', code: 'MI', country: 'Marshall Islands' }
        ];

        for (const au of authorities) {
            const [item, created] = await db.CertificateAuthority.findOrCreate({
                where: { code: au.code },
                defaults: { ...au, status: 'ACTIVE' }
            });
            if (created) console.log(`[Authority] Created: ${au.name}`);
        }

        // 3. Fix missing source_type and status in existing certificates
        const brokenCerts = await db.Certificate.findAll({
            where: {
                [db.Sequelize.Op.or]: [
                    { source_type: null },
                    { status: null }
                ]
            }
        });

        if (brokenCerts.length > 0) {
            console.log(`Fixing ${brokenCerts.length} broken certificates...`);
            for (const cert of brokenCerts) {
                await cert.update({
                    source_type: cert.source_type || 'INTERNAL',
                    status: cert.status || 'DRAFT'
                });
            }
        }

        // 4. Cleanup old history with null values if any
        const brokenHistory = await db.CertificateHistory.findAll({
            where: {
                [db.Sequelize.Op.or]: [
                    { changed_by_user_id: null },
                    { changed_at: null }
                ]
            }
        });

        if (brokenHistory.length > 0) {
            console.log(`Cleaning up ${brokenHistory.length} history records...`);
            // We can't easily guess the user, so we leave it but fix the date
            for (const h of brokenHistory) {
                await h.update({
                    changed_at: h.changed_at || new Date()
                });
            }
        }

        console.log('--- Repair Complete ---');
        process.exit(0);
    } catch (err) {
        console.error('Repair failed:', err);
        process.exit(1);
    }
}

repairSystem();
