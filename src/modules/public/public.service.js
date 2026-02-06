import db from '../../models/index.js';

const Certificate = db.Certificate;
const Vessel = db.Vessel;

export const verifyCertificate = async (certificateNumber) => {
    const cert = await Certificate.findOne({
        where: { certificate_number: certificateNumber },
        include: [
            { model: Vessel, attributes: ['vessel_name', 'imo_number'] }
        ]
    });

    if (!cert) throw { statusCode: 404, message: 'Certificate not found' };

    // Limit public details
    return {
        certificate_number: cert.certificate_number,
        status: cert.status,
        issue_date: cert.issue_date,
        expiry_date: cert.expiry_date,
        vessel: cert.Vessel,
        // pdf_url? maybe only if valid
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
