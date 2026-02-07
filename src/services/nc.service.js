import db from '../models/index.js';
import * as notificationService from './notification.service.js';

const NonConformity = db.NonConformity;

export const createNC = async (data, user) => {
    const nc = await NonConformity.create({ ...data, status: 'OPEN' });

    // Notify
    await notificationService.notifyRoles(['TM', 'TO'], 'New Non-Conformity', `NC raised for Job ${data.job_id} by ${user.name}`);

    return nc;
};

export const closeNC = async (id, remarks) => {
    const nc = await NonConformity.findByPk(id);
    if (!nc) throw { statusCode: 404, message: 'NC not found' };

    await nc.update({ status: 'CLOSED', closure_remarks: remarks, closed_at: new Date() });

    return nc;
};

export const getByJob = async (jobId) => {
    return await NonConformity.findAll({ where: { job_id: jobId } });
};
