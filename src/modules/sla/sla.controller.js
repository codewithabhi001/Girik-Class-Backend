
import * as slaService from './sla.service.js';

export const createRule = async (req, res, next) => {
    try {
        const rule = await slaService.createSlaRule(req.body);
        res.status(201).json(rule);
    } catch (e) { next(e); }
};

export const getRules = async (req, res, next) => {
    try {
        const rules = await slaService.getRules();
        res.json({ rules });
    } catch (e) { next(e); }
};

export const overrideSla = async (req, res, next) => {
    try {
        const { new_deadline, reason } = req.body;
        const result = await slaService.overrideSla(req.params.id, new_deadline, reason, req.user.id);
        res.json(result);
    } catch (e) { next(e); }
};

export const pauseSla = async (req, res, next) => {
    try {
        const result = await slaService.pauseSla(req.params.id, req.body.reason, req.user.id);
        res.json(result);
    } catch (e) { next(e); }
};


export const resumeSla = async (req, res, next) => {
    try {
        const result = await slaService.resumeSla(req.params.id, req.user.id);
        res.json(result);
    } catch (e) { next(e); }
};

export const evaluateSla = async (req, res, next) => {
    try {
        const breaches = await slaService.checkBreaches();
        res.json({ message: 'SLA Evaluation Triggered', breaches_detected: breaches.length });
    } catch (e) { next(e); }
};

export const getBreaches = async (req, res, next) => {
    try {
        const breaches = await slaService.getBreaches();
        res.json({ breaches });
    } catch (e) { next(e); }
};

