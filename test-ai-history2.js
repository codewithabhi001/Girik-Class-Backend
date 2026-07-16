import dotenv from 'dotenv';
dotenv.config();

import { geminiProvider } from './src/modules/ai/providers/gemini.provider.js';

async function test() {
    try {
        console.log('Testing Gemini API with full chat history...');
        const messages = [
            { role: 'user', content: 'ho create a job for that' },
            { role: 'assistant', content: "Please specify which client 'Global Shipping Logistics' you would like to use for the job:\n\n1. Client with email `codewithabhi01@gmail.com` (ID: `019f6afd-c0ba-72a9-ba01-14225ed81272`)\n2. Client with email `test_history_1784206717627@oceanic.com` (ID: `019f6b02-261c-72cb-a542-42d5608ce220`)" },
            { role: 'user', content: '1' },
            { role: 'assistant', content: "I could not find a certificate type matching 'Hull'. Please provide the correct certificate type, or choose from the available ones." },
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
