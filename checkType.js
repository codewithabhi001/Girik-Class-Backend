import db from './src/models/index.js';

async function check() {
  const c = await db.CertificateType.findByPk('019e8326-1a42-7616-a168-1f1b51c7d952');
  console.log('model:', c.requires_survey, 'type:', typeof c.requires_survey, 'isFalse?', c.requires_survey === false);
  process.exit(0);
}
check();
