/**
 * Builds a role-wise Postman collection from OpenAPI spec (same as Swagger role views).
 * Run: node scripts/build-postman-collection.js
 * Output: postman/Girik-API-Role-Based.postman_collection.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildFullSpec } from '../src/docs/build-openapi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROLES = ['ADMIN', 'GM', 'TM', 'SURVEYOR', 'CLIENT'];
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

/** Get resource key from path: /api/v1/certificates -> certificates, /api/v1/jobs/1/checklist -> jobs */
function getResourceFromPath(pathStr) {
  const segments = pathStr.split('/').filter(Boolean);
  // /api/v1/xxx/... -> xxx
  if (segments[0] === 'api' && segments[1] === 'v1' && segments[2]) return segments[2];
  if (segments[0]) return segments[0];
  return 'other';
}

/** certificates -> Certificates, activity-requests -> Activity Requests */
function toFolderName(key) {
  return key
    .replace(/-/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Resource folder order: auth first, then alphabetical */
const RESOURCE_ORDER = ['auth', 'public', 'health', 'certificates', 'jobs', 'surveys', 'clients', 'vessels', 'payments', 'users', 'documents', 'reports', 'approvals', 'notifications', 'system', 'dashboard', 'mobile', 'support', 'search', 'compliance', 'surveyors', 'checklist-templates', 'checklists', 'non-conformities', 'toca', 'flags', 'change-requests', 'certificate-templates', 'incidents', 'activity-requests', 'customer-feedback', 'feedback', 'templates', 'other'];

function sortResourceKeys(keys) {
  const orderMap = new Map(RESOURCE_ORDER.map((k, i) => [k, i]));
  return [...keys].sort((a, b) => {
    const ai = orderMap.has(a) ? orderMap.get(a) : 999;
    const bi = orderMap.has(b) ? orderMap.get(b) : 999;
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b);
  });
}

function openApiPathToPostman(pathStr) {
  return pathStr.replace(/\{(\w+)\}/g, '{{$1}}');
}

function getRequestBodyExample(op) {
  const content = op.requestBody?.content;
  if (!content) return undefined;
  const json = content['application/json'];
  if (!json) return undefined;
  const example = json.example;
  if (example) return JSON.stringify(example, null, 2);
  if (json.schema?.properties) {
    const obj = {};
    for (const [k, v] of Object.entries(json.schema.properties)) {
      if (v.example !== undefined) obj[k] = v.example;
      else if (v.type === 'string') obj[k] = '';
      else if (v.type === 'number') obj[k] = 0;
      else if (v.type === 'integer') obj[k] = 0;
      else if (v.type === 'boolean') obj[k] = false;
      else if (v.type === 'array') obj[k] = [];
      else obj[k] = null;
    }
    return JSON.stringify(obj, null, 2);
  }
  return undefined;
}

function getQueryParams(op) {
  const params = op.parameters || [];
  return params
    .filter((p) => p.in === 'query')
    .map((p) => ({
      key: p.name,
      value: p.schema?.default !== undefined ? String(p.schema.default) : '',
      description: p.description || '',
    }));
}

function getPathVars(pathStr) {
  const matches = pathStr.match(/\{(\w+)\}/g) || [];
  return matches.map((m) => m.slice(1, -1));
}

function buildRequest(op, pathStr, method) {
  const pathWithVars = openApiPathToPostman(pathStr);
  const rawUrl = `{{baseUrl}}${pathWithVars}`;
  const pathSegments = pathWithVars.split('/').filter(Boolean);
  const pathVarNames = getPathVars(pathStr);
  const roles = op['x-roles'];
  const needsAuth = Array.isArray(roles) && !roles.includes('PUBLIC') && roles.some((r) => ROLES.includes(r));
  const summary = op.summary || op.operationId || `${method.toUpperCase()} ${pathStr}`;

  const urlObj = {
    raw: rawUrl,
    host: ['{{baseUrl}}'],
    path: pathSegments,
  };
  if (pathVarNames.length) {
    urlObj.variable = pathVarNames.map((v) => ({ key: v, value: '' }));
  }

  const req = {
    name: summary,
    request: {
      method: method.toUpperCase(),
      header: [],
      url: urlObj,
      description: op.description || summary,
    },
    response: [],
  };

  if (needsAuth) {
    req.request.auth = {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{token}}', type: 'string' }],
    };
  }

  const query = getQueryParams(op);
  if (query.length) {
    req.request.url.query = query.map((q) => ({ key: q.key, value: q.value, description: q.description }));
  }

  const body = getRequestBodyExample(op);
  if (body) {
    req.request.header.push({ key: 'Content-Type', value: 'application/json', type: 'text' });
    req.request.body = {
      mode: 'raw',
      raw: body,
      options: { raw: { language: 'json' } },
    };
  }

  return req;
}

function collectOperationsByRole(spec) {
  const byRole = {};
  ROLES.forEach((r) => { byRole[r] = []; });

  for (const [pathKey, pathValue] of Object.entries(spec.paths || {})) {
    for (const method of HTTP_METHODS) {
      const op = pathValue[method];
      if (!op) continue;

      const roles = op['x-roles'];
      if (!Array.isArray(roles)) {
        ROLES.forEach((r) => byRole[r].push({ path: pathKey, method, op }));
        continue;
      }

      for (const role of ROLES) {
        if (roles.includes(role)) {
          byRole[role].push({ path: pathKey, method, op });
        }
      }
    }
  }

  return byRole;
}

/** Group operations by role, then by resource folder. Returns { [role]: { [resourceKey]: [{ path, method, op }] } } */
function groupByRoleAndResource(spec) {
  const byRole = collectOperationsByRole(spec);
  const byRoleAndResource = {};
  for (const role of ROLES) {
    byRoleAndResource[role] = {};
    for (const entry of byRole[role]) {
      const resource = getResourceFromPath(entry.path);
      if (!byRoleAndResource[role][resource]) byRoleAndResource[role][resource] = [];
      byRoleAndResource[role][resource].push(entry);
    }
  }
  return byRoleAndResource;
}

function buildCollection() {
  const spec = buildFullSpec();
  const byRoleAndResource = groupByRoleAndResource(spec);

  const collection = {
    info: {
      name: 'Girik Marine API (Role-based)',
      description: 'Postman collection generated from OpenAPI. Folders: Role (Admin, GM, etc.) → Resource (Certificates, Jobs, etc.) → APIs. Admin has all APIs admin can access; same for other roles.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      { key: 'baseUrl', value: 'http://localhost:3000' },
      { key: 'token', value: '' },
    ],
    item: [
      {
        name: '0. Auth & Public',
        description: 'Login (PUBLIC). After login, copy token to collection variable "token".',
        item: [],
      },
      ...ROLES.map((role) => ({
        name: role,
        description: `All APIs that role ${role} can access. Grouped by resource (Certificates, Jobs, etc.). Set token after login.`,
        item: [],
      })),
    ],
  };

  // Public ops grouped by resource (Auth, Public, etc.)
  const publicByResource = {};
  for (const [pathKey, pathValue] of Object.entries(spec.paths || {})) {
    for (const method of HTTP_METHODS) {
      const op = pathValue[method];
      if (!op) continue;
      const roles = op['x-roles'];
      if (Array.isArray(roles) && roles.includes('PUBLIC')) {
        const resource = getResourceFromPath(pathKey);
        if (!publicByResource[resource]) publicByResource[resource] = [];
        publicByResource[resource].push({ path: pathKey, method, op });
      }
    }
  }
  const publicResourceKeys = sortResourceKeys(Object.keys(publicByResource));
  collection.item[0].item = publicResourceKeys.map((resourceKey) => ({
    name: toFolderName(resourceKey),
    description: `Public endpoints for ${toFolderName(resourceKey)}`,
    item: publicByResource[resourceKey].map(({ path, method, op }) => buildRequest(op, path, method)),
  }));

  // Each role folder: resource subfolders with their requests
  ROLES.forEach((role, idx) => {
    const folderIdx = idx + 1;
    const resourceMap = byRoleAndResource[role];
    const resourceKeys = sortResourceKeys(Object.keys(resourceMap));
    collection.item[folderIdx].item = resourceKeys.map((resourceKey) => ({
      name: toFolderName(resourceKey),
      description: `${role} – ${toFolderName(resourceKey)} APIs`,
      item: resourceMap[resourceKey].map(({ path, method, op }) => buildRequest(op, path, method)),
    }));
  });

  return collection;
}

const outDir = path.join(__dirname, '..', 'postman');
const outFile = path.join(outDir, 'Girik-API-Role-Based.postman_collection.json');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(buildCollection(), null, 2), 'utf8');
console.log('Postman collection written to:', outFile);
