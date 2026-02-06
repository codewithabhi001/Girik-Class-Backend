
import db from '../../models/index.js';
import { Op } from 'sequelize';

const SlaRule = db.SlaRule;
const JobSlaLog = db.JobSlaLog;
const JobRequest = db.JobRequest;

// 1. Manage Rules
export const createSlaRule = async (data) => {
    return await SlaRule.create(data);
};

export const getRules = async () => {
    return await SlaRule.findAll({ where: { is_active: true } });
};

// 2. Job SLA Actions
export const overrideSla = async (jobId, newDeadline, reason, userId) => {
    // Audit log
    await JobSlaLog.create({
        job_id: jobId,
        action: 'OVERRIDE',
        reason: reason,
        new_deadline: newDeadline,
        performed_by: userId
    });

    // Update Job
    // Assuming JobRequest has a `target_date` we update, or we add an `sla_deadline` column (ideal)
    // For now, let's assume we update `target_date`
    await JobRequest.update({ target_date: newDeadline }, { where: { id: jobId } });

    console.log(`EVENT_SLA_OVERRIDE: Job ${jobId}`);
    return { message: 'SLA Overridden' };
};

export const pauseSla = async (jobId, reason, userId) => {
    await JobSlaLog.create({
        job_id: jobId,
        action: 'PAUSE',
        reason: reason,
        performed_by: userId
    });
    // Calculate paused time logic would go here (complex)
    return { message: 'Workflow Paused' };
};

export const resumeSla = async (jobId, userId) => {
    await JobSlaLog.create({
        job_id: jobId,
        action: 'RESUME',
        performed_by: userId
    });
    return { message: 'Workflow Resumed' };
};

// 3. Monitor

// 3. Monitor
export const checkBreaches = async () => {
    // Find active jobs past deadline
    const now = new Date();

    // Find jobs where target_date < now AND status NOT IN ('COMPLETED', 'CERTIFIED')
    const breaches = await JobRequest.findAll({
        where: {
            target_date: { [Op.lt]: now },
            job_status: { [Op.notIn]: ['COMPLETED', 'CERTIFIED', 'CANCELLED', 'ON_HOLD'] }
        }
    });

    for (const job of breaches) {
        // Log breach if not already logged recently (deduplication needed in real system)
        console.log(`EVENT_SLA_BREACH: Job ${job.id} missed deadline ${job.target_date}`);
        await JobSlaLog.create({
            job_id: job.id,
            action: 'BREACH',
            reason: `Automatic detection. Deadline: ${job.target_date}`,
            performed_by: null // System
        });
    }

    return breaches;
};

export const getBreaches = async () => {
    // Return logs of type BREACH or current active breaches
    // Returning Log history for now
    return await JobSlaLog.findAll({
        where: { action: 'BREACH' },
        limit: 50,
        order: [['created_at', 'DESC']],
        include: [JobRequest]
    });
};

