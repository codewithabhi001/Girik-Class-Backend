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
    register: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, and digit' }),
        role: Joi.string().valid('ADMIN', 'GM', 'TM', 'TO', 'TA', 'SURVEYOR', 'CLIENT', 'FLAG_ADMIN').required(),
        company_name: Joi.string().optional(),
    }),
    createJob: Joi.object({
        vessel_id: Joi.string().guid().required(),
        certificate_type_id: Joi.string().guid().required(),
        reason: Joi.string().required(),
        target_port: Joi.string().required(),
        target_date: Joi.date().iso().required(),
        uploaded_documents: Joi.array().items(Joi.object({
            required_document_id: Joi.string().guid().required(),
            file_url: Joi.string().required()
        })).optional()
    }),
    submitSurvey: Joi.object({
        job_id: Joi.string().guid().required(),
        gps_latitude: Joi.number().required(),
        gps_longitude: Joi.number().required(),
        survey_statement: Joi.string().required(),
    }),
    draftSurveyStatement: Joi.object({
        survey_statement: Joi.string().required(),
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
            question_text: Joi.string().required(),
            answer: Joi.string().valid('YES', 'NO', 'NA').required(),
            remarks: Joi.string().allow('').optional(),
            file_url: Joi.string().allow('', null).optional()
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
        flag_state_name: Joi.string().required(),
        country: Joi.string().required(),
        authority_name: Joi.string().required(),
        contact_email: Joi.string().email().required(),
    }),
    createClient: Joi.object({
        company_name: Joi.string().required(),
        company_code: Joi.string().required(),
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
            role: Joi.string().valid('CLIENT', 'ADMIN', 'GM', 'TM', 'TO', 'TA', 'SURVEYOR', 'FLAG_ADMIN').optional().default('CLIENT'),
            phone: Joi.string().optional().allow(''),
        }).optional(),
    }),
    createUser: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase, and digit' }),
        role: Joi.string().valid('ADMIN', 'GM', 'TM', 'TO', 'TA', 'SURVEYOR', 'CLIENT', 'FLAG_ADMIN').required(),
        phone: Joi.string().optional(),
        client_id: Joi.string().guid().optional().allow(null),
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
    createCertificateType: Joi.object({
        name: Joi.string().required().trim(),
        issuing_authority: Joi.string().valid('CLASS', 'FLAG').required(),
        validity_years: Joi.number().integer().min(1).max(10).required(),
        status: Joi.string().valid('ACTIVE', 'INACTIVE').optional().default('ACTIVE'),
        description: Joi.string().allow('', null).optional(),
        requires_survey: Joi.boolean().optional().default(true),
        required_documents: Joi.array().items(Joi.object({
            document_name: Joi.string().required(),
            is_mandatory: Joi.boolean().optional().default(true)
        })).optional()
    }),
    updateCertificateType: Joi.object({
        name: Joi.string().optional().trim(),
        issuing_authority: Joi.string().valid('CLASS', 'FLAG').optional(),
        validity_years: Joi.number().integer().min(1).max(10).optional(),
        status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
        description: Joi.string().allow('', null).optional(),
        requires_survey: Joi.boolean().optional(),
        required_documents: Joi.array().items(Joi.object({
            document_name: Joi.string().required(),
            is_mandatory: Joi.boolean().optional().default(true)
        })).optional()
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
                type: Joi.string().valid('YES_NO_NA', 'TEXT', 'NUMBER').default('YES_NO_NA')
            })).required()
        })).required(),
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
                type: Joi.string().valid('YES_NO_NA', 'TEXT', 'NUMBER').default('YES_NO_NA')
            })).required()
        })).optional(),
        status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DRAFT').optional(),
        metadata: Joi.object().optional()
    }),
    createVessel: Joi.object({
        client_id: Joi.string().guid().required(),
        vessel_name: Joi.string().required(),
        imo_number: Joi.string().pattern(/^[0-9]{7}$/).required().messages({
            'string.pattern.base': 'IMO number must be a 7-digit number'
        }),
        call_sign: Joi.string().optional().allow(''),
        mmsi_number: Joi.string().pattern(/^[0-9]{9}$/).optional().allow('').messages({
            'string.pattern.base': 'MMSI number must be a 9-digit number'
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
            description: Joi.string().optional().allow('')
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
    }),
    updateUser: Joi.object({
        name: Joi.string().optional(),
        email: Joi.string().email().optional(),
        role: Joi.string().valid('ADMIN', 'GM', 'TM', 'TO', 'TA', 'SURVEYOR', 'CLIENT', 'FLAG_ADMIN').optional(),
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
    }),
    updateContactEnquiryStatus: Joi.object({
        status: Joi.string().valid('NEW', 'READ', 'REPLIED', 'ARCHIVED').required(),
        internal_note: Joi.string().max(2000).optional().allow('', null),
    }),
};
