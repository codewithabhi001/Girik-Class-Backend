
import * as providerService from './provider.service.js';

export const createProvider = async (req, res, next) => {
    try {
        const provider = await providerService.createProvider(req.body);
        res.status(201).json(provider);
    } catch (error) {
        next(error);
    }
};

export const getProviders = async (req, res, next) => {
    try {
        const result = await providerService.getProviders(req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

export const updateProviderStatus = async (req, res, next) => {
    try {
        const provider = await providerService.updateProviderStatus(req.params.id, req.body.status, req.user);
        res.json(provider);
    } catch (error) {
        next(error);
    }
};

export const evaluateProvider = async (req, res, next) => {
    try {
        const evaluation = await providerService.evaluateProvider(req.params.id, req.body, req.user);
        res.status(201).json(evaluation);
    } catch (error) {
        next(error);
    }
};

export const getEvaluations = async (req, res, next) => {
    try {
        const evaluations = await providerService.getEvaluations(req.params.id);
        res.json(evaluations);
    } catch (error) {
        next(error);
    }
};


