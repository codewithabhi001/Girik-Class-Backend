
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, '../../APIS_BY_ROLE_RESPONSE.md');
const OUTPUT_DIR = path.join(__dirname, '../docs/roles');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const content = fs.readFileSync(INPUT_FILE, 'utf-8');

const rolesData = {};
let currentRole = null;

const lines = content.split('\n');

for (const line of lines) {
    if (line.startsWith('## Role:')) {
        currentRole = line.replace('## Role:', '').trim();
        // Normalize role name
        if (currentRole.includes('ALL')) currentRole = 'ALL';
        rolesData[currentRole] = [];
    } else if (line.trim().startsWith('|') && !line.includes('Module') && !line.includes('---')) {
        // Parse table row
        const parts = line.split('|').map(p => p.trim()).filter(p => p);
        if (parts.length >= 3) {
            const method = parts[1].replace(/\*\*/g, '').toLowerCase();
            const endpoint = parts[2].replace(/`/g, '');
            rolesData[currentRole].push({
                module: parts[0],
                method: method,
                endpoint: endpoint,
                // also strip backticks from response if needed, but not critical
                response: parts[3] ? parts[3].replace(/`/g, '') : 'Unknown'
            });
        }
    }
}

// Helper to convert express path to swagger path
const toSwaggerPath = (path) => {
    return path.replace(/\/:([a-zA-Z0-9_]+)/g, '/{$1}');
};

// Helper to extract parameters from path
const getParameters = (path) => {
    const matches = path.match(/\/:([a-zA-Z0-9_]+)/g);
    if (!matches) return [];
    return matches.map(m => {
        const name = m.replace('/:', '');
        return {
            name: name,
            in: 'path',
            required: true,
            schema: { type: 'string' }
        };
    });
};

const generateSwagger = (role, apis) => {
    const paths = {};

    apis.forEach(api => {
        const swaggerPath = toSwaggerPath(api.endpoint);
        if (!paths[swaggerPath]) paths[swaggerPath] = {};

        const pathParams = getParameters(api.endpoint);

        paths[swaggerPath][api.method] = {
            tags: [api.module], // Use Module as Tag
            summary: `${api.method.toUpperCase()} ${api.module}`,
            security: [{ bearerAuth: [] }],
            parameters: pathParams,
            responses: {
                '200': {
                    description: `Success: ${api.response}`
                }
            }
        };

        // Add request body for POST/PUT
        if (['post', 'put', 'patch'].includes(api.method)) {
            paths[swaggerPath][api.method].requestBody = {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                // generic placeholder
                                exampleField: { type: 'string' }
                            }
                        }
                    }
                }
            };
        }
    });

    return {
        openapi: '3.0.0',
        info: {
            title: `Girik Backend API - ${role}`,
            version: '1.0.0'
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Localhost' },
            { url: 'https://girik', description: 'Production' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        paths: paths
    };
};

// Merge paths helper
const mergePaths = (target, source) => {
    for (const [path, methods] of Object.entries(source)) {
        if (!target[path]) target[path] = {};
        for (const [method, details] of Object.entries(methods)) {
            target[path][method] = details;
        }
    }
    return target;
};


// 1. Process Roles
const allApis = rolesData['ALL'] || [];
const allSwagger = generateSwagger('ALL', allApis);

// Save ALL (Authenticated)
fs.writeFileSync(path.join(OUTPUT_DIR, 'all_auth.json'), JSON.stringify(allSwagger, null, 2));

// Process each specific role (merge with ALL)
const predefinedRoles = ['ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR', 'CLIENT'];
const allCompletePaths = JSON.parse(JSON.stringify(allSwagger.paths)); // Start with ALL paths

predefinedRoles.forEach(role => {
    const roleApis = rolesData[role] || [];
    const roleSwagger = generateSwagger(role, roleApis);

    // Merge ALL paths into Role paths
    roleSwagger.paths = mergePaths(roleSwagger.paths, allSwagger.paths);

    // Convert Role name to filename (slug)
    const filename = role.toLowerCase() + '.json';
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), JSON.stringify(roleSwagger, null, 2));

    // Add to complete set
    mergePaths(allCompletePaths, generateSwagger(role, roleApis).paths);
});

// Finally generate valid 'all.json' which is the superset of EVERYTHING
const completeSwagger = {
    openapi: '3.0.0',
    info: { title: 'Girik Backend API - ALL ROLES', version: '1.0.0' },
    servers: [
        { url: 'http://localhost:3000', description: 'Localhost' },
        { url: 'https://girik', description: 'Production' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    },
    paths: allCompletePaths
};

fs.writeFileSync(path.join(OUTPUT_DIR, 'all.json'), JSON.stringify(completeSwagger, null, 2));

console.log('Swagger files generated in src/docs/roles/');
