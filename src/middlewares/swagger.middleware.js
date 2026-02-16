/**
 * Role-specific Swagger UI middleware.
 * Serves OpenAPI docs at:
 *   /api-docs          - Full spec (all endpoints)
 *   /api-docs/admin    - ADMIN role view
 *   /api-docs/gm       - GM role view
 *   /api-docs/tm       - TM role view
 *   /api-docs/surveyor - SURVEYOR role view
 *   /api-docs/client   - CLIENT role view
 */
import swaggerUi from 'swagger-ui-express';
import { clearCache, getSpecForRole } from '../docs/build-openapi.js';

const ROLE_SLUGS = ['admin', 'gm', 'tm', 'to', 'surveyor', 'client', 'ta', 'flag_admin'];

const ROLE_MAP = {
  admin: 'ADMIN',
  gm: 'GM',
  tm: 'TM',
  to: 'TO',
  ta: 'TA',
  surveyor: 'SURVEYOR',
  client: 'CLIENT',
  flag_admin: 'FLAG_ADMIN',
};

/**
 * Swagger UI options - Bearer auth for "Try it out"
 */
const SWAGGER_OPTIONS = {
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    tryItOutEnabled: true,
  },
};

/**
 * Setup Swagger UI - single mount at /api-docs
 * Uses swaggerUrl to load role-specific spec from /api-docs/spec/:role.json
 */
export function setupSwagger(app) {
  // Spec endpoints - must be before the catch-all to avoid static file conflict
  app.get('/api-docs/spec.json', (req, res) => {
    // Rebuild on each request so docs edits appear instantly in dev.
    clearCache();
    const role = req.query.role || 'all';
    const spec = getSpecForRole(role);
    res.json(spec);
  });

  const roleUrls = [
    { url: '/api-docs/spec.json?role=all', name: 'ALL' },
    { url: '/api-docs/spec.json?role=ADMIN', name: 'ADMIN' },
    { url: '/api-docs/spec.json?role=GM', name: 'GM' },
    { url: '/api-docs/spec.json?role=TM', name: 'TM' },
    { url: '/api-docs/spec.json?role=TO', name: 'TO' },
    { url: '/api-docs/spec.json?role=TA', name: 'TA' },
    { url: '/api-docs/spec.json?role=SURVEYOR', name: 'SURVEYOR' },
    { url: '/api-docs/spec.json?role=CLIENT', name: 'CLIENT' },
    { url: '/api-docs/spec.json?role=FLAG_ADMIN', name: 'FLAG_ADMIN' },
  ];

  // Swagger UI: serve static first, then custom HTML for index paths
  const customHandler = (req, res, next) => {
    // Determine role from path: /api-docs/admin -> admin, /api-docs -> all
    const pathParts = req.path.replace(/^\//, '').split('/').filter(Boolean);
    const roleSlug = pathParts[0] && ROLE_SLUGS.includes(pathParts[0].toLowerCase())
      ? pathParts[0].toLowerCase()
      : null;

    const role = roleSlug ? ROLE_MAP[roleSlug] : 'all';
    const isRootDocs = req.path === '/' || req.path === '';

    const html = isRootDocs
      ? swaggerUi.generateHTML(null, {
          ...SWAGGER_OPTIONS,
          swaggerOptions: {
            ...SWAGGER_OPTIONS.swaggerOptions,
            urls: roleUrls,
            'urls.primaryName': 'ALL',
          },
        })
      : swaggerUi.generateHTML(null, {
          ...SWAGGER_OPTIONS,
          swaggerUrl: `/api-docs/spec.json?role=${role}`,
        });

    res.send(html);
  };

  app.use('/api-docs', swaggerUi.serve, customHandler);
}
