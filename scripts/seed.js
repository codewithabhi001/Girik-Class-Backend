import db from '../src/models/index.js';
import bcrypt from 'bcrypt';

const seed = async () => {
    try {
        console.log('Seeding dummy data...');
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash('Password@123', salt);

        // 1. Create a Client
        const createClientIfMissing = async (clientData) => {
            const existing = await db.Client.findOne({ where: { company_code: clientData.company_code } });
            if (existing) return existing;
            const created = await db.Client.create(clientData);
            console.log(`Client created: ${clientData.company_code}`);
            return created;
        };

        const client = await createClientIfMissing({
            company_name: 'Pacific Maritime Corp',
            company_code: 'PMC001',
            address: '123 Harbor Side, Singapore',
            country: 'Singapore',
            email: 'ops@pacificmaritime.com',
            phone: '+65 9123 4567',
            contact_person_name: 'John Doe',
            contact_person_email: 'john@pacificmaritime.com',
            status: 'ACTIVE'
        });

        const client2 = await createClientIfMissing({
            company_name: 'Atlantic Shipping Ltd',
            company_code: 'ASL002',
            address: '45 Docklands, London, UK',
            country: 'UK',
            email: 'admin@atlanticshipping.com',
            phone: '+44 20 7123 4567',
            contact_person_name: 'Jane Smith',
            contact_person_email: 'jane@atlanticshipping.com',
            status: 'ACTIVE'
        });

        // 2. Create Users
        const users = [
            {
                name: 'System Admin',
                email: 'admin@girik.com',
                password_hash: defaultPassword,
                role: 'ADMIN',
                status: 'ACTIVE'
            },
            {
                name: 'Technical Manager',
                email: 'tm@girik.com',
                password_hash: defaultPassword,
                role: 'TM',
                status: 'ACTIVE'
            },
            {
                name: 'General Manager',
                email: 'gm@girik.com',
                password_hash: defaultPassword,
                role: 'GM',
                status: 'ACTIVE'
            },
            {
                name: 'Pacific Ops Login',
                email: 'ops@pacific.com',
                password_hash: defaultPassword,
                role: 'CLIENT',
                client_id: client.id,
                status: 'ACTIVE'
            },
            {
                name: 'Atlantic Ops Login',
                email: 'ops@atlantic.com',
                password_hash: defaultPassword,
                role: 'CLIENT',
                client_id: client2.id,
                status: 'ACTIVE'
            },
            {
                name: 'Expert Surveyor',
                email: 'surveyor@girik.com',
                password_hash: defaultPassword,
                role: 'SURVEYOR',
                status: 'ACTIVE'
            }
        ];

        for (const u of users) {
            const existingUser = await db.User.findOne({ where: { email: u.email } });
            if (!existingUser) {
                await db.User.create(u);
                console.log(`User created: ${u.email} (${u.role})`);
            } else {
                console.log(`User already exists: ${u.email}`);
            }
        }

        // 3. Create Surveyor Profile
        const surveyorUser = await db.User.findOne({ where: { role: 'SURVEYOR' } });
        const existingProfile = await db.SurveyorProfile.findOne({ where: { user_id: surveyorUser.id } });
        if (!existingProfile) {
            await db.SurveyorProfile.create({
                user_id: surveyorUser.id,
                license_number: 'SURV-882299',
                valid_from: new Date(),
                status: 'ACTIVE'
            });
            console.log('Surveyor profile created');
        }

        // 4. Create Vessels
        const vessels = [
            {
                client_id: client.id,
                vessel_name: 'Pacific Star',
                imo_number: '9123456',
                call_sign: 'V7AB1',
                flag_state: 'Singapore',
                ship_type: 'Bulk Carrier',
                year_built: 2015,
                class_status: 'ACTIVE'
            },
            {
                client_id: client.id,
                vessel_name: 'Pacific Wave',
                imo_number: '9234567',
                call_sign: 'V7XY2',
                flag_state: 'Singapore',
                ship_type: 'Oil Tanker',
                year_built: 2018,
                class_status: 'ACTIVE'
            },
            {
                client_id: client2.id,
                vessel_name: 'Atlantic Queen',
                imo_number: '9345678',
                call_sign: 'GBPQ3',
                flag_state: 'UK',
                ship_type: 'Container Ship',
                year_built: 2020,
                class_status: 'ACTIVE'
            },
            {
                client_id: client2.id,
                vessel_name: 'Atlantic Breeze',
                imo_number: '9456789',
                call_sign: 'GBRS4',
                flag_state: 'UK',
                ship_type: 'Passenger Ship',
                year_built: 2022,
                class_status: 'ACTIVE'
            }
        ];

        for (const v of vessels) {
            const existingVessel = await db.Vessel.findOne({ where: { imo_number: v.imo_number } });
            if (!existingVessel) {
                await db.Vessel.create(v);
                console.log(`Vessel created: ${v.vessel_name}`);
            } else {
                console.log(`Vessel already exists: ${v.vessel_name}`);
            }
        }

        // 5. Create Certificate Types
        const certTypes = [
            { name: 'Class Certificate', issuing_authority: 'CLASS', validity_years: 5, description: 'Main classification certificate' },
            { name: 'Safety Management Certificate', issuing_authority: 'CLASS', validity_years: 5, description: 'SMS compliance' },
            { name: 'Load Line Certificate', issuing_authority: 'CLASS', validity_years: 5, description: 'Freeboard and load line' },
            { name: 'International Oil Pollution Prevention (IOPP)', issuing_authority: 'FLAG', validity_years: 5, description: 'Marine pollution prevention' },
            { name: 'International Air Pollution Prevention (IAPP)', issuing_authority: 'FLAG', validity_years: 5, description: 'Air emissions compliance' },
            { name: 'Maritime Labour Convention (MLC)', issuing_authority: 'FLAG', validity_years: 5, description: 'Seafarer rights and conditions' },
            { name: 'International Ship Security Certificate (ISSC)', issuing_authority: 'FLAG', validity_years: 5, description: 'Ship security and ISPS code' },
            { name: 'Safe Manning Document', issuing_authority: 'FLAG', validity_years: 5, description: 'Minimum safe crew requirements' }
        ];
        for (const ct of certTypes) {
            const existingType = await db.CertificateType.findOne({ where: { name: ct.name } });
            if (!existingType) {
                await db.CertificateType.create(ct);
                console.log(`Certificate Type created: ${ct.name}`);
            }
        }
        console.log('Certificate types created');

        // 6. Create Job Requests and Certificates for some vessels
        const pacificStar = await db.Vessel.findOne({ where: { vessel_name: 'Pacific Star' } });
        const classCertType = await db.CertificateType.findOne({ where: { name: 'Class Certificate' } });
        const opsUser = await db.User.findOne({ where: { email: 'ops@pacific.com' } });
        const adminUser = await db.User.findOne({ where: { role: 'ADMIN' } });

        if (pacificStar && classCertType && opsUser && adminUser) {
            // ... (keep existing job creation logic)
            const [job, created] = await db.JobRequest.findOrCreate({
                where: { vessel_id: pacificStar.id, certificate_type_id: classCertType.id, job_status: 'CERTIFIED' },
                defaults: {
                    requested_by_user_id: opsUser.id,
                    reason: 'Annual Survey',
                    target_port: 'Singapore',
                    target_date: new Date()
                }
            });

            // Helper to create certificate if it doesn't exist
            const createCertIfMissing = async (certData) => {
                const existing = await db.Certificate.findOne({ where: { certificate_number: certData.certificate_number } });
                if (!existing) {
                    await db.Certificate.create(certData);
                    console.log(`Certificate created: ${certData.certificate_number} for vessel ${certData.vessel_id}`);
                }
            };
            const smcType = await db.CertificateType.findOne({ where: { name: 'Safety Management Certificate' } });
            const loadLineType = await db.CertificateType.findOne({ where: { name: 'Load Line Certificate' } });
            const allVessels = await db.Vessel.findAll();

            for (const v of allVessels) {
                // 1. Every vessel gets a Class Cert (Valid)
                await createCertIfMissing({
                    vessel_id: v.id,
                    certificate_type_id: classCertType.id,
                    certificate_number: `CERT-CL-${v.vessel_name.substring(0, 3).toUpperCase()}-101`,
                    issue_date: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
                    expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 4)),
                    status: 'VALID',
                    issued_by_user_id: adminUser.id
                });

                // 2. Some getting SMC (Expiring Soon - 30 days)
                if (v.vessel_name.includes('Pacific')) {
                    await createCertIfMissing({
                        vessel_id: v.id,
                        certificate_type_id: smcType.id,
                        certificate_number: `CERT-SMC-${v.vessel_name.substring(0, 3).toUpperCase()}-202`,
                        issue_date: new Date(new Date().setFullYear(new Date().getFullYear() - 5)),
                        expiry_date: new Date(new Date().setDate(new Date().getDate() + 25)), // 25 days left
                        status: 'VALID',
                        issued_by_user_id: adminUser.id
                    });
                }

                // 3. Some getting Load Line (Expired)
                if (v.vessel_name.includes('Atlantic')) {
                    await createCertIfMissing({
                        vessel_id: v.id,
                        certificate_type_id: loadLineType.id,
                        certificate_number: `CERT-LL-${v.vessel_name.substring(0, 3).toUpperCase()}-303`,
                        issue_date: new Date(new Date().setFullYear(new Date().getFullYear() - 5)),
                        expiry_date: new Date(new Date().setDate(new Date().getDate() - 10)), // Expired 10 days ago
                        status: 'EXPIRED',
                        issued_by_user_id: adminUser.id
                    });
                }
            }

            // 7. Create Checklist Templates
            const templateData = [
                {
                    name: 'Annual Class Survey Checklist',
                    code: 'CL-SURV-ANN-001',
                    description: 'Standard checklist for annual class survey requirements.',
                    certificate_type_id: classCertType.id,
                    status: 'ACTIVE',
                    sections: [
                        {
                            title: 'General Documentation',
                            items: [
                                { code: 'DOC-001', text: 'Previous survey reports and records available on board?', type: 'YES_NO' },
                                { code: 'DOC-002', text: 'Valid certificates of registry and classification?', type: 'YES_NO' }
                            ]
                        },
                        {
                            title: 'Hull and Deck',
                            items: [
                                { code: 'HULL-001', text: 'Hull plating above waterline in satisfactory condition?', type: 'YES_NO_NA' },
                                { code: 'HULL-002', text: 'Anchors and chain cables in good working order?', type: 'YES_NO_NA' },
                                { code: 'HULL-003', text: 'Watertight doors and hatches sealing properly?', type: 'YES_NO' }
                            ]
                        }
                    ]
                },
                {
                    name: 'SMC Intermediate Audit Checklist',
                    code: 'CL-SMC-INT-002',
                    description: 'Checklist for Safety Management Certificate intermediate audit.',
                    certificate_type_id: smcType.id,
                    status: 'ACTIVE',
                    sections: [
                        {
                            title: 'Safety Management System',
                            items: [
                                { code: 'SMS-001', text: 'Safety and environmental-protection policy available?', type: 'YES_NO' },
                                { code: 'SMS-002', text: 'Designated Person Ashore (DPA) known to crew?', type: 'YES_NO' },
                                { code: 'SMS-003', text: 'Master\'s responsibility and authority clearly defined?', type: 'YES_NO' }
                            ]
                        },
                        {
                            title: 'Emergency Preparedness',
                            items: [
                                { code: 'EP-001', text: 'Emergency drills carried out as per schedule?', type: 'YES_NO' },
                                { code: 'EP-002', text: 'Mustering and abandon ship drills satisfactory?', type: 'YES_NO' }
                            ]
                        }
                    ]
                }
            ];

            for (const t of templateData) {
                const existingTemplate = await db.ChecklistTemplate.findOne({ where: { code: t.code } });
                if (!existingTemplate) {
                    await db.ChecklistTemplate.create({
                        ...t,
                        created_by: adminUser.id
                    });
                    console.log(`Checklist Template created: ${t.code}`);
                }
            }
        }

        console.log('\nSeeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
