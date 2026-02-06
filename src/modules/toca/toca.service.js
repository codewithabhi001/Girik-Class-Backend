import db from '../../models/index.js';
import * as notificationService from '../../services/notification.service.js';

const Toca = db.Toca;

export const createToca = async (data, user) => {
    // data includes vessel_id, losing, gaining, etc.
    // documents_url could be array of S3 links
    const toca = await Toca.create({ ...data, status: 'PENDING' });
    return toca;
};

export const updateStatus = async (id, status, user) => {
    const toca = await Toca.findByPk(id);
    if (!toca) throw { statusCode: 404, message: 'TOCA not found' };

    await toca.update({ status, decision_date: new Date() });

    // Notify
    await notificationService.notifyRoles(['GM'], 'TOCA Status Update', `TOCA ${id} is now ${status}`);

    return toca;
};

export const getTocas = async (query) => {
    return await Toca.findAll({ limit: 10 });
}
