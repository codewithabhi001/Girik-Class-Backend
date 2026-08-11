import { Sequelize } from 'sequelize';
import env from './src/config/env.js';
import db from './src/models/index.js';

async function test() {
  try {
    const user = await db.User.findOne({
        where: { email: 'to@grclass.com' },
        include: [
            { model: db.Client, attributes: ['id', 'company_name'] },
            { model: db.SurveyorProfile, attributes: ['id'] }
        ],
        useMaster: true
    });
    console.log('User found:', user?.email);
  } catch (err) {
    console.error('Sequelize Error:', err);
  } finally {
    process.exit(0);
  }
}
test();
