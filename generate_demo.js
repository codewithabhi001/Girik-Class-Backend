import { generateSampleReport } from './src/modules/reports/templates/survey-status-report.template.js';
import fs from 'fs';
import path from 'path';


const html = generateSampleReport();
fs.writeFileSync('survey-status-report-demo.html', html, 'utf8');
console.log('Successfully generated survey-status-report-demo.html');
