import db from '../../models/index.js';
import * as fileAccessService from '../../services/fileAccess.service.js';

const Certificate = db.Certificate;
const Vessel = db.Vessel;

export const verifyCertificate = async (certificateNumber) => {
    const cert = await Certificate.findOne({
        where: { certificate_number: certificateNumber },
        include: [
            { model: Vessel, attributes: ['vessel_name', 'imo_number'] }
        ]
    });
    console.log(cert)
    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

    // Determine valid PDF URL (CDN for new, Signed for legacy)
    let pdfUrl = null;
    if (cert.pdf_file_url) {
        const key = fileAccessService.getKeyFromUrl(cert.pdf_file_url);
        // Try CDN match first
        pdfUrl = fileAccessService.generatePublicCdnUrl(key);
        // Fallback to signed URL if not in public/ folder (Legacy support)
        if (!pdfUrl) {
            pdfUrl = await fileAccessService.generateSignedUrl(key, 900); // 15 min access
        }
    }

    // Limit public details
    return {
        certificate_number: cert.certificate_number,
        status: cert.status,
        issue_date: cert.issue_date,
        expiry_date: cert.expiry_date,
        vessel: cert.Vessel,
        pdf_url: pdfUrl
    };
};

export const verifyVessel = async (imoNumber) => {
    const vessel = await Vessel.findOne({ where: { imo_number: imoNumber } });
    if (!vessel) throw { statusCode: 404, message: 'Vessel not found' };

    // Public details only
    return {
        vessel_name: vessel.vessel_name,
        imo_number: vessel.imo_number,
        call_sign: vessel.call_sign,
        flag: vessel.flag,
        classification_society: vessel.classification_society
    };
};
