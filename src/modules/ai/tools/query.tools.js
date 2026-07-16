import * as clientService from '../../clients/client.service.js';
import * as vesselService from '../../vessels/vessel.service.js';
import * as certService from '../../certificates/certificate.service.js';
import * as flagService from '../../flags/flag.service.js';

export const searchClientsTool = {
    name: 'searchClients',
    description: 'Searches for clients in the database by name or company code. Use this to find the client_id required for creating jobs or other actions.',
    parameters: {
        type: 'object',
        properties: {
            search_term: {
                type: 'string',
                description: 'The name or company code of the client to search for.'
            }
        },
        required: ['search_term']
    },
    execute: async (args) => {
        try {
            const { count, rows } = await clientService.getClients({ search: args.search_term, limit: 10 });
            return {
                success: true,
                count,
                clients: rows.map(r => ({
                    id: r.id,
                    company_name: r.company_name,
                    company_code: r.company_code,
                    email: r.email
                }))
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

export const searchVesselsTool = {
    name: 'searchVessels',
    description: 'Searches for vessels in the database by name or IMO number. Optionally filter by client_id. Use this to find the vessel_id required for creating jobs.',
    parameters: {
        type: 'object',
        properties: {
            search_term: {
                type: 'string',
                description: 'The name or IMO number of the vessel to search for.'
            },
            client_id: {
                type: 'string',
                description: 'Optional. The ID of the client who owns the vessel.'
            }
        },
        required: ['search_term']
    },
    execute: async (args) => {
        try {
            const query = { search: args.search_term, limit: 10 };
            if (args.client_id) query.client_id = args.client_id;
            
            const { count, rows } = await vesselService.getVessels(query);
            return {
                success: true,
                count,
                vessels: rows.map(r => ({
                    id: r.id,
                    vessel_name: r.vessel_name,
                    imo_number: r.imo_number,
                    client_id: r.client_id,
                    client_name: r.Client ? r.Client.company_name : null
                }))
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

export const searchCertificateTypesTool = {
    name: 'searchCertificateTypes',
    description: 'Searches for available certificate types/templates in the database. Use this to find the certificate_type_id required when creating a job.',
    parameters: {
        type: 'object',
        properties: {
            search_term: {
                type: 'string',
                description: 'The name of the certificate type to search for (e.g., Hull Inspection).'
            }
        },
        required: ['search_term']
    },
    execute: async (args) => {
        try {
            const types = await certService.getCertificateTypes({ search: args.search_term });
            // The service returns a raw array, limit to 10
            return {
                success: true,
                count: types.length,
                certificate_types: types.slice(0, 10).map(t => ({
                    id: t.id,
                    type_name: t.type_name,
                    description: t.description
                }))
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

export const searchFlagsTool = {
    name: 'searchFlags',
    description: 'Searches for flag administrations in the database. Use this to find the flag_administration_id required when creating a vessel.',
    parameters: {
        type: 'object',
        properties: {
            search_term: {
                type: 'string',
                description: 'The name or country of the flag administration to search for (e.g., Panama).'
            }
        },
        required: ['search_term']
    },
    execute: async (args) => {
        try {
            const flags = await flagService.getFlags(args.search_term);
            return {
                success: true,
                count: flags.length,
                flags: flags.slice(0, 10).map(f => ({
                    id: f.id,
                    flag_state_name: f.flag_state_name,
                    country: f.country
                }))
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};
