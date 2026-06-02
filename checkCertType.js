import db from './src/models/index.js';

async function check() {
  const c = await db.CertificateType.findByPk('019e8326-1a42-7616-a168-1f1b51c7d952');
  console.log(c.toJSON());
  process.exit(0);
}
check();
