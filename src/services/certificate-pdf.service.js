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
 * @returns {string} Filled HTML
 */
export const fillTemplate = (templateContent, data) => {
    if (!templateContent || typeof templateContent !== 'string') return '';
    let out = templateContent;
    for (const [key, value] of Object.entries(data)) {
        const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        const str = value instanceof Date ? FORMAT_DATE(value) : String(value ?? '');
        out = out.replace(placeholder, str);
    }
    return out;
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
        console.warn('Certificate PDF generation (puppeteer) failed:', err.message);
        throw { statusCode: 500, message: 'Failed to generate certificate PDF. Ensure Puppeteer/Chromium is available.' };
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
