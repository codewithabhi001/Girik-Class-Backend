import db from '../../models/index.js';
import { Op } from 'sequelize';

const { JobRequest, Certificate, Payment, User, Vessel } = db;

/**
 * Get client dashboard statistics
 */
/**
 * Get client dashboard statistics
 */
export const getClientDashboard = async (userId) => {
    const user = await User.findByPk(userId, {
        include: [{ model: db.Client }]
    });
    if (!user) throw { statusCode: 404, message: 'User not found' };

    const clientId = user.client_id;
    if (!clientId) throw { statusCode: 403, message: 'User is not associated with a client' };

    // Get all vessels for this client
    const vessels = await Vessel.findAll({ where: { client_id: clientId } });
    const vesselIds = vessels.map(v => v.id);

    // Get jobs for all vessels of this client
    const jobs = await JobRequest.findAll({
        where: { vessel_id: vesselIds },
        include: [
            { model: Vessel, attributes: ['vessel_name'] },
            { model: db.CertificateType, attributes: ['name'] }
        ],
        order: [['created_at', 'DESC']]
    });

    // Get certificates for all vessels
    const certificates = await Certificate.findAll({
        where: { vessel_id: vesselIds },
        include: [{ model: Vessel, attributes: ['vessel_name'] }]
    });

    // Get payments for these jobs
    const jobIds = jobs.map(j => j.id);
    const payments = await Payment.findAll({
        where: { job_id: jobIds }
    });

    // Calculate statistics
    const stats = {
        total_vessels: vessels.length,
        active_jobs: jobs.filter(j => !['CERTIFIED', 'REJECTED'].includes(j.job_status)).length,
        expiring_soon: certificates.filter(c => {
            const daysToExpiry = Math.floor((new Date(c.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
            return daysToExpiry <= 60 && daysToExpiry > 0;
        }).length,
        pending_payments: payments.filter(p => p.payment_status === 'UNPAID').length,
    };

    return {
        stats,
        recent_jobs: jobs.slice(0, 5).map(j => ({
            id: j.id,
            vessel_name: j.Vessel?.vessel_name,
            type: j.CertificateType?.name,
            status: j.job_status,
            date: j.created_at
        })),
        expiring_certificates: certificates
            .filter(c => {
                const daysToExpiry = Math.floor((new Date(c.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                return daysToExpiry <= 60 && daysToExpiry > 0;
            })
            .slice(0, 5)
            .map(c => ({
                id: c.id,
                name: c.certificate_name,
                vessel: c.Vessel?.vessel_name,
                expiry_date: c.expiry_date
            }))
    };
};

/**
 * Get client profile and company details
 */
export const getClientProfile = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: ['id', 'name', 'email', 'role', 'phone'],
        include: [{
            model: db.Client,
            attributes: ['company_name', 'company_code', 'address', 'country', 'email', 'phone', 'contact_person_name', 'created_at']
        }]
    });

    if (!user) throw { statusCode: 404, message: 'User not found' };
    return user;
};
