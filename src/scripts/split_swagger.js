
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yamljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_FILE = path.join(__dirname, '../docs/swagger.yaml');
const OUTPUT_DIR = path.join(__dirname, '../docs/roles');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load the source YAML
const swaggerDoc = YAML.load(SOURCE_FILE);

// Define Role Mappings
// Each key is a role filename (e.g., 'admin'), value is array of Tags to include.
// If value is 'ALL', include everything.
const ROLE_MAPPINGS = {
    'admin': 'ALL',
    'client': [
        '🔐 Authentication',
        '🌐 Public Access',
        '🏢 Client Portal',
        '📝 Activity Requests',
        '💬 Feedback'
    ],
    'surveyor': [
        '🔐 Authentication',
        '🌐 Public Access',
        '👷 Surveyors',
        '📱 Mobile',
        '✅ Checklists',
        '🔍 Surveys',
        '📍 Geofence',
        '🚫 Non-Conformities',
        '🗂️ Evidence'
    ],
    'management': [
        '🔐 Authentication',
        '🌐 Public Access',
        '🚢 Vessels',
        '🏢 Clients',
        '📋 Jobs',
        '🔍 Surveys',
        '📜 Certificates',
        '💰 Payments',
        '👍 Approvals',
        '🔔 Notifications',
        '🗂️ Evidence',
        '📊 Reports',
        '🔄 Change Requests',
        '🚨 Incidents',
        '📅 Events',
        '⏱️ SLA',
        '🏭 Providers',
        '💬 Feedback',
        '📄 Templates',
        '📦 Bulk Operations',
        '🔍 Search',
        '⚖️ Compliance',
        '🤖 AI',
        '🎣 Webhooks'
    ]
};

// Helper: Filter paths based on tags
const filterPaths = (paths, allowedTags) => {
    if (allowedTags === 'ALL') return paths;

    const newPaths = {};
    for (const [pathKey, methods] of Object.entries(paths)) {
        const newMethods = {};
        let hasMethods = false;

        for (const [method, details] of Object.entries(methods)) {
            if (details.tags && details.tags.some(tag => allowedTags.includes(tag))) {
                newMethods[method] = details;
                hasMethods = true;
            }
        }

        if (hasMethods) {
            newPaths[pathKey] = newMethods;
        }
    }
    return newPaths;
};

// Generate files
Object.entries(ROLE_MAPPINGS).forEach(([role, tags]) => {
    const roleDoc = JSON.parse(JSON.stringify(swaggerDoc)); // Deep copy

    roleDoc.info.title = `GIRIK API - ${role.toUpperCase()}`;
    roleDoc.paths = filterPaths(roleDoc.paths, tags);

    // Filter tags definition in 'tags' array to only specific ones (optional but cleaner)
    if (tags !== 'ALL' && roleDoc.tags) {
        roleDoc.tags = roleDoc.tags.filter(t => tags.includes(t.name));
    }

    const outputPath = path.join(OUTPUT_DIR, `swagger-${role}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(roleDoc, null, 2));
    console.log(`Generated ${role.toUpperCase()} swagger at ${outputPath}`);
});

console.log('Swagger splitting complete.');
