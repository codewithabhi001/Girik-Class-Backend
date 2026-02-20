/**
 * Builds the full OpenAPI spec by merging base.yaml, schemas, and paths.
 * Provides role-filtered spec for role-specific Swagger UIs.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yamljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = __dirname;
const SCHEMAS_DIR = path.join(DOCS_DIR, 'schemas');
const PATHS_DIR = path.join(DOCS_DIR, 'paths');

const ROLES = ['ADMIN', 'GM', 'TM', 'TO', 'TA', 'SURVEYOR', 'CLIENT', 'FLAG_ADMIN', 'PUBLIC'];
const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

/**
 * Deep merge objects
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Load and parse a YAML file
 */
function loadYaml(filePath) {
  return yaml.load(filePath);
}

function clone(obj) {
  return obj == null ? obj : JSON.parse(JSON.stringify(obj));
}

function inferPrimitiveExample(schema) {
  if (!schema || typeof schema !== 'object') return null;
  if (schema.example !== undefined) return clone(schema.example);
  if (Array.isArray(schema.enum) && schema.enum.length) return clone(schema.enum[0]);

  const type = schema.type;
  const format = schema.format;

  if (type === 'string') {
    if (format === 'uuid') return '01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f';
    if (format === 'date') return '2026-03-15';
    if (format === 'date-time') return '2026-03-15T10:00:00.000Z';
    if (format === 'email') return 'user@example.com';
    if (format === 'uri' || format === 'url') return 'https://example.com/resource';
    if (format === 'binary') return 'file.bin';
    return 'string';
  }

  if (type === 'integer') return 1;
  if (type === 'number') return 1.5;
  if (type === 'boolean') return true;
  return null;
}

function resolveRef($ref, spec) {
  if (typeof $ref !== 'string') return null;
  const parts = $ref.replace(/^#\//, '').split('/');
  let node = spec;
  for (const key of parts) {
    if (!node || typeof node !== 'object') return null;
    node = node[key];
  }
  return node || null;
}

function buildExampleFromSchema(schema, spec, visited = new Set()) {
  if (!schema || typeof schema !== 'object') return null;

  if (schema.example !== undefined) return clone(schema.example);
  if (schema.default !== undefined) return clone(schema.default);

  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    if (!refName || visited.has(refName)) return null;
    visited.add(refName);
    const resolved = resolveRef(schema.$ref, spec);
    return buildExampleFromSchema(resolved, spec, visited);
  }

  if (Array.isArray(schema.oneOf) && schema.oneOf.length) {
    return buildExampleFromSchema(schema.oneOf[0], spec, visited);
  }
  if (Array.isArray(schema.anyOf) && schema.anyOf.length) {
    return buildExampleFromSchema(schema.anyOf[0], spec, visited);
  }
  if (Array.isArray(schema.allOf) && schema.allOf.length) {
    const merged = {};
    for (const item of schema.allOf) {
      const ex = buildExampleFromSchema(item, spec, visited);
      if (ex && typeof ex === 'object' && !Array.isArray(ex)) {
        Object.assign(merged, ex);
      }
    }
    if (Object.keys(merged).length) return merged;
  }

  const primitive = inferPrimitiveExample(schema);
  if (primitive !== null) return primitive;

  if (schema.type === 'array' || schema.items) {
    const itemExample = buildExampleFromSchema(schema.items || {}, spec, visited);
    return itemExample == null ? [] : [itemExample];
  }

  if (schema.type === 'object' || schema.properties || schema.additionalProperties) {
    const out = {};
    const properties = schema.properties || {};

    const required = Array.isArray(schema.required) ? schema.required : Object.keys(properties);
    for (const key of required) {
      const propSchema = properties[key];
      const value = buildExampleFromSchema(propSchema || { type: 'string' }, spec, visited);
      out[key] = value == null ? 'string' : value;
    }

    if (!Object.keys(out).length && schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      const value = buildExampleFromSchema(schema.additionalProperties, spec, visited);
      out.key = value == null ? 'string' : value;
    }

    return out;
  }

  return null;
}

function ensureOperationExamples(spec) {
  for (const pathItem of Object.values(spec.paths || {})) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.includes(method.toLowerCase())) continue;
      if (!operation || typeof operation !== 'object') continue;

      // Request examples
      const requestBody = operation.requestBody;
      if (requestBody?.content && typeof requestBody.content === 'object') {
        for (const mediaTypeObj of Object.values(requestBody.content)) {
          if (!mediaTypeObj || typeof mediaTypeObj !== 'object') continue;
          if (mediaTypeObj.example !== undefined || mediaTypeObj.examples !== undefined) continue;
          const ex = buildExampleFromSchema(mediaTypeObj.schema, spec);
          if (ex !== null) mediaTypeObj.example = ex;
        }
      }

      // Response examples + JSON fallback body
      const responses = operation.responses || {};
      for (const [statusCode, response] of Object.entries(responses)) {
        if (!response || typeof response !== 'object') continue;

        const isError = Number(statusCode) >= 400;
        if (!response.content || typeof response.content !== 'object' || !Object.keys(response.content).length) {
          response.content = {
            'application/json': {
              schema: isError
                ? { $ref: '#/components/schemas/ErrorResponse' }
                : {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Request successful' },
                  },
                },
            },
          };
        }

        for (const mediaTypeObj of Object.values(response.content)) {
          if (!mediaTypeObj || typeof mediaTypeObj !== 'object') continue;
          if (mediaTypeObj.example !== undefined || mediaTypeObj.examples !== undefined) continue;
          const ex = buildExampleFromSchema(mediaTypeObj.schema, spec);
          if (ex !== null) mediaTypeObj.example = ex;
        }
      }
    }
  }
}

/**
 * Build full OpenAPI spec
 */
export function buildFullSpec() {
  const base = loadYaml(path.join(DOCS_DIR, 'base.yaml'));

  // Merge schemas
  const schemaFiles = fs.readdirSync(SCHEMAS_DIR).filter((f) => f.endsWith('.yaml'));
  let schemas = {};
  for (const file of schemaFiles.sort()) {
    const content = loadYaml(path.join(SCHEMAS_DIR, file));
    if (content && typeof content === 'object') {
      schemas = deepMerge(schemas, content);
    }
  }

  // Merge paths
  const pathFiles = fs.readdirSync(PATHS_DIR).filter((f) => f.endsWith('.yaml'));
  let paths = {};
  for (const file of pathFiles.sort()) {
    const content = loadYaml(path.join(PATHS_DIR, file));
    if (content && typeof content === 'object') {
      for (const [pathKey, pathValue] of Object.entries(content)) {
        paths[pathKey] = deepMerge(paths[pathKey] || {}, pathValue);
      }
    }
  }

  const spec = {
    ...base,
    components: {
      ...base.components,
      schemas: deepMerge(base.components?.schemas || {}, schemas),
    },
    paths,
  };

  // Ensure each operation has practical request/response examples.
  ensureOperationExamples(spec);

  return spec;
}

/**
 * Filter spec to only include operations accessible by the given role.
 * An operation is included if its x-roles array contains the role or 'PUBLIC'.
 */
export function filterSpecByRole(spec, role) {
  if (!role || role === 'all') {
    return spec;
  }

  const filteredPaths = {};

  for (const [pathKey, pathValue] of Object.entries(spec.paths || {})) {
    const filteredPath = {};
    let hasOperations = false;

    for (const [method, op] of Object.entries(pathValue)) {
      // Skip non-operation keys (parameters, etc.)
      if (!HTTP_METHODS.includes(method.toLowerCase())) {
        filteredPath[method] = op;
        continue;
      }

      const roles = op['x-roles'];
      if (!Array.isArray(roles)) {
        filteredPath[method] = op;
        hasOperations = true;
        continue;
      }

      // Include if role matches or operation is PUBLIC
      if (roles.includes(role) || roles.includes('PUBLIC')) {
        filteredPath[method] = op;
        hasOperations = true;
      }
    }

    if (hasOperations) {
      filteredPaths[pathKey] = filteredPath;
    }
  }

  return {
    ...spec,
    paths: filteredPaths,
    info: {
      ...spec.info,
      title: `${spec.info?.title || 'API'} (${role} view)`,
      description: `${spec.info?.description || ''}\n\n**Filtered view:** Only endpoints accessible to role **${role}**.`,
    },
  };
}

/**
 * Filter components.schemas to only include schemas referenced in paths
 */
function shakeSchemas(spec) {
  const definitions = spec.components?.schemas || {};
  const usedSchemas = new Set();
  const queue = [];

  // 1. Initial scan of paths for $ref
  function findRefs(obj) {
    if (!obj || typeof obj !== 'object') return;

    if (obj.$ref) {
      const parts = obj.$ref.split('/');
      const name = parts[parts.length - 1];
      if (definitions[name] && !usedSchemas.has(name)) {
        usedSchemas.add(name);
        queue.push(name);
      }
    }

    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        findRefs(obj[key]);
      }
    }
  }

  findRefs(spec.paths);

  // 2. Transitive dependencies
  while (queue.length > 0) {
    const name = queue.pop();
    const schema = definitions[name];
    if (schema) {
      // Find refs inside this schema
      const internalUsed = new Set();
      // Helper specific for schema traversal to avoid re-adding parent
      function findschemaRefs(obj) {
        if (!obj || typeof obj !== 'object') return;
        if (obj.$ref) {
          const parts = obj.$ref.split('/');
          const refName = parts[parts.length - 1];
          if (definitions[refName] && !usedSchemas.has(refName)) {
            usedSchemas.add(refName);
            queue.push(refName);
          }
        }
        for (const key in obj) {
          if (typeof obj[key] === 'object') {
            findschemaRefs(obj[key]);
          }
        }
      }
      findschemaRefs(schema);
    }
  }

  // 3. Rebuild definitions
  const newSchemas = {};
  for (const name of usedSchemas) {
    newSchemas[name] = definitions[name];
  }

  // 4. Update spec
  if (spec.components) {
    spec.components.schemas = newSchemas;
  }

  return spec;
}

/**
 * Filter tags to only include used tags
 */
function filterTags(spec) {
  if (!spec.tags) return spec;

  const usedTags = new Set();
  for (const pathKey in spec.paths) {
    const pathItem = spec.paths[pathKey];
    for (const method in pathItem) {
      const op = pathItem[method];
      if (op.tags && Array.isArray(op.tags)) {
        op.tags.forEach(tag => usedTags.add(tag));
      }
    }
  }

  spec.tags = spec.tags.filter(t => usedTags.has(t.name));
  return spec;
}


/**
 * Customize spec based on role constraints (e.g. status enums, examples)
 */
function customizeSpec(spec, role) {
  // Update login example if role is specific
  const loginPost = spec.paths?.['/api/v1/auth/login']?.post;
  if (loginPost && loginPost.requestBody?.content?.['application/json']) {
    const roleEmails = {
      ADMIN: 'admin@girik.com',
      TM: 'tm@girik.com',
      GM: 'gm@girik.com',
      SURVEYOR: 'surveyor@girik.com',
      CLIENT: 'ops@pacific.com',
    };

    if (roleEmails[role]) {
      loginPost.requestBody.content['application/json'].example = {
        email: roleEmails[role],
        password: 'Password@123'
      };
      loginPost.description = (loginPost.description || '') + `\n\n**Note:** Default credentials for **${role}** have been pre-filled for testing.`;
    }
  }

  if (role === 'SURVEYOR') {
    // 1. Filter Job Statuses for Surveyor
    const jobsGet = spec.paths?.['/api/v1/jobs']?.get;
    if (jobsGet && jobsGet.parameters) {
      const statusParam = jobsGet.parameters.find(p => p.name === 'status');
      if (statusParam && statusParam.schema && statusParam.schema.enum) {
        // Surveyors only see jobs from ASSIGNED onwards
        const surveyorStatuses = [
          'ASSIGNED',
          'SURVEY_AUTHORIZED',
          'IN_PROGRESS',
          'SURVEY_DONE',
          'REVIEWED',
          'FINALIZED',
          'REWORK_REQUESTED',
          'PAYMENT_DONE',
          'CERTIFIED',
          'REJECTED'
        ];
        // Intersect with existing enum to be safe, or just overwrite
        statusParam.schema.enum = statusParam.schema.enum.filter(s => surveyorStatuses.includes(s));
        statusParam.description = (statusParam.description || '') + ' (Filtered for SURVEYOR context)';
      }
    }
  }
  return spec;
}

/**
 * Get spec for a role. Caches full spec.
 */
let cachedFullSpec = null;

export function getSpecForRole(role) {
  if (!cachedFullSpec) {
    cachedFullSpec = buildFullSpec();
  }
  const baseSpec = clone(cachedFullSpec);
  let spec = filterSpecByRole(baseSpec, role);

  // Custom overrides (modify spec based on role rules)
  spec = customizeSpec(spec, role);

  // Clean up unused schemas and tags
  spec = shakeSchemas(spec);
  spec = filterTags(spec);

  return spec;
}

export function clearCache() {
  cachedFullSpec = null;
}
