
import db from '../../models/index.js';
import { Op } from 'sequelize';

const UserSession = db.UserSession;
const User = db.User;
const AbacPolicy = db.AbacPolicy;

export const getActiveSessions = async (userId) => {
    return await UserSession.findAll({
        where: {
            user_id: userId,
            is_revoked: false,
            expires_at: { [Op.gt]: new Date() }
        },
        order: [['last_active_at', 'DESC']]
    });
};

export const revokeSession = async (sessionId, userId) => {
    const session = await UserSession.findOne({
        where: { id: sessionId, user_id: userId }
    });

    if (!session) throw new Error('Session not found or already revoked');

    session.is_revoked = true;
    session.revoked_at = new Date();
    session.revoked_reason = 'User Logout';
    await session.save();
    return session;
};

export const revokeOtherSessions = async (currentSessionId, userId) => {
    return await UserSession.update(
        { is_revoked: true, revoked_at: new Date(), revoked_reason: 'Remote Logout' },
        {
            where: {
                user_id: userId,
                id: { [Op.ne]: currentSessionId },
                is_revoked: false
            }
        }
    );
};

export const forceLogoutUser = async (targetUserId, adminId) => {
    // 1. Revoke all sessions
    await UserSession.update(
        { is_revoked: true, revoked_at: new Date(), revoked_reason: 'Admin Force Logout' },
        { where: { user_id: targetUserId, is_revoked: false } }
    );

    // 2. Mark user as force-logged-out (optional, if column exists on User)
    // await User.update({ last_force_logout_at: new Date() }, { where: { id: targetUserId } });

    // 3. Emit Event (TODO: integrating event bus later)
    console.log(`EVENT_FORCE_LOGOUT: User ${targetUserId} by Admin ${adminId}`);

    return { message: 'User forcefully logged out from all devices.' };
};


// ABAC Policy Management
export const createPolicy = async (policyData) => {
    return await AbacPolicy.create(policyData);
};

export const getPolicies = async () => {
    return await AbacPolicy.findAll({ where: { is_active: true } });
};
