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
      const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
      if (!httpMethods.includes(method.toLowerCase())) {
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
 * Customize spec based on role constraints (e.g. status enums)
 */
function customizeSpec(spec, role) {
  if (role === 'SURVEYOR') {
    // 1. Filter Job Statuses for Surveyor
    const jobsGet = spec.paths?.['/api/v1/jobs']?.get;
    if (jobsGet && jobsGet.parameters) {
      const statusParam = jobsGet.parameters.find(p => p.name === 'status');
      if (statusParam && statusParam.schema && statusParam.schema.enum) {
        // Surveyors only see jobs from ASSIGNED onwards
        const surveyorStatuses = [
          'ASSIGNED',
          'SURVEY_DONE',
          'TO_APPROVED',
          'TM_FINAL',
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
  let spec = filterSpecByRole(cachedFullSpec, role);

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
