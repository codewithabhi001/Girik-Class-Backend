/**
 * Builds production-grade OpenAPI specs from modular YAML.
 * - Merges base.yaml + schemas/*.yaml + paths/*.yaml
 * - Filters paths by x-roles per role
 * - Outputs: src/docs/roles/swagger-role-{admin,gm,tm,surveyor,client}.json
 *
 * Run: node scripts/build-openapi.js
 * Or:  npm run build:openapi
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yamljs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'src', 'docs');
const SCHEMAS_DIR = path.join(DOCS, 'schemas');
const PATHS_DIR = path.join(DOCS, 'paths');
const ROLES_DIR = path.join(DOCS, 'roles');

const ROLES = ['admin', 'gm', 'tm', 'to', 'surveyor', 'client'];

// Role slug -> allowed x-roles values (uppercase)
const ROLE_MAP = {
  admin: ['ADMIN', 'PUBLIC'],
  gm: ['GM', 'ADMIN', 'PUBLIC'],
  tm: ['TM', 'GM', 'ADMIN', 'PUBLIC'],
  to: ['TO', 'TM', 'GM', 'ADMIN', 'PUBLIC'],
  surveyor: ['SURVEYOR', 'PUBLIC'],
  client: ['CLIENT', 'PUBLIC'],
};

function loadYaml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return YAML.parse(content);
}

function mergeSchemas() {
  const schemas = {};
  const files = fs.readdirSync(SCHEMAS_DIR).filter((f) => f.endsWith('.yaml'));
  for (const f of files) {
    const data = loadYaml(path.join(SCHEMAS_DIR, f));
    if (data && typeof data === 'object') {
      Object.assign(schemas, data);
    }
  }
  return schemas;
}

function mergePaths() {
  const paths = {};
  const files = fs.readdirSync(PATHS_DIR).filter((f) => f.endsWith('.yaml'));
  for (const f of files) {
    const data = loadYaml(path.join(PATHS_DIR, f));
    if (data && typeof data === 'object') {
      for (const [p, ops] of Object.entries(data)) {
        if (!paths[p]) paths[p] = {};
        Object.assign(paths[p], ops);
      }
    }
  }
  return paths;
}

function operationAllowedForRole(op, roleSlug) {
  const roles = op['x-roles'];
  if (!Array.isArray(roles)) return false;
  const allowed = ROLE_MAP[roleSlug] || [];
  return roles.some((r) => allowed.includes(String(r).toUpperCase()));
}

function filterPathsForRole(allPaths, roleSlug) {
  const filtered = {};
  for (const [pathKey, methods] of Object.entries(allPaths)) {
    const filteredMethods = {};
    for (const [method, op] of Object.entries(methods)) {
      if (operationAllowedForRole(op, roleSlug)) {
        filteredMethods[method] = op;
      }
    }
    if (Object.keys(filteredMethods).length > 0) {
      filtered[pathKey] = filteredMethods;
    }
  }
  return filtered;
}

function buildFullSpec() {
  const base = loadYaml(path.join(DOCS, 'base.yaml'));
  const schemas = mergeSchemas();
  const allPaths = mergePaths();

  const spec = {
    openapi: base.openapi,
    info: base.info,
    servers: base.servers,
    tags: base.tags,
    paths: allPaths,
    components: {
      ...base.components,
      schemas: {
        ...(base.components?.schemas || {}),
        ...schemas,
      },
    },
    security: base.security || [{ bearerAuth: [] }],
  };

  return spec;
}

function main() {
  if (!fs.existsSync(ROLES_DIR)) {
    fs.mkdirSync(ROLES_DIR, { recursive: true });
  }

  const fullSpec = buildFullSpec();
  const allPaths = fullSpec.paths;

  for (const role of ROLES) {
    const filteredPaths = filterPathsForRole(allPaths, role);
    const roleSpec = {
      ...fullSpec,
      info: {
        ...fullSpec.info,
        title: `Girik Marine API - ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        description: `APIs for **${role.toUpperCase()}** role. Use POST /auth/login first, then Authorize with the token.`,
      },
      paths: filteredPaths,
    };

    const outPath = path.join(ROLES_DIR, `swagger-role-${role}.json`);
    fs.writeFileSync(outPath, JSON.stringify(roleSpec, null, 2), 'utf8');
    console.log(`Written: src/docs/roles/swagger-role-${role}.json (${Object.keys(filteredPaths).length} paths)`);
  }

  // Also write combined (all roles) for /api-docs/all
  fullSpec.info.title = 'Girik Marine API - All Roles';
  fullSpec.info.description = 'Full API documentation. Filter by tag or use role-specific docs.';
  fs.writeFileSync(path.join(DOCS, 'swagger-by-role.json'), JSON.stringify(fullSpec, null, 2), 'utf8');
  console.log('Written: src/docs/swagger-by-role.json');
}

main();
