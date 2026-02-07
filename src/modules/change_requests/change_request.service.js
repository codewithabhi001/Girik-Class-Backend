import db from '../../models/index.js';
import logger from '../../utils/logger.js';

const { ChangeRequest, User } = db;

/**
 * Create a change request
 */
export const createChangeRequest = async (data) => {
    const changeRequest = await ChangeRequest.create({
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        requested_by: data.requested_by,
        change_description: data.change_description,
        old_value: data.old_value,
        new_value: data.new_value,
        status: 'PENDING',
        priority: data.priority || 'MEDIUM'
    });

    return changeRequest;
};

/**
 * Get all change requests with filters
 */
export const getChangeRequests = async (filters = {}) => {
    const where = {};

    if (filters.status) where.status = filters.status;
    if (filters.entity_type) where.entity_type = filters.entity_type;
    if (filters.requested_by) where.requested_by = filters.requested_by;

    const changeRequests = await ChangeRequest.findAll({
        where,
        include: [
            { model: User, as: 'requester', attributes: ['id', 'name', 'email'] },
            { model: User, as: 'approver', attributes: ['id', 'name', 'email'] }
        ],
        order: [['created_at', 'DESC']]
    });

    return changeRequests;
};

/**
 * Approve a change request
 */
export const approveChangeRequest = async (id, approvedBy, remarks) => {
    const changeRequest = await ChangeRequest.findByPk(id);

    if (!changeRequest) {
        throw new Error('Change request not found');
    }

    if (changeRequest.status !== 'PENDING') {
        throw new Error('Change request has already been processed');
    }

    await changeRequest.update({
        status: 'APPROVED',
        approved_by: approvedBy,
        approval_remarks: remarks,
        approved_at: new Date()
    });

    // TODO: Apply the actual change to the entity
    logger.info(`Change request ${id} approved by ${approvedBy}`);

    return changeRequest;
};

/**
 * Reject a change request
 */
export const rejectChangeRequest = async (id, rejectedBy, remarks) => {
    const changeRequest = await ChangeRequest.findByPk(id);

    if (!changeRequest) {
        throw new Error('Change request not found');
    }

    if (changeRequest.status !== 'PENDING') {
        throw new Error('Change request has already been processed');
    }

    await changeRequest.update({
        status: 'REJECTED',
        approved_by: rejectedBy,
        approval_remarks: remarks,
        approved_at: new Date()
    });

    return changeRequest;
};
