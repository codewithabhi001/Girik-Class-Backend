import db from '../../models/index.js';
import * as s3Service from '../../services/s3.service.js';
import * as notificationService from '../../services/notification.service.js';

const SurveyReport = db.SurveyReport;
const JobRequest = db.JobRequest;
const GpsTracking = db.GpsTracking;
const ActivityPlanning = db.ActivityPlanning;
const JobStatusHistory = db.JobStatusHistory;

export const submitSurveyReport = async (data, file, userId) => {
    const { job_id, gps_latitude, gps_longitude, survey_statement } = data;

    const job = await JobRequest.findByPk(job_id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };

    if (job.gm_assigned_surveyor_id !== userId) {
        throw { statusCode: 403, message: 'You are not assigned to this job' };
    }

    if (job.job_status !== 'IN_PROGRESS') {
        throw { statusCode: 400, message: 'Survey report can only be submitted after starting the survey (job must be IN_PROGRESS)' };
    }

    const checklistCount = await ActivityPlanning.count({ where: { job_id } });
    if (checklistCount === 0) {
        throw { statusCode: 400, message: 'Checklist must be submitted before submitting the survey report' };
    }

    // Upload Photo
    let photoUrl = null;
    if (file) {
        photoUrl = await s3Service.uploadFile(file.buffer, file.originalname, file.mimetype, s3Service.UPLOAD_FOLDERS.SURVEYS_PHOTO);
    }

    // Save Report
    const report = await SurveyReport.create({
        job_id,
        surveyor_id: userId,
        survey_date: new Date(),
        gps_latitude,
        gps_longitude,
        attendance_photo_url: photoUrl,
        survey_statement
    });

    // Update Job Status
    await job.update({ job_status: 'SURVEY_DONE' });

    // Log GPS
    await GpsTracking.create({
        surveyor_id: userId,
        vessel_id: job.vessel_id,
        job_id,
        latitude: gps_latitude,
        longitude: gps_longitude
    });

    return report;
};

export const startSurvey = async (data, userId) => {
    const { job_id, latitude, longitude } = data;
    const job = await JobRequest.findByPk(job_id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    if (job.job_status !== 'ASSIGNED') {
        throw { statusCode: 400, message: 'Survey can only be started when job is ASSIGNED' };
    }
    if (job.gm_assigned_surveyor_id !== userId) {
        throw { statusCode: 403, message: 'You are not assigned to this job' };
    }

    await job.update({ job_status: 'IN_PROGRESS' });
    await JobStatusHistory.create({
        job_id: job.id,
        old_status: 'ASSIGNED',
        new_status: 'IN_PROGRESS',
        changed_by: userId,
        change_reason: 'Survey started by surveyor'
    });
    await GpsTracking.create({
        surveyor_id: userId,
        vessel_id: job.vessel_id,
        job_id,
        latitude,
        longitude
    });
    return { message: 'Survey Started', job_id, started_at: new Date() };
};

export const finalizeSurvey = async (id, userId) => {
    const job = await JobRequest.findByPk(id);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    if (job.job_status !== 'SURVEY_DONE') {
        throw { statusCode: 400, message: 'Survey can only be finalized after the report is submitted (job must be SURVEY_DONE)' };
    }
    if (job.gm_assigned_surveyor_id !== userId) {
        throw { statusCode: 403, message: 'You are not assigned to this job' };
    }

    const survey = await SurveyReport.findOne({ where: { job_id: id } });
    if (!survey) {
        throw { statusCode: 400, message: 'Survey Report not found. Cannot finalize.' };
    }

    await job.update({ job_status: 'TM_FINAL' });

    return { message: 'Survey Finalized.' };
};

export const streamLocation = async (jobId, data, userId) => {
    const { latitude, longitude } = data;
    const job = await JobRequest.findByPk(jobId);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    if (job.job_status !== 'IN_PROGRESS') {
        throw { statusCode: 400, message: 'Location can only be streamed while survey is in progress' };
    }
    if (job.gm_assigned_surveyor_id !== userId) {
        throw { statusCode: 403, message: 'You are not assigned to this job' };
    }
    await GpsTracking.create({
        surveyor_id: userId,
        latitude,
        longitude,
        vessel_id: job?.vessel_id,
        job_id: jobId
    });
    return { status: 'OK' };
};

export const uploadProof = async (jobId, file, userId) => {
    const job = await JobRequest.findByPk(jobId);
    if (!job) throw { statusCode: 404, message: 'Job not found' };
    if (job.job_status !== 'IN_PROGRESS') {
        throw { statusCode: 400, message: 'Evidence can only be uploaded while survey is in progress' };
    }
    if (job.gm_assigned_surveyor_id !== userId) {
        throw { statusCode: 403, message: 'You are not assigned to this job' };
    }
    const url = await s3Service.uploadFile(file.buffer, file.originalname, file.mimetype, s3Service.UPLOAD_FOLDERS.SURVEYS_PROOF);
    return { url };
};

export const getTimeline = async (id) => {
    const gps = await GpsTracking.findAll({
        where: { job_id: id },
        order: [['timestamp', 'ASC']]
    });
    const report = await SurveyReport.findOne({ where: { job_id: id } });

    return {
        job_id: id,
        gps_trace: gps,
        report_status: report ? 'SUBMITTED' : 'PENDING',
        submission_time: report ? report.created_at : null
    };
};

export const getSurveyReports = async (query) => {
    const { page = 1, limit = 10, ...filters } = query;
    return await SurveyReport.findAndCountAll({
        where: filters,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        include: [
            { model: JobRequest, include: [{ model: db.Vessel, attributes: ['vessel_name', 'imo_number'] }] },
            { model: db.User, attributes: ['name', 'email'] }
        ]
    });
};

export const flagViolation = async (id, userId) => {
    await notificationService.notifyRoles(['ADMIN', 'TM', 'GM'], 'Survey Violation Flagged', `Suspicious behavior flagged for Job ${id}.`, 'CRITICAL');
    return { message: 'Violation flagged and admins notified.' };
};
