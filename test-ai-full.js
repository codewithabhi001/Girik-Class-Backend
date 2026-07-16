import dotenv from 'dotenv';
dotenv.config();

import { geminiProvider } from './src/modules/ai/providers/gemini.provider.js';

async function test() {
    try {
        console.log('Testing Gemini API integration full tool call...');
        const messages = [
            { role: 'assistant', content: 'Hello! I am the GR Class Agentic AI.' },
            { role: 'user', content: 'Register a new client. The company name is Oceanic Shipping, company code is OCN123, and the email is admin@oceanic.com. The contact person is Rahul and his email is admin@oceanic.com. The phone number is +919876543210 and the address is Mumbai, India. Country is India.' }
        ];

        const response = await geminiProvider(messages);
        console.log('\n--- AI RESPONSE ---');
        console.log(response.message);
        console.log('-------------------\n');
        console.log('TEST SUCCESSFUL!');
    } catch (error) {
        console.error('TEST FAILED:', error);
    }
}

test();
