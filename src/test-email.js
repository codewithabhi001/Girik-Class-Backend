import dotenv from 'dotenv';
dotenv.config();

import { sendTemplateEmail } from './services/email.service.js';

async function testEmail() {
    const emails = ['ddeepakraj901@gmail.com', 'abhisheksingh9709844475@gmail.com'];
    for (const targetEmail of emails) {
        console.log(`Sending test email to ${targetEmail}...`);
        try {
            const result = await sendTemplateEmail(
                targetEmail,
                'WELCOME_USER',
                { 
                    userName: 'User', 
                    loginUrl: 'https://grclass.com/login',
                    dashboardUrl: 'https://grclass.com/dashboard',
                    email: targetEmail
                }
            );
            console.log(`Email sent to ${targetEmail} result:`, result);
        } catch (err) {
            console.error(`Failed to send email to ${targetEmail}:`, err);
        }
    }
    process.exit(0);
}

testEmail();
