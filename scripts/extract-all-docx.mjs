import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

const copyDir = path.resolve('ONLY CERTIFICATES copy');

// The 15 most required certificates from the list
const requiredCerts = [
  'ANTI FOULING SYSTEM CERTIFICATE',
  'CARGO SHIP SAFETY EQUIPMENT CERTIFICATE',
  'CARGO SHIP SAFETY RADIO CERTIFICATE',
  'INTERNATIONAL OIL POLLUTION PREVENTION CERTIFICATE',
  'INTERNATIONAL SEWAGE POLLUTION PREVENTION CERTIFICATE',
  'International Air Pollution Prevention Certificate',
  'International Ship Security Certificate',
  'International Load Line Certificate',
  'Maritime Labour Convention',
  'International Ballast Water Management Certificate',
  'International Tonnage Certificate',
  'Document of Compliance',
  'Safety Management Certificate',
];

async function extractDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (e) {
    console.error(`  Error extracting ${filePath}: ${e.message}`);
    return null;
  }
}

async function main() {
  const outputDir = path.resolve('scripts/docx-extracts');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const allDirs = fs.readdirSync(copyDir);
  
  for (const dir of allDirs) {
    const fullDir = path.join(copyDir, dir);
    if (!fs.statSync(fullDir).isDirectory()) continue;
    
    const files = fs.readdirSync(fullDir).filter(f => 
      (f.endsWith('.docx') || f.endsWith('.doc')) && !f.startsWith('~')
    );
    
    if (files.length === 0) continue;
    
    console.log(`\n=== ${dir} ===`);
    
    for (const file of files) {
      const filePath = path.join(fullDir, file);
      console.log(`  Processing: ${file}`);
      const text = await extractDocx(filePath);
      if (text) {
        const safeName = dir.replace(/[^a-zA-Z0-9]/g, '_') + '__' + file.replace(/\.(docx|doc)$/i, '') + '.txt';
        fs.writeFileSync(path.join(outputDir, safeName), text, 'utf8');
        console.log(`  Saved: ${safeName} (${text.length} chars)`);
      }
    }
  }
  
  console.log('\nDone!');
}

main();
