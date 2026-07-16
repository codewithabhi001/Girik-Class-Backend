import { grokProvider } from './grok.provider.js';
import { geminiProvider } from './gemini.provider.js';

// Factory pattern for switching between AI Providers
export const generateAIResponse = async (messages) => {
    const activeProvider = (process.env.ACTIVE_AI_PROVIDER || 'grok').toLowerCase();
    
    switch (activeProvider) {
        case 'gemini':
            return await geminiProvider(messages);
        case 'grok':
            return await grokProvider(messages);
        default:
            throw new Error(`Unsupported AI Provider: ${activeProvider}`);
    }
};
