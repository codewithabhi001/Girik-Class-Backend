import * as jobService from '../../jobs/job.service.js';

export const createJobTool = {
    name: 'createJob',
    description: 'Creates a new job in the system for a specific client or vessel. The AI must first use searchClients, searchVessels, and searchCertificateTypes to get the correct UUIDs before calling this tool.',
    parameters: {
        type: 'object',
        properties: {
            client_id: {
                type: 'string',
                description: 'The UUID of the client. Obtain this using searchClients if not already known.'
            },
            vessel_id: {
                type: 'string',
                description: 'The UUID of the vessel. Obtain this using searchVessels if not already known.'
            },
            target_port: {
                type: 'string',
                description: 'The port where the job/survey will take place.'
            },
            target_date: {
                type: 'string',
                description: 'The target date for the job in ISO format (e.g. 2026-08-01).'
            },
            reason: {
                type: 'string',
                description: 'The reason or description for the job.'
            },
            priority: {
                type: 'string',
                enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
                description: 'The priority of the job. Default is NORMAL.'
            },
            certificates: {
                type: 'array',
                description: 'A list of certificates to be issued in this job.',
                items: {
                    type: 'object',
                    properties: {
                        certificate_type_id: {
                            type: 'string',
                            description: 'The UUID of the certificate type. Obtain using searchCertificateTypes.'
                        }
                    },
                    required: ['certificate_type_id']
                }
            }
        },
        required: ['client_id', 'target_port', 'target_date', 'reason', 'certificates']
    },
    execute: async (args) => {
        try {
            // Re-format payload to match the backend controller's expectation
            const payload = {
                client_id: args.client_id,
                vessel_id: args.vessel_id,
                target_port: args.target_port,
                target_date: args.target_date,
                reason: args.reason,
                priority: args.priority || 'NORMAL',
                certificates: args.certificates.map(cert => ({
                    certificate_type_id: cert.certificate_type_id,
                    certificate_term: 'FULL_TERM', // Default
                    uploaded_documents: []
                })),
                uploaded_documents: []
            };

            // Assuming AI executes as an ADMIN user (role used for backend logic)
            const adminUserId = '00000000-0000-0000-0000-000000000000'; // Or we can pass user ID if context provides it.
            const options = { skipMandatoryDocumentCheck: true };

            const job = await jobService.createJob(payload, adminUserId, options);
            
            return {
                success: true,
                message: `Job created successfully with Job Number ${job.job_number}.`,
                job_id: job.id,
                job_number: job.job_number
            };
        } catch (error) {
            console.error('[AI Tool Error] createJob:', error);
            return {
                success: false,
                error: error.message || 'Failed to create job.'
            };
        }
    }
};
