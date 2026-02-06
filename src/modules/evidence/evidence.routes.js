import express from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate, schemas } from '../../middlewares/validate.middleware.js';
import * as docService from '../documents/document.service.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
router.use(authenticate);

// "Evidence" is basically a document linked to specific contexts.
// We can reuse document service but expose specific evidence endpoint.

router.post('/', upload.single('file'), validate(schemas.uploadEvidence), async (req, res, next) => {
    try {
        // Map evidence schema to document schema logic
        const { job_id, context, description } = req.body;
        // entity_type = 'JOB_EVIDENCE' or 'SURVEY_EVIDENCE'? 
        // Let's use 'JOB' as entity, and 'EVIDENCE' as document_type, and context in description or separate field?
        // Ideally we need more metadata columns in Document or a JSON column.
        // For now, I will append context to document_type: e.g. 'EVIDENCE_HULL_DAMAGE'

        const docData = {
            entity_type: 'JOB',
            entity_id: job_id,
            document_type: `EVIDENCE_${context.toUpperCase()}`,
            description: description
        };

        const result = await docService.uploadDocument(req.file, docData, req.user);
        res.status(201).json(result);
    } catch (e) { next(e); }
});

router.get('/:entity/:id', async (req, res, next) => {
    try {
        // Return only evidence types
        const docs = await docService.getDocuments(req.params.entity, req.params.id);
        const evidence = docs.filter(d => d.document_type.startsWith('EVIDENCE'));
        res.json(evidence);
    } catch (e) { next(e); }
});


import * as evidenceController from './evidence.controller.js';
import { hasRole } from '../../middlewares/rbac.middleware.js';

// ... uploads (existing)

router.get('/:id/chain', evidenceController.getChain);
router.post('/verify', hasRole('ADMIN', 'TM'), evidenceController.verifyEvidence);
router.put('/:id/lock', hasRole('ADMIN', 'TM'), evidenceController.lockEvidence);

export default router;

