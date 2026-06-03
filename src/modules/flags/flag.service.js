import db from '../../models/index.js';
const { Op } = db.Sequelize;
import { resolveEntity } from '../../services/fileAccess.service.js';

const FlagAdministration = db.FlagAdministration;

export const createFlag = async (data) => {
    const flag = await FlagAdministration.create(data);
    return await resolveEntity(flag);
};

export const getFlags = async (search) => {
    const { Op } = db.Sequelize;
    const where = {};
    if (search) {
        where.flag_state_name = { [Op.like]: `%${search}%` };
    }
    const list = await FlagAdministration.findAll({
        where,
        attributes: [
            'id',
            'flag_state_name',
            'country',
            'authority_name',
            'contact_email',
            'logo_url',
            'status'
        ],
        useReplica: true
    });
    return await resolveEntity(list);
};

export const getFlag = async (id) => {
    const flag = await FlagAdministration.findByPk(id);
    return await resolveEntity(flag);
};  

export const updateFlag = async (id, data) => {
    const flag = await FlagAdministration.findByPk(id, { useMaster: true });
    if (!flag) throw { statusCode: 404, message: 'Flag not found' };
    const updated = await flag.update(data);
    return await resolveEntity(updated);
};

export const deleteFlag = async (id) => {
    const flag = await FlagAdministration.findByPk(id, { useMaster: true });
    if (!flag) throw { statusCode: 404, message: 'Flag not found' };

    // Check if this flag is associated with any vessel
    const vesselCount = await db.Vessel.count({ where: { flag_administration_id: id }, useMaster: true });
    if (vesselCount > 0) {
        throw {
            statusCode: 409,
            message: `Cannot delete this flag: it is currently assigned to ${vesselCount} vessel${vesselCount > 1 ? 's' : ''}. Please reassign or remove the flag from those vessels first.`
        };
    }

    // Check if this flag is associated with any certificate
    const certCount = await db.Certificate.count({ where: { flag_administration_id: id }, useMaster: true });
    if (certCount > 0) {
        throw {
            statusCode: 409,
            message: `Cannot delete this flag: it is referenced in ${certCount} certificate${certCount > 1 ? 's' : ''}. Please update those certificates first.`
        };
    }

    await flag.destroy();
    return { message: 'Flag deleted successfully' };
};

