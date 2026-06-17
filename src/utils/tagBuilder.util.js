
import db from '../models/index.js';

export const buildTagValuesForJob = async (jobId) => {
    const job = await db.JobRequest.findByPk(jobId, {
        include: [
            { 
                model: db.Vessel, 
                include: [
                    { model: db.Client, as: 'Client' }, 
                    { model: db.FlagAdministration, as: 'FlagAdministration' }
                ] 
            },
            { model: db.User, as: 'surveyor' },
        ]
    });

    if (!job) return {};

    const vessel = job.Vessel;
    const client = vessel?.Client;
    const surveyor = job.surveyor;

    const jobCerts = await db.JobCertificate.findAll({
        where: { job_request_id: jobId },
        include: [{ model: db.CertificateType }]
    });
    const certType = jobCerts[0]?.CertificateType;

    const formatDate = (v) => {
        if (!v) return '';
        try {
            const d = (v instanceof Date) ? v : new Date(v);
            if (Number.isNaN(d.getTime())) return String(v);
            return d.toISOString().slice(0, 10);
        } catch {
            return String(v);
        }
    };

    // 1. Base tags (Vessel, Job, Client)
    const tags = {
        vessel_name: vessel?.vessel_name || '',
        imo_number: vessel?.imo_number || '',
        call_sign: vessel?.call_sign || '',
        mmsi_number: vessel?.mmsi_number || '',
        port_of_registry: vessel?.port_of_registry || '',
        year_built: vessel?.year_built ?? '',
        ship_type: vessel?.ship_type || '',
        gross_tonnage: vessel?.gross_tonnage ?? '',
        net_tonnage: vessel?.net_tonnage ?? '',
        deadweight: vessel?.deadweight ?? '',
        flag_state: vessel?.FlagAdministration?.name || '',

        owner_operators: client?.company_name || client?.name || '',
        company_name: client?.company_name || client?.name || '',
        company_address: client?.address || '',
        company_id_number: client?.company_id_number || client?.company_code || '',

        survey_commenced_date: formatDate(job.target_date || job.createdAt),
        survey_completed_date: formatDate(job.updatedAt), // Rough estimate if not finalized
        place_of_survey: job.target_port || '',
        job_id: job.id || '',
        certificate_type: certType?.name || '',
        certificate_number: '', // Will be filled by certificate service if available

        surveyor_name: surveyor?.name || '',
    };

    // 2. Checklist tags (Activity Planning)
    const checklistItems = await db.ActivityPlanning.findAll({
        where: jobCerts.length > 0
            ? { [db.Sequelize.Op.or]: [{ job_id: jobId }, { job_certificate_id: jobCerts.map(jc => jc.id) }] }
            : { job_id: jobId }
    });

    checklistItems.forEach(item => {
        if (item.question_code) {
            tags[item.question_code] = item.answer === 'NA' ? 'N/A' : item.answer;
            tags[`${item.question_code}_REMARKS`] = item.remarks || '';
        }
    });

    // 3. Survey tags
    const survey = jobCerts.length > 0
        ? await db.Survey.findOne({ where: { job_certificate_id: jobCerts.map(jc => jc.id) } })
        : null;
    if (survey) {
        tags.survey_statement = survey.survey_statement || '';
        tags.submitted_at = formatDate(survey.submitted_at);
        tags.finalized_at = formatDate(survey.finalized_at);
    }

    return tags;
};
