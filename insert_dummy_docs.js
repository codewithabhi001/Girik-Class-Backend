import 'dotenv/config';
import db from './src/models/index.js';

async function run() {
  try {
    const certTypes = [
      { id: "019c79eb-f926-71e0-95fd-81cfc21fe72b", name: "Annual Survey" },
      { id: "019c7a50-64b3-773d-b9d8-4587f012d560", name: "Annual Survey" },
      { id: "019c7a1e-29de-7439-9037-5f215517dda1", name: "Annual Survey" },
      { id: "019c7a15-3b37-7425-ab77-d80d864f86a4", name: "Annual Survey" },
      { id: "019c7a13-cb1c-77bc-a81d-ae4fc732ca23", name: "Annual Survey" },
      { id: "019c7a13-19b3-729f-ad51-2f9b1bbea9d4", name: "Annual Survey" },
      { id: "019c7a11-e15a-72a8-8c2c-d907b818f4fb", name: "Annual Survey" },
      { id: "019c7a11-5c9d-720f-aa68-1d6caf183246", name: "Annual Survey" },
      { id: "019c79f0-d055-724f-a039-47843e74bddc", name: "Annual Survey" },
      { id: "019c79ef-d58b-746f-9612-33aa4008bcde", name: "Annual Survey" },
      { id: "019c79ef-4283-76cf-a231-469674a10a73", name: "Annual Survey" },
      { id: "019c79ee-b03b-76aa-affb-ea9ab49201d7", name: "Annual Survey" },
      { id: "019c79ee-19a6-7585-95c0-19ea922a220c", name: "Annual Survey" },
      { id: "019c79ed-b4b7-77ba-9083-0d5c5d28508c", name: "Annual Survey" },
      { id: "019c79eb-8c54-76ca-b545-1d079c9a419e", name: "Annual Survey" },
      { id: "019c79a4-55ba-773c-9454-f6bee169ab03", name: "Class Certificate" },
      { id: "019c79a4-5d4c-74b6-8233-09e4bb79a703", name: "International Air Pollution Prevention (IAPP)" },
      { id: "019c79a4-5b7c-7108-8578-9bbc9fd484e7", name: "International Oil Pollution Prevention (IOPP)" },
      { id: "019c79a4-6070-7115-b177-f14af24e6a1e", name: "International Ship Security Certificate (ISSC)" },
      { id: "019c79a4-59e1-72e8-bc79-a4e7f1169b04", name: "Load Line Certificate" },
      { id: "019c79a4-5ecd-71e9-b1f2-d1fd2afa79fb", name: "Maritime Labour Convention (MLC)" },
      { id: "019c79a4-6230-7743-972b-071270f29334", name: "Safe Manning Document" }
    ];

    const generateDocs = (certType) => {
      switch (certType.name) {
        case 'Annual Survey':
          return [
            { document_name: 'Previous Survey Report', is_mandatory: true },
            { document_name: 'Vessel Log Book', is_mandatory: true },
            { document_name: 'Crew List', is_mandatory: false }
          ];
        case 'Class Certificate':
          return [
            { document_name: 'Builder Certificate', is_mandatory: true },
            { document_name: 'Stability Booklet', is_mandatory: true },
            { document_name: 'Tonnage Certificate', is_mandatory: false }
          ];
        case 'International Air Pollution Prevention (IAPP)':
          return [
            { document_name: 'Engine Technical File', is_mandatory: true },
            { document_name: 'Fuel Oil Quality Records', is_mandatory: true }
          ];
        case 'International Oil Pollution Prevention (IOPP)':
          return [
            { document_name: 'Oil Record Book', is_mandatory: true },
            { document_name: 'SOPEP Manual', is_mandatory: true }
          ];
        case 'International Ship Security Certificate (ISSC)':
          return [
            { document_name: 'Ship Security Plan (SSP)', is_mandatory: true },
            { document_name: 'Continuous Synopsis Record (CSR)', is_mandatory: true }
          ];
        case 'Load Line Certificate':
          return [
            { document_name: 'Stability Information Booklet', is_mandatory: true },
            { document_name: 'Freeboard Calculation', is_mandatory: true }
          ];
        case 'Maritime Labour Convention (MLC)':
          return [
            { document_name: 'Declaration of Maritime Labour Compliance (DMLC)', is_mandatory: true },
            { document_name: 'Seafarer Employment Agreements', is_mandatory: true },
            { document_name: 'Medical Certificates for Seafarers', is_mandatory: false }
          ];
        case 'Safe Manning Document':
          return [
            { document_name: 'Crew List', is_mandatory: true },
            { document_name: 'Officers Competency Certificates', is_mandatory: true }
          ];
        default:
          return [
            { document_name: 'General Registry Document', is_mandatory: true }
          ];
      }
    };

    let allDocsPayload = [];

    for (const ct of certTypes) {
      // Check if type exists
      const certTypeRow = await db.CertificateType.findByPk(ct.id);
      if (certTypeRow) {
        // clear existing to avoid dupes if already run
        await db.CertificateRequiredDocument.destroy({ where: { certificate_type_id: ct.id } });

        const docs = generateDocs(ct);
        const docsWithId = docs.map(d => ({ ...d, certificate_type_id: ct.id }));
        allDocsPayload.push(...docsWithId);
      }
    }

    if (allDocsPayload.length > 0) {
      await db.CertificateRequiredDocument.bulkCreate(allDocsPayload);
      console.log(`Inserted ${allDocsPayload.length} dummy required documents successfully!`);
    } else {
      console.log('No valid certificate types found to insert documents for.');
    }

  } catch (error) {
    console.error('Error inserting dummy documents:', error);
  } finally {
    process.exit(0);
  }
}

run();
