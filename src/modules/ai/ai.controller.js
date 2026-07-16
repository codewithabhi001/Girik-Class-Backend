import { generateAIResponse } from './providers/index.js';

export const chatWithAI = async (req, res, next) => {
    try {
        const { messages, api_key } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ success: false, message: 'Messages array is required.' });
        }

        const aiResponse = await generateAIResponse(messages, { api_key });
        
        return res.status(200).json({
            success: true,
            data: aiResponse
        });
    } catch (error) {
        console.error('[AI Chat Error]:', error);
        next(error);
    }
};
