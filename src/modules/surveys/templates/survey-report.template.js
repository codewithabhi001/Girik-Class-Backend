const formatDate = (d) => (d instanceof Date ? d.toLocaleString() : String(d ?? ''));
const formatDateOnly = (d) => (d instanceof Date ? d.toISOString().split('T')[0] : String(d ?? ''));

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const buildSurveyReportHtml = ({ job, vessel, surveyor, survey, checklist, client }) => {
    const vName = escapeHtml(vessel?.vessel_name);
    const vImo = escapeHtml(vessel?.imo_number);
    const vType = escapeHtml(vessel?.ship_type || 'N/A');
    const vFlag = escapeHtml(vessel?.FlagAdministration?.name || 'N/A');
    const vPort = escapeHtml(vessel?.port_of_registry || 'N/A');
    const vGrt = escapeHtml(vessel?.gross_tonnage || 'N/A');
    
    const sName = escapeHtml(surveyor?.name);
    const clientName = escapeHtml(client?.name || job?.requester?.name || 'N/A');
    const requestedOn = formatDate(job?.created_at);
    
    const statement = escapeHtml(survey?.survey_statement || 'No statement provided.');
    
    const checklistRows = (checklist || []).map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7; font-size: 13px;">${escapeHtml(item.question_text)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: center; font-weight: bold; color: ${item.answer === 'YES' ? '#2f855a' : item.answer === 'NO' ? '#c53030' : '#4a5568'};">${escapeHtml(item.answer)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #edf2f7; font-size: 12px; color: #718096;">
                <div>${escapeHtml(item.remarks || '-')}</div>
                ${item.file_url ? `
                    <div style="margin-top: 6px; font-size: 11px;">
                        <strong style="color:#4a5568;">Checklist Evidence:</strong>
                        <a href="${item.file_url}" style="color: #2c5282; text-decoration: none;">View File</a>
                    </div>
                ` : ''}
            </td>
        </tr>
    `).join('');

    const watermark = survey?.is_draft ? `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 150px; color: rgba(226, 232, 240, 0.2); font-weight: bold; pointer-events: none; z-index: -1;">
            DRAFT
        </div>
    ` : '';

    const signatureArea = survey?.is_draft ? `
        <div style="text-align: center; padding: 20px; border: 2px dashed #e2e8f0; color: #a0aec0; border-radius: 8px; font-style: italic;">
            Document Generated in Draft Mode - No Signatures Required
        </div>
    ` : `
        <div style="display: flex; justify-content: space-between; margin-top: 30px;">
            <div style="text-align: center; width: 45%;">
                <div style="height: 80px; border-bottom: 1px solid #2d3748; margin-bottom: 10px; display: flex; align-items: flex-end; justify-content: center;">
                    ${survey?.signature_url ? `<img src="${survey.signature_url}" style="max-height: 70px;" />` : ''}
                </div>
                <div style="font-size: 12px; font-weight: bold;">${sName}</div>
                <div style="font-size: 11px; color: #718096;">Surveyor Signature</div>
            </div>
            <div style="text-align: center; width: 45%;">
                <div style="height: 80px; border-bottom: 1px solid #2d3748; margin-bottom: 10px;"></div>
                <div style="font-size: 12px; font-weight: bold;">GR-CLASS AUTHORIZED SIGNATORY</div>
                <div style="font-size: 11px; color: #718096;">Official Stamp & Date</div>
            </div>
        </div>
    `;

    return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #2d3748; padding: 40px; line-height: 1.5; position: relative; background: #fff;">
        ${watermark}
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a365d; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="display: flex; align-items: center; gap: 15px;">
                <img src="https://grclass.com/grclass-logo.webp" alt="GR Class Logo" style="height: 52px; width: auto; object-fit: contain;" />
                <div>
                    <h1 style="margin: 0; color: #1a365d; font-size: 24px; letter-spacing: 1px;">SURVEY STATEMENT OF FACT</h1>
                    <p style="margin: 3px 0 0 0; color: #4a5568; font-size: 13px; font-weight: 600;">GR-CLASS CERTIFICATION SERVICES</p>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 12px; color: #718096;">Report Reference</div>
                <div style="font-size: 16px; font-weight: bold; color: #1a365d;">#${survey?.id?.substring(0, 8).toUpperCase()}</div>
                <div style="font-size: 11px; color: #a0aec0; margin-top:4px;">Date: ${formatDateOnly(new Date())}</div>
            </div>
        </div>

        <!-- 1. General Information -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
            <div>
                <h3 style="font-size: 14px; text-transform: uppercase; color: #2c5282; margin-bottom: 10px; border-left: 4px solid #2c5282; padding-left: 10px;">Vessel Particulars</h3>
                <table style="width: 100%; font-size: 13px;">
                    <tr><td style="color: #718096; width: 120px; padding: 4px 0;">Vessel Name:</td><td style="font-weight: 600;">${vName}</td></tr>
                    <tr><td style="color: #718096; padding: 4px 0;">IMO Number:</td><td style="font-weight: 600;">${vImo}</td></tr>
                    <tr><td style="color: #718096; padding: 4px 0;">Ship Type:</td><td>${vType}</td></tr>
                    <tr><td style="color: #718096; padding: 4px 0;">Flag:</td><td>${vFlag}</td></tr>
                    <tr><td style="color: #718096; padding: 4px 0;">Port of Registry:</td><td>${vPort}</td></tr>
                    <tr><td style="color: #718096; padding: 4px 0;">Gross Tonnage:</td><td>${vGrt}</td></tr>
                </table>
            </div>
            <div>
                <h3 style="font-size: 14px; text-transform: uppercase; color: #2c5282; margin-bottom: 10px; border-left: 4px solid #2c5282; padding-left: 10px;">Service Details</h3>
                <table style="width: 100%; font-size: 13px;">
                    <tr><td style="color: #718096; width: 120px; padding: 4px 0;">Requesting Party:</td><td style="font-weight: 600;">${clientName}</td></tr>
                    <tr><td style="color: #718096; padding: 4px 0;">Requested On:</td><td>${requestedOn}</td></tr>
                    <tr><td style="color: #718096; padding: 4px 0;">Surveyor:</td><td style="font-weight: 600;">${sName}</td></tr>
                    <tr><td style="color: #718096; padding: 4px 0;">Check-in (GPS):</td><td style="font-family: monospace; font-size: 11px;">${survey?.start_latitude || 'N/A'}, ${survey?.start_longitude || 'N/A'}</td></tr>
                    <tr><td style="color: #718096; padding: 4px 0;">Check-out (GPS):</td><td style="font-family: monospace; font-size: 11px; font-weight: bold; color: #c53030;">${survey?.submit_latitude || 'N/A'}, ${survey?.submit_longitude || 'N/A'}</td></tr>
                </table>
            </div>
        </div>

        <!-- 2. Checklist Section -->
        <div style="margin-bottom: 30px;">
            <h3 style="font-size: 14px; text-transform: uppercase; color: #2c5282; margin-bottom: 10px; border-left: 4px solid #2c5282; padding-left: 10px;">Technical Inspection Checklist</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0;">
                <thead>
                    <tr style="background: #f8fafc;">
                        <th style="padding: 12px; text-align: left; font-size: 11px; color: #4a5568; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Requirement / Question</th>
                        <th style="padding: 12px; text-align: center; font-size: 11px; color: #4a5568; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; width: 80px;">Status</th>
                        <th style="padding: 12px; text-align: left; font-size: 11px; color: #4a5568; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; width: 151px;">Findings / Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    ${checklistRows}
                </tbody>
            </table>
        </div>

        <!-- 3. Final Statement -->
        <div style="margin-bottom: 30px;">
            <h3 style="font-size: 14px; text-transform: uppercase; color: #2c5282; margin-bottom: 10px; border-left: 4px solid #2c5282; padding-left: 10px;">Surveyor's Final Statement</h3>
            <div style="background: #fff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 6px; font-size: 14px; color: #1a202c; min-height: 100px; line-height: 1.6; white-space: pre-wrap;">${statement}</div>
        </div>
        
        <!-- 3.5 Attached Documents -->
        <div style="margin-bottom: 40px;">
            <h3 style="font-size: 14px; text-transform: uppercase; color: #2c5282; margin-bottom: 10px; border-left: 4px solid #2c5282; padding-left: 10px;">Attached Evidence & Documents</h3>
            <div style="font-size: 12px; color: #4a5568;">
                ${survey?.evidence_proof_url ? `
                    <div style="margin-bottom: 8px;">
                        <strong>Inspection Evidence:</strong> 
                        <a href="${survey.evidence_proof_url}" style="color: #2c5282; text-decoration: none;">View Proof File</a>
                    </div>
                ` : ''}
                ${(survey?.signed_checklist_files && survey.signed_checklist_files.length > 0) ? `
                    <div style="margin-bottom: 8px;">
                        <strong>Signed Checklist Scans:</strong><br/>
                        ${survey.signed_checklist_files.map((file, idx) => `
                            <a href="${file}" style="color: #2c5282; text-decoration: none; margin-right: 15px;">[Scan ${idx + 1}]</a>
                        `).join('')}
                    </div>
                ` : ''}
                ${(!survey?.evidence_proof_url && (!survey?.signed_checklist_files || survey.signed_checklist_files.length === 0)) ? `
                    <div style="color: #a0aec0; font-style: italic;">No additional documents attached.</div>
                ` : ''}
            </div>
        </div>

        <!-- 4. Signatures -->
        ${signatureArea}

        <!-- Footer -->
        <div style="margin-top: 60px; border-top: 1px solid #edf2f7; padding-top: 20px; text-align: center; font-size: 10px; color: #a0aec0;">
            GR-CLASS Certification Services - Marine Inspection Division
            <br/>This document is a record of fact at the time of inspection and does not constitute a legal certificate.
            <br/>Report Generated: ${formatDate(new Date())}
        </div>
    </div>
    `;
};
