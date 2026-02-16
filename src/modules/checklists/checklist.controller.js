import * as checklistService from './checklist.service.js';

export const getChecklist = async (req, res, next) => {
    try {
        const list = await checklistService.getChecklist(req.params.jobId, req.query);
        res.json({ success: true, data: list });
    } catch (error) { next(error); }
};

export const submitChecklist = async (req, res, next) => {
    try {
        const list = await checklistService.submitChecklist(req.params.jobId, req.body.items, req.user.id);
        res.json({ success: true, data: list });
    } catch (error) { next(error); }
};
