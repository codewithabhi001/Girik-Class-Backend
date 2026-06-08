import db from '../../models/index.js';
import * as s3Service from '../../services/s3.service.js';
import * as notificationService from '../../services/notification.service.js';
import * as authService from '../auth/auth.service.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import * as emailService from '../../services/email.service.js';
import { v4 as uuidv4 } from 'uuid';

const SurveyorApplication = db.SurveyorApplication;
const User = db.User;
const SurveyorProfile = db.SurveyorProfile;

export const UPLOAD_FOLDERS = s3Service.UPLOAD_FOLDERS;
export const getUploadSignedUrl = s3Service.getUploadSignedUrl;

/**
 * Helper to upload base64 file string to S3
 */
const uploadBase64ToS3 = async (base64Str, defaultFilename, folder) => {
    if (!base64Str || !base64Str.startsWith('data:')) {
        return base64Str;
    }
    const matches = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
    if (!matches) {
        return base64Str;
    }
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Deduce file extension
    let extension = 'bin';
    if (mimeType.includes('pdf')) extension = 'pdf';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
    else if (mimeType.includes('png')) extension = 'png';
    else if (mimeType.includes('word') || mimeType.includes('officedocument.wordprocessingml')) extension = 'docx';
    
    const fileName = `${defaultFilename}.${extension}`;
    return await s3Service.uploadFile(buffer, fileName, mimeType, folder);
};

export const applySurveyor = async (data, files) => {
    const existingUser = await User.findOne({ where: { email: data.email }, useMaster: true });
    if (existingUser) throw { statusCode: 400, message: 'A user with this email already exists.' };

    const existingApp = await SurveyorApplication.findOne({
        where: { email: data.email, status: ['PENDING', 'DOCUMENTS_REQUIRED'] },
        useMaster: true
    });
    if (existingApp) throw { statusCode: 400, message: 'An application is already under review.' };

    const folder = s3Service.UPLOAD_FOLDERS.SURVEYOR;

    // Support keys in body or files in request
    // Parallelize all uploads
    const uploadTasks = [];
    
    let cvUrl = null;
    if (files?.cv) {
        uploadTasks.push((async () => {
            cvUrl = await s3Service.uploadFile(files.cv[0].buffer, files.cv[0].originalname, files.cv[0].mimetype, `${folder}/cv`);
        })());
    } else if (data.cvKey) {
        if (data.cvKey.startsWith('data:')) {
            uploadTasks.push((async () => {
                cvUrl = await uploadBase64ToS3(data.cvKey, 'cv', `${folder}/cv`);
            })());
        } else {
            cvUrl = data.cvKey;
        }
    }

    let idProofUrl = null;
    if (files?.id_proof) {
        uploadTasks.push((async () => {
            idProofUrl = await s3Service.uploadFile(files.id_proof[0].buffer, files.id_proof[0].originalname, files.id_proof[0].mimetype, `${folder}/id-proof`);
        })());
    } else if (data.idProofKey) {
        if (data.idProofKey.startsWith('data:')) {
            uploadTasks.push((async () => {
                idProofUrl = await uploadBase64ToS3(data.idProofKey, 'id_proof', `${folder}/id-proof`);
            })());
        } else {
            idProofUrl = data.idProofKey;
        }
    }

    let certUrls = [];
    if (files?.certificates) {
        files.certificates.forEach(file => {
            uploadTasks.push((async () => {
                const url = await s3Service.uploadFile(file.buffer, file.originalname, file.mimetype, `${folder}/certificates`);
                certUrls.push(url);
            })());
        });
    } else if (data.certificateKeys && Array.isArray(data.certificateKeys)) {
        data.certificateKeys.forEach((key, index) => {
            if (key && key.startsWith('data:')) {
                uploadTasks.push((async () => {
                    const url = await uploadBase64ToS3(key, `certificate_${index + 1}`, `${folder}/certificates`);
                    certUrls.push(url);
                })());
            } else {
                certUrls.push(key);
            }
        });
    }

    if (uploadTasks.length > 0) {
        await Promise.all(uploadTasks);
    }

    if (!cvUrl || !idProofUrl) {
        throw { statusCode: 400, message: 'CV and ID Proof are required (files or keys).' };
    }

    const app = await SurveyorApplication.create({
        ...data,
        cv_file_url: cvUrl,
        id_proof_url: idProofUrl,
        certificate_files_url: certUrls,
        status: 'PENDING'
    });

    // Send email acknowledgement to the surveyor applicant
    emailService.sendTemplateEmail(app.email, 'SURVEYOR_APPLICATION_SUBMITTED', {
        fullName: app.full_name,
        email: app.email
    }).catch(err => console.error('Failed to send surveyor application acknowledgement email:', err));

    return await fileAccessService.resolveEntity(app);
};

export const getApplications = async (query, user = null) => {
    const { page = 1, limit = 10, status } = query;
    const where = {};
    if (status) where.status = status;

    const { count, rows } = await SurveyorApplication.findAndCountAll({
        where,
        attributes: [
            'id',
            'full_name',
            'email',
            'phone',
            'nationality',
            'qualification',
            'years_of_experience',
            'status',
            'created_at'
        ],
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        useReplica: true
    });

    return {
        count,
        rows: await fileAccessService.resolveEntity(rows, user)
    };
};

export const reviewApplication = async (id, status, remarks, reviewerUserId) => {
    const app = await SurveyorApplication.findByPk(id, { useMaster: true });
    if (!app) throw { statusCode: 404, message: 'Application not found' };

    if (status === 'APPROVED') {
        const passwordMatch = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        let randomPassword = uuidv4().substring(0, 10);
        // Ensure password meets complexity requirements
        if (!passwordMatch.test(randomPassword)) {
            randomPassword += "A1a!";
        }

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
            status: 'ACTIVE',
            nationality: app.nationality,
            qualification: app.qualification,
            years_of_experience: app.years_of_experience,
            cv_url: app.cv_file_url,
            id_proof_url: app.id_proof_url
        });

        await app.update({ status, reviewer_remarks: remarks, approved_user_id: user.id });

        // Log credentials for demo/dev purposes if no mailer configured
        console.log(`Surveyor Approved: ${app.email} / ${randomPassword}`);
        return await fileAccessService.resolveEntity(app);
    }

    await app.update({ status, reviewer_remarks: remarks });
    return await fileAccessService.resolveEntity(app);
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
        status: 'ACTIVE',
        nationality: data.nationality,
        qualification: data.qualification || data.qualifications,
        years_of_experience: data.years_of_experience,
        cv_url: data.cv_url,
        id_proof_url: data.id_proof_url,
        license_copy_url: data.license_copy_url
    });

    return await fileAccessService.resolveEntity({ user, profile });
};

export const getProfile = async (id, user = null, options = {}) => {
    const profile = await SurveyorProfile.findOne({
        where: { [db.Sequelize.Op.or]: [{ id: id }, { user_id: id }] },
        include: [
            { model: User, attributes: ['id', 'name', 'email', 'phone', 'role', 'status'] },
            {
                model: SurveyorApplication,
                as: 'application',
                required: false,
                attributes: ['id', 'full_name', 'email', 'phone', 'nationality', 'qualification', 'years_of_experience', 'cv_file_url', 'id_proof_url', 'certificate_files_url', 'status', 'reviewer_remarks']
            }
        ],
        ...options
    });
    if (!profile) throw { statusCode: 404, message: 'Profile not found' };
    return await fileAccessService.resolveEntity(profile, user);
};

export const updateProfile = async (id, data) => {
    const profile = await SurveyorProfile.findOne({
        where: { [db.Sequelize.Op.or]: [{ id: id }, { user_id: id }] },
        include: [{ model: User }],
        useMaster: true
    });
    if (!profile) throw { statusCode: 404, message: 'Profile not found' };

    // Update User details if provided
    const userUpdate = {};
    if (data.name || data.full_name) userUpdate.name = data.name || data.full_name;
    if (data.phone) userUpdate.phone = data.phone;
    if (data.email) userUpdate.email = data.email;
    if (data.profile_pic_url) userUpdate.profile_pic_url = data.profile_pic_url;

    if (Object.keys(userUpdate).length > 0) {
        await profile.User.update(userUpdate);
    }

    // Update Profile details
    const profileFields = [
        'license_number', 'authorized_ship_types', 'authorized_certificates',
        'valid_from', 'valid_to', 'is_available', 'nationality',
        'qualification', 'years_of_experience', 'cv_url', 'id_proof_url', 'license_copy_url'
    ];

    const profileUpdate = {};
    profileFields.forEach(field => {
        if (data[field] !== undefined) {
            profileUpdate[field] = data[field];
        }
    });

    // Handle "qualifications" alias if "qualification" is missing
    if (data.qualifications !== undefined && data.qualification === undefined) {
        profileUpdate.qualification = data.qualifications;
    }

    return await fileAccessService.resolveEntity(await profile.update(profileUpdate));
};

export const updateAvailability = async (userId, isAvailable) => {
    const profile = await SurveyorProfile.findOne({ where: { user_id: userId }, useMaster: true });
    if (!profile) throw { statusCode: 404, message: 'Surveyor profile not found' };
    return await fileAccessService.resolveEntity(await profile.update({ is_available: isAvailable }));
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

export const getGPSHistory = async (idParam) => {
    // GPS records are stored with User.id as surveyor_id.
    // The caller may pass either a User ID or a SurveyorProfile ID.
    // Resolve Profile ID → User ID if needed.
    let userId = idParam;

    const profile = await SurveyorProfile.findOne({
        where: { [db.Sequelize.Op.or]: [{ id: idParam }, { user_id: idParam }] },
        attributes: ['user_id'],
        useReplica: true
    });

    if (profile) {
        userId = profile.user_id;
    }

    return await db.GpsTracking.findAll({
        where: { surveyor_id: userId },
        attributes: ['id', 'job_id', 'job_certificate_id', 'surveyor_id', 'vessel_id', 'latitude', 'longitude', 'timestamp'],
        order: [['timestamp', 'DESC']],
        limit: 100,
        useReplica: true
    });
};

export const updateStatus = async (id, status) => {
    // Search user by provided id (might be userId or profileId)
    let user = await User.findByPk(id, { useMaster: true });
    if (!user) {
        // If not found by PK, check if it's a profile ID
        const profile = await SurveyorProfile.findByPk(id, { useMaster: true });
        if (profile) {
            user = await User.findByPk(profile.user_id, { useMaster: true });
        }
    }

    if (!user || user.role !== 'SURVEYOR') throw { statusCode: 404, message: 'Surveyor not found' };

    await user.update({ status });

    // Also update profile status if it exists
    const profile = await SurveyorProfile.findOne({ where: { user_id: user.id }, useMaster: true });
    if (profile) {
        // Sync profile status (ACTIVE, INACTIVE, SUSPENDED)
        const profileStatusMap = { 'ACTIVE': 'ACTIVE', 'INACTIVE': 'INACTIVE', 'SUSPENDED': 'SUSPENDED' };
        await profile.update({ status: profileStatusMap[status] || 'INACTIVE' });
    }

    return await fileAccessService.resolveEntity(user);
};

export const getSurveyors = async (query = {}, user = null) => {
    const { status, is_available } = query;
    const where = {};
    if (status) where.status = status;
    if (is_available !== undefined) where.is_available = is_available === 'true';

    const surveyors = await SurveyorProfile.findAll({
        where,
        attributes: ['id', 'user_id', 'license_number', 'status', 'is_available', 'nationality', 'qualification'],
        include: [
            {
                model: User,
                attributes: ['id', 'name', 'email', 'phone', 'role', 'status', 'profile_pic_url']
            }
        ],
        order: [[User, 'name', 'ASC']],
        useReplica: true
    });

    return await fileAccessService.resolveEntity(surveyors, user);
};

export const getUploadUrls = async (query) => {
    const { cv_filename, id_proof_filename, id_proof, certificate_filenames, cv_mimetype, id_proof_mimetype, certificate_mimetypes } = query;
    const folder = s3Service.UPLOAD_FOLDERS.SURVEYOR;
    
    // Support 'id_proof' as alias for 'id_proof_filename'
    const idProofFn = id_proof_filename || id_proof;

    const result = {};
    const tasks = [];

    if (cv_filename) {
        tasks.push((async () => {
            const key = `${folder}/cv/${uuidv4()}-${cv_filename}`;
            const contentType = cv_mimetype || 'application/pdf';
            result.cv = { key, uploadUrl: await s3Service.getUploadSignedUrl(key, contentType) };
        })());
    }

    if (idProofFn) {
        tasks.push((async () => {
            const key = `${folder}/id-proof/${uuidv4()}-${idProofFn}`;
            const contentType = id_proof_mimetype || 'application/pdf';
            result.id_proof = { key, uploadUrl: await s3Service.getUploadSignedUrl(key, contentType) };
        })());
    }

    if (certificate_filenames) {
        let filenames = certificate_filenames;
        let mimetypes = certificate_mimetypes;

        if (typeof filenames === 'string') {
            try { filenames = JSON.parse(filenames); } catch (e) { filenames = filenames.split(','); }
        }
        if (typeof mimetypes === 'string') {
            try { mimetypes = JSON.parse(mimetypes); } catch (e) { mimetypes = mimetypes.split(','); }
        }

        if (!Array.isArray(filenames)) filenames = [filenames];
        if (!Array.isArray(mimetypes)) mimetypes = [mimetypes];

        result.certificates = [];
        filenames.forEach((fn, index) => {
            tasks.push((async () => {
                const key = `${folder}/certificates/${uuidv4()}-${fn}`;
                const contentType = mimetypes[index] || 'application/pdf';
                result.certificates.push({ key, uploadUrl: await s3Service.getUploadSignedUrl(key, contentType) });
            })());
        });
    }

    await Promise.all(tasks);
    return result;
};

export const getApplication = async (id, user = null) => {
    const app = await SurveyorApplication.findByPk(id);
    if (!app) throw { statusCode: 404, message: 'Application not found' };
    return await fileAccessService.resolveEntity(app, user);
};

/**
 * Returns a combined checklist of all vessel ship_types and certificate types
 * with is_authorized flag based on the surveyor's profile.
 * Used for the authorization checklist UI.
 */
export const getSurveyorAuthorizationChecklist = async (surveyorId) => {
    const { Op } = db.Sequelize;

    // 1. Fetch surveyor profile (by user_id or profile_id)
    const profile = await SurveyorProfile.findOne({
        where: { [Op.or]: [{ id: surveyorId }, { user_id: surveyorId }] },
        attributes: ['id', 'user_id', 'authorized_ship_types', 'authorized_certificates'],
        include: [{ model: User, attributes: ['id', 'name', 'email'] }],
    });
    if (!profile) throw { statusCode: 404, message: 'Surveyor profile not found' };

    const authorizedShipTypes = Array.isArray(profile.authorized_ship_types)
        ? profile.authorized_ship_types
        : [];
    const authorizedCertIds = Array.isArray(profile.authorized_certificates)
        ? profile.authorized_certificates
        : [];

    // 2. Fetch all distinct vessel ship_types from DB
    const vesselTypeRows = await db.Vessel.findAll({
        where: { ship_type: { [Op.ne]: null } },
        attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('ship_type')), 'ship_type']],
        raw: true,
        order: [['ship_type', 'ASC']],
        useReplica: true
    });
    const allShipTypes = vesselTypeRows.map((r) => r.ship_type).filter(Boolean);

    // 3. Fetch all active certificate types
    const certTypes = await db.CertificateType.findAll({
        where: { status: 'ACTIVE' },
        attributes: ['id', 'name', 'issuing_authority'],
        order: [['name', 'ASC']],
        useReplica: true
    });

    // 4. Build checklists
    const vesselTypes = allShipTypes.map((type) => ({
        ship_type: type,
        is_authorized: authorizedShipTypes.includes(type),
    }));

    const certificateTypes = certTypes.map((ct) => ({
        id: ct.id,
        name: ct.name,
        issuing_authority: ct.issuing_authority,
        is_authorized: authorizedCertIds.includes(ct.id) || authorizedCertIds.includes(ct.name),
    }));

    return {
        surveyor: {
            profile_id: profile.id,
            user_id: profile.user_id,
            name: profile.User?.name ?? null,
            email: profile.User?.email ?? null,
        },
        vessel_types: vesselTypes,
        certificate_types: certificateTypes,
    };
};
