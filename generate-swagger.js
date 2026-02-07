import fs from 'fs';
import yaml from 'js-yaml';

// Read the MASTER_API_LIST.md file
const apiList = fs.readFileSync('./MASTER_API_LIST.md', 'utf8');

// Parse the markdown table
const lines = apiList.split('\n');
const apis = [];

for (let i = 5; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.startsWith('|')) continue;

    const parts = line.split('|').map(p => p.trim()).filter(p => p);
    if (parts.length >= 4) {
        const [module, method, endpoint, description] = parts;
        if (method && endpoint && !endpoint.includes('Method')) {
            apis.push({ module, method, endpoint, description });
        }
    }
}

console.log(`Found ${apis.length} APIs`);

// Generate paths object
const paths = {};

apis.forEach(api => {
    const path = api.endpoint.replace('/api/v1', '');
    const method = api.method.toLowerCase();

    if (!paths[path]) {
        paths[path] = {};
    }

    // Determine tag from module
    const tagMap = {
        'AUTH': '🔐 Authentication',
        'USER': '👥 Users',
        'ROLE': '🔑 Roles & Permissions',
        'VESSEL': '🚢 Vessels',
        'CLIENT': '🏢 Clients',
        'JOB': '📋 Jobs',
        'SURVEY': '🔍 Surveys',
        'CERTIFICATE': '📜 Certificates',
        'PAYMENT': '💰 Payments',
        'SURVEYOR': '👨‍🔧 Surveyors',
        'NC': '⚠️ Non-Conformities',
        'MOBILE': '📱 Mobile Sync',
        'NOTIFICATION': '🔔 Notifications',
        'DOC': '📄 Documents',
        'APPROVAL': '✅ Approvals',
        'REPORT': '📊 Reports',
        'SEARCH': '🔍 Search',
        'BULK': '📦 Bulk Operations',
        'CHANGEREQUEST': '🔄 Change Requests',
        'EVENT': '📅 Events',
        'INCIDENT': '🚨 Incidents',
        'TEMPLATE': '📝 Templates',
        'CLIENTPORTAL': '🏠 Client Portal',
        'PUBLIC': '🌐 Public APIs',
        'SECURITY': '🔒 Security',
        'SYSTEM': '⚙️ System',
        'GEOFENCE': '📍 Geofencing',
        'SLA': '⏱️ SLA Management',
        'WEBHOOK': '🔗 Webhooks',
        'AUDIT': '📋 Audit Logs',
        'COMPLIANCE': '⚖️ Compliance',
        'EVIDENCE': '🔐 Evidence',
        'FLAG': '🏴 Flag Administration',
        'TOCA': '🔄 TOCA',
        'CHECKLIST': '✓ Checklists',
        'AI': '🤖 AI Services'
    };

    const tag = tagMap[api.module] || api.module;

    // Security - public endpoints don't need auth
    const security = path.includes('/public/') || path.includes('/auth/login') || path.includes('/auth/register')
        ? []
        : [{ bearerAuth: [] }];

    paths[path][method] = {
        tags: [tag],
        summary: api.description,
        description: `${api.description} - ${api.module} module`,
        security: security,
        parameters: extractParameters(path),
        requestBody: needsRequestBody(method) ? {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            // Generic properties
                        }
                    }
                }
            }
        } : undefined,
        responses: {
            '200': {
                description: '✅ Success',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object'
                        }
                    }
                }
            },
            '201': {
                description: '✅ Created'
            },
            '400': {
                description: '❌ Bad Request'
            },
            '401': {
                $ref: '#/components/responses/UnauthorizedError'
            },
            '403': {
                $ref: '#/components/responses/ForbiddenError'
            },
            '404': {
                $ref: '#/components/responses/NotFoundError'
            },
            '500': {
                $ref: '#/components/responses/ServerError'
            }
        }
    };
});

function extractParameters(path) {
    const params = [];
    const matches = path.match(/:(\w+)/g);
    if (matches) {
        matches.forEach(match => {
            const paramName = match.substring(1);
            params.push({
                name: paramName,
                in: 'path',
                required: true,
                schema: {
                    type: 'string'
                },
                description: `${paramName} identifier`
            });
        });
    }
    return params.length > 0 ? params : undefined;
}

function needsRequestBody(method) {
    return ['post', 'put', 'patch'].includes(method);
}

// Write to file
const output = yaml.dump({ paths }, { lineWidth: -1 });
fs.writeFileSync('./swagger-paths.yaml', output);

console.log('✅ Generated swagger-paths.yaml with all APIs!');
console.log(`Total paths: ${Object.keys(paths).length}`);
