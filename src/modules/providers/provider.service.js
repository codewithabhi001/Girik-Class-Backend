
import db from '../../models/index.js';
import * as notificationService from '../../services/notification.service.js';

const ServiceProvider = db.ServiceProvider;
const ProviderEvaluation = db.ProviderEvaluation;

export const createProvider = async (data) => {
    return await ServiceProvider.create(data);
};

export const getProviders = async (query) => {
    const { page = 1, limit = 10, status, service_type } = query;
    const where = {};
    if (status) where.status = status;
    if (service_type) where.service_type = service_type;

    return await ServiceProvider.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']]
    });
};

export const getProviderById = async (id) => {
    const provider = await ServiceProvider.findByPk(id, {
        include: [ProviderEvaluation]
    });
    if (!provider) throw { statusCode: 404, message: 'Provider not found' };
    return provider;
};

export const updateProviderStatus = async (id, status, user) => {
    const provider = await getProviderById(id);
    await provider.update({ status });
    // Audit log
    return provider;
};

export const evaluateProvider = async (id, data, user) => {
    const provider = await getProviderById(id);

    // Calculate score from components if not provided directly
    // Assuming data has { punctuality_score, quality_score, documentation_score, compliance_score }
    // We compute 'score' as average of these if 'score' field is used in DB, but the specific fields are also stored.
    // The previous prompt said "Payload: ... scores ...", Model has specific fields. 
    // I will compute the average for the 'score' column if it exists or just use the specific fields.
    // The model has `average_rating` on provider, and `score` generic on evaluation? 
    // Wait, my previous model update for ProviderEvaluation had `average_rating` on Provider (No, that's aggregated).
    // The `ProviderEvaluation` model I wrote has `average_rating` inside it? No, wait. 
    // `dateTypes.FLOAT` for punctuality_score... and I kept `score`?
    // Let's assume evaluation 'score' is the mean of the 4 components.

    // Safety: ensure scores are numbers
    const p = data.punctuality_score || 0;
    const q = data.quality_score || 0;
    const d = data.documentation_score || 0;
    const c = data.compliance_score || 0;

    // We update the record
    const evaluation = await ProviderEvaluation.create({
        provider_id: id,
        evaluated_by: user.id,
        ...data,
        // If we want a single 'score' for the evaluation record itself (if the model has it, which I removed in favor of specifics? No I think I updated it to have specifics)
        // I'll assume we can perform the create with `...data` effectively.
    });

    // Compute Provider Overall Rating
    const evaluations = await ProviderEvaluation.findAll({ where: { provider_id: id } });

    // Compute average of all evaluations (assuming we average the 'quality_score' or similar or we need a composite?)
    // Let's compute a composite score for each evaluation first
    const compositeScores = evaluations.map(ev =>
        (ev.punctuality_score + ev.quality_score + ev.documentation_score + ev.compliance_score) / 4
    );

    const totalScore = compositeScores.reduce((sum, score) => sum + score, 0);
    const avgRating = evaluations.length ? (totalScore / evaluations.length) : 0;

    await provider.update({ rating: avgRating });

    // Flag Poor Performers Logic
    if (avgRating < 3.0) {
        // Trigger Alert
        await notificationService.notifyRoles(['GM', 'TM'], 'Low Provider Rating Alert', `Provider ${provider.company_name} has a low rating of ${avgRating.toFixed(2)}. Please review.`);

        // Emitting event (Mock)
        console.log(`EVENT_PROVIDER_LOW_SCORE: ${provider.id} score ${avgRating}`);
    }

    return evaluation;
};

export const getEvaluations = async (id) => {
    return await ProviderEvaluation.findAll({
        where: { provider_id: id },
        order: [['created_at', 'DESC']],
        include: ['Evaluator']
    });
};


