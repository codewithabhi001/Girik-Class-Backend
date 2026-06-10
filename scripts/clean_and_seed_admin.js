import 'dotenv/config';
import bcrypt from 'bcrypt';
import db from '../src/models/index.js';

const DEFAULT_PASSWORD = 'Password@123';

const USERS_TO_SEED = [
    {
        name: 'System Admin',
        email: 'info@grclass.com',
        role: 'ADMIN',
        status: 'ACTIVE'
    },
    {
        name: 'Technical Manager',
        email: 'tm@grclass.com',
        role: 'TM',
        status: 'ACTIVE'
    },
    {
        name: 'General Manager',
        email: 'gm@grclass.com',
        role: 'GM',
        status: 'ACTIVE'
    },
    {
        name: 'Technical Officer',
        email: 'to@grclass.com',
        role: 'TO',
        status: 'ACTIVE'
    },
    {
        name: 'Abhinav Surveyor',
        email: 'abhivishwkarmaa52@gmail.com',
        role: 'SURVEYOR',
        status: 'ACTIVE'
    }
];

async function main() {
    try {
        console.log('--- Starting Database Wiping & Specified Users Seeding ---');

        const sequelize = db.sequelize;
        const dialect = sequelize.getDialect();

        // 1. Get all tables dynamically from the models
        const toTruncate = Object.keys(db)
            .filter((k) => k !== 'sequelize' && k !== 'Sequelize')
            .map((k) => db[k].tableName || db[k].options?.tableName)
            .filter(Boolean);

        if (toTruncate.length > 0) {
            console.log(`🧹 Truncating ${toTruncate.length} tables...`);
            if (dialect === 'mysql') {
                await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
            }

            for (const table of toTruncate) {
                const quoted = dialect === 'mysql' ? `\`${table}\`` : `"${table}"`;
                try {
                    await sequelize.query(`TRUNCATE TABLE ${quoted}`);
                    console.log(`   truncated: ${table}`);
                } catch (err) {
                    console.warn(`   skipped ${table}: ${err.message}`);
                }
            }

            if (dialect === 'mysql') {
                await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
            }
            console.log('✅ All tables successfully truncated.');
        } else {
            console.log('No tables to truncate.');
        }

        // 2. Create the specified users
        console.log('\n👤 Creating Specified Users...');
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

        for (const u of USERS_TO_SEED) {
            const user = await db.User.create({
                name: u.name,
                email: u.email,
                password_hash: passwordHash,
                role: u.role,
                status: u.status,
            });
            console.log(`✅ Created user: ${user.email} [Role: ${user.role}]`);

            // If the role is SURVEYOR, create a SurveyorProfile
            if (u.role === 'SURVEYOR') {
                await db.SurveyorProfile.create({
                    user_id: user.id,
                    license_number: 'SURV-52',
                    status: 'ACTIVE',
                    is_available: true,
                    authorized_ship_types: JSON.stringify(['TANKER', 'CARGO', 'PASSENGER']),
                    authorized_certificates: JSON.stringify(['CERT_TYPE_A', 'CERT_TYPE_B'])
                });
                console.log(`   └─ Created SurveyorProfile for ${user.email}`);
            }
        }

        // 3. Seed site static content
        console.log('\n📄 Seeding Site Static Content...');
        const staticContents = [
            {
                key: 'about-us',
                title: 'About GR-Class – Excellence in Maritime Classification',
                body_html: `
<section style="line-height: 1.6; color: #333; font-family: sans-serif;">
    <h2 style="color: #0d233a; border-bottom: 2px solid #0d233a; padding-bottom: 8px;">GR Class Services</h2>
    <p>
        GR Class welcomes you for your asset’s safety and compliances. GR Class is a Recognized Organization (RO), 
        Recognized Security Organization (RSO), and Classification Society (CS) authorised to offer statutory/class certification and services.
    </p>
    <p>
        We are committed to ensuring the highest standards of safety, reliability, and environmental sustainability in the maritime industry. 
        Our team possesses strong technical expertise and professionalism, guaranteeing dedicated service to our clients.
    </p>
    <h3 style="color: #1b4f72; margin-top: 20px;">Our Core Mission</h3>
    <p>
        Ensuring marine safety and safeguarding lives and property at sea through a comprehensive approach that combines international regulations 
        (e.g., SOLAS, ISPS Code), advanced surveillance, rigorous training, and risk management to protect lives, vessels, and the marine environment.
    </p>
    <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;" />
    <h3 style="color: #1b4f72;">Capabilities & Technical Infrastructure</h3>
    <p>
        Being a classification society, our geographical presence along with certified surveyors makes GR Class technically strong and capable, 
        enhancing survey capabilities and ensuring standardised regulatory and compliance services.
    </p>
</section>
                `
            },
            {
                key: 'privacy',
                title: 'Privacy Policy',
                body_html: `
<section style="line-height: 1.6; color: #333; font-family: sans-serif;">
    <h2 style="color: #0d233a; border-bottom: 2px solid #0d233a; padding-bottom: 8px;">Privacy & Data Protection Policy</h2>
    <p><strong>Last Updated: May 17, 2026</strong></p>
    <p>
        At GR Class, we are committed to safeguarding the privacy and security of our clients' data, including vessel blueprints, crew information, 
        and administrative credentials. This Privacy Policy details how we collect, process, and protect your information.
    </p>
    <h3 style="color: #1b4f72; margin-top: 20px;">1. Information We Collect</h3>
    <p>We collect structural vessel data, compliance documents, email addresses of operations personnel, and payment details during registration and service requests.</p>
    <h3 style="color: #1b4f72; margin-top: 20px;">2. Data Security & Storage</h3>
    <p>GR Class implements advanced encryption, access-controlled databases, and regular security audits to protect sensitive operational files from unauthorized access.</p>
</section>
                `
            },
            {
                key: 'terms-compliance',
                title: 'Terms of Use & Compliance Standards',
                body_html: `
<section style="line-height: 1.6; color: #333; font-family: sans-serif;">
    <h2 style="color: #0d233a; border-bottom: 2px solid #0d233a; padding-bottom: 8px;">Terms of Use & Compliance</h2>
    <p><strong>Effective Date: May 17, 2026</strong></p>
    <p>
        These Terms govern all classification, statutory, and environmental survey services provided by GR Class to shipowners, charterers, and managers. 
        By scheduling a survey or utilizing our certificates, you agree to these conditions.
    </p>
    <h3 style="color: #1b4f72; margin-top: 20px;">1. Standards of Performance</h3>
    <p>
        All surveys are conducted by certified GR Class surveyors with professional integrity. However, classification and certification do not relieve 
        the owner of their primary responsibility to maintain the vessel in a seaworthy condition.
    </p>
    <h3 style="color: #1b4f72; margin-top: 20px;">2. Access to Vessels</h3>
    <p>Shipowners must provide GR Class surveyors with safe, unobstructed access to the vessel, including dry-dock spaces, tanks, and structural compartments, along with complete technical documentation.</p>
</section>
                `
            },
            {
                key: 'faq',
                title: 'Frequently Asked Questions (FAQ)',
                faq_items: [
                    {
                        heading: "General & Classification",
                        questions: [
                            {
                                question: "What is the role of GR Class as a Recognized Organization (RO)?",
                                answer: "As a Recognized Organization (RO) and Classification Society (CS), GR Class is authorized by various Flag Administrations to perform statutory surveys, verify safety compliance, and issue legal certificates in accordance with major international conventions like SOLAS, MARPOL, and Load Line."
                            },
                            {
                                question: "How do I submit an application for ship classification?",
                                answer: "Ship classification applications can be initiated online via the GR Class Portal. You will need to upload basic vessel dimensions, general plans, and operational history. Our technical experts will then review the data to proceed with the survey schedule."
                            }
                        ]
                    },
                    {
                        heading: "Surveys & Audits",
                        questions: [
                            {
                                question: "What happens if a surveyor identifies a deficiency during inspection?",
                                answer: "If a deficiency is noted, our surveyor will issue a formal Condition of Class or Non-Conformity report. The vessel operator is provided with a realistic timeframe to perform rectifications, which are subsequently audited for compliance."
                            },
                            {
                                question: "Can I request a remote survey?",
                                answer: "Yes, GR Class supports remote surveys for certain minor vessel checks, checklist reviews, and documentation audits. You can coordinate this through the admin panel under remote survey requests."
                            }
                        ]
                    },
                    {
                        heading: "Certification & Compliance",
                        questions: [
                            {
                                question: "Are GR Class certificates digitally verifiable?",
                                answer: "Yes, all certificates issued by GR Class are digitally signed and include secure QR codes. Port State Control (PSC), custom officers, and flag authorities can instantly verify certificate validity by scanning the QR code."
                            },
                            {
                                question: "How are certificate expiry dates monitored?",
                                answer: "The GR Class system automatically tracks all certificates and sends automated email notifications to client managers at 90, 60, and 30 days prior to expiration to facilitate timely scheduling of annual or renewal surveys."
                            }
                        ]
                    }
                ]
            },
            {
                key: 'news',
                title: 'Newsroom & Maritime Advisories',
                news_items: [
                    {
                        id: 'news-01',
                        title: 'GR Class Expands Middle East Operations',
                        body_html: '<p>GR Class is proud to announce the setup of its primary administrative operational hub in the Ajman District Business Hub. This geographic expansion increases survey responsiveness and capacity for Gulf and international clients.</p>',
                        thumbnail_url: 'https://images.unsplash.com/photo-1541462608141-2f58c70402b1?w=500',
                        published_at: '2026-05-15T09:00:00Z'
                    },
                    {
                        id: 'news-02',
                        title: 'Adoption of IMO 2026 Environmental Standards',
                        body_html: '<p>In alignment with upcoming IMO targets, GR Class has rolled out a suite of technical environmental advisory services focusing on EEDI, EEXI, and CII compliance mapping for bulk carriers and tank fleets.</p>',
                        thumbnail_url: 'https://images.unsplash.com/photo-1505705694340-019e1e335916?w=500',
                        published_at: '2026-05-10T14:30:00Z'
                    },
                    {
                        id: 'news-03',
                        title: 'Digital Remote Surveyor Program Launched',
                        body_html: '<p>To optimize shipping schedules and reduce dry-docking costs, GR Class has officially rolled out its real-time digital remote surveyor program, leveraging secure streaming and checklist validation.</p>',
                        thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500',
                        published_at: '2026-05-08T10:15:00Z'
                    }
                ]
            }
        ];

        for (const content of staticContents) {
            await db.SiteStaticContent.create({
                key: content.key,
                title: content.title,
                body_html: content.body_html || null,
                faq_items: content.faq_items || null,
                news_items: content.news_items || null
            });
            console.log(`   Successfully seeded static content key: ${content.key}`);
        }

        console.log('\n✨ Database Cleanup & Seed completed successfully! ✨');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database Cleanup & Seed failed:', err);
        process.exit(1);
    }
}

main();
