import db from './src/models/index.js';

async function run() {
    try {
        const requiredDocs = await db.CertificateRequiredDocument.findAll({
            where: { certificate_type_id: '019e6844-1adb-70ee-823e-b7c580eb715f', is_mandatory: true }
        });
        console.log(requiredDocs.map(rd => rd.id));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
