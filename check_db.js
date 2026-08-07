import db from './src/models/index.js';

async function checkDB() {
    await db.sequelize.authenticate();
    const template = await db.CertificateTemplate.findOne({
        where: { template_name: 'GRClass_AFS_RA_SoC_Record.html' }
    });
    console.log(template.template_content.substring(0, 500));
    process.exit(0);
}
checkDB();
