import express from 'express';
// Stub Mobile sync routes
const router = express.Router();

router.post('/sync', (req, res) => {
    // Process offline actions
    res.json({ status: 'SYNCED', received: req.body.offline_data?.length || 0 });
});

router.get('/offline/jobs', (req, res) => {
    // Return jobs assigned to this user that are active
    res.json({ jobs: [] });
});

router.post('/offline/surveys', (req, res) => {
    // Accept bulk survey data
    res.json({ message: 'Surveys queued' });
});

export default router;
