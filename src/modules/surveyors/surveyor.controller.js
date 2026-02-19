import * as surveyorService from './surveyor.service.js';
import * as fileAccessService from '../../services/fileAccess.service.js';

export const applySurveyor = async (req, res, next) => {
    try {
        const application = await surveyorService.applySurveyor(req.body, req.files);
        res.status(201).json({
            success: true,
            message: 'Surveyor application submitted successfully',
            data: application
        });
    } catch (error) { next(error); }
};

export const getApplications = async (req, res, next) => {
    try {
        const result = await surveyorService.getApplications(req.query);

        // Transform file URLs to signed URLs
        const transformedRows = await Promise.all(result.rows.map(async (app) => {
            const data = app.toJSON();
            if (data.cv_file_url) data.cv_file_url = await fileAccessService.generateSignedUrl(fileAccessService.getKeyFromUrl(data.cv_file_url), 3600, req.user);
            if (data.id_proof_url) data.id_proof_url = await fileAccessService.generateSignedUrl(fileAccessService.getKeyFromUrl(data.id_proof_url), 3600, req.user);
            if (data.certificate_files_url && Array.isArray(data.certificate_files_url)) {
                data.certificate_files_url = await Promise.all(data.certificate_files_url.map(url => fileAccessService.generateSignedUrl(fileAccessService.getKeyFromUrl(url), 3600, req.user)));
            }
            return data;
        }));

        res.json({
            success: true,
            message: 'Applications fetched successfully',
            data: { count: result.count, rows: transformedRows }
        });
    } catch (error) { next(error); }
};

export const reviewApplication = async (req, res, next) => {
    try {
        const { status, remarks } = req.body;
        const result = await surveyorService.reviewApplication(req.params.id, status, remarks, req.user.id);
        res.json({
            success: true,
            message: `Application ${status.toLowerCase()} successfully`,
            data: result
        });
    } catch (error) { next(error); }
};

export const getProfile = async (req, res, next) => {
    try {
        const profile = await surveyorService.getProfile(req.params.id);
        const data = profile.toJSON();

        if (data.application) {
            if (data.application.cv_file_url) data.application.cv_file_url = await fileAccessService.generateSignedUrl(fileAccessService.getKeyFromUrl(data.application.cv_file_url), 3600, req.user);
            if (data.application.id_proof_url) data.application.id_proof_url = await fileAccessService.generateSignedUrl(fileAccessService.getKeyFromUrl(data.application.id_proof_url), 3600, req.user);
            if (data.application.certificate_files_url && Array.isArray(data.application.certificate_files_url)) {
                data.application.certificate_files_url = await Promise.all(data.application.certificate_files_url.map(url => fileAccessService.generateSignedUrl(fileAccessService.getKeyFromUrl(url), 3600, req.user)));
            }
        }

        res.json({
            success: true,
            message: 'Profile fetched successfully',
            data: data
        });
    } catch (error) { next(error); }
};

export const updateProfile = async (req, res, next) => {
    try {
        const profile = await surveyorService.updateProfile(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: profile
        });
    } catch (error) { next(error); }
};

export const createSurveyor = async (req, res, next) => {
    try {
        const result = await surveyorService.createSurveyor(req.body);
        res.status(201).json({
            success: true,
            message: 'Surveyor created successfully',
            data: result
        });
    } catch (error) { next(error); }
};

export const updateAvailability = async (req, res, next) => {
    try {
        const profile = await surveyorService.updateAvailability(req.user.id, req.body.is_available);
        res.json({ success: true, data: profile });
    } catch (e) { next(e); }
};

export const reportLocation = async (req, res, next) => {
    try {
        const result = await surveyorService.reportLocation(req.user.id, req.body);
        res.json({ success: true, data: result });
    } catch (e) { next(e); }
};

export const getGPSHistory = async (req, res, next) => {
    try {
        const history = await surveyorService.getGPSHistory(req.params.id);
        res.json({ success: true, data: history });
    } catch (e) { next(e); }
};
