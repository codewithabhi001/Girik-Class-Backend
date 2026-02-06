
import * as abacService from '../services/abac.service.js';
import db from '../models/index.js';

/**
 * Middleware to enforce ABAC policies.
 * @param {string} resourceType - The name of the resource (e.g., 'JOB', 'CERTIFICATE')
 * @param {string} action - The action being performed (e.g., 'READ', 'UPDATE')
 * @param {function} resourceIdGetter - Function to extract resource ID from request (e.g., req => req.params.id)
 * @param {function} resourceFetcher - Optional function to fetch resource if not standard generic fetch
 */
export const checkAbac = (resourceType, action, resourceIdGetter) => {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) return res.status(401).json({ message: 'Unauthorized' });

            const resourceId = resourceIdGetter ? resourceIdGetter(req) : null;
            let resourceData = null;

            if (resourceId) {
                // Determine model from resourceType
                // Convention: resourceType 'JOB' -> db.JobRequest
                // This mapping might need to be explicit if names don't match
                const modelNameMap = {
                    'JOB': 'JobRequest',
                    'CERTIFICATE': 'Certificate',
                    'PAYMENT': 'Payment',
                    'USER': 'User'
                };

                const modelName = modelNameMap[resourceType] || resourceType;

                if (db[modelName]) {
                    resourceData = await db[modelName].findByPk(resourceId);
                    if (!resourceData) {
                        return res.status(404).json({ message: 'Resource not found' });
                    }
                    // Attach to req for controller use to avoid re-fetching
                    req.resource = resourceData;

                    // Convert to JSON for safe evaluation
                    resourceData = resourceData.toJSON();
                }
            }

            const isAllowed = await abacService.checkAccess(user, resourceType, action, resourceData);

            if (!isAllowed) {
                return res.status(403).json({
                    success: false,
                    error_code: 'ACCESS_DENIED_POLICY',
                    message: 'Access denied by security policy',
                    trace_id: req.id
                });
            }

            next();
        } catch (error) {
            console.error('ABAC Middleware Error:', error);
            next(error);
        }
    };
};
