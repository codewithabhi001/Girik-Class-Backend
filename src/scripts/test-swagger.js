import swaggerJsdoc from 'swagger-jsdoc';
import swaggerConfig from '../config/swagger.config.js';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Testing Base YAML Parsing ---');
try {
    const basePath = path.join(__dirname, '../docs/swagger.yaml');
    const baseData = YAML.load(basePath);
    console.log('Base YAML parsed successfully.');
} catch (error) {
    console.error('Base YAML parsing failed:', error);
}

console.log('\n--- Testing Module YAML Parsing ---');
const modulesDir = path.join(__dirname, '../modules');

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanDir(fullPath);
        } else if (file.endsWith('.swagger.yaml')) {
            try {
                YAML.load(fullPath);
                console.log(`PASS: ${file}`);
            } catch (e) {
                console.error(`FAIL: ${file}`, e.message);
            }
        }
    }
}

try {
    scanDir(modulesDir);
} catch (e) {
    console.log("Error scanning modules:", e);
}

console.log('\n--- Testing JSDoc Generation ---');
try {
    const spec = swaggerJsdoc(swaggerConfig);
    console.log('Swagger Spec Generation Successful');
    console.log('Title:', spec.info.title);
    console.log('Version:', spec.info.version);
    console.log('Paths Count:', Object.keys(spec.paths || {}).length);
} catch (error) {
    console.error('Swagger Generation Failed:', error);
}
