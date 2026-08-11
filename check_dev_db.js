import { Sequelize } from 'sequelize';
import env from './src/config/env.js';

const sequelize = new Sequelize('Gr_class_Dev', env.database.username, env.database.password, {
  host: env.database.host,
  dialect: 'mysql',
  logging: false
});

async function run() {
  try {
    const [results] = await sequelize.query("SELECT * FROM system_settings WHERE `key` = 'maintenance_mode'");
    console.log('maintenance_mode:', results);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}
run();
