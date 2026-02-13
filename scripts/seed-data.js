
import db from '../src/models/index.js';
import logger from '../src/utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const seedData = async () => {
    try {
        await db.sequelize.authenticate();
        logger.info('Database connected...');

        // 1. Create Certificate Types
        logger.info('Seeding Certificate Types...');
        const certTypesData = [
            {
                name: 'Cargo Ship Safety Construction Certificate',
                issuing_authority: 'CLASS',
                validity_years: 5,
                status: 'ACTIVE',
                description: 'Required for all cargo ships of 500 gross tonnage and above.'
            },
            {
                name: 'Cargo Ship Safety Equipment Certificate',
                issuing_authority: 'CLASS',
                validity_years: 5, // Usually 2 + 1 or 5 with annual surveys
                status: 'ACTIVE',
                description: 'Covering fire safety systems, life-saving appliances, etc.'
            },
            {
                name: 'International Load Line Certificate',
                issuing_authority: 'CLASS',
                validity_years: 5,
                status: 'ACTIVE',
                description: 'certifying that the ship has been surveyed and marked with load lines.'
            },
            {
                name: 'International Oil Pollution Prevention Certificate (IOPP)',
                issuing_authority: 'FLAG',
                validity_years: 5,
                status: 'ACTIVE',
                description: 'Required for oil tankers > 150 GT and other ships > 400 GT.'
            }
        ];

        const createdCertTypes = [];
        for (const data of certTypesData) {
            const [certType] = await db.CertificateType.findOrCreate({
                where: { name: data.name },
                defaults: data
            });
            createdCertTypes.push(certType);
        }
        logger.info(`Seeded ${createdCertTypes.length} Certificate Types.`);

        // 2. Create Clients
        logger.info('Seeding Clients...');
        const clientsData = [
            {
                company_name: 'Maersk Line',
                company_code: 'MAERSK',
                address: 'Esplanaden 50, 1098 Copenhagen, Denmark',
                country: 'Denmark',
                email: 'info@maersk.com',
                phone: '+45 3363 3363',
                contact_person_name: 'Soren Skou',
                contact_person_email: 'soren.skou@maersk.com',
                status: 'ACTIVE'
            },
            {
                company_name: 'Mediterranean Shipping Company (MSC)',
                company_code: 'MSC',
                address: 'Chemin Rieu 12-14, 1208 Geneva, Switzerland',
                country: 'Switzerland',
                email: 'info@msc.com',
                phone: '+41 22703 8888',
                contact_person_name: 'Diego Aponte',
                contact_person_email: 'diego.aponte@msc.com',
                status: 'ACTIVE'
            }
        ];

        const createdClients = [];
        for (const data of clientsData) {
            const [client] = await db.Client.findOrCreate({
                where: { company_code: data.company_code },
                defaults: data
            });
            createdClients.push(client);
        }
        logger.info(`Seeded ${createdClients.length} Clients.`);

        // 3. Create Vessels
        logger.info('Seeding Vessels...');
        const vesselsData = [
            // Maersk Vessels
            {
                client_id: createdClients[0].id,
                vessel_name: 'Maersk Mc-Kinney Moller',
                imo_number: '9619907',
                call_sign: 'OWJA2',
                mmsi_number: '219018501',
                flag_state: 'Denmark',
                port_of_registry: 'Copenhagen',
                year_built: 2013,
                ship_type: 'Container Ship',
                gross_tonnage: 194849,
                net_tonnage: 194849,
                deadweight: 194153,
                class_status: 'ACTIVE',
                current_class_society: 'ABS',
                engine_type: 'MAN B&W 8S80ME-C9.2',
                builder_name: 'Daewoo Shipbuilding & Marine Engineering'
            },
            {
                client_id: createdClients[0].id,
                vessel_name: 'Madrid Maersk',
                imo_number: '9778791',
                call_sign: 'OWJE2',
                mmsi_number: '219836000',
                flag_state: 'Denmark',
                port_of_registry: 'Copenhagen',
                year_built: 2017,
                ship_type: 'Container Ship',
                gross_tonnage: 214286,
                net_tonnage: 214286,
                deadweight: 205672,
                class_status: 'ACTIVE',
                current_class_society: 'DNV',
                engine_type: 'MAN B&W 11G95ME-C9.5',
                builder_name: 'Daewoo Shipbuilding & Marine Engineering'
            },
            // MSC Vessels
            {
                client_id: createdClients[1].id,
                vessel_name: 'MSC Oscar',
                imo_number: '9703291',
                call_sign: '3FDA',
                mmsi_number: '354628000',
                flag_state: 'Panama',
                port_of_registry: 'Panama City',
                year_built: 2015,
                ship_type: 'Container Ship',
                gross_tonnage: 192237,
                net_tonnage: 192237,
                deadweight: 197362,
                class_status: 'ACTIVE',
                current_class_society: 'DNV',
                engine_type: 'MAN B&W 11S90ME-C10.2',
                builder_name: 'Daewoo Shipbuilding & Marine Engineering'
            }
        ];

        for (const data of vesselsData) {
            await db.Vessel.findOrCreate({
                where: { imo_number: data.imo_number },
                defaults: data
            });
        }
        logger.info(`Seeded ${vesselsData.length} Vessels.`);

        // 4. Create Checklist Templates
        logger.info('Seeding Checklist Templates...');

        // Find Certificate Types for linking
        const safetyConstCert = createdCertTypes.find(c => c.name.includes('Safety Construction'));
        const loadLineCert = createdCertTypes.find(c => c.name.includes('Load Line'));

        const templatesData = [
            {
                name: 'Safety Construction Annual Survey Checklist',
                code: 'SAF-CON-ANN-001',
                description: 'Checklist for the annual survey of Cargo Ship Safety Construction.',
                certificate_type_id: safetyConstCert ? safetyConstCert.id : null,
                status: 'ACTIVE',
                sections: [
                    {
                        title: 'Hull Inspection',
                        items: [
                            { code: 'H1.1', text: 'Condition of hull plating', type: 'YES_NO_NA' },
                            { code: 'H1.2', text: 'Condition of decks and superstructures', type: 'YES_NO_NA' },
                            { code: 'H1.3', text: 'Verification of watertight doors condition', type: 'YES_NO_NA' }
                        ]
                    },
                    {
                        title: 'Machinery Spaces',
                        items: [
                            { code: 'M1.1', text: 'General cleanliness of machinery spaces', type: 'YES_NO_NA' },
                            { code: 'M1.2', text: 'Bilge pumping arrangements operational', type: 'YES_NO_NA' },
                            { code: 'M1.3', text: 'Emergency generator quick start test', type: 'YES_NO_NA' }
                        ]
                    }
                ],
                metadata: { version: '1.0', applicable_vessel_types: ['Cargo', 'Tanker'] }
            },
            {
                name: 'Load Line Annual Inspection Checklist',
                code: 'LL-ANN-001',
                description: 'Annual inspection checklist for International Load Line Certificate.',
                certificate_type_id: loadLineCert ? loadLineCert.id : null,
                status: 'ACTIVE',
                sections: [
                    {
                        title: 'Freeboard Marks',
                        items: [
                            { code: 'LL1.1', text: 'Load line marks clearly visible and painted', type: 'YES_NO_NA' },
                            { code: 'LL1.2', text: 'Deck line marked correctly', type: 'YES_NO_NA' }
                        ]
                    },
                    {
                        title: 'Weathertight Closing Appliances',
                        items: [
                            { code: 'LL2.1', text: 'Cargo hatch covers in good condition', type: 'YES_NO_NA' },
                            { code: 'LL2.2', text: 'Ventilators and air pipes weathertight', type: 'YES_NO_NA' },
                            { code: 'LL2.3', text: 'Doors to superstructures weathertight', type: 'YES_NO_NA' }
                        ]
                    }
                ],
                metadata: { version: '2.0', applicable_vessel_types: ['All'] }
            }
        ];

        for (const data of templatesData) {
            const [template] = await db.ChecklistTemplate.findOrCreate({
                where: { code: data.code },
                defaults: data
            });
        }
        logger.info(`Seeded ${templatesData.length} Checklist Templates.`);

        // 5. Create Certificate Templates
        logger.info('Seeding Certificate Templates...');
        const certTemplatesData = [
            {
                template_name: 'Safety Construction Certificate',
                certificate_type_id: safetyConstCert?.id || createdCertTypes[0]?.id,
                template_content: '<h1>CARGO SHIP SAFETY CONSTRUCTION CERTIFICATE</h1><p>This is to certify that the vessel <strong>{{vessel_name}}</strong> (IMO {{imo_number}}) has been surveyed and complies with SOLAS requirements.</p><p>Issued: {{issue_date}} | Valid until: {{expiry_date}}</p>',
                variables: ['vessel_name', 'imo_number', 'issue_date', 'expiry_date'],
                is_active: true
            },
            {
                template_name: 'Load Line Certificate',
                certificate_type_id: loadLineCert?.id || createdCertTypes[2]?.id,
                template_content: '<h1>INTERNATIONAL LOAD LINE CERTIFICATE</h1><p>Certificate for vessel <strong>{{vessel_name}}</strong> (IMO {{imo_number}})</p><p>Load line marks have been verified as per 1966 Convention.</p><p>Valid until: {{expiry_date}}</p>',
                variables: ['vessel_name', 'imo_number', 'expiry_date'],
                is_active: true
            },
            {
                template_name: 'Safety Equipment Certificate',
                certificate_type_id: createdCertTypes.find(c => c.name?.includes('Safety Equipment'))?.id || createdCertTypes[1]?.id,
                template_content: '<h1>CARGO SHIP SAFETY EQUIPMENT CERTIFICATE</h1><p>Vessel: {{vessel_name}} (IMO {{imo_number}})</p><p>Fire safety systems and life-saving appliances verified.</p><p>Issue date: {{issue_date}}</p>',
                variables: ['vessel_name', 'imo_number', 'issue_date'],
                is_active: true
            }
        ];

        for (const data of certTemplatesData) {
            if (data.certificate_type_id) {
                const [certTemplate] = await db.CertificateTemplate.findOrCreate({
                    where: {
                        template_name: data.template_name,
                        certificate_type_id: data.certificate_type_id
                    },
                    defaults: data
                });
            }
        }
        logger.info(`Seeded ${certTemplatesData.length} Certificate Templates.`);

        logger.info('Seeding completed successfully.');
        process.exit(0);

    } catch (error) {
        logger.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
