const formatDate = (d) => (d instanceof Date ? d.toISOString().split('T')[0] : String(d ?? ''));

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const buildFallbackCertificateHtml = ({ variables, issuingAuthority, qrDataUrl }) => {
    const vesselName = escapeHtml(variables?.vessel_name);
    const imoNumber = escapeHtml(variables?.imo_number);
    const certificateNumber = escapeHtml(variables?.certificate_number);
    const certificateType = escapeHtml(variables?.certificate_type || 'Certificate');
    const authority = escapeHtml(issuingAuthority);
    const issueDate = escapeHtml(formatDate(variables?.issue_date));
    const expiryDate = escapeHtml(formatDate(variables?.expiry_date));

    const qrHtml = qrDataUrl
        ? `<div style="width:160px;height:160px;border-radius:8px;overflow:hidden;margin-bottom:12px;"><img src="${qrDataUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" alt="QR"/></div>`
        : `<div style="width:160px;height:160px;border:2px dashed #cbd5e1;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#64748b;margin-bottom:12px;">QR</div>`;

    return `
      <div style="max-width:900px;margin:16px auto;padding:28px;border-radius:8px;border:1px solid #e0e0e0;font-family: 'Helvetica Neue', Arial, sans-serif;color:#1f2937;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:16px;">
            <div style="width:72px;height:72px;background:linear-gradient(135deg,#0b5394,#2a9df4);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:18px;">
              GIR
            </div>
            <div>
              <div style="font-size:18px;font-weight:700;">${certificateType}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:4px;">${authority}</div>
            </div>
          </div>
          <div style="text-align:right;font-size:12px;color:#6b7280;">
            <div>Certificate No</div>
            <div style="font-weight:700;margin-top:6px;">${certificateNumber}</div>
          </div>
        </div>

        <hr style="border:none;border-top:1px solid #e6edf3;margin:20px 0;">

        <div style="display:flex;gap:24px;">
          <div style="flex:1;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;color:#111827;">
              <tr>
                <td style="padding:8px 0;font-weight:600;width:160px;">Vessel</td>
                <td style="padding:8px 0;">${vesselName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:600;">IMO Number</td>
                <td style="padding:8px 0;">${imoNumber}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:600;">Issue Date</td>
                <td style="padding:8px 0;">${issueDate}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-weight:600;">Expiry Date</td>
                <td style="padding:8px 0;">${expiryDate}</td>
              </tr>
            </table>
          </div>
          <div style="width:240px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
            ${qrHtml}
            <div style="font-size:12px;color:#6b7280;text-align:center;">Scan to verify</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:28px;">
          <div style="max-width:60%;">
            <div style="font-size:12px;color:#6b7280;">Issued by</div>
            <div style="font-weight:700;margin-top:6px;">GIRIK Certification Services</div>
            <div style="font-size:12px;color:#6b7280;margin-top:8px;">${authority}</div>
          </div>
          <div style="text-align:center;">
            <div style="height:48px;border-bottom:2px solid #111827;width:220px;margin-bottom:6px;"></div>
            <div style="font-size:12px;color:#6b7280;">Authorized Signatory</div>
          </div>
        </div>

        <div style="margin-top:20px;font-size:11px;color:#9ca3af;text-align:center;">
          This certificate is issued electronically and is valid without a signature.
        </div>
      </div>`;
};
