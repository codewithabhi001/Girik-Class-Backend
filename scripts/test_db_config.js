import 'dotenv/config';
import './disable_replica.js';
import env from '../src/config/env.js';
console.log('Loaded database config:', JSON.stringify(env.database, null, 2));
