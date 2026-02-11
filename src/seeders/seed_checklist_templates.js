/**
 * Seed Checklist Templates
 * 
 * This script creates checklist templates in the database using the sample data.
 * 
 * Usage:
 * node src/seeders/seed_checklist_templates.js
 */

import db from '../models/index.js';

// Sample templates data
const checklistTemplates = [
    {
        name: "Safety Equipment Inspection Checklist",
        code: "SAFETY_EQUIP_001",
        description: "Comprehensive checklist for inspecting vessel safety equipment as per SOLAS requirements",
        certificate_type_id: '019c4b07-983f-707e-b168-2fb307169bd2',
        sections: [
            {
                title: "Life-Saving Appliances",
                items: [
                    {
                        code: "LSA001",
                        text: "Are life jackets available for all persons on board?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "LSA002",
                        text: "Are life jackets in good condition (no tears, inflation mechanism working)?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "LSA003",
                        text: "Total number of life jackets found",
                        type: "NUMBER"
                    },
                    {
                        code: "LSA004",
                        text: "Are liferafts properly serviced and within certification date?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "LSA005",
                        text: "Number of liferafts on board",
                        type: "NUMBER"
                    },
                    {
                        code: "LSA006",
                        text: "Are lifeboats in operational condition?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "LSA007",
                        text: "Describe any deficiencies found in life-saving equipment",
                        type: "TEXT"
                    }
                ]
            },
            {
                title: "Fire Fighting Equipment",
                items: [
                    {
                        code: "FFE001",
                        text: "Are portable fire extinguishers within expiry date?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "FFE002",
                        text: "Are fire extinguishers properly mounted and accessible?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "FFE003",
                        text: "Number of fire extinguishers inspected",
                        type: "NUMBER"
                    },
                    {
                        code: "FFE004",
                        text: "Is the fire detection system operational?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "FFE005",
                        text: "Is the fire alarm system functional?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "FFE006",
                        text: "Are fire hoses and nozzles in good condition?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "FFE007",
                        text: "Describe fire fighting system configuration",
                        type: "TEXT"
                    }
                ]
            },
            {
                title: "Emergency Equipment",
                items: [
                    {
                        code: "EME001",
                        text: "Are emergency lights functional?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "EME002",
                        text: "Is emergency power supply operational?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "EME003",
                        text: "Are emergency escape routes clearly marked?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "EME004",
                        text: "Is the emergency communication system working?",
                        type: "YES_NO_NA"
                    }
                ]
            }
        ],
        status: "ACTIVE",
        metadata: {
            version: "1.0",
            applicable_vessel_types: ["CARGO", "TANKER", "PASSENGER", "CONTAINER"],
            estimated_completion_time_minutes: 60,
            regulatory_reference: "SOLAS Chapter III"
        }
    },
    {
        name: "Load Line Survey Checklist",
        code: "LOADLINE_001",
        description: "Checklist for Load Line Certificate survey and inspection",
        certificate_type_id: '019c3775-0536-777b-b77e-19a6ffcc7516', // Load Line Certificate
        sections: [
            {
                title: "Hull Inspection",
                items: [
                    {
                        code: "HUL001",
                        text: "Is the hull free from visible cracks or damage?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "HUL002",
                        text: "Is there any evidence of corrosion on the hull?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "HUL003",
                        text: "Describe hull condition and any defects found",
                        type: "TEXT"
                    },
                    {
                        code: "HUL004",
                        text: "Are load line marks clearly visible and correctly positioned?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "HUL005",
                        text: "Measured freeboard (in mm)",
                        type: "NUMBER"
                    }
                ]
            },
            {
                title: "Watertight Integrity",
                items: [
                    {
                        code: "WTI001",
                        text: "Are all watertight doors operational?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "WTI002",
                        text: "Are hatch covers watertight and in good condition?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "WTI003",
                        text: "Number of watertight compartments inspected",
                        type: "NUMBER"
                    },
                    {
                        code: "WTI004",
                        text: "Are air pipes and ventilators properly fitted?",
                        type: "YES_NO_NA"
                    },
                    {
                        code: "WTI005",
                        text: "Describe any issues with watertight integrity",
                        type: "TEXT"
                    }
                ]
            }
        ],
        status: "ACTIVE",
        metadata: {
            version: "1.0",
            applicable_vessel_types: ["CARGO", "TANKER", "BULK_CARRIER"],
            estimated_completion_time_minutes: 90,
            regulatory_reference: "Load Line Convention 1966"
        }
    }
];

async function seedChecklistTemplates() {
    try {
        console.log('🌱 Starting checklist templates seeding...\n');

        // Connect to database
        await db.sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // Check if templates already exist
        const existingCount = await db.ChecklistTemplate.count();

        if (existingCount > 0) {
            console.log(`⚠️  Found ${existingCount} existing checklist templates`);
            console.log('Adding new templates only (skipping duplicates)\n');
        }

        // Get admin user for created_by field
        const adminUser = await db.User.findOne({ where: { role: 'ADMIN' } });

        if (!adminUser) {
            console.error('❌ No ADMIN user found. Please create an admin user first.');
            process.exit(1);
        }

        console.log(`👤 Using admin user: ${adminUser.email}\n`);

        // Insert checklist templates
        const results = [];

        for (const template of checklistTemplates) {
            try {
                // Check if this template already exists
                const existing = await db.ChecklistTemplate.findOne({
                    where: { code: template.code }
                });

                if (existing) {
                    console.log(`⏭️  Skipping "${template.name}" (code: ${template.code} already exists)`);
                    results.push({ ...existing.toJSON(), status: 'skipped' });
                } else {
                    // Verify certificate type exists
                    const certType = await db.CertificateType.findByPk(template.certificate_type_id);

                    if (!certType) {
                        console.log(`❌ Skipping "${template.name}" - Certificate type not found: ${template.certificate_type_id}`);
                        continue;
                    }

                    const created = await db.ChecklistTemplate.create({
                        ...template,
                        created_by: adminUser.id,
                        updated_by: adminUser.id
                    });

                    console.log(`✅ Created "${template.name}"`);
                    console.log(`   Code: ${template.code}`);
                    console.log(`   ID: ${created.id}`);
                    console.log(`   Certificate Type: ${certType.name}`);
                    console.log(`   Sections: ${template.sections.length}`);
                    console.log(`   Status: ${template.status}\n`);

                    results.push({ ...created.toJSON(), status: 'created' });
                }
            } catch (error) {
                console.error(`❌ Error creating "${template.name}":`, error.message);
            }
        }

        console.log('\n📊 Seeding Summary:');
        console.log(`   Total templates: ${checklistTemplates.length}`);
        console.log(`   Created: ${results.filter(r => r.status === 'created').length}`);
        console.log(`   Skipped: ${results.filter(r => r.status === 'skipped').length}`);

        console.log('\n✨ Checklist templates seeded successfully!\n');

        // Display all checklist templates
        console.log('📋 Available Checklist Templates:\n');
        const allTemplates = await db.ChecklistTemplate.findAll({
            include: [{
                model: db.CertificateType,
                attributes: ['name', 'issuing_authority']
            }],
            order: [['name', 'ASC']]
        });

        allTemplates.forEach((template, index) => {
            console.log(`${index + 1}. ${template.name}`);
            console.log(`   ID: ${template.id}`);
            console.log(`   Code: ${template.code}`);
            console.log(`   Certificate Type: ${template.CertificateType?.name || 'None'}`);
            console.log(`   Status: ${template.status}`);
            console.log(`   Sections: ${template.sections.length}\n`);
        });

        console.log('💡 Next Steps:');
        console.log('1. Create a job with one of the certificate types above');
        console.log('2. Assign a surveyor to the job');
        console.log('3. Surveyor fetches template: GET /api/v1/checklist-templates/job/:jobId');
        console.log('4. Surveyor fills and submits checklist\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

// Run the seeder
seedChecklistTemplates();
