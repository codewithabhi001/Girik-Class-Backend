import dotenv from 'dotenv';
dotenv.config();

import { geminiProvider } from './src/modules/ai/providers/gemini.provider.js';
import * as clientService from './src/modules/clients/client.service.js';

async function test() {
    try {
        console.log('Testing Gemini API integration full tool call...');
        
        // Let's ensure the email doesn't exist by making it unique
        const uniqueEmail = `test_${Date.now()}@oceanic.com`;

        const messages = [
            { role: 'user', content: `Register a new client. The company name is Oceanic Shipping, company code is OCN999, and the email is ${uniqueEmail}. The contact person is Rahul and his email is ${uniqueEmail}. The phone number is +919876543210 and the address is Mumbai, India. Country is India.` }
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
