import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

const CERT_DIR = path.resolve('ONLY CERTIFICATES');
const OUT_DIR = path.resolve('extracted_content');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function extractDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (e) {
    console.error(`  ERROR extracting ${filePath}: ${e.message}`);
    return null;
  }
}

async function extractHtml(filePath) {
  try {
    const result = await mammoth.convertToHtml({ path: filePath });
    return result.value;
  } catch (e) {
    console.error(`  ERROR html-extracting ${filePath}: ${e.message}`);
    return null;
  }
}

async function main() {
  const folders = fs.readdirSync(CERT_DIR).filter(f =>
    fs.statSync(path.join(CERT_DIR, f)).isDirectory()
  );

  const allCerts = [];

  for (const folder of folders) {
    const folderPath = path.join(CERT_DIR, folder);
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.docx'));

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      console.log(`Processing: ${folder}/${file}`);

      const text = await extractDocx(filePath);
      const html = await extractHtml(filePath);

      if (text) {
        const certCode = file.replace(/\.docx$/i, '').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        allCerts.push({
          folder,
          file,
          certCode,
          text,
          html
        });

        // Also save individual text for easy reading
        const txtPath = path.join(OUT_DIR, `${certCode}.txt`);
        fs.writeFileSync(txtPath, text);
        console.log(`  -> Saved ${certCode}.txt`);
      }
    }
  }

  // Save full JSON
  fs.writeFileSync(
    path.join(OUT_DIR, '_all_certs.json'),
    JSON.stringify(allCerts, null, 2)
  );

  console.log(`\nDone! Extracted ${allCerts.length} certificates.`);
  console.log(`Output directory: ${OUT_DIR}`);
}

main().catch(console.error);
