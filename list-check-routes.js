import express from 'express';
import listEndpoints from 'express-list-endpoints';
import router from './src/routes.js';

const app = express();
app.use('/api/v1', router);

console.log(listEndpoints(app).filter(r => r.path.includes('checklist')));
