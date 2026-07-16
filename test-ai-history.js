import dotenv from 'dotenv';
dotenv.config();

import { geminiProvider } from './src/modules/ai/providers/gemini.provider.js';

async function test() {
    try {
        console.log('Testing Gemini API with history...');
        const uniqueEmail = `test_history_${Date.now()}@oceanic.com`;

        const messages = [
            { role: 'assistant', content: 'Hello! I am the GR Class Agentic AI. How can I assist you today?' },
            { role: 'user', content: 'Can you search the database and tell me if we have any client registered with the name \'Global Shipping Logistics\'?' },
            { role: 'assistant', content: 'I couldn\'t find a client named \'Global Shipping Logistics\'. Please check the name and try again, or let me know if you\'d like to create a new client.' },
            { role: 'user', content: `Yes, please create a new client. The company name is Global Shipping Logistics, company code is GSL808, and the email is ${uniqueEmail}. The contact person is Rahul Sharma and his email is ${uniqueEmail}. The phone number is +919876543210 and the address is Mumbai, India.` }
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
