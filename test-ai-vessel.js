import 'dotenv/config';
import { geminiProvider } from './src/modules/ai/providers/gemini.provider.js';

async function run() {
    try {
        const messages = [
            { role: 'user', content: 'Create a new client Oceanic Shipping' },
            { role: 'assistant', content: 'I have created the client Oceanic Shipping. Would you like to register a vessel for them?' },
            { role: 'user', content: 'Yes, please register a vessel for them. The vessel name is Oceanic Star, ship type is Bulk Carrier, and the flag is Panama.' }
        ];
        
        const response = await geminiProvider(messages);
        console.log("SUCCESS:", response);
    } catch (e) {
        console.error("CRASH:", e);
    }
}

run();
