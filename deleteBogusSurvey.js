import db from './src/models/index.js';

async function deleteBogus() {
  await db.Survey.destroy({
    where: { id: '019e8712-c552-71be-b46a-b40393b36225' }
  });
  console.log("Deleted bogus survey");
  process.exit(0);
}
deleteBogus();
