import fs from 'fs';
import { getSpecForRole } from './src/docs/build-openapi.js';

try {
    const spec = getSpecForRole('ADMIN');
    fs.writeFileSync('admin_swagger.json', JSON.stringify(spec, null, 2));
    console.log('Admin swagger generated successfully at admin_swagger.json');
} catch (error) {
    console.error('Error generating swagger:', error);
}
