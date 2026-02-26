import fs from 'fs';
import path from 'path';

function getRoutesFromModules(dir) {
    let routes = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            routes = routes.concat(getRoutesFromModules(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('routes.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const regex = /(?:router|app)\.(get|post|put|patch|delete)\(['"`](.*?)['"`]/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                routes.push({
                    method: match[1],
                    pathSegment: match[2],
                    file: fullPath
                });
            }
        }
    }
    return routes;
}

try {
    const swagger = JSON.parse(fs.readFileSync('admin_swagger.json', 'utf8'));
    const paths = swagger.paths || {};

    const swaggerRoutes = [];
    for (const [pathStr, pathItem] of Object.entries(paths)) {
        for (const [method, _] of Object.entries(pathItem)) {
            if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
                swaggerRoutes.push(`${method.toUpperCase()} ${pathStr}`);
            }
        }
    }

    const modulesRoutes = getRoutesFromModules('./src/modules');
    let missing = [];

    // This is a rough mapping because standard express routes differ from swagger routes (e.g., /:id vs /{id})
    modulesRoutes.forEach(r => {
        // standard express route like / or /:id
        // we need to combine it with the module base route.
        // But in girik backend usually routes.js mounts it, and the base mount is in another file e.g., src/routes.js
        // Let's just print some info if we want to cross-reference exactly.
    });

    console.log(`Swagger has ${swaggerRoutes.length} operations.`);
    console.log(`Express files define roughly ${modulesRoutes.length} operations.`);

    // Checking the downloadCertificate missing 2xx
    const certOp = paths['/api/v1/certificates/{id}/download']?.get;
    if (certOp && (!certOp.responses || !Object.keys(certOp.responses).some(k => k.startsWith('2')))) {
        console.log('WARNING: /api/v1/certificates/{id}/download GET missing a 200 response.');
    }

} catch (error) {
    console.error('Error:', error);
}
