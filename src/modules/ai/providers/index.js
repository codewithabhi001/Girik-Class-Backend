import { grokProvider } from './grok.provider.js';
import { geminiProvider } from './gemini.provider.js';
import { groqProvider } from './groq.provider.js';

// Factory pattern for switching between AI Providers
export const generateAIResponse = async (messages, options = {}) => {
    const activeProvider = (process.env.ACTIVE_AI_PROVIDER || 'grok').toLowerCase();
    
    switch (activeProvider) {
        case 'gemini':
            return await geminiProvider(messages, options);
        case 'grok':
            return await grokProvider(messages, options);
        case 'groq':
            return await groqProvider(messages, options);
        default:
            throw new Error(`Unsupported AI Provider: ${activeProvider}`);
    }
};
