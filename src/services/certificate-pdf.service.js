/**
 * Certificate PDF service: fill template variables and generate PDF from HTML.
 */

import * as s3Service from './s3.service.js';

const FORMAT_DATE = (d) => {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().split('T')[0];
};

/**
 * Replace {{variable}} placeholders in template content with values from data.
 * @param {string} templateContent - HTML string with {{var}} placeholders
 * @param {Record<string, string|number|Date>} data - key-value for replacement
 * @param {string[]} wrapFields - fields to wrap in dynamic spans for sync
 * @returns {string} Filled HTML
 */
export const fillTemplate = (templateContent, data, wrapFields = ['certificate_number', 'issue_date', 'expiry_date', 'flag_state'], imageFields = ['flag_logo']) => {
    if (!templateContent || typeof templateContent !== 'string') return '';
    let out = templateContent;
    for (const [key, value] of Object.entries(data)) {
        const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}|\\{\\s*${key}\\s*\\}`, 'g');
        let str = value instanceof Date ? FORMAT_DATE(value) : String(value ?? '');
        if (wrapFields && wrapFields.includes(key)) {
            str = `<span class="cert-field" data-field="${key}">${str}</span>`;
        } else if (imageFields && imageFields.includes(key) && str) {
            str = `${str}" data-img-field="${key}`;
        }
        out = out.replace(placeholder, str);
    }
    return out;
};

/**
 * Extracts data-field tag values from HTML.
 * @param {string} html
 * @returns {Record<string, string>}
 */
export const extractFieldsFromHtml = (html) => {
    if (!html || typeof html !== 'string') return {};
    const fields = {};
    const regex = /<[^>]*data-field=["']([^"']+)["'][^>]*>([\s\S]*?)<\/[^>]+>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        fields[match[1]] = match[2].replace(/<[^>]*>/g, '').trim();
    }
    return fields;
};

/**
 * Updates data-field tag contents inside HTML string.
 * @param {string} html
 * @param {Record<string, string>} data
 * @returns {string}
 */
export const updateFieldsInHtml = (html, data) => {
    if (!html || typeof html !== 'string') return html;
    let updatedHtml = html;
    for (const [key, value] of Object.entries(data)) {
        const formattedValue = value instanceof Date ? FORMAT_DATE(value) : String(value ?? '');
        
        // 1. Update text fields inside data-field spans
        const spanRegex = new RegExp(`(<([^\\s>]+)[^>]*data-field=["']${key}["'][^>]*>)([\\s\\S]*?)(<\\/\\2>)`, 'g');
        updatedHtml = updatedHtml.replace(spanRegex, `$1${formattedValue}$4`);

        // 2. Update image fields inside src of tags with data-img-field
        const imgRegex = new RegExp(`(<img[^>]*src=["'])([^"']*)(["'][^>]*data-img-field=["']${key}["'][^>]*>)`, 'g');
        updatedHtml = updatedHtml.replace(imgRegex, `$1${formattedValue}$3`);
        
        const imgRegex2 = new RegExp(`(<img[^>]*data-img-field=["']${key}["'][^>]*src=["'])([^"']*)(["'][^>]*>)`, 'g');
        updatedHtml = updatedHtml.replace(imgRegex2, `$1${formattedValue}$3`);
    }
    return updatedHtml;
};

export const DEFAULT_REMARKS_PLACEHOLDER = 'N/A';

/**
 * Build the standard remarks block used in certificate HTML (before gen-notice / footer).
 * Always returns a block so the remarks section exists for later draft updates.
 * @param {string} remarksText
 * @returns {string}
 */
export const formatRemarksHtml = (remarksText) => {
    const displayText = remarksText && String(remarksText).trim()
        ? String(remarksText).trim()
        : DEFAULT_REMARKS_PLACEHOLDER;
    return `
                <div class="sec-label">OBSERVACIONES / REMARKS</div>
                <div class="certify-box remarks-block" data-field="remarks" style="background: #ffffff; border-left: 4.5px solid var(--navy-blue); padding: 8px 12px; font-family: 'Times New Roman', serif; font-size: 8.5pt; font-weight: bold; color: var(--navy-blue); margin-bottom: 2.5mm; text-align: left;">
                    ${displayText}
                </div>`;
};

const REMARKS_BLOCK_REGEX = /<div class="sec-label">OBSERVACIONES \/ REMARKS<\/div>\s*<div class="certify-box[^"]*"[^>]*>[\s\S]*?<\/div>/gi;

/**
 * Sync remarks into custom certificate HTML — replaces placeholder, existing block, or inserts before gen-notice.
 * @param {string} html
 * @param {string} remarksText
 * @returns {string}
 */
export const updateRemarksInHtml = (html, remarksText) => {
    if (!html || typeof html !== 'string') return html;
    const remarksHtml = formatRemarksHtml(remarksText);

    let updated = html.replace(/\{\{?\s*remarks\s*\}?\}/g, remarksHtml);

    const withReplacedBlock = updated.replace(REMARKS_BLOCK_REGEX, remarksHtml);
    if (withReplacedBlock !== updated) {
        return withReplacedBlock;
    }

    const genNoticeIdx = updated.indexOf('<div class="gen-notice"');
    if (genNoticeIdx !== -1) {
        return updated.slice(0, genNoticeIdx) + remarksHtml + '\n                ' + updated.slice(genNoticeIdx);
    }

    const footerIdx = updated.indexOf('<div class="footer-area"');
    if (footerIdx !== -1) {
        return updated.slice(0, footerIdx) + remarksHtml + '\n                ' + updated.slice(footerIdx);
    }

    const bodyCloseIdx = updated.lastIndexOf('</div>');
    if (bodyCloseIdx !== -1) {
        return updated.slice(0, bodyCloseIdx) + remarksHtml + updated.slice(bodyCloseIdx);
    }

    return updated + remarksHtml;
};

/**
 * Generate PDF buffer from HTML string using Puppeteer.
 * @param {string} html - Full HTML document (can include <style>)
 * @returns {Promise<Buffer>} PDF buffer
 */
export const htmlToPdfBuffer = async (html) => {
    try {
        const puppeteer = await import('puppeteer');
        const browser = await puppeteer.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            // Small delay to ensure Base64 images (QR) are rendered
            await new Promise(r => setTimeout(r, 500));
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
            });
            return Buffer.from(pdfBuffer);
        } finally {
            await browser.close();
        }
    } catch (err) {
        console.error('Certificate PDF generation (puppeteer) CRITICAL ERROR:', err);
        throw { 
            statusCode: 500, 
            message: `Failed to generate certificate PDF: ${err.message}. Ensure Chromium is installed.` 
        };
    }
};

/**
 * Wrap HTML fragment in a minimal document for PDF (ensures encoding and basic styles).
 */
export const wrapHtmlForPdf = (htmlFragment) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Certificate</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 16px; color: #333; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
${htmlFragment}
</body>
</html>`;
};

/**
 * Upload certificate PDF to S3 and return public URL.
 * @param {Buffer} pdfBuffer
 * @param {string} certificateNumber - e.g. CERT-ABC12345
 * @returns {Promise<string>} PDF URL
 */
export const uploadCertificatePdf = async (pdfBuffer, certificateNumber) => {
    const safeName = (certificateNumber || 'certificate').replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `certificate-${safeName}.pdf`;
    const url = await s3Service.uploadFile(
        pdfBuffer,
        fileName,
        'application/pdf',
        s3Service.UPLOAD_FOLDERS.CERTIFICATES
    );
    return url;
};
