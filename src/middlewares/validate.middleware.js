import Joi from 'joi';
import logger from '../utils/logger.js';

export const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const formattedErrors = {};
            error.details.forEach((detail) => {
                const key = detail.path.join('.');
                formattedErrors[key] = detail.message.replace(/"/g, '');
            });

            const firstErrorMessage = error.details.length > 0 
                ? error.details[0].message.replace(/"/g, '') 
                : 'Invalid input data. Please check the fields.';

            logger.warn(`Validation Failed: ${req.method} ${req.originalUrl}`, {
                event: 'validation_error',
                path: req.originalUrl,
                method: req.method,
                errors: formattedErrors,
                user: req.user?.email || null,
                ip: req.ip
            });

            return res.status(400).json({
                success: false,
                error_code: 'VALIDATION_ERROR',
                message: firstErrorMessage,
                errors: formattedErrors
            });
        }

        next();
    };
};

export const schemas = {
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),
    refreshToken: Joi.object({
        refreshToken: Joi.string(),
        token: Joi.string(),
    }).or('refreshToken', 'token'),
    forgotPassword: Joi.object({
        email: Joi.string().email().required(),
    }),
    resetPassword: Joi.object({
        token: Joi.string().required(),
        newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, and digit' }),
    }),
    changePassword: Joi.object({
        oldPassword: Joi.string().required(),
        newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, and digit' }),
    }),
    register: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, and digit' }),
        role: Joi.string().valid('ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR', 'CLIENT').required(),
        company_name: Joi.string().optional(),
        client_id: Joi.string().guid().optional().allow(null, ''),
        phone: Joi.string().optional().allow('', null)
    }).unknown(true),
    createJob: Joi.object({
        vessel_id: Joi.string().guid().optional().allow(null, ''),
        client_id: Joi.string().guid().optional().allow(null, ''),
        target_port: Joi.string().required(),
        target_date: Joi.date().iso().required(),
        priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT').optional().default('NORMAL'),
        reason: Joi.string().optional().allow('', null),
        certificates: Joi.array().items(Joi.object({
            certificate_type_id: Joi.string().guid().required(),
            certificate_term: Joi.string().valid('FULL_TERM', 'SHORT_TERM', 'INTERIM', 'CONDITIONAL', 'PROVISIONAL').optional().default('FULL_TERM'),
            uploaded_documents: Joi.array().items(Joi.object({
                required_document_id: Joi.string().guid().optional().allow(null, ''),
                custom_document_name: Joi.string().optional().allow(null, ''),
                file_url: Joi.string().required()
            })).optional().default([])
        })).min(1).required(),
        uploaded_documents: Joi.array().items(Joi.object({
            required_document_id: Joi.string().guid().optional().allow(null, ''),
            custom_document_name: Joi.string().optional().allow(null, ''),
            file_url: Joi.string().required()
        })).optional().default([]),
        payment: Joi.object({
            amount: Joi.number().positive().required(),
            currency: Joi.string().optional().default('USD')
        }).optional(),
        skip_mandatory_check: Joi.boolean().optional().default(false)
    }).or('vessel_id', 'client_id'),
    submitSurvey: Joi.object({
        submit_latitude: Joi.number().optional(),
        submit_longitude: Joi.number().optional(),
        survey_statement: Joi.string().allow('').optional(),
        photoKey: Joi.string().optional(),
        signatureKey: Joi.string().optional(),
    }),
    draftSurveyStatement: Joi.object({
        survey_statement: Joi.string().optional(),
        job_certificate_id: Joi.string().guid().allow('', null).optional()
    }),
    finalizeSurvey: Joi.object({
        job_certificate_id: Joi.string().guid().allow('', null).optional()
    }),
    generateCertificate: Joi.object({
        job_id: Joi.string().guid().optional(),
        job_certificate_id: Joi.string().guid().optional(), // new: per-certificate generation
        validity_years: Joi.number().integer().min(1).max(5).optional(),
        issue_date: Joi.date().iso().optional(),
        expiry_date: Joi.date().iso().optional(),
        flag_administration_id: Joi.string().guid().optional().allow(null),
        certificate_term: Joi.string().valid('FULL_TERM', 'SHORT_TERM', 'INTERIM', 'CONDITIONAL', 'PROVISIONAL').optional(),
    }).or('job_id', 'job_certificate_id'),
    applySurveyor: Joi.object({
        full_name: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required(),
        nationality: Joi.string().required(),
        qualification: Joi.string().required(),
        years_of_experience: Joi.number().integer().required(),
        cvKey: Joi.string().custom((value, helpers) => {
            if (value && value.startsWith('data:')) {
                const base64Data = value.split(';base64,')[1];
                if (base64Data) {
                    const padding = base64Data.endsWith('==') ? 2 : (base64Data.endsWith('=') ? 1 : 0);
                    const size = (base64Data.length * 3) / 4 - padding;
                    if (size > 2 * 1024 * 1024) {
                        return helpers.message('CV file size exceeds the limit of 2MB.');
                    }
                }
            }
            return value;
        }).optional(),
        idProofKey: Joi.string().custom((value, helpers) => {
            if (value && value.startsWith('data:')) {
                const base64Data = value.split(';base64,')[1];
                if (base64Data) {
                    const padding = base64Data.endsWith('==') ? 2 : (base64Data.endsWith('=') ? 1 : 0);
                    const size = (base64Data.length * 3) / 4 - padding;
                    if (size > 2 * 1024 * 1024) {
                        return helpers.message('ID Proof file size exceeds the limit of 2MB.');
                    }
                }
            }
            return value;
        }).optional(),
        certificateKeys: Joi.array().items(Joi.string().custom((value, helpers) => {
            if (value && value.startsWith('data:')) {
                const base64Data = value.split(';base64,')[1];
                if (base64Data) {
                    const padding = base64Data.endsWith('==') ? 2 : (base64Data.endsWith('=') ? 1 : 0);
                    const size = (base64Data.length * 3) / 4 - padding;
                    if (size > 2 * 1024 * 1024) {
                        return helpers.message('Certificate file size exceeds the limit of 2MB.');
                    }
                }
            }
            return value;
        })).optional(),
    }),
    updateSurveyorProfile: Joi.object({
        full_name: Joi.string().optional(),
        name: Joi.string().optional(),
        email: Joi.string().email().optional(),
        phone: Joi.string().optional().allow(''),
        nationality: Joi.string().optional().allow(''),
        qualification: Joi.string().optional().allow(''),
        years_of_experience: Joi.number().integer().optional(),
        license_number: Joi.string().optional().allow(''),
        authorized_ship_types: Joi.array().items(Joi.string()).optional(),
        authorized_certificates: Joi.array().items(Joi.string()).optional(),
        valid_to: Joi.date().iso().optional(),
        cv_url: Joi.string().optional().allow('', null),
        license_copy_url: Joi.string().optional().allow('', null),
        is_available: Joi.boolean().optional(),
    }),
    reviewSurveyor: Joi.object({
        status: Joi.string().valid('APPROVED', 'REJECTED', 'DOCUMENTS_REQUIRED').required(),
        remarks: Joi.string().optional().allow(''),
    }),
    reviewItem: Joi.object({
        status: Joi.string().valid('APPROVED', 'REJECTED').required(),
        rejection_reason: Joi.string().when('status', {
            is: 'REJECTED',
            then: Joi.string().required(),
            otherwise: Joi.string().allow('', null).optional()
        }),
        job_certificate_id: Joi.string().guid().allow('', null).optional()
    }),
    updateGps: Joi.object({
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
        job_certificate_id: Joi.string().guid().allow('', null).optional()
    }),
    setGeoFence: Joi.object({
        vessel_id: Joi.string().guid().required(),
        radius_meters: Joi.number().integer().min(100).required(),
    }),
    createNC: Joi.object({
        job_id: Joi.string().guid().required(),
        vessel_id: Joi.string().guid().optional().allow(null, ''),
        job_certificate_id: Joi.string().guid().optional().allow(null, ''),
        description: Joi.string().required(),
        severity: Joi.string().valid('MINOR', 'MAJOR', 'CRITICAL').required(),
    }),
    closeNC: Joi.object({
        closure_remarks: Joi.string().required(),
    }),
    submitChecklist: Joi.object({
        items: Joi.array().items(Joi.object({
            question_code: Joi.string().required(),
            question_text: Joi.string().required(),
            answer: Joi.string().required(),
            remarks: Joi.string().allow('').optional(),
            file_url: Joi.string().allow('', null).optional()
        })).required(),
        // Optional: S3 keys or objects (url, template_file_id, file_name)
        signed_checklist_files: Joi.array().items(
            Joi.alternatives().try(
                Joi.string(),
                Joi.object({
                    url: Joi.string().required(),
                    template_file_id: Joi.string().guid().allow(null).optional(),
                    file_name: Joi.string().allow('', null).optional()
                })
            )
        ).optional(),
        job_certificate_id: Joi.string().guid().allow('', null).optional()
    }),
    updateSignedChecklistFiles: Joi.object({
        signed_checklist_files: Joi.array().items(
            Joi.alternatives().try(
                Joi.string(),
                Joi.object({
                    url: Joi.string().required(),
                    template_file_id: Joi.string().guid().allow(null).optional(),
                    file_name: Joi.string().allow('', null).optional()
                })
            )
        ).required(),
        job_certificate_id: Joi.string().guid().allow('', null).optional()
    }),
    createToca: Joi.object({
        vessel_id: Joi.string().guid().required(),
        losing_class_society: Joi.string().required(),
        gaining_class_society: Joi.string().required(),
        request_date: Joi.date().required(),
    }),
    updateToca: Joi.object({
        status: Joi.string().valid('ACCEPTED', 'REJECTED').required(),
    }),
    createFlag: Joi.object({
        flag_state_name: Joi.string().required(),
        country: Joi.string().required(),
        authority_name: Joi.string().required(),
        contact_email: Joi.string().email().required(),
        authorization_scope: Joi.string().optional().allow('', null),
        logo_url: Joi.string().optional().allow('', null),
        status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
    }),
    updateFlag: Joi.object({
        flag_state_name: Joi.string().optional(),
        country: Joi.string().optional(),
        authority_name: Joi.string().optional(),
        contact_email: Joi.string().email().optional(),
        authorization_scope: Joi.string().optional().allow('', null),
        logo_url: Joi.string().optional().allow('', null),
        status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
    }),
    createClient: Joi.object({
        company_name: Joi.string().required(),
        company_code: Joi.string().required(),
        company_id_number: Joi.string().optional().allow('', null),
        email: Joi.string().email().required(),
        address: Joi.string().optional().allow(''),
        country: Joi.string().optional().allow(''),
        phone: Joi.string().optional().allow(''),
        contact_person_name: Joi.string().optional().allow(''),
        contact_person_email: Joi.string().email().optional().allow(''),
        status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
        user: Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, and digit' }),
            role: Joi.string().valid('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR').optional().default('CLIENT'),
            phone: Joi.string().optional().allow(''),
        }).optional(),
    }),
    createUser: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, and digit' }),
        role: Joi.string().valid('ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR', 'CLIENT').required(),
        phone: Joi.string().optional().allow('', null),
        client_id: Joi.string().guid().optional().allow(null, ''),
        license_number: Joi.string().optional().allow(''),
        authorized_ship_types: Joi.array().items(Joi.string()).optional(),
        authorized_certificates: Joi.array().items(Joi.string()).optional(),
        valid_from: Joi.date().iso().optional(),
    }).unknown(true),
    createSurveyor: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, and digit' }),
        phone: Joi.string().optional().allow(''),
        license_number: Joi.string().optional().allow(''),
        authorized_ship_types: Joi.array().items(Joi.string()).optional(),
        authorized_certificates: Joi.array().items(Joi.string()).optional(),
        valid_from: Joi.date().iso().optional(),
        nationality: Joi.string().optional().allow(''),
        qualification: Joi.string().optional().allow(''),
        qualifications: Joi.string().optional().allow(''), // Support both
        years_of_experience: Joi.alternatives().try(Joi.number().integer(), Joi.string().pattern(/^\d+$/).custom(v => parseInt(v))).optional(), // More flexible
    }),
    updateUserStatus: Joi.object({
        status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'INACTIVE').required(),
    }),
    createRole: Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional(),
    }),
    assignPermissions: Joi.object({
        permissionIds: Joi.array().items(Joi.string().guid()).required(),
    }),
    certAction: Joi.object({
        reason: Joi.string().required(),
        newOwnerId: Joi.string().guid().optional(),
        extensionMonths: Joi.number().integer().min(1).optional(),
        newTypeId: Joi.string().guid().optional(),
    }),
    renewCert: Joi.object({
        validity_years: Joi.number().integer().min(1).max(5).required(),
        reason: Joi.string().required(),
    }),
    createCertificateType: Joi.object({
        name: Joi.string().required().trim(),
        short_code: Joi.string().optional().allow('', null).max(50).trim(),
        issuing_authority: Joi.string().valid('CLASS', 'FLAG').required(),
        validity_years: Joi.number().integer().min(1).max(10).required(),
        status: Joi.string().valid('ACTIVE', 'INACTIVE').optional().default('ACTIVE'),
        description: Joi.string().allow('', null).optional(),
        requires_survey: Joi.boolean().optional().default(true),
        requires_survey_short_term: Joi.boolean().optional(),
        requires_survey_full_term: Joi.boolean().optional(),
        requires_survey_interim: Joi.boolean().optional(),
        requires_survey_conditional: Joi.boolean().optional(),
        requires_survey_provisional: Joi.boolean().optional(),
        signature_url: Joi.string().optional().allow('', null),
        required_documents: Joi.array().items(Joi.object({
            document_name: Joi.string().required(),
            is_mandatory: Joi.boolean().optional().default(true),
            applies_to_term: Joi.string().valid('FULL_TERM', 'SHORT_TERM', 'INTERIM', 'CONDITIONAL', 'PROVISIONAL', 'BOTH', 'ALL').optional().default('FULL_TERM')
        })).optional()
    }),
    updateCertificateType: Joi.object({
        name: Joi.string().optional().trim(),
        short_code: Joi.string().optional().allow('', null).max(50).trim(),
        issuing_authority: Joi.string().valid('CLASS', 'FLAG').optional(),
        validity_years: Joi.number().integer().min(1).max(10).optional(),
        status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
        description: Joi.string().allow('', null).optional(),
        requires_survey: Joi.boolean().optional(),
        requires_survey_short_term: Joi.boolean().optional(),
        requires_survey_full_term: Joi.boolean().optional(),
        requires_survey_interim: Joi.boolean().optional(),
        requires_survey_conditional: Joi.boolean().optional(),
        requires_survey_provisional: Joi.boolean().optional(),
        signature_url: Joi.string().optional().allow('', null),
        required_documents: Joi.array().items(Joi.object({
            document_name: Joi.string().required(),
            is_mandatory: Joi.boolean().optional().default(true),
            applies_to_term: Joi.string().valid('FULL_TERM', 'SHORT_TERM', 'INTERIM', 'CONDITIONAL', 'PROVISIONAL', 'BOTH', 'ALL').optional().default('FULL_TERM')
        })).optional()
    }),
    addCertificateTypeRequiredDocument: Joi.object({
        document_name: Joi.string().required().trim(),
        is_mandatory: Joi.boolean().optional().default(true),
        applies_to_term: Joi.string().valid('FULL_TERM', 'SHORT_TERM', 'INTERIM', 'CONDITIONAL', 'PROVISIONAL', 'BOTH', 'ALL').optional().default('FULL_TERM'),
    }),
    updateCertificateTypeRequiredDocument: Joi.object({
        document_name: Joi.string().optional().trim(),
        is_mandatory: Joi.boolean().optional(),
        applies_to_term: Joi.string().valid('FULL_TERM', 'SHORT_TERM', 'INTERIM', 'CONDITIONAL', 'PROVISIONAL', 'BOTH', 'ALL').optional(),
    }).or('document_name', 'is_mandatory', 'applies_to_term'),
    uploadDocument: Joi.object({
        entity_type: Joi.string().required(),
        entity_id: Joi.string().guid().required(),
        document_type: Joi.string().required(),
        description: Joi.string().optional(),
    }),
    startSurvey: Joi.object({
        job_id: Joi.string().guid().optional(),
        job_certificate_id: Joi.string().guid().optional(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
    }).or('job_id', 'job_certificate_id'),
    rejectJob: Joi.object({
        reason: Joi.string().required(),
    }),
    assignJob: Joi.object({
        surveyorId: Joi.string().guid().optional(),
        surveyor_id: Joi.string().guid().optional(),
        remarks: Joi.string().optional().allow(''),
    }).or('surveyorId', 'surveyor_id'),
    reassignJob: Joi.object({
        surveyorId: Joi.string().guid().optional(),
        surveyor_id: Joi.string().guid().optional(),
        reason: Joi.string().required(),
    }).or('surveyorId', 'surveyor_id'),
    rescheduleJob: Joi.object({
        new_target_date: Joi.date().iso().required(),
        new_target_port: Joi.string().required(),
        reason: Joi.string().required(),
    }),
    // escalateJob schema removed (escalation endpoint removed)
    uploadEvidence: Joi.object({
        job_id: Joi.string().guid().required(),
        context: Joi.string().required(),
        description: Joi.string().optional(),
    }),
    updateNotifPrefs: Joi.object({
        email_enabled: Joi.boolean().required(),
        app_enabled: Joi.boolean().required(),
        alert_types: Joi.array().items(Joi.string()).required()
    }),
    createSupportTicket: Joi.object({
        subject: Joi.string().required(),
        description: Joi.string().optional(),
        message: Joi.string().optional(),
        priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
        category: Joi.string().optional().allow(''),
    }).or('description', 'message'),
    updateSupportTicketStatus: Joi.object({
        status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED').required(),
        internal_note: Joi.string().optional().allow(''),
    }),
    // mobileSync schema removed (mobile module was removed)
    rateLimitConfig: Joi.object({
        ip: Joi.string().ip().required(),
        limit: Joi.number().integer().required(),
    }),
    createTemplate: Joi.object({
        template_name: Joi.string().required(),
        certificate_type_id: Joi.string().guid().required(),
        certificate_term: Joi.string().valid('FULL_TERM', 'SHORT_TERM', 'INTERIM', 'CONDITIONAL', 'PROVISIONAL').optional().allow(null),
        template_content: Joi.string().required(),
        variables: Joi.array().items(Joi.string()).optional(),
        is_active: Joi.boolean().optional().default(true)
    }),
    updateTemplate: Joi.object({
        template_name: Joi.string().optional(),
        certificate_type_id: Joi.string().guid().optional(),
        certificate_term: Joi.string().valid('FULL_TERM', 'SHORT_TERM', 'INTERIM', 'CONDITIONAL', 'PROVISIONAL').optional().allow(null),
        template_content: Joi.string().optional(),
        variables: Joi.array().items(Joi.string()).optional(),
        is_active: Joi.boolean().optional()
    }),
    createChecklistTemplate: Joi.object({
        name: Joi.string().required(),
        code: Joi.string().required(),
        description: Joi.string().optional().allow(''),
        certificate_type_id: Joi.string().guid().optional().allow(null),
        sections: Joi.array().items(Joi.object({
            title: Joi.string().required(),
            items: Joi.array().items(Joi.object({
                code: Joi.string().required(),
                text: Joi.string().required(),
                type: Joi.string().uppercase().valid('YES_NO_NA', 'TEXT', 'NUMBER', 'PASS_FAIL', 'YES_NO', 'PASS_FAIL_NA').default('YES_NO_NA')
            })).required()
        })).required(),
        // Optional. S3 keys obtained from
        // GET /api/v1/checklist-templates/get-upload-url. Stored as JSON array.
        template_files: Joi.array().items(Joi.string()).optional(),
        status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DRAFT').optional(),
        metadata: Joi.object().optional()
    }),
    updateChecklistTemplate: Joi.object({
        name: Joi.string().optional(),
        code: Joi.string().optional(),
        description: Joi.string().optional().allow(''),
        certificate_type_id: Joi.string().guid().optional().allow(null),
        sections: Joi.array().items(Joi.object({
            title: Joi.string().required(),
            items: Joi.array().items(Joi.object({
                code: Joi.string().required(),
                text: Joi.string().required(),
                type: Joi.string().uppercase().valid('YES_NO_NA', 'TEXT', 'NUMBER', 'PASS_FAIL', 'YES_NO', 'PASS_FAIL_NA').default('YES_NO_NA')
            })).required()
        })).optional(),
        status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DRAFT').optional(),
        metadata: Joi.object().optional(),
        // Three independent ways to manage attached template files:
        //   - template_files          → full replace
        //   - add_template_files      → append these keys to the existing list
        //   - remove_template_files   → drop these specific keys from the list
        // (You can use add_ + remove_ together. Don't combine either with the
        // full-replace `template_files` field.)
        template_files: Joi.array().items(Joi.string()).optional(),
        add_template_files: Joi.array().items(Joi.string()).optional(),
        remove_template_files: Joi.array().items(Joi.string()).optional()
    }).custom((value, helpers) => {
        const fullReplace = Object.prototype.hasOwnProperty.call(value, 'template_files');
        const addOrRemove = Object.prototype.hasOwnProperty.call(value, 'add_template_files')
            || Object.prototype.hasOwnProperty.call(value, 'remove_template_files');
        if (fullReplace && addOrRemove) {
            return helpers.message('Use either `template_files` (full replace) OR `add_template_files` / `remove_template_files`, not both.');
        }
        return value;
    }, 'template-files-mutex'),
    createVessel: Joi.object({
        client_id: Joi.string().guid().required(),
        vessel_name: Joi.string().required(),
        imo_number: Joi.string().pattern(/^[0-9]{7}$/).required().messages({
            'string.pattern.base': 'IMO number must be a 7-digit number'
        }),
        call_sign: Joi.string().optional().allow(''),
        mmsi_number: Joi.string().pattern(/^[0-9]{9}$/).required().messages({
            'string.pattern.base': 'MMSI number must be a 9-digit number',
            'any.required': 'MMSI number is required',
            'string.empty': 'MMSI number is required'
        }),
        flag_administration_id: Joi.string().guid().required(),
        port_of_registry: Joi.string().optional().allow(''),
        year_built: Joi.number().integer().optional(),
        ship_type: Joi.string().required(),
        gross_tonnage: Joi.number().optional(),
        net_tonnage: Joi.number().optional(),
        deadweight: Joi.number().optional(),
        class_status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'WITHDRAWN').optional(),
        current_class_society: Joi.string().optional().allow(''),
        engine_type: Joi.string().optional().allow(''),
        builder_name: Joi.string().optional().allow(''),
        uploaded_documents: Joi.array().items(Joi.object({
            file_url: Joi.string().required(),
            document_type: Joi.string().required(),
            description: Joi.string().optional().allow(''),
            document_name: Joi.string().optional().allow('', null)
        })).optional()
    }),
    updateVessel: Joi.object({
        client_id: Joi.string().guid().optional(),
        vessel_name: Joi.string().optional(),
        imo_number: Joi.string().pattern(/^[0-9]{7}$/).optional().messages({
            'string.pattern.base': 'IMO number must be a 7-digit number'
        }),
        call_sign: Joi.string().optional().allow(''),
        mmsi_number: Joi.string().pattern(/^[0-9]{9}$/).optional().allow('').messages({
            'string.pattern.base': 'MMSI number must be a 9-digit number'
        }),
        flag_administration_id: Joi.string().guid().optional(),
        port_of_registry: Joi.string().optional().allow(''),
        year_built: Joi.number().integer().optional(),
        ship_type: Joi.string().optional(),
        gross_tonnage: Joi.number().optional(),
        net_tonnage: Joi.number().optional(),
        deadweight: Joi.number().optional(),
        class_status: Joi.string().valid('ACTIVE', 'SUSPENDED', 'WITHDRAWN').optional(),
        current_class_society: Joi.string().optional().allow(''),
        engine_type: Joi.string().optional().allow(''),
        builder_name: Joi.string().optional().allow(''),
        uploaded_documents: Joi.array().items(Joi.object({
            file_url: Joi.string().required(),
            document_type: Joi.string().required(),
            description: Joi.string().optional().allow(''),
            document_name: Joi.string().optional().allow('', null)
        })).optional()
    }),
    updateUser: Joi.object({
        name: Joi.string().optional(),
        email: Joi.string().email().optional(),
        role: Joi.string().valid('ADMIN', 'GM', 'TM', 'TO', 'SURVEYOR', 'CLIENT').optional(),
        phone: Joi.string().optional().allow(''),
        status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').optional(),
        client_id: Joi.string().guid().optional().allow(null),
    }),

    // ── Contact / Website Enquiry ───────────────────────────────────────────
    submitContactEnquiry: Joi.object({
        full_name: Joi.string().min(2).max(100).required(),
        company: Joi.string().max(150).optional().allow('', null),
        corporate_email: Joi.string().email().required(),
        message: Joi.string().min(10).max(5000).required(),
        phone: Joi.string().max(30).optional().allow('', null),
        subject: Joi.string().max(200).optional().allow('', null),
        source_page: Joi.string().max(50).optional().allow('', null),
        website: Joi.string().max(200).optional().allow('', null), // Honeypot
        captcha_token: Joi.string().optional().allow('', null), // Cloudflare Turnstile token
    }),
    updateContactEnquiryStatus: Joi.object({
        status: Joi.string().valid('NEW', 'READ', 'REPLIED', 'ARCHIVED').required(),
        internal_note: Joi.string().max(2000).optional().allow('', null),
    }),


    updateFcmToken: Joi.object({
        fcmToken: Joi.string().required(),
    }),
    newsletterSubscribe: Joi.object({
        email: Joi.string().email().required(),
        source: Joi.string().max(100).optional().allow('', null)
    }),
    newsletterUnsubscribe: Joi.object({
        email: Joi.string().email().required()
    }),
    upsertPortfolioFeedback: Joi.object({
        comment: Joi.string().required(),
        rating: Joi.number().integer().min(1).max(5).optional(),
        designation: Joi.string().max(100).allow('', null).optional(),
        company: Joi.string().max(100).allow('', null).optional(),
    }),
    togglePortfolioFeedbackVisibility: Joi.object({
        is_visible: Joi.boolean().required(),
    }),
    // ── Certificate Management ───────────────────────────────────────────
    updateCertificateDraft: Joi.object({
        flag_administration_id: Joi.string().guid().optional(),
        certificate_term: Joi.string().valid('FULL_TERM', 'SHORT_TERM', 'INTERIM', 'CONDITIONAL', 'PROVISIONAL').optional(),
        remarks: Joi.string().allow('', null).optional(),
        issue_date: Joi.date().iso().optional(),
        expiry_date: Joi.date().iso().optional(),
        signature_url: Joi.string().optional().allow('', null),
    }),
    updateCertificateLayout: Joi.object({
        custom_html: Joi.string().required(),
    }),
    uploadExternalCertificate: Joi.alternatives().try(
        Joi.object({
            certificates: Joi.array().items(Joi.object({
                certificate_type_id: Joi.string().guid().required(),
                certificate_number: Joi.string().required(),
                issue_date: Joi.date().iso().required(),
                expiry_date: Joi.date().iso().required(),
                s3_key: Joi.string().required(),
            })).min(1).required()
        }),
        Joi.array().items(Joi.object({
            certificate_type_id: Joi.string().guid().required(),
            certificate_number: Joi.string().required(),
            issue_date: Joi.date().iso().required(),
            expiry_date: Joi.date().iso().required(),
            s3_key: Joi.string().required(),
        })).min(1),
        Joi.object({
            certificate_type_id: Joi.string().guid().required(),
            certificate_number: Joi.string().required(),
            issue_date: Joi.date().iso().required(),
            expiry_date: Joi.date().iso().required(),
            s3_key: Joi.string().required(),
        })
    ),
    overrideCertificate: Joi.object({
        s3_key: Joi.string().required(),
        reason: Joi.string().optional().allow('', null)
    }),
    createActivityRequest: Joi.object({
        vessel_id: Joi.string().guid().optional().allow(null, ''),
        activity_type: Joi.string()
            .uppercase()
            .valid('INSPECTION', 'AUDIT', 'TRAINING', 'VISIT', 'SURVEY', 'OTHER')
            .required(),
        requested_service: Joi.string().required(),
        priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
        description: Joi.string().optional().allow('', null),
        location_port: Joi.string().required(),
        proposed_date: Joi.date().iso().required(),
        attachments: Joi.array().items(Joi.string().uri()).optional(),
    }),
    updateActivityRequestStatus: Joi.object({
        status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'DRAFT').required(),
        remarks: Joi.string().optional().allow('', null),
    }),
    convertActivityRequestToJob: Joi.object({
        certificate_type_id: Joi.string().guid().optional(),
        certificates: Joi.array().items(Joi.object({
            certificate_type_id: Joi.string().guid().required(),
            certificate_term: Joi.string().valid('FULL_TERM', 'SHORT_TERM').optional().default('FULL_TERM'),
            uploaded_documents: Joi.array().items(Joi.object({
                required_document_id: Joi.string().guid().optional().allow(null, ''),
                custom_document_name: Joi.string().optional().allow(null, ''),
                file_url: Joi.string().required(),
            })).optional().default([]),
        })).min(1).optional(),
        vessel_id: Joi.string().guid().optional(),
        reason: Joi.string().optional().allow('', null),
        target_port: Joi.string().optional().allow('', null),
        target_date: Joi.date().iso().optional(),
        priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT').optional(),
        remarks: Joi.string().optional().allow('', null),
        uploaded_documents: Joi.array().items(Joi.object({
            required_document_id: Joi.string().guid().optional().allow(null, ''),
            custom_document_name: Joi.string().optional().allow(null, ''),
            file_url: Joi.string().required(),
        })).optional(),
    }).or('certificate_type_id', 'certificates'),
    createJobMessage: Joi.object({
        message: Joi.string().optional().allow('', null),
        message_text: Joi.string().optional().allow('', null),
        type: Joi.string().valid('internal', 'external').optional(),
        attachment_url: Joi.string().optional().allow('', null),
        attachmentKey: Joi.string().optional().allow('', null),
        is_internal: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional().default(false),
    }).unknown(true),
    createSiteStaticContent: Joi.object({
        key: Joi.string().max(64).required(),
        title: Joi.string().max(200).required(),
        body_html: Joi.string().allow('', null).optional(),
        faq_items: Joi.array().items(Joi.object({
            heading: Joi.string().max(200).required(),
            questions: Joi.array().items(Joi.object({
                question: Joi.string().max(2000).required(),
                answer: Joi.string().max(50000).required()
            })).min(1).required()
        })).optional(),
        news_items: Joi.array().items(Joi.object({
            id: Joi.string().optional(),
            title: Joi.string().max(200).required(),
            body_html: Joi.string().allow('', null).optional(),
            thumbnail_url: Joi.string().allow('', null).optional(),
            published_at: Joi.string().allow('', null).optional(),
        })).optional(),
        is_published: Joi.boolean().optional(),
    }).unknown(true),
    updateSiteStaticContent: Joi.object({
        key: Joi.string().max(64).optional(),
        title: Joi.string().max(200).optional(),
        body_html: Joi.string().allow('', null).optional(),
        faq_items: Joi.array().items(Joi.object({
            heading: Joi.string().max(200).required(),
            questions: Joi.array().items(Joi.object({
                question: Joi.string().max(2000).required(),
                answer: Joi.string().max(50000).required()
            })).min(1).required()
        })).optional(),
        news_items: Joi.array().items(Joi.object({
            id: Joi.string().optional(),
            title: Joi.string().max(200).required(),
            body_html: Joi.string().allow('', null).optional(),
            thumbnail_url: Joi.string().allow('', null).optional(),
            published_at: Joi.string().allow('', null).optional(),
        })).optional(),
        is_published: Joi.boolean().optional(),
    }).unknown(true),
    reportSystemIssue: Joi.object({
        error_message: Joi.string().required(),
        stack_trace: Joi.string().allow('', null).optional(),
        description: Joi.string().allow('', null).optional(),
        page_url: Joi.string().allow('', null).optional(),
        user_agent: Joi.string().allow('', null).optional()
    }),
    updateSystemIssueStatus: Joi.object({
        status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'RESOLVED').required()
    }),
    updateMaintenanceMode: Joi.object({
        isMaintenance: Joi.boolean().required(),
        message: Joi.string().allow('', null).optional()
    }),
    checkMobileAppStatus: Joi.object({
        platform: Joi.string().valid('ios', 'android').required(),
        version: Joi.alternatives().try(Joi.number().integer(), Joi.string().pattern(/^\d+$/)).required()
    }),
    updateMobileAppConfig: Joi.object({
        android: Joi.object({
            minVersion: Joi.number().integer().required(),
            latestVersion: Joi.number().integer().required(),
            isMaintenance: Joi.boolean().required(),
            maintenanceMessage: Joi.string().required(),
            storeUrl: Joi.string().uri().required()
        }).required(),
        ios: Joi.object({
            minVersion: Joi.number().integer().required(),
            latestVersion: Joi.number().integer().required(),
            isMaintenance: Joi.boolean().required(),
            maintenanceMessage: Joi.string().required(),
            storeUrl: Joi.string().uri().required()
        }).required()
    })
};

