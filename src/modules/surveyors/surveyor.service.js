import db from '../../models/index.js';
import * as s3Service from '../../services/s3.service.js';
import * as notificationService from '../../services/notification.service.js';
import * as authService from '../auth/auth.service.js';
import { v4 as uuidv4 } from 'uuid';

const SurveyorApplication = db.SurveyorApplication;
const User = db.User;
const SurveyorProfile = db.SurveyorProfile;

export const applySurveyor = async (data, files) => {
    if (!files || !files.cv || !files.id_proof) {
        throw { statusCode: 400, message: 'CV and ID Proof are required.' };
    }

    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) throw { statusCode: 400, message: 'A user with this email already exists.' };

    const existingApp = await SurveyorApplication.findOne({
        where: { email: data.email, status: ['PENDING', 'DOCUMENTS_REQUIRED'] }
    });
    if (existingApp) throw { statusCode: 400, message: 'An application is already under review.' };

    const cvUrl = await s3Service.uploadFile(files.cv[0].buffer, files.cv[0].originalname, files.cv[0].mimetype);
    const idProofUrl = await s3Service.uploadFile(files.id_proof[0].buffer, files.id_proof[0].originalname, files.id_proof[0].mimetype);

    let certUrls = [];
    if (files.certificates) {
        for (const file of files.certificates) {
            const url = await s3Service.uploadFile(file.buffer, file.originalname, file.mimetype);
            certUrls.push(url);
        }
    }

    return await SurveyorApplication.create({
        ...data,
        cv_file_url: cvUrl,
        id_proof_url: idProofUrl,
        certificate_files_url: certUrls,
        status: 'PENDING'
    });
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

export const reviewApplication = async (id, status, remarks, reviewerUserId) => {
    const app = await SurveyorApplication.findByPk(id);
    if (!app) throw { statusCode: 404, message: 'Application not found' };

    if (status === 'APPROVED') {
        const randomPassword = uuidv4().substring(0, 10);
        const { user } = await authService.register({
            name: app.full_name,
            email: app.email,
            password: randomPassword,
            role: 'SURVEYOR',
            phone: app.phone
        });

        await SurveyorProfile.create({
            user_id: user.id,
            license_number: `SURV-${uuidv4().substring(0, 6).toUpperCase()}`,
            valid_from: new Date(),
            status: 'ACTIVE'
        });

        // Log credentials for demo/dev purposes if no mailer configured
        console.log(`Surveyor Approved: ${app.email} / ${randomPassword}`);
    }

    await app.update({ status, tm_remarks: remarks });
    return app;
};

export const createSurveyor = async (data) => {
    const { user } = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'SURVEYOR',
        phone: data.phone
    });

    const profile = await SurveyorProfile.create({
        user_id: user.id,
        license_number: data.license_number || `SURV-${uuidv4().substring(0, 6).toUpperCase()}`,
        authorized_ship_types: data.authorized_ship_types,
        authorized_certificates: data.authorized_certificates,
        valid_from: data.valid_from || new Date(),
        status: 'ACTIVE'
    });

    return { user, profile };
};

export const getProfile = async (id) => {
    const profile = await SurveyorProfile.findOne({ where: { user_id: id }, include: ['User'] });
    if (!profile) throw { statusCode: 404, message: 'Profile not found' };
    return profile;
};

export const updateProfile = async (id, data) => {
    const profile = await SurveyorProfile.findOne({ where: { user_id: id } });
    if (!profile) throw { statusCode: 404, message: 'Profile not found' };
    return await profile.update(data);
};

export const updateAvailability = async (userId, isAvailable) => {
    const profile = await SurveyorProfile.findOne({ where: { user_id: userId } });
    if (!profile) throw { statusCode: 404, message: 'Surveyor profile not found' };
    return await profile.update({ is_available: isAvailable });
};

export const reportLocation = async (userId, locationData) => {
    const { latitude, longitude, accuracy } = locationData;
    await db.GPSTracking.create({
        user_id: userId,
        latitude,
        longitude,
        accuracy,
        recorded_at: new Date()
    });

    await SurveyorProfile.update(
        { last_known_location: `POINT(${longitude} ${latitude})` },
        { where: { user_id: userId } }
    );

    return { success: true };
};

export const getGPSHistory = async (userId) => {
    return await db.GPSTracking.findAll({
        where: { user_id: userId },
        order: [['recorded_at', 'DESC']],
        limit: 100
    });
};
