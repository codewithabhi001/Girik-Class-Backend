
import db from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Safe policy evaluator. 
 * Replaces variables in condition string with context values and evaluates.
 * Supported variables: user.*, resource.*
 * CAUTION: This uses new Function() for evaluation, but with limited scope.
 * Ideally, use a library like 'casbin' or 'accesscontrol', but per requirements, we are building dynamic DB policies.
 */
const evaluateCondition = (condition, context) => {
    try {
        // Create a safe context proxy
        const safeContext = {
            user: context.user,
            resource: context.resource
        };

        const keys = Object.keys(safeContext);
        const values = Object.values(safeContext);

        // Simple safety check: block imports, requires, or process access
        if (condition.includes('import') || condition.includes('require') || condition.includes('process.')) {
            console.warn('Unsafe ABAC condition detected:', condition);
            return false;
        }

        const func = new Function(...keys, `return ${condition};`);
        return func(...values);
    } catch (error) {
        console.error(`Error evaluating ABAC condition: "${condition}"`, error);
        return false;
    }
};

export const checkAccess = async (user, resourceType, action, resourceData = null) => {
    // 1. Admin bypass (optional, but usually admins have full access)
    // if (user.role === 'ADMIN') return true; 

    // 2. Fetch applicable policies
    // We look for policies that match the resource and (optionally) specific action, or wildcard action
    const policies = await db.AbacPolicy.findAll({
        where: {
            resource: resourceType,
            is_active: true
        }
    });

    // If no policies exist for this resource, decision falls back to Default Deny or Allow depending on system config.
    // Usually, if ABAC is enforced, it should be Default Deny.
    // However, if we are mixing RBAC and ABAC, we might only check ABAC if policies exist.
    if (policies.length === 0) {
        return true; // Pass through to RBAC if no specific ABAC policies defined
    }

    let allow = false;

    for (const policy of policies) {
        // Check if policy allows or denies
        // We need a context. If resourceData is missing (e.g. list operation), we can only check static policies.

        const context = {
            user: {
                id: user.id,
                role: user.role,
                ...user // spread other user attributes
            },
            resource: resourceData || {}
        };

        const result = evaluateCondition(policy.condition_script, context);

        if (result) {
            if (policy.effect === 'DENY') {
                return false; // Explicit Deny overrides everything
            }
            if (policy.effect === 'ALLOW') {
                allow = true;
            }
        }
    }

    return allow;
};
