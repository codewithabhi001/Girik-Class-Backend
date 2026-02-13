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
 * Get spec for a role. Caches full spec.
 */
let cachedFullSpec = null;

export function getSpecForRole(role) {
  if (!cachedFullSpec) {
    cachedFullSpec = buildFullSpec();
  }
  return filterSpecByRole(cachedFullSpec, role);
}

export function clearCache() {
  cachedFullSpec = null;
}
