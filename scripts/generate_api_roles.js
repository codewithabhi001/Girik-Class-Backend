
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const modulesDir = path.join(srcDir, 'modules');
const routesFile = path.join(srcDir, 'routes.js');

const ROLES = ['ADMIN', 'GM', 'TM', 'TO', 'TA', 'SURVEYOR', 'CLIENT', 'FLAG_ADMIN'];

// Map to store final permissions: { Role: [ "METHOD /api/path" ] }
const rolePermissions = {};
ROLES.forEach(r => rolePermissions[r] = new Set());
rolePermissions['PUBLIC'] = new Set();
rolePermissions['AUTHENTICATED'] = new Set(); // For endpoints with no specific role checks but are authenticated

function cleanRoleName(r) {
    return r.trim().replace(/['"]/g, '');
}

function parseRoles(str) {
    // str looks like "'ADMIN', 'GM'"
    return str.split(',').map(cleanRoleName);
}

// 1. Analyze src/routes.js to identify modules and their mount points
const routesContent = fs.readFileSync(routesFile, 'utf8');
const mounts = [];

// Regex to find imports: import xyzRoutes from './path/to/routes.js'
// and mounts: router.use('/path', xyzRoutes)

const importMap = {};
const importRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
let match;
while ((match = importRegex.exec(routesContent)) !== null) {
    importMap[match[1]] = path.resolve(srcDir, match[2]);
}

const useRegex = /router\.use\(['"]([^'"]+)['"],\s*(\w+)\)/g;
while ((match = useRegex.exec(routesContent)) !== null) {
    mounts.push({
        prefix: match[1],
        variable: match[2],
        path: importMap[match[2]]
    });
}
// Special case for root '/' mount
const rootUseRegex = /router\.use\(['"]\/['"],\s*(\w+)\)/g;
while ((match = rootUseRegex.exec(routesContent)) !== null) {
    mounts.push({
        prefix: '',
        variable: match[1],
        path: importMap[match[1]]
    });
}

console.log(`Found ${mounts.length} module mounts.`);

// 2. Process each module file
mounts.forEach(module => {
    if (!module.path || !fs.existsSync(module.path)) {
        console.warn(`Warning: Could not resolve file for ${module.variable} (${module.path})`);
        return;
    }

    const content = fs.readFileSync(module.path, 'utf8');
    const lines = content.split('\n');
    let fileLevelRoles = null; // null means no restrictions found at file level

    // Check for router.use(hasRole(...))
    // We assume it's usually at the top level of the router setup
    const fileRoleRegex = /router\.use\(\s*hasRole\(([^)]+)\)\s*\)/;
    const fileRoleMatch = content.match(fileRoleRegex);
    if (fileRoleMatch) {
        fileLevelRoles = parseRoles(fileRoleMatch[1]);
    }

    // Identify routes
    // router.METHOD('/path', middleware, handler)
    // We look for router.get, .post, .put, .delete, .patch

    // We iterate line by line for simplicity, though multilines might break this.
    // Ideally we should match the whole file, but regex is tricky.
    // Let's assume standard formatting: router.method('path', hasRole(...), ...)

    // Improved strategy: Match all router.[verb] calls globally
    const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]*)['"]\s*,([^;]+)\)/g;

    // We need to loop manually because we need to parse the middleware arguments
    let routeMatch;
    while ((routeMatch = routeRegex.exec(content)) !== null) {
        const method = routeMatch[1].toUpperCase();
        let subPath = routeMatch[2];
        const middlewares = routeMatch[3];

        // Ensure path prefix handling
        if (subPath === '/') subPath = '';
        let fullPath = `/api${module.prefix}${subPath}`;
        // Remove double slashes if any (except ://)
        fullPath = fullPath.replace(/([^:]\/)\/+/g, '$1');

        // Check for specific roles in this route
        const roleCheckRegex = /hasRole\(([^)]+)\)/;
        const roleMatch = middlewares.match(roleCheckRegex);

        let routeRoles = null;
        if (roleMatch) {
            routeRoles = parseRoles(roleMatch[1]);
        }

        // Determine effective roles
        // Start with file level
        let effectiveRoles = fileLevelRoles ? [...fileLevelRoles] : null;

        if (routeRoles) {
            if (effectiveRoles) {
                // Intersection
                effectiveRoles = effectiveRoles.filter(r => routeRoles.includes(r));
            } else {
                effectiveRoles = [...routeRoles];
            }
        }

        // Special handling for Public module
        if (module.prefix.includes('/public')) {
            rolePermissions['PUBLIC'].add(`${method} ${fullPath}`);
            continue;
        }

        // Apply Logic:
        // 1. ADMIN is always added if it's a protected route (which virtually all are under /api except public)
        // 2. If 'effectiveRoles' is null, it typically means "Authenticated User" (any valid token)
        // 3. We assume 'Authenticated' maps to "All Roles" (except Public/Anon) 

        const finalRolesStart = new Set();

        if (effectiveRoles) {
            effectiveRoles.forEach(r => finalRolesStart.add(r));
            // Always add ADMIN if strictly role protected (unless explicitly excluded? No, rbac says admin bypasses)
            finalRolesStart.add('ADMIN');
        } else {
            // No role restriction found on file or route.
            // Check if it's protected by Auth middleware (assumed yes for /api)
            // So All Roles can access
            ROLES.forEach(r => finalRolesStart.add(r));
            // Maybe add to AUTHENTICATED list for clarity
            rolePermissions['AUTHENTICATED'].add(`${method} ${fullPath}`);
        }

        finalRolesStart.forEach(role => {
            if (rolePermissions[role]) {
                rolePermissions[role].add(`${method} ${fullPath}`);
            }
        });
    }
});

// 3. Generate Output MarkDown
let output = "# API Access Control Matrix\n\n";
output += "This document lists API endpoints accessible to each user role.\n";
output += "*Note: 'ADMIN' typically has access to all protected endpoints.*\n\n";

// Print Public Routes first
if (rolePermissions['PUBLIC'].size > 0) {
    output += `## 🌍 PUBLIC (No Auth Required)\n`;
    [...rolePermissions['PUBLIC']].sort().forEach(api => output += `- \`${api}\`\n`);
    output += '\n';
}

if (rolePermissions['AUTHENTICATED'].size > 0) {
    output += `## 🔐 AUTHENTICATED (All Logged-in Users)\n`;
    output += "These endpoints do not have specific role restrictions but require a valid login.\n";
    [...rolePermissions['AUTHENTICATED']].sort().forEach(api => output += `- \`${api}\`\n`);
    output += '\n';
}

ROLES.forEach(role => {
    output += `## 👤 Role: ${role}\n`;
    const apis = [...rolePermissions[role]].sort();

    // Filter out ones already listed in AUTHENTICATED to reduce noise?
    // Actually, explicit listing is better for "What can I do?"
    // But if list is identical to Authenticated, say so? No, just list.

    if (apis.length === 0) {
        output += "_No specific endpoints found (or role not used in explicit checks)._\n";
    } else {
        apis.forEach(api => {
            output += `- \`${api}\`\n`;
        });
    }
    output += "\n";
});

const outputPath = path.join(projectRoot, 'src', 'docs', 'API_ROLES_LIST.md');
// Ensure docs dir exists
if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

fs.writeFileSync(outputPath, output);
console.log(`Documentation generated at: ${outputPath}`);
