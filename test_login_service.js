import { Sequelize } from 'sequelize';
import env from './src/config/env.js';
import db from './src/models/index.js';
import { login } from './src/modules/auth/auth.service.js';

async function test() {
  try {
    const result = await login('to@grclass.com', 'Pass@1234');
    console.log('Login success:', result.user.email);
  } catch (err) {
    console.error('Login Error:', err);
  } finally {
    process.exit(0);
  }
}
test();
