const express = require('express');
const listEndpoints = require('express-list-endpoints');
import('./src/routes.js').then(module => {
    const app = express();
    app.use('/api/v1', module.default);
    console.log(listEndpoints(app).filter(r => r.path.includes('checklist')));
});
