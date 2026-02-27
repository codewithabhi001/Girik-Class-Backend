import db from '../../models/index.js';
import * as s3Service from '../../services/s3.service.js';
import * as notificationService from '../../services/notification.service.js';
import * as authService from '../auth/auth.service.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import { v4 as uuidv4 } from 'uuid';

const SurveyorApplication = db.SurveyorApplication;
const User = db.User;
const SurveyorProfile = db.SurveyorProfile;

export const applySurveyor = async (data, files) => {
    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) throw { statusCode: 400, message: 'A user with this email already exists.' };

    const existingApp = await SurveyorApplication.findOne({
        where: { email: data.email, status: ['PENDING', 'DOCUMENTS_REQUIRED'] }
    });
    if (existingApp) throw { statusCode: 400, message: 'An application is already under review.' };

    const folder = s3Service.UPLOAD_FOLDERS.SURVEYOR;

    // Support keys in body or files in request
    let cvUrl = data.cvKey || null;
    if (files?.cv) {
        cvUrl = await s3Service.uploadFile(files.cv[0].buffer, files.cv[0].originalname, files.cv[0].mimetype, `${folder}/cv`);
    }

    let idProofUrl = data.idProofKey || null;
    if (files?.id_proof) {
        idProofUrl = await s3Service.uploadFile(files.id_proof[0].buffer, files.id_proof[0].originalname, files.id_proof[0].mimetype, `${folder}/id-proof`);
    }

    if (!cvUrl || !idProofUrl) {
        throw { statusCode: 400, message: 'CV and ID Proof are required (files or keys).' };
    }

    let certUrls = data.certificateKeys || [];
    if (files?.certificates) {
        for (const file of files.certificates) {
            const url = await s3Service.uploadFile(file.buffer, file.originalname, file.mimetype, `${folder}/certificates`);
            certUrls.push(url);
        }
    }

    const app = await SurveyorApplication.create({
        ...data,
        cv_file_url: cvUrl,
        id_proof_url: idProofUrl,
        certificate_files_url: certUrls,
        status: 'PENDING'
    });

    return await fileAccessService.resolveEntity(app);
};

export const getApplications = async (query, user = null) => {
    const { page = 1, limit = 10, status } = query;
    const where = {};
    if (status) where.status = status;

    const { count, rows } = await SurveyorApplication.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (page - 1) * limit
    });

    return {
        count,
        rows: await fileAccessService.resolveEntity(rows, user)
    };
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
            surveyor_application_id: app.id,
            license_number: `SURV-${uuidv4().substring(0, 6).toUpperCase()}`,
            valid_from: new Date(),
            status: 'ACTIVE'
        });

        await app.update({ status, reviewer_remarks: remarks, approved_user_id: user.id });

        // Log credentials for demo/dev purposes if no mailer configured
        console.log(`Surveyor Approved: ${app.email} / ${randomPassword}`);
        return app;
    }

    await app.update({ status, reviewer_remarks: remarks });
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

export const getProfile = async (id, user = null) => {
    const profile = await SurveyorProfile.findOne({
        where: { user_id: id },
        include: [
            { model: User, attributes: ['id', 'name', 'email', 'phone', 'role', 'status'] },
            {
                model: SurveyorApplication,
                as: 'application',
                required: false,
                attributes: ['id', 'full_name', 'email', 'phone', 'nationality', 'qualification', 'years_of_experience', 'cv_file_url', 'id_proof_url', 'certificate_files_url', 'status', 'reviewer_remarks']
            }
        ]
    });
    if (!profile) throw { statusCode: 404, message: 'Profile not found' };
    return await fileAccessService.resolveEntity(profile, user);
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
    const { latitude, longitude } = locationData;
    await db.GpsTracking.create({
        surveyor_id: userId,
        latitude,
        longitude,
        timestamp: new Date()
    });

    await SurveyorProfile.update(
        { last_known_location: `POINT(${longitude} ${latitude})` },
        { where: { user_id: userId } }
    );

    return { success: true };
};

export const getGPSHistory = async (userId) => {
    return await db.GpsTracking.findAll({
        where: { surveyor_id: userId },
        order: [['timestamp', 'DESC']],
        limit: 100
    });
};
