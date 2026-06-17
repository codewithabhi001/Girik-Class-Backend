/** Flatten Sequelize list rows — no nested association objects in list payloads. */

export const toPlain = (row) => (row?.get ? row.get({ plain: true }) : row ?? {});

/** Display null/empty as N/A in flat list rows. */
export const na = (value) => (value == null || value === '') ? 'N/A' : value;

/** Minimal certificate type row for list endpoints (no description / required_documents). */
export const flatCertificateTypeListRow = (row) => {
    const t = toPlain(row);
    return {
        id: t.id,
        name: t.name,
        short_code: t.short_code ?? '',
        issuing_authority: t.issuing_authority,
        validity_years: t.validity_years,
        status: t.status,
        requires_survey: t.requires_survey,
        requires_survey_short_term: t.requires_survey_short_term,
        requires_survey_full_term: t.requires_survey_full_term,
    };
};

/** Full certificate type payload for detail/create/update responses. */
export const shapeCertificateTypeDetail = (row) => {
    const t = toPlain(row);
    const docs = t.CertificateRequiredDocuments || t.required_documents || [];
    return {
        id: t.id,
        name: t.name,
        short_code: t.short_code ?? '',
        issuing_authority: t.issuing_authority,
        validity_years: t.validity_years,
        status: t.status,
        description: t.description ?? null,
        requires_survey: t.requires_survey,
        requires_survey_short_term: t.requires_survey_short_term,
        requires_survey_full_term: t.requires_survey_full_term,
        required_documents: docs.map((d) => ({
            id: d.id,
            document_name: d.document_name,
            is_mandatory: d.is_mandatory,
            applies_to_term: d.applies_to_term,
        })),
    };
};

export const flatCertificateListRow = (row) => {
    const c = toPlain(row);
    const result = {
        id: c.id,
        vessel_id: c.vessel_id,
        certificate_type_id: c.certificate_type_id,
        certificate_number: na(c.certificate_number),
        issue_date: na(c.issue_date),
        expiry_date: na(c.expiry_date),
        status: na(c.status),
        createdAt: na(c.createdAt),
        certificate_type: na(c.CertificateType?.name),
    };
    const activePdfUrl = c.pdf_file_url || c.uploaded_file_url || c.generated_pdf_url || c.manually_overridden_file_url || c.pdf_url;
    if (activePdfUrl && activePdfUrl !== 'N/A' && activePdfUrl !== '') {
        result.pdf_file_url = activePdfUrl;
        result.pdf_url = activePdfUrl;
    }
    if (c.vessel_id === null || c.vessel_id === undefined) {
        result.vessel_name = 'Company Wide';
        result.imo_number = 'N/A';
        result.client_id = c.client_id || c.Client?.id || 'N/A';
        result.company_name = na(c.Client?.company_name);
    } else if (c.Vessel !== undefined) {
        result.vessel_name = na(c.Vessel?.vessel_name);
        result.imo_number = na(c.Vessel?.imo_number);
        result.client_id = na(c.Vessel?.client_id);
        result.company_name = na(c.Vessel?.Client?.company_name);
    }
    return result;
};

export const flatIncidentListRow = (row) => {
    const i = toPlain(row);
    return {
        id: i.id,
        vessel_id: i.vessel_id,
        reported_by: i.reported_by,
        title: na(i.title),
        status: na(i.status),
        created_at: na(i.created_at ?? i.createdAt),
        vessel_name: na(i.Vessel?.vessel_name),
        imo_number: na(i.Vessel?.imo_number),
    };
};

export const flatSurveyReportListRow = (row) => {
    const s = toPlain(row);
    return {
        id: s.id,
        job_id: s.JobCertificate?.JobRequest?.id ?? s.job_id,
        surveyor_id: s.surveyor_id,
        survey_status: na(s.survey_status),
        submission_count: na(s.submission_count),
        started_at: na(s.started_at),
        submitted_at: na(s.submitted_at),
        finalized_at: na(s.finalized_at),
        survey_statement_status: na(s.survey_statement_status),
        survey_statement_pdf_url: na(s.survey_statement_pdf_url),
        job_status: na(s.JobCertificate?.JobRequest?.job_status ?? s.JobRequest?.job_status),
        vessel_name: na(s.JobCertificate?.JobRequest?.Vessel?.vessel_name ?? s.JobRequest?.Vessel?.vessel_name),
        imo_number: na(s.JobCertificate?.JobRequest?.Vessel?.imo_number ?? s.JobRequest?.Vessel?.imo_number),
        surveyor_name: na(s.User?.name),
        surveyor_email: na(s.User?.email),
    };
};

export const flatPaymentListRow = (row) => {
    const p = toPlain(row);
    return {
        id: na(p.id),
        job_id: na(p.job_id),
        job_request_number: na(p.JobRequest?.job_request_number),
        invoice_number: na(p.invoice_number),
        amount: na(p.amount),
        currency: na(p.currency),
        payment_status: na(p.payment_status),
        created_at: na(p.created_at ?? p.createdAt),
        paid_at: na(p.paid_at),
        amount_collected: na(p.amount_collected),
        amount_paid: na(p.amount_paid),
        remaining: na(p.remaining),
        net_amount: na(p.net_amount),
        refunded_amount: na(p.refunded_amount),
        vessel_name: na(p.JobRequest?.Vessel?.vessel_name),
        client_id: na(p.JobRequest?.Vessel?.client_id),
        company_name: na(p.JobRequest?.Vessel?.Client?.company_name),
        job_status: na(p.JobRequest?.job_status),
        reason: na(p.reason),
    };
};

export const flatSupportTicketListRow = (row) => {
    const t = toPlain(row);
    return {
        id: t.id,
        ticket_number: na(t.ticket_number),
        subject: na(t.subject),
        priority: na(t.priority),
        status: na(t.status),
        category: na(t.category),
        user_id: t.user_id,
        created_at: na(t.created_at ?? t.createdAt),
        creator_name: na(t.Creator?.name),
        creator_email: na(t.Creator?.email),
    };
};

export const flatContactEnquiryListRow = (row) => {
    const e = toPlain(row);
    return {
        id: e.id,
        full_name: na(e.full_name),
        company: na(e.company),
        corporate_email: na(e.corporate_email),
        phone: na(e.phone),
        subject: na(e.subject),
        source_page: na(e.source_page),
        status: na(e.status),
        internal_note: na(e.internal_note),
        replied_by: na(e.replied_by),
        replied_at: na(e.replied_at),
        created_at: na(e.created_at ?? e.createdAt),
        responder_name: na(e.Responder?.name),
        responder_email: na(e.Responder?.email),
    };
};

/** Flat vessel block for activity request list/detail (no nested Sequelize objects). */
export const flatActivityRequestVesselBlock = (vessel) => {
    const v = vessel ? toPlain(vessel) : null;
    return {
        id: na(v?.id),
        vessel_name: na(v?.vessel_name),
        imo_number: na(v?.imo_number),
        call_sign: na(v?.call_sign),
        mmsi_number: na(v?.mmsi_number),
        port_of_registry: na(v?.port_of_registry),
        year_built: na(v?.year_built),
        ship_type: na(v?.ship_type),
        gross_tonnage: na(v?.gross_tonnage),
        net_tonnage: na(v?.net_tonnage),
        deadweight: na(v?.deadweight),
        class_status: na(v?.class_status),
        current_class_society: na(v?.current_class_society),
        engine_type: na(v?.engine_type),
        flag_state: na(v?.FlagAdministration?.flag_state_name),
        company_name: na(v?.Client?.company_name),
        company_code: na(v?.Client?.company_code),
    };
};

export const flatActivityRequestListRow = (row) => {
    const a = toPlain(row);
    return {
        id: a.id,
        request_number: na(a.request_number),
        activity_type: na(a.activity_type),
        requested_service: na(a.requested_service),
        proposed_date: na(a.proposed_date),
        location_port: na(a.location_port),
        status: na(a.status),
        vessel_id: na(a.vessel_id),
        created_at: na(a.created_at ?? a.createdAt),
        vessel_name: na(a.Vessel?.vessel_name),
        imo_number: na(a.Vessel?.imo_number),
        linked_job_id: na(a.linked_job_id ?? a.LinkedJob?.id),
        linked_job_status: na(a.LinkedJob?.job_status),
        linked_job_request_number: na(a.LinkedJob?.job_request_number),
    };
};

export const flatActivityRequestDetailRow = (row) => {
    const a = toPlain(row);
    const vessel = flatActivityRequestVesselBlock(a.Vessel);
    return {
        id: a.id,
        request_number: na(a.request_number),
        activity_type: na(a.activity_type),
        requested_service: na(a.requested_service),
        proposed_date: na(a.proposed_date),
        status: na(a.status),
        vessel_id: na(a.vessel_id),
        requested_by: na(a.requested_by),
        priority: na(a.priority),
        description: na(a.description),
        location_port: na(a.location_port),
        linked_job_id: na(a.linked_job_id ?? a.LinkedJob?.id),
        rejection_reason: na(a.rejection_reason),
        attachments: a.attachments ?? [],
        created_at: na(a.created_at ?? a.createdAt),
        updated_at: na(a.updated_at ?? a.updatedAt),
        vessel_name: vessel.vessel_name,
        imo_number: vessel.imo_number,
        requester_name: na(a.Requester?.name),
        requester_email: na(a.Requester?.email),
        vessel,
        linked_job_status: na(a.LinkedJob?.job_status),
        linked_job_reason: na(a.LinkedJob?.reason),
        linked_job_request_number: na(a.LinkedJob?.job_request_number),
    };
};

export const flatChangeRequestListRow = (row) => {
    const cr = toPlain(row);
    return {
        id: cr.id,
        entity_type: na(cr.entity_type),
        entity_id: cr.entity_id,
        change_description: na(cr.change_description),
        status: na(cr.status),
        priority: na(cr.priority),
        requested_by: cr.requested_by,
        approved_by: na(cr.approved_by),
        approved_at: na(cr.approved_at),
        createdAt: na(cr.createdAt),
        requester_name: na(cr.requester?.name),
        requester_email: na(cr.requester?.email),
        approver_name: na(cr.approver?.name),
        approver_email: na(cr.approver?.email),
    };
};

export const flatSearchVesselRow = (row) => {
    const v = toPlain(row);
    return {
        id: v.id,
        vessel_name: na(v.vessel_name),
        imo_number: na(v.imo_number),
        client_id: na(v.client_id),
    };
};

export const flatSearchJobRow = (row) => {
    const j = toPlain(row);
    return {
        id: j.id,
        job_number: na(j.job_request_number),
        job_status: na(j.job_status),
        vessel_id: j.vessel_id,
        created_at: na(j.createdAt),
        vessel_name: na(j.Vessel?.vessel_name),
        imo_number: na(j.Vessel?.imo_number),
    };
};

export const flatSearchCertificateRow = (row) => {
    const c = toPlain(row);
    return {
        id: c.id,
        certificate_number: na(c.certificate_number),
        vessel_id: c.vessel_id,
        status: na(c.status),
        expiry_date: na(c.expiry_date),
    };
};

export const flatFeedbackListRow = (row) => {
    const f = toPlain(row);
    return {
        id: f.id,
        job_id: f.job_id,
        client_id: f.client_id,
        rating: na(f.rating),
        timeliness: na(f.timeliness),
        professionalism: na(f.professionalism),
        documentation: na(f.documentation),
        remarks: na(f.remarks),
        submitted_at: na(f.submitted_at),
        job_request_number: na(f.JobRequest?.job_request_number),
        client_name: na(f.Client?.name),
        client_email: na(f.Client?.email),
        company_name: na(f.Client?.Client?.company_name),
    };
};

export const flatAuditLogListRow = (row) => {
    const l = toPlain(row);
    return {
        id: l.id,
        user_id: na(l.user_id),
        action: na(l.action),
        entity_name: na(l.entity_name),
        entity_id: na(l.entity_id),
        created_at: na(l.created_at ?? l.createdAt),
        user_name: na(l.User?.name),
        user_email: na(l.User?.email),
        user_role: na(l.User?.role),
    };
};

export const flatVesselListRow = (row) => {
    const v = toPlain(row);
    return {
        id: v.id,
        vessel_name: na(v.vessel_name),
        imo_number: na(v.imo_number),
        ship_type: na(v.ship_type),
        class_status: na(v.class_status),
        created_at: na(v.created_at ?? v.createdAt),
        flag_state: na(v.FlagAdministration?.flag_state_name),
        company_name: na(v.Client?.company_name),
        company_code: na(v.Client?.company_code),
        gross_tonnage: na(v.gross_tonnage),
    };
};

export const flatClientListRow = (row) => {
    const c = toPlain(row);
    return {
        id: c.id,
        company_name: na(c.company_name),
        company_code: na(c.company_code),
        status: na(c.status),
        email: na(c.email),
        created_at: na(c.created_at ?? c.createdAt),
        has_user: !!(c.Users && c.Users.length > 0),
    };
};

export const flatNcListRow = (row) => {
    const n = toPlain(row);
    return {
        id: n.id,
        job_id: n.job_id,
        job_request_number: na(n.JobRequest?.job_request_number),
        vessel_name: na(n.JobRequest?.Vessel?.vessel_name),
        severity: na(n.severity),
        status: na(n.status),
        created_at: na(n.created_at ?? n.createdAt),
    };
};

export const flatNcDetailRow = (row) => {
    const n = toPlain(row);
    return {
        id: n.id,
        job_id: n.job_id,
        job_request_number: na(n.JobRequest?.job_request_number),
        vessel_name: na(n.JobRequest?.Vessel?.vessel_name),
        description: n.description ?? null,
        severity: na(n.severity),
        status: na(n.status),
        closure_remarks: n.closure_remarks ?? null,
        closed_at: na(n.closed_at),
        created_at: na(n.created_at ?? n.createdAt),
        updated_at: na(n.updated_at ?? n.updatedAt),
    };
};
