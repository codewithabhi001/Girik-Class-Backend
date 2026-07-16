import * as clientService from '../../clients/client.service.js';
import * as emailService from '../../../services/email.service.js';
import crypto from 'crypto';

export const createClientTool = {
    name: 'createClient',
    description: 'Registers a new corporate client in the system. Use this when the user asks to onboard, add, or create a new client or company. It returns the details of the created client.',
    parameters: {
        type: 'object',
        properties: {
            company_name: {
                type: 'string',
                description: 'The name of the company or client.'
            },
            company_code: {
                type: 'string',
                description: 'A short unique code for the company (e.g. OCEANIC).'
            },
            email: {
                type: 'string',
                description: 'The primary corporate email address of the client.'
            },
            address: {
                type: 'string',
                description: 'The physical address of the company. Make up a reasonable default if not provided.'
            },
            country: {
                type: 'string',
                description: 'The country of the company. Default to India if not specified.'
            },
            phone: {
                type: 'string',
                description: 'The contact phone number. Must be a valid phone format, e.g. +919876543210. Make up a reasonable valid phone if not provided.'
            },
            contact_person_name: {
                type: 'string',
                description: 'The name of the primary contact person. Default to "Admin" if not provided.'
            },
            contact_person_email: {
                type: 'string',
                description: 'The email of the primary contact person. Usually same as primary email.'
            }
        },
        required: [
            'company_name',
            'company_code',
            'email',
            'address',
            'country',
            'phone',
            'contact_person_name',
            'contact_person_email'
        ]
    },
    execute: async (args) => {
        try {
            // Generate a secure random password
            const generatedPassword = crypto.randomBytes(6).toString('hex') + 'A1!';
            
            // Because our DB creates a user automatically, we construct the payload
            const payload = {
                ...args,
                status: 'ACTIVE',
                user: {
                    name: args.contact_person_name,
                    email: args.contact_person_email,
                    password: generatedPassword, 
                    role: 'CLIENT',
                    phone: args.phone
                }
            };
            const result = await clientService.createClient(payload);
            
            // Send welcome email with credentials
            const emailHtml = `
                <h2>Welcome to GR Class!</h2>
                <p>Hello ${args.contact_person_name},</p>
                <p>Your client portal has been successfully created for <b>${args.company_name}</b>.</p>
                <p>You can log in using the following credentials:</p>
                <ul>
                    <li><b>Email:</b> ${args.contact_person_email}</li>
                    <li><b>Password:</b> ${generatedPassword}</li>
                </ul>
                <p>Please change your password after logging in.</p>
                <br/>
                <p>Best Regards,<br/>GR Class System</p>
            `;
            
            emailService.sendEmail(args.contact_person_email, 'Welcome to GR Class - Login Credentials', emailHtml, 'system')
                .catch(e => console.error('[AI Tool Email Error]', e));

            return {
                success: true,
                message: `Client ${args.company_name} successfully registered and login credentials emailed to ${args.contact_person_email}.`,
                client_id: result.client.id,
                user_id: result.user.id
            };
        } catch (error) {
            console.error('[AI Tool Error] createClient:', error);
            return {
                success: false,
                error: error.message || 'Failed to create client due to validation or database error.'
            };
        }
    }
};
