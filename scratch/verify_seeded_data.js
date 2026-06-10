import db from '../src/models/index.js';

async function check() {
    try {
        const surveyor = await db.User.findOne({ where: { role: 'SURVEYOR' } });
        const tm = await db.User.findOne({ where: { role: 'TM' } });
        const requester = await db.User.findOne({ where: { role: { [db.Sequelize.Op.in]: ['GM', 'ADMIN', 'TM'] } } });
        const certGen = await db.User.findOne({ where: { role: { [db.Sequelize.Op.in]: ['GM', 'ADMIN'] } } });
        const client = await db.Client.findOne();
        const flag = await db.FlagAdministration.findOne();
        const vessel = await db.Vessel.findOne();
        const certType = await db.CertificateType.findOne({ where: { requires_survey: true } });

        console.log('--- DB Data Check ---');
        console.log('Surveyor:', surveyor ? surveyor.email : 'MISSING');
        console.log('TM:', tm ? tm.email : 'MISSING');
        console.log('Requester:', requester ? requester.email : 'MISSING');
        console.log('CertGen:', certGen ? certGen.email : 'MISSING');
        console.log('Client:', client ? client.company_name : 'MISSING');
        console.log('Flag:', flag ? flag.flag_state_name : 'MISSING');
        console.log('Vessel:', vessel ? vessel.vessel_name : 'MISSING');
        console.log('CertType:', certType ? certType.name : 'MISSING');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
check();
