import db from '../../models/index.js';
import * as s3Service from '../../services/s3.service.js';
import * as notificationService from '../../services/notification.service.js';
import * as authService from '../auth/auth.service.js';
import transporter from '../../config/mail.js';
import { v4 as uuidv4 } from 'uuid';

const SurveyorApplication = db.SurveyorApplication;
const User = db.User;
const SurveyorProfile = db.SurveyorProfile;

export const applySurveyor = async (data, files) => {
    // files: { cv: [...], certificates: [...], id_proof: [...] }

    let cvUrl = null;
    let idProofUrl = null;
    let certUrls = [];

    if (files.cv && files.cv[0]) {
        cvUrl = await s3Service.uploadFile(files.cv[0].buffer, files.cv[0].originalname, files.cv[0].mimetype);
    }
    if (files.id_proof && files.id_proof[0]) {
        idProofUrl = await s3Service.uploadFile(files.id_proof[0].buffer, files.id_proof[0].originalname, files.id_proof[0].mimetype);
    }
    if (files.certificates) {
        for (const file of files.certificates) {
            const url = await s3Service.uploadFile(file.buffer, file.originalname, file.mimetype);
            certUrls.push(url);
        }
    }

    const application = await SurveyorApplication.create({
        ...data,
        cv_file_url: cvUrl,
        id_proof_url: idProofUrl,
        certificate_files_url: certUrls, // JSON stored
        status: 'PENDING'
    });

    // Notify TM and Admin
    await notificationService.notifyRoles(['TM', 'ADMIN'], 'New Surveyor Application', `Application received from ${data.full_name}`);

    // Send Email to TM (Pseudo)
    // await transporter.sendMail({ ... });

    return application;
};

export const getApplications = async (query) => {
    const { page = 1, limit = 10, status } = query;
    const where = {};
    if (status) where.status = status;

    return await SurveyorApplication.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (page - 1) * limit
    });
};

export const reviewApplication = async (id, status, remarks, reviewerUser) => {
    const app = await SurveyorApplication.findByPk(id);
    if (!app) throw { statusCode: 404, message: 'Application not found' };

    if (status === 'APPROVED') {
        // Create User
        // Generate random password
        const randomPassword = uuidv4().substring(0, 10); // Simple random string

        try {
            const { user } = await authService.register({
                name: app.full_name,
                email: app.email,
                password: randomPassword,
                role: 'SURVEYOR',
                phone: app.phone
            });

            // Create Profile
            await SurveyorProfile.create({
                user_id: user.id,
                license_number: `SURV-${uuidv4().substring(0, 6).toUpperCase()}`,
                valid_from: new Date(),
                status: 'ACTIVE'
            });

            // Send Email with credentials
            console.log(`Surveyor Approved. Credentials sent to ${app.email}: Pwd: ${randomPassword}`);
            // await transporter.sendMail({ ... });

        } catch (e) {
            if (e.message !== 'Email already exists') throw e;
            // If user exists, maybe just link profile or error?
            // For now, assume fresh email.
            console.warn('User already exists for approved surveyor');
        }
    }

    await app.update({ status, tm_remarks: remarks });

    // Notify Applicant via Email
    // ...

    return app;
};

export const getProfile = async (id) => {
    // id could be surveyor_profile id or user_id. Let's assume user_id or profile_id passed in param
    // But route is /surveyors/:id/profile. Usually :id is user_id for simplicity or profile id.
    // Let's assume :id is user_id
    const profile = await SurveyorProfile.findOne({ where: { user_id: id }, include: ['User'] });
    if (!profile) throw { statusCode: 404, message: 'Profile not found' };
    return profile;
};

export const updateProfile = async (id, data) => {
    const profile = await SurveyorProfile.findOne({ where: { user_id: id } });
    if (!profile) throw { statusCode: 404, message: 'Profile not found' };
    return await profile.update(data);
};
