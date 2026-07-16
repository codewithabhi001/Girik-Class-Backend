import * as vesselService from '../../vessels/vessel.service.js';

export const createVesselTool = {
    name: 'createVessel',
    description: 'Registers a new vessel in the system for a specific client. Use this when the user asks to add or register a vessel.',
    parameters: {
        type: 'object',
        properties: {
            client_id: {
                type: 'string',
                description: 'The UUID of the client who owns the vessel.'
            },
            vessel_name: {
                type: 'string',
                description: 'The name of the vessel.'
            },
            imo_number: {
                type: 'string',
                description: 'The 7-digit IMO number of the vessel.'
            },
            mmsi_number: {
                type: 'string',
                description: 'The 9-digit MMSI number of the vessel.'
            },
            ship_type: {
                type: 'string',
                description: 'The type of ship (e.g., Bulk Carrier, Tanker, Container Ship).'
            },
            flag_administration_id: {
                type: 'string',
                description: 'The UUID of the flag administration (use searchFlags to find this).'
            },
            port_of_registry: {
                type: 'string',
                description: 'The port where the vessel is registered.'
            },
            gross_tonnage: {
                type: 'number',
                description: 'The gross tonnage of the vessel.'
            }
        },
        required: [
            'client_id',
            'vessel_name',
            'imo_number',
            'mmsi_number',
            'ship_type',
            'flag_administration_id',
            'port_of_registry'
        ]
    },
    execute: async (args) => {
        try {
            const payload = {
                client_id: args.client_id,
                vessel_name: args.vessel_name,
                imo_number: args.imo_number,
                mmsi_number: args.mmsi_number,
                ship_type: args.ship_type,
                flag_administration_id: args.flag_administration_id,
                port_of_registry: args.port_of_registry,
                gross_tonnage: args.gross_tonnage,
            };
            
            // system user id for creation log
            const systemUserId = '00000000-0000-0000-0000-000000000000';
            
            const result = await vesselService.createVessel(payload, systemUserId);
            
            return {
                success: true,
                message: `Vessel ${args.vessel_name} (IMO: ${args.imo_number}) successfully registered.`,
                vessel_id: result.id
            };
        } catch (error) {
            console.error('[AI Tool Error] createVessel:', error);
            return {
                success: false,
                error: error.message || 'Failed to register vessel.'
            };
        }
    }
};
