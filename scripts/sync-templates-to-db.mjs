import db from '../src/models/index.js';
import fs from 'fs';
import path from 'path';

const scanHtmlTags = (htmlContent) => {
    if (!htmlContent || typeof htmlContent !== 'string') return [];
    const regex = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}|\{\s*([a-zA-Z0-9_.-]+)\s*\}/g;
    const tags = new Set();
    let match;
    while ((match = regex.exec(htmlContent)) !== null) {
        const val = match[1] || match[2];
        if (val) tags.add(val);
    }
    return Array.from(tags);
};

const BASE = path.resolve('ONLY CERTIFICATES');

async function sync() {
  try {
    const certTypes = await db.CertificateType.findAll();
    
    const folderMapping = {
      "AFS": "ANTI FOULING SYSTEM CERTIFICATE",
      "BCH": "International Certificate of Fitness for Carriage of Dangerous Chemicals in Bulk",
      "BPTC": "BOLLARD PULL ASSESMENT",
      "BS": "BOTTOM INSPECTION",
      "BWM": "BALLAST WATER MANAGEMENT CERTIFICATE",
      "CCSSC": "CARIBBEAN CARGO SHIP SAFETY CERTIFICATE",
      "CDG": "Document of Compliance with the Special Requirements for Ships Carrying Dangerous Goods",
      "CG": "Cargo Handling Gear",
      "CICA": "Crew Accommodation Inspection Certificate",
      "CSSC": "CARGO SHIP SAFETY CERTIFICATE",
      "CSSCC": "CARGO SHIP SAFETY CONSTRUCTION CERTIFICATE",
      "CSSEC": "CARGO SHIP SAFETY EQUIPMENT CERTIFICATE",
      "CSSR": "CARGO SHIP SAFETY RADIOTELEPHONY CERTIFICATE",
      "CSSRC": "CARGO SHIP SAFETY RADIO CERTIFICATE",
      "DOC": "Document of Compliance",
      "DS": "Docking Survey",
      "EIAPP": "Engine International Air Pollution Prevention Certificate",
      "FVSC": "FISHING VESSEL SAFETY CERTIFICATE",
      "GMC": "Certificate of Prevention of Pollution by Garbage from Ships",
      "GRALO": "Document of Authorization for the Carriage of Grain",
      "HM": "Certificate of Classification",
      "HSC": "High Speed Craft Safety Certificate",
      "IAPP": "International Air Pollution Prevention Certificate",
      "IBC": "Certificate of Fitness for Carriage of Dangerous Chemicals in Bulk",
      "IBWMC": "BALLAST WATER MANAGEMENT CERTIFICATE",
      "IEE": "International Energy Efficiency Certificate",
      "IGC": "Certificate of Fitness for Carriage of Liquefied Gases in Bulk",
      "IHMFT": "Statement of Compliance of the International Certificate on Inventory of Hazardous Materials",
      "IMBSC": "Certificate of Compliance with the International Maritime Solid Bulk Cargoes (IMSBC) CODE",
      "IMSBC": "Certificate of Compliance with the International Maritime Solid Bulk Cargoes (IMSBC) CODE",
      "IOPPC": "INTERNATIONAL OIL POLLUTION PREVENTION CERTIFICATE",
      "ISPPC": "INTERNATIONAL SEWAGE POLLUTION PREVENTION CERTIFICATE",
      "ISSC": "International Ship Security Certificate",
      "ITC": "International Tonnage Certificate",
      "LL": "International Load Line Certificate",
      "MLC": "Maritime Labour Convention",
      "MODU": "Mobile Offshore Drilling Unit Safety Certificate",
      "NLS": "International Pollution Prevention Certificate for the Carriage of Noxious Liquid Substances in Bulk",
      "PLECE": "Pleasure Craft Safety Certificate",
      "SMC": "Safety Management Certificate",
      "SPS": "Special Purpose Ship Safety Certificate",
      "SWC": "Sea Worthiness Certificate",
      "TON": "National Tonnage Certificate (vessel under 24 m in length )"
    };

    const prefixMapping = {
      'CSSR': 'SARCE',
      'HM': 'CEC',
      'IOPPC': 'IOPP',
      'SMC': 'ISM'
    };

    for (const type of certTypes) {
      const shortCode = type.short_code;
      const folderName = folderMapping[shortCode];
      if (!folderName) {
        console.log(`No folder mapping for short code: ${shortCode}`);
        continue;
      }

      const htmlDir = path.join(BASE, folderName, 'html');
      if (!fs.existsSync(htmlDir)) {
        console.log(`Directory does not exist: ${htmlDir}`);
        continue;
      }

      // Sync SHORT_TERM
      const stPrefix = prefixMapping[shortCode] || shortCode;
      let stFile = path.join(htmlDir, `GRClass_${stPrefix}_ST_Certificate.html`);
      if (!fs.existsSync(stFile) && shortCode === 'DS') {
        stFile = path.join(htmlDir, `GRClass_DOCKING SURVEY_ST_Certificate.html`);
      }
      
      if (fs.existsSync(stFile)) {
        const content = fs.readFileSync(stFile, 'utf8');
        const scannedTags = scanHtmlTags(content);
        
        const [template, created] = await db.CertificateTemplate.findOrCreate({
          where: {
            certificate_type_id: type.id,
            certificate_term: 'SHORT_TERM'
          },
          defaults: {
            template_name: `${type.name} Short Term Template`,
            template_content: content,
            variables: scannedTags,
            is_active: true
          }
        });
        if (!created) {
          await template.update({
            template_content: content,
            variables: scannedTags,
            is_active: true
          });
        }
        console.log(`Synced ST for ${shortCode}`);
      }

      // Sync FULL_TERM
      const ftPrefix = prefixMapping[shortCode] || shortCode;
      let ftFile = path.join(htmlDir, `GRClass_${ftPrefix}_FT_Certificate.html`);
      if (!fs.existsSync(ftFile) && shortCode === 'DS') {
        ftFile = path.join(htmlDir, `GRClass_DOCKING SURVEY_FT_Certificate.html`);
      }
      
      if (fs.existsSync(ftFile)) {
        const content = fs.readFileSync(ftFile, 'utf8');
        const scannedTags = scanHtmlTags(content);
        
        const [template, created] = await db.CertificateTemplate.findOrCreate({
          where: {
            certificate_type_id: type.id,
            certificate_term: 'FULL_TERM'
          },
          defaults: {
            template_name: `${type.name} Full Term Template`,
            template_content: content,
            variables: scannedTags,
            is_active: true
          }
        });
        if (!created) {
          await template.update({
            template_content: content,
            variables: scannedTags,
            is_active: true
          });
        }
        console.log(`Synced FT for ${shortCode}`);
      }
    }
  } catch (err) {
    console.error('Error during sync:', err);
  } finally {
    await db.sequelize.close();
  }
}

sync();
