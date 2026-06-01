import db from './src/models/index.js';

async function grantAll() {
    try {
        const surveyor = await db.User.findOne({ where: { email: 'abhivishwkarmaa52@gmail.com' } });
        if (!surveyor) throw new Error('Surveyor not found');

        const certTypes = await db.CertificateType.findAll();
        for (const certType of certTypes) {
            await db.SurveyorScope.findOrCreate({
                where: { user_id: surveyor.id, certificate_type_id: certType.id },
                defaults: { user_id: surveyor.id, certificate_type_id: certType.id }
            });
        }
        console.log('Granted all certificate authorities to surveyor.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

grantAll();
