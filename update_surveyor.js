import db from './src/models/index.js';

async function run() {
    try {
        const surveyor = await db.User.findOne({ where: { email: 'abhivishwkarmaa52@gmail.com' } });
        if (!surveyor) throw new Error('Surveyor not found');
        
        const certTypes = await db.CertificateType.findAll();
        const certNames = certTypes.map(c => c.name);

        const vesselTypes = ['bulk carrier', 'container ship', 'oil tanker', 'general cargo', 'Bulk Carrier', 'Container Ship', 'Oil Tanker', 'General Cargo'];
        
        const profile = await db.SurveyorProfile.findOne({ where: { user_id: surveyor.id } });
        if (profile) {
            await profile.update({
                authorized_ship_types: JSON.stringify(vesselTypes),
                authorized_certificates: JSON.stringify(certNames),
                is_available: true,
                status: 'ACTIVE'
            });
            console.log('Surveyor profile updated.');
        } else {
            console.log('Surveyor profile not found.');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
