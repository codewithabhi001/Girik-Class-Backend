import { Op } from 'sequelize';

/**
 * Builds Sequelize where clause for Certificate queries based on user role.
 * Used by certificate.service.js getCertificateScopeFilter (which passes db and forwards to this).
 * @param {object} user - { id, role, client_id }
 * @param {object} deps - { JobRequest, Vessel }
 * @returns {Promise<object>} where clause for Certificate
 */
export async function buildCertificateScopeWhere(user, deps) {
    if (!user) return {};
    const { JobRequest, Vessel } = deps;
    const role = user.role;
    if (['ADMIN', 'GM', 'TM', 'TO'].includes(role)) {
        return {};
    }
    if (role === 'SURVEYOR') {
        const jobs = await JobRequest.findAll({
            where: { assigned_surveyor_id: user.id },
            attributes: ['vessel_id'],
            raw: true,
        });
        const vesselIds = [...new Set(jobs.map((j) => j.vessel_id).filter(Boolean))];
        if (vesselIds.length === 0) {
            return { vessel_id: { [Op.in]: [null] } };
        }
        return { vessel_id: { [Op.in]: vesselIds } };
    }
    if (role === 'CLIENT') {
        if (!user.client_id) {
            return { vessel_id: { [Op.in]: [null] } };
        }
        const vessels = await Vessel.findAll({
            where: { client_id: user.client_id },
            attributes: ['id'],
            raw: true,
        });
        const vesselIds = vessels.map((v) => v.id);
        if (vesselIds.length === 0) {
            return { vessel_id: { [Op.in]: [null] } };
        }
        return { vessel_id: { [Op.in]: vesselIds } };
    }
    return { vessel_id: { [Op.in]: [null] } };
}
