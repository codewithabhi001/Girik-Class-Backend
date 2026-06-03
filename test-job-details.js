import db from './src/models/index.js';
import { getSurveyDetails } from './src/modules/surveys/survey.service.js';

async function run() {
  try {
    const details = await getSurveyDetails('019e8d1e-1263-769e-8b2f-06c7b802745c', { id: '019e8300-cd16-7009-8fb6-6685c6086efc' });
    console.log(JSON.stringify(details, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

run();
