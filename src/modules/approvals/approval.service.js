import db from '../../models/index.js';
const Approval = db.Approval;

export const createApproval = async (data) => {
    return await Approval.create({ ...data, status: 'PENDING' });
};

export const updateStep = async (id, status, user) => {
    const approval = await Approval.findByPk(id);
    if (!approval) throw { statusCode: 404, message: 'Approval not found' };

    await approval.update({ status, approved_by: user.id, approved_at: new Date() });
    return approval;
};
