/**
 * Notification Formatter
 * 
 * This utility converts raw event types and data into user-friendly 
 * titles and messages for push and in-app notifications.
 */

const formats = {
    'JOB_CREATED': (data) => ({
        title: 'New Job Request',
        message: `A new job for vessel "${data.vesselName}" at "${data.port}" has been created.`
    }),
    'JOB_DOCUMENT_VERIFIED': (data) => ({
        title: 'Documents Verified',
        message: `Documents for job on "${data.vesselName}" have been verified by the Technical Officer.`
    }),
    'JOB_APPROVED': (data) => {
        if (data.status === 'SURVEY_AUTHORIZED') {
            return {
                title: 'Survey authorized',
                message: `The survey for "${data.vesselName}" is authorized. You may begin the inspection in the GR Class app.`
            };
        }
        return {
            title: 'Job approved',
            message: `The job request for "${data.vesselName}" has been approved.`
        };
    },
    'JOB_ASSIGNED': (data) => ({
        title: 'New Assignment',
        message: `You have been assigned to a new survey for "${data.vesselName}" at "${data.port}".`
    }),
    'JOB_RESCHEDULED': (data) => ({
        title: 'Job Rescheduled',
        message: `The job for "${data.vesselName}" has been rescheduled to ${data.newDate} at ${data.newPort}. Reason: ${data.reason}`
    }),
    'JOB_REVIEWED': (data) => ({
        title: 'Technical Review Updated',
        message: `Technical review for vessel "${data.vesselName}" has been completed.`
    }),
    'JOB_SENT_BACK': (data) => ({
        title: 'Rework Requested',
        message: `Changes are requested for the survey of "${data.vesselName}". Remarks: ${data.remarks}`
    }),
    'JOB_FINALIZED': (data) => ({
        title: 'Job Finalized',
        message: `The job for "${data.vesselName}" has been finalized successfully.`
    }),
    'SURVEY_STARTED': (data) => ({
        title: 'Survey In Progress',
        message: `Survey has been started by the surveyor for "${data.vesselName}".`
    }),
    'SURVEY_SUBMITTED': (data) => ({
        title: 'Survey Report Submitted',
        message: `Survey report for "${data.vesselName}" has been submitted for review.`
    }),
    'SURVEY_PROOF_UPLOADED': (data) => ({
        title: 'Survey Proofs Uploaded',
        message: `Surveyor has uploaded proofs for "${data.vesselName}".`
    }),
    'SURVEY_REWORK_REQUESTED': (data) => ({
        title: 'Survey Rework Requested',
        message: `Corrections are needed for your survey on "${data.vesselName}".`
    }),
    'INFO': (data) => ({
        title: data.title || 'Information Update',
        message: data.message || 'You have a new update.'
    }),
    'NEW_WEBSITE_ENQUIRY': (data) => ({
        title: 'New Website Enquiry',
        message: `${data.full_name} (${data.company || 'N/A'}) sent a new message via the contact form.`
    })
};

/**
 * Format raw notification data into a user-friendly object.
 * @param {string} eventType 
 * @param {object} data 
 * @returns {object} { title, message }
 */
export const formatNotification = (eventType, data = {}) => {
    const formatter = formats[eventType];

    if (formatter) {
        const formatted = formatter(data);
        // If data already has title/message, allow override
        return {
            title: data.title || formatted.title,
            message: data.message || formatted.message
        };
    }

    // Fallback for unknown event types
    return {
        title: data.title || eventType.replace(/_/g, ' '),
        message: data.message || 'You have a new notification.'
    };
};
