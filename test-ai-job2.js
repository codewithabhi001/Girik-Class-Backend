import dotenv from 'dotenv';
dotenv.config();

import { geminiProvider } from './src/modules/ai/providers/gemini.provider.js';

async function test() {
    try {
        console.log('Testing Gemini API with job creation (Bottom Inspection)...');
        // Clear history, just this one message
        const messages = [
            { role: 'user', content: "Create a new job for my client 'Global Shipping Logistics'. The target port is Mumbai Port and the target date is 2026-08-20. The reason is initial setup. We need to issue a 'Bottom Inspection' certificate for this job." }
        ];

        const response = await geminiProvider(messages);
        console.log('\n--- AI RESPONSE ---');
        console.log(response.message);
        console.log('-------------------\n');
    } catch (error) {
        console.error('TEST FAILED:', error);
    }
}

test();
