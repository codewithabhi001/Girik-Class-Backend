import 'dotenv/config';
import path from 'path';
import ExcelJS from 'exceljs';
import db from '../src/models/index.js';

const EXCEL_PATH = '/Users/abhinavvishwakarma/Desktop/Gr-class-Workshop/Docs/DOCUMENTS REQUIRED (1).xlsx';

function normalize(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[^\w\s]/g, '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, '')
        .toUpperCase();
}

async function syncRequiredDocuments() {
    console.log(`📄 Loading required documents from: ${EXCEL_PATH}`);

    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(EXCEL_PATH);
        const worksheet = workbook.getWorksheet(1);
        
        const rows = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip header
            const values = row.values;
            const certName = String(values[2] || '').trim();
            const shortCode = String(values[3] || '').trim();
            const docName = String(values[4] || '').trim();
            
            if (docName && certName) {
                rows.push({ certName, shortCode, docName });
            }
        });

        console.log(`✅ Found ${rows.length} valid rows in Excel.`);

        await db.sequelize.authenticate();
        console.log('✅ Connected to database.');

        // Clean existing required documents first to avoid duplicates and ensure a fresh state
        await db.CertificateRequiredDocument.destroy({ where: {} });
        console.log('🧹 Cleaned existing required documents.');

        const existingTypes = await db.CertificateType.findAll();
        const typeMap = new Map();

        existingTypes.forEach(t => {
            typeMap.set(normalize(t.name), t);
            if (t.short_code) {
                typeMap.set(normalize(t.short_code), t);
            }
        });

        let matchedCount = 0;
        let docCreated = 0;
        let unmatchedFolders = new Set();

        for (const row of rows) {
            const normalizedCert = normalize(row.certName);
            const normalizedCode = normalize(row.shortCode);
            
            const certType = typeMap.get(normalizedCert) || typeMap.get(normalizedCode);

            if (!certType) {
                unmatchedFolders.add(row.certName);
                continue;
            }

            matchedCount++;

            // If the document is "OTHER DOCUMENTS" or "OTHER DOCUMENT", it is NOT mandatory
            const isOtherDoc = row.docName.toUpperCase().includes('OTHER DOCUMENT');
            const is_mandatory = !isOtherDoc;

            // Create record
            await db.CertificateRequiredDocument.create({
                certificate_type_id: certType.id,
                document_name: row.docName,
                is_mandatory
            });
            docCreated++;
        }

        console.log(`\n📊 Sync Summary:`);
        console.log(`   Total Rows Matched to Certificate Types: ${matchedCount}`);
        console.log(`   Unmatched Certificate Types in Excel: ${unmatchedFolders.size}`);
        if (unmatchedFolders.size > 0) {
            console.log(`   - Unmatched list:`, Array.from(unmatchedFolders));
        }
        console.log(`   Required Documents Created: ${docCreated}`);
        console.log(`\n✨ Done.\n`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during import:', error);
        process.exit(1);
    }
}

syncRequiredDocuments();
