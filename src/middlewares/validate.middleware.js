import Joi from 'joi';

export const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            return res.status(400).json({ message: 'Validation Error', error: errorMessage });
        }

        next();
    };
};

export const schemas = {
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),
    register: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('ADMIN', 'GM', 'TM', 'TO', 'TA', 'SURVEYOR', 'CLIENT', 'FLAG_ADMIN').required(),
        company_name: Joi.string().optional(),
    }),
    createJob: Joi.object({
        vessel_id: Joi.string().guid().required(),
        certificate_type_id: Joi.string().guid().required(),
        reason: Joi.string().required(),
        target_port: Joi.string().required(),
        target_date: Joi.date().iso().required(),
    }),
    submitSurvey: Joi.object({
        job_id: Joi.string().guid().required(),
        gps_latitude: Joi.number().required(),
        gps_longitude: Joi.number().required(),
        survey_statement: Joi.string().required(),
        reason_if_outside: Joi.string().optional().allow(''),
    }),
    generateCertificate: Joi.object({
        job_id: Joi.string().guid().required(),
        validity_years: Joi.number().integer().min(1).max(5).optional(),
    }),
    applySurveyor: Joi.object({
        full_name: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().required(),
        nationality: Joi.string().required(),
        qualification: Joi.string().required(),
        years_of_experience: Joi.number().integer().required(),
    }),
    reviewSurveyor: Joi.object({
        status: Joi.string().valid('APPROVED', 'REJECTED', 'DOCUMENTS_REQUIRED').required(),
        remarks: Joi.string().optional().allow(''),
    }),
    updateGps: Joi.object({
        vessel_id: Joi.string().guid().required(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
    }),
    setGeoFence: Joi.object({
        vessel_id: Joi.string().guid().required(),
        radius_meters: Joi.number().integer().min(100).required(),
    }),
    createNC: Joi.object({
        job_id: Joi.string().guid().required(),
        description: Joi.string().required(),
        severity: Joi.string().valid('MINOR', 'MAJOR', 'CRITICAL').required(),
    }),
    closeNC: Joi.object({
        closure_remarks: Joi.string().required(),
    }),
    submitChecklist: Joi.object({
        items: Joi.array().items(Joi.object({
            question_code: Joi.string().required(),
            answer: Joi.string().valid('YES', 'NO', 'NA').required(),
            remarks: Joi.string().allow('').optional()
        })).required()
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
        flag_name: Joi.string().required(),
        country: Joi.string().required(),
        authority_name: Joi.string().required(),
        contact_email: Joi.string().email().required(),
    }),
    createUser: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('ADMIN', 'GM', 'TM', 'TO', 'TA', 'SURVEYOR', 'CLIENT', 'FLAG_ADMIN').required(),
        phone: Joi.string().optional(),
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
    }),
    renewCert: Joi.object({
        validity_years: Joi.number().integer().min(1).max(5).required(),
        reason: Joi.string().required(),
    }),
    uploadDocument: Joi.object({
        entity_type: Joi.string().required(),
        entity_id: Joi.string().guid().required(),
        document_type: Joi.string().required(),
        description: Joi.string().optional(),
    }),
    startSurvey: Joi.object({
        job_id: Joi.string().guid().required(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
    }),
    rejectJob: Joi.object({
        reason: Joi.string().required(),
    }),
    reassignJob: Joi.object({
        surveyorId: Joi.string().guid().required(),
        reason: Joi.string().required(),
    }),
    escalateJob: Joi.object({
        reason: Joi.string().required(),
        target_role: Joi.string().valid('GM', 'ADMIN').required(),
    }),
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
    mobileSync: Joi.object({
        last_sync_timestamp: Joi.date().iso().required(),
        offline_data: Joi.object().optional() // items created offline
    }),
    rateLimitConfig: Joi.object({
        ip: Joi.string().ip().required(),
        limit: Joi.number().integer().required(),
    }),
    createTemplate: Joi.object({
        name: Joi.string().required(),
        code: Joi.string().required(),
        description: Joi.string().optional(),
        sections: Joi.array().items(Joi.object({
            title: Joi.string().required(),
            items: Joi.array().items(Joi.object({
                code: Joi.string().required(),
                text: Joi.string().required(),
                type: Joi.string().valid('YES_NO_NA', 'TEXT', 'NUMBER').default('YES_NO_NA')
            })).required()
        })).required(),
        status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DRAFT').optional(),
        metadata: Joi.object().optional()
    }),
    updateTemplate: Joi.object({
        name: Joi.string().optional(),
        code: Joi.string().optional(),
        description: Joi.string().optional(),
        sections: Joi.array().items(Joi.object({
            title: Joi.string().required(),
            items: Joi.array().items(Joi.object({
                code: Joi.string().required(),
                text: Joi.string().required(),
                type: Joi.string().valid('YES_NO_NA', 'TEXT', 'NUMBER').default('YES_NO_NA')
            })).required()
        })).optional(),
        status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DRAFT').optional(),
        metadata: Joi.object().optional()
    })
};
