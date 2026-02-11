/**
 * Seed Certificate Types
 * 
 * Run this script to populate the database with standard maritime certificate types.
 * These are required before creating checklist templates.
 * 
 * Usage:
 * node src/seeders/seed_certificate_types.js
 */

import db from '../models/index.js';

const certificateTypes = [
    {
        name: "Safety Equipment Certificate",
        issuing_authority: "CLASS",
        validity_years: 1,
        status: "ACTIVE",
        description: "Certificate for vessel safety equipment compliance as per SOLAS requirements"
    },
    {
        name: "Load Line Certificate",
        issuing_authority: "CLASS",
        validity_years: 5,
        status: "ACTIVE",
        description: "International Load Line Certificate (1966 Convention)"
    },
    {
        name: "Cargo Ship Safety Equipment Certificate",
        issuing_authority: "FLAG",
        validity_years: 1,
        status: "ACTIVE",
        description: "Certificate for cargo ship safety equipment"
    },
    {
        name: "Cargo Ship Safety Radio Certificate",
        issuing_authority: "FLAG",
        validity_years: 1,
        status: "ACTIVE",
        description: "Certificate for radio and communication equipment"
    },
    {
        name: "Cargo Ship Safety Construction Certificate",
        issuing_authority: "CLASS",
        validity_years: 5,
        status: "ACTIVE",
        description: "Certificate for ship construction and structural integrity"
    },
    {
        name: "International Oil Pollution Prevention Certificate",
        issuing_authority: "FLAG",
        validity_years: 5,
        status: "ACTIVE",
        description: "IOPP Certificate as per MARPOL Annex I"
    },
    {
        name: "Ship Energy Efficiency Certificate",
        issuing_authority: "CLASS",
        validity_years: 5,
        status: "ACTIVE",
        description: "IEE Certificate for energy efficiency compliance"
    },
    {
        name: "Document of Compliance (ISM)",
        issuing_authority: "CLASS",
        validity_years: 5,
        status: "ACTIVE",
        description: "ISM Code Document of Compliance"
    },
    {
        name: "Safety Management Certificate (ISM)",
        issuing_authority: "CLASS",
        validity_years: 5,
        status: "ACTIVE",
        description: "ISM Code Safety Management Certificate"
    },
    {
        name: "Minimum Safe Manning Certificate",
        issuing_authority: "FLAG",
        validity_years: 5,
        status: "ACTIVE",
        description: "Certificate specifying minimum safe manning levels"
    }
];

async function seedCertificateTypes() {
    try {
        console.log('🌱 Starting certificate types seeding...\n');

        // Connect to database
        await db.sequelize.authenticate();
        console.log('✅ Database connection established\n');

        // Check if certificate types already exist
        const existingCount = await db.CertificateType.count();

        if (existingCount > 0) {
            console.log(`⚠️  Found ${existingCount} existing certificate types`);
            console.log('Do you want to:');
            console.log('1. Skip seeding (recommended)');
            console.log('2. Add new types only (safe)');
            console.log('3. Clear and reseed (destructive)\n');
            console.log('Defaulting to option 2: Adding new types only\n');
        }

        // Insert certificate types
        const results = [];

        for (const certType of certificateTypes) {
            try {
                // Check if this type already exists
                const existing = await db.CertificateType.findOne({
                    where: { name: certType.name }
                });

                if (existing) {
                    console.log(`⏭️  Skipping "${certType.name}" (already exists)`);
                    results.push({ ...existing.toJSON(), status: 'skipped' });
                } else {
                    const created = await db.CertificateType.create(certType);
                    console.log(`✅ Created "${certType.name}" (ID: ${created.id})`);
                    results.push({ ...created.toJSON(), status: 'created' });
                }
            } catch (error) {
                console.error(`❌ Error creating "${certType.name}":`, error.message);
            }
        }

        console.log('\n📊 Seeding Summary:');
        console.log(`   Total certificate types: ${certificateTypes.length}`);
        console.log(`   Created: ${results.filter(r => r.status === 'created').length}`);
        console.log(`   Skipped: ${results.filter(r => r.status === 'skipped').length}`);

        console.log('\n✨ Certificate types seeded successfully!\n');

        // Display all certificate types with IDs
        console.log('📋 Available Certificate Types:\n');
        const allTypes = await db.CertificateType.findAll({
            attributes: ['id', 'name', 'issuing_authority', 'validity_years'],
            order: [['name', 'ASC']]
        });

        allTypes.forEach((type, index) => {
            console.log(`${index + 1}. ${type.name}`);
            console.log(`   ID: ${type.id}`);
            console.log(`   Authority: ${type.issuing_authority}`);
            console.log(`   Validity: ${type.validity_years} years\n`);
        });

        console.log('💡 Next Steps:');
        console.log('1. Copy the certificate type IDs above');
        console.log('2. Update sample_checklist_templates.js with these IDs');
        console.log('3. Create checklist templates using POST /api/v1/checklist-templates\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

// Run the seeder
seedCertificateTypes();
