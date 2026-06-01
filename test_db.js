import db from './src/models/index.js';
async function update() {
    await db.sequelize.authenticate();
    await db.CertificateRequiredDocument.update({ is_mandatory: false }, { where: {} });
    console.log("Updated RequiredDocs to have no mandatory docs.");
    process.exit(0);
}
update();
