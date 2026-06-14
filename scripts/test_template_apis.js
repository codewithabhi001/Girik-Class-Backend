/**
 * End-to-end smoke test for the Checklist-Template and Certificate-Template
 * HTTP APIs.  It mints an admin JWT directly (so we don't need a password),
 * exercises every endpoint, and prints a pass/fail table.  Best-effort
 * cleanup runs at the end.
 *
 *   node scripts/test_template_apis.js
 *
 * Prereqs:
 *   - npm run dev (server on http://localhost:5000)
 *   - At least one ACTIVE ADMIN user and one ACTIVE CertificateType in the DB
 */

import jwt from 'jsonwebtoken';
import db from '../src/models/index.js';
import env from '../src/config/env.js';

const BASE_URL = `http://localhost:${env.port || 5000}`;

const log   = (...a) => console.log(...a);
const dim   = (s) => `\x1b[2m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red   = (s) => `\x1b[31m${s}\x1b[0m`;
const cyan  = (s) => `\x1b[36m${s}\x1b[0m`;

/** Asserts the array of resolved URLs contains an entry that references `key`. */
const arrayContainsKey = (arr, key) =>
    Array.isArray(arr) && arr.some(v => typeof v === 'string' && v.includes(key));

/** Pulls the human-readable error string out of either `message` or `errors[*]`. */
const errStr = (body) => {
    if (!body) return '';
    if (body.message) {
        const errs = body.errors && typeof body.errors === 'object'
            ? Object.values(body.errors).join(' | ')
            : '';
        return `${body.message} ${errs}`.trim();
    }
    return JSON.stringify(body);
};

const results = [];
function record(name, ok, detail = '') {
    results.push({ name, ok, detail });
    log(`${ok ? green('  ✓') : red('  ✗')} ${name}${detail ? dim('   ' + detail) : ''}`);
}

async function api(token, method, path, body) {
    const headers = { 'Authorization': `Bearer ${token}` };
    if (body) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    let json;
    try { json = await res.json(); } catch { json = null; }
    return { status: res.status, body: json };
}

async function expect(name, fn) {
    try {
        const detail = await fn();
        record(name, true, detail);
    } catch (e) {
        record(name, false, e.message);
    }
}

(async () => {
    log(cyan('\n=== TEMPLATE-API SMOKE TEST ==='));
    log(dim(`base = ${BASE_URL}`));

    // ── Auth: mint an ADMIN JWT ───────────────────────────────────────────
    const admin = await db.User.findOne({ where: { role: 'ADMIN', status: 'ACTIVE' } });
    if (!admin) throw new Error('No ACTIVE ADMIN user found in DB. Seed one first.');

    // Create a temporary certificate type for isolation
    const stamp = Date.now();
    const certType = await db.CertificateType.create({
        name: `Temp Smoke Test ${stamp}`,
        issuing_authority: 'CLASS',
        validity_years: 5,
        status: 'ACTIVE',
        description: 'Temporary certificate type for smoke test'
    });

    const adminToken = jwt.sign(
        { id: admin.id, role: admin.role, email: admin.email, type: 'access' },
        env.jwt.accessSecret,
        { expiresIn: env.jwt.accessExpiresIn }
    );
    log(dim(`admin = ${admin.email}   certType = ${certType.name}`));

    // Some IDs we'll fill in as we go and clean up at the end.
    const created = { checklistTpls: [], certTpls: [] };

    // =====================================================================
    //                       CHECKLIST TEMPLATES
    // =====================================================================
    log(cyan('\n[1] Checklist Templates'));

    const ctCode = `TEST_CT_${stamp}`;

    // --- 1.1 GET upload URL --------------------------------------------------
    let firstFileKey;
    await expect('GET /checklist-templates/get-upload-url', async () => {
        const r = await api(adminToken, 'GET',
            `/api/v1/checklist-templates/get-upload-url?fileName=master_${stamp}.docx&contentType=application/vnd.openxmlformats-officedocument.wordprocessingml.document`);
        if (r.status !== 200) throw new Error(`status=${r.status} body=${JSON.stringify(r.body)}`);
        if (!r.body?.data?.uploadUrl || !r.body?.data?.fileKey) throw new Error('missing uploadUrl/fileKey');
        firstFileKey = r.body.data.fileKey;
        return `fileKey=${firstFileKey.slice(0, 40)}…`;
    });

    // --- 1.2 CREATE ---------------------------------------------------------
    let ctId;
    await expect('POST /checklist-templates  (with template_files + sections)', async () => {
        const r = await api(adminToken, 'POST', '/api/v1/checklist-templates', {
            name: `Test CT ${stamp}`,
            code: ctCode,
            description: 'API test template',
            certificate_type_id: certType.id,
            sections: [{
                title: 'Section A',
                items: [
                    { code: 'Q1', text: 'Question 1?', type: 'YES_NO_NA' },
                    { code: 'Q2', text: 'Question 2?', type: 'YES_NO' },
                ]
            }],
            template_files: [firstFileKey],
            status: 'DRAFT',
            metadata: { version: '1.0' }
        });
        if (r.status !== 201) throw new Error(`status=${r.status} body=${JSON.stringify(r.body)}`);
        ctId = r.body.data.id;
        created.checklistTpls.push(ctId);
        if (!Array.isArray(r.body.data.template_files) || r.body.data.template_files.length !== 1)
            throw new Error('template_files not persisted as array of 1');
        return `id=${ctId}`;
    });

    // --- 1.3 GET LIST -------------------------------------------------------
    await expect('GET /checklist-templates  (list)', async () => {
        const r = await api(adminToken, 'GET', '/api/v1/checklist-templates');
        if (r.status !== 200) throw new Error(`status=${r.status}`);
        if (!Array.isArray(r.body.data)) throw new Error('data not array');
        return `count=${r.body.data.length}`;
    });

    await expect('GET /checklist-templates?status=DRAFT  (filter)', async () => {
        const r = await api(adminToken, 'GET', '/api/v1/checklist-templates?status=DRAFT');
        if (r.status !== 200) throw new Error(`status=${r.status}`);
        const found = r.body.data.find(t => t.id === ctId);
        if (!found) throw new Error('our just-created DRAFT not in filtered list');
        return `our row in DRAFT list ✓`;
    });

    // --- 1.4 GET BY ID ------------------------------------------------------
    await expect('GET /checklist-templates/:id', async () => {
        const r = await api(adminToken, 'GET', `/api/v1/checklist-templates/${ctId}`);
        if (r.status !== 200) throw new Error(`status=${r.status}`);
        if (r.body.data.id !== ctId) throw new Error('wrong id');
        const tf = r.body.data.template_files;
        if (!Array.isArray(tf) || tf.length !== 1) throw new Error(`template_files len=${tf?.length}`);
        return `template_files len=${tf.length}`;
    });

    // --- 1.5 UPDATE: add_template_files ------------------------------------
    let secondFileKey;
    await expect('GET /checklist-templates/get-upload-url  (second file)', async () => {
        const r = await api(adminToken, 'GET',
            `/api/v1/checklist-templates/get-upload-url?fileName=supplement_${stamp}.pdf&contentType=application/pdf`);
        if (r.status !== 200) throw new Error(`status=${r.status}`);
        secondFileKey = r.body.data.fileKey;
        return `fileKey=${secondFileKey.slice(0, 40)}…`;
    });

    await expect('PUT /checklist-templates/:id  (add_template_files)', async () => {
        const r = await api(adminToken, 'PUT', `/api/v1/checklist-templates/${ctId}`, {
            add_template_files: [secondFileKey]
        });
        if (r.status !== 200) throw new Error(`status=${r.status} body=${JSON.stringify(r.body)}`);
        const tf = r.body.data.template_files;
        if (!Array.isArray(tf) || tf.length !== 2) throw new Error(`expected 2 files, got ${tf?.length}`);
        return `template_files len=${tf.length}`;
    });

    // --- 1.6 UPDATE: remove_template_files ---------------------------------
    // (response array is resolved to signed URLs — assert by *contains key*.)
    await expect('PUT /checklist-templates/:id  (remove_template_files)', async () => {
        const r = await api(adminToken, 'PUT', `/api/v1/checklist-templates/${ctId}`, {
            remove_template_files: [firstFileKey]
        });
        if (r.status !== 200) throw new Error(`status=${r.status}`);
        const tf = r.body.data.template_files;
        if (!Array.isArray(tf) || tf.length !== 1) throw new Error(`expected len=1, got ${tf?.length}`);
        if (arrayContainsKey(tf, firstFileKey)) throw new Error('first key still present');
        if (!arrayContainsKey(tf, secondFileKey)) throw new Error('second key missing');
        return 'first key removed, second remains';
    });

    // --- 1.7 UPDATE: full replace ------------------------------------------
    await expect('PUT /checklist-templates/:id  (template_files full replace)', async () => {
        const r = await api(adminToken, 'PUT', `/api/v1/checklist-templates/${ctId}`, {
            template_files: ['checklist-templates/replaced-only.docx']
        });
        if (r.status !== 200) throw new Error(`status=${r.status}`);
        const tf = r.body.data.template_files;
        if (tf.length !== 1) throw new Error(`expected len=1, got ${tf.length}`);
        if (!arrayContainsKey(tf, 'checklist-templates/replaced-only.docx'))
            throw new Error(`replacement key not in response: ${JSON.stringify(tf)}`);
        return 'replaced ✓';
    });

    // --- 1.8 UPDATE mutex error case ---------------------------------------
    await expect('PUT /checklist-templates/:id  (mutex error: replace + add → 400)', async () => {
        const r = await api(adminToken, 'PUT', `/api/v1/checklist-templates/${ctId}`, {
            template_files: ['x'],
            add_template_files: ['y']
        });
        if (r.status !== 400) throw new Error(`expected 400, got ${r.status}`);
        const combined = errStr(r.body).toLowerCase();
        if (!combined.includes('either') || !combined.includes('template_files'))
            throw new Error(`unhelpful err: ${combined}`);
        return `400 + clear message`;
    });

    // --- 1.9 UPDATE structural edit on DRAFT (allowed) ---------------------
    await expect('PUT /checklist-templates/:id  (rename, DRAFT-allowed)', async () => {
        const r = await api(adminToken, 'PUT', `/api/v1/checklist-templates/${ctId}`, {
            name: `Test CT ${stamp} (renamed)`
        });
        if (r.status !== 200) throw new Error(`status=${r.status}`);
        if (!r.body.data.name.includes('renamed')) throw new Error('rename not persisted');
        return 'renamed ✓';
    });

    // --- 1.10 ACTIVATE GUARD: empty-sections template fails ---------------
    let emptyTplId;
    await expect('POST /checklist-templates  (empty-sections template, DRAFT)', async () => {
        const r = await api(adminToken, 'POST', '/api/v1/checklist-templates', {
            name: `Empty ${stamp}`,
            code: `EMPTY_${stamp}`,
            certificate_type_id: certType.id,
            sections: [{ title: 'Empty', items: [] }],
            status: 'DRAFT',
        });
        if (r.status !== 201) throw new Error(`status=${r.status} body=${JSON.stringify(r.body)}`);
        emptyTplId = r.body.data.id;
        created.checklistTpls.push(emptyTplId);
        return `id=${emptyTplId}`;
    });

    await expect('PUT /checklist-templates/:id/activate  (empty sections → 400)', async () => {
        const r = await api(adminToken, 'PUT', `/api/v1/checklist-templates/${emptyTplId}/activate`);
        if (r.status !== 400) throw new Error(`expected 400, got ${r.status}`);
        if (!String(r.body.message).toLowerCase().includes('no checklist items'))
            throw new Error(`unhelpful err: ${JSON.stringify(r.body)}`);
        return `400 + clear message`;
    });

    // --- 1.11 ACTIVATE happy path -----------------------------------------
    await expect('PUT /checklist-templates/:id/activate  (real template → ACTIVE)', async () => {
        const r = await api(adminToken, 'PUT', `/api/v1/checklist-templates/${ctId}/activate`);
        if (r.status !== 200) throw new Error(`status=${r.status} body=${JSON.stringify(r.body)}`);
        if (r.body.data.status !== 'ACTIVE') throw new Error(`status=${r.body.data.status}`);
        return 'status=ACTIVE';
    });

    // --- 1.12 STRUCTURAL EDIT NOW BLOCKED (ACTIVE) - REVERTED (ALLOWED) ----
    await expect('PUT /checklist-templates/:id  (rename on ACTIVE → 200)', async () => {
        const r = await api(adminToken, 'PUT', `/api/v1/checklist-templates/${ctId}`, {
            name: `Should be allowed ${stamp}`
        });
        if (r.status !== 200) throw new Error(`expected 200, got ${r.status}`);
        return `200 — renaming active template succeeded`;
    });

    // --- 1.13 FILE-EDIT STILL ALLOWED ON ACTIVE ----------------------------
    await expect('PUT /checklist-templates/:id  (add file on ACTIVE → 200)', async () => {
        const r = await api(adminToken, 'PUT', `/api/v1/checklist-templates/${ctId}`, {
            add_template_files: ['checklist-templates/post-active-doc.docx']
        });
        if (r.status !== 200) throw new Error(`status=${r.status} body=${JSON.stringify(r.body)}`);
        if (!arrayContainsKey(r.body.data.template_files, 'checklist-templates/post-active-doc.docx'))
            throw new Error('file not appended on ACTIVE template');
        return 'file appended on ACTIVE ✓';
    });

    // --- 1.14 CLONE and DELETE removed per user requirements ----------------
    log(dim('  - skipped POST /checklist-templates/:id/clone (removed)'));
    log(dim('  - skipped DELETE /checklist-templates/:id (removed)'));

    // =====================================================================
    //                      CERTIFICATE TEMPLATES
    // =====================================================================
    log(cyan('\n[2] Certificate Templates'));

    let certTplId;
    await expect('POST /certificate-templates', async () => {
        const r = await api(adminToken, 'POST', '/api/v1/certificate-templates', {
            template_name: `Test Cert Tpl ${stamp}`,
            certificate_type_id: certType.id,
            certificate_term: 'FULL_TERM',
            template_content: `<html><body>{{vessel_name}} - {{imo_number}}</body></html>`,
            variables: ['vessel_name', 'imo_number'],
            is_active: true,
        });
        if (r.status !== 201) throw new Error(`status=${r.status} body=${JSON.stringify(r.body)}`);
        certTplId = r.body.data.id;
        created.certTpls.push(certTplId);
        return `id=${certTplId}`;
    });

    await expect('GET /certificate-templates  (list)', async () => {
        const r = await api(adminToken, 'GET', '/api/v1/certificate-templates');
        if (r.status !== 200) throw new Error(`status=${r.status}`);
        if (!Array.isArray(r.body.data)) throw new Error('data not array');
        return `count=${r.body.data.length}`;
    });

    await expect('GET /certificate-templates?is_active=true  (filter)', async () => {
        const r = await api(adminToken, 'GET', '/api/v1/certificate-templates?is_active=true');
        if (r.status !== 200) throw new Error(`status=${r.status}`);
        return `count=${r.body.data.length}`;
    });

    await expect('GET /certificate-templates/:id', async () => {
        const r = await api(adminToken, 'GET', `/api/v1/certificate-templates/${certTplId}`);
        if (r.status !== 200) throw new Error(`status=${r.status}`);
        if (r.body.data.id !== certTplId) throw new Error('wrong id');
        return 'fetched ✓';
    });

    await expect('PUT /certificate-templates/:id  (swap template_content)', async () => {
        const r = await api(adminToken, 'PUT', `/api/v1/certificate-templates/${certTplId}`, {
            template_content: `<html><body>{{vessel_name}} - {{imo_number}} v2</body></html>`,
            template_name: `Test Cert Tpl ${stamp} (v2)`
        });
        if (r.status !== 200) throw new Error(`status=${r.status} body=${JSON.stringify(r.body)}`);
        if (r.body.data.template_content !== `<html><body>{{vessel_name}} - {{imo_number}} v2</body></html>`)
            throw new Error(`template_content not swapped: ${r.body.data.template_content}`);
        return 'swapped ✓';
    });

    await expect('DELETE /certificate-templates/:id', async () => {
        const r = await api(adminToken, 'DELETE', `/api/v1/certificate-templates/${certTplId}`);
        if (r.status !== 200) throw new Error(`status=${r.status}`);
        const r2 = await api(adminToken, 'GET', `/api/v1/certificate-templates/${certTplId}`);
        if (r2.status !== 404) throw new Error(`expected 404 after delete, got ${r2.status}`);
        created.certTpls = created.certTpls.filter(id => id !== certTplId);
        return 'deleted, GET → 404 ✓';
    });

    // ── Cleanup any leftover checklist-templates we created ─────────────
    log(cyan('\n[3] Cleanup'));
    for (const id of created.checklistTpls) {
        try {
            // hard remove from DB so re-runs aren't polluted
            await db.ChecklistTemplate.destroy({ where: { id } });
            log(dim(`  - removed checklist-template ${id}`));
        } catch (e) {
            log(red(`  ! failed to remove ${id}: ${e.message}`));
        }
    }
    for (const id of created.certTpls) {
        try {
            await db.CertificateTemplate.destroy({ where: { id } });
            log(dim(`  - removed certificate-template ${id}`));
        } catch (e) {
            log(red(`  ! failed to remove ${id}: ${e.message}`));
        }
    }

    try {
        await db.CertificateType.destroy({ where: { id: certType.id } });
        log(dim(`  - removed temporary certificate-type ${certType.id}`));
    } catch (e) {
        log(red(`  ! failed to remove certType: ${e.message}`));
    }

    // ── Summary ──────────────────────────────────────────────────────────
    const passed = results.filter(r => r.ok).length;
    const total  = results.length;
    log(cyan(`\n=== ${passed}/${total} passed ===`));
    if (passed !== total) {
        log(red('\nFailures:'));
        for (const r of results.filter(r => !r.ok)) {
            log(red(`  ✗ ${r.name}`));
            log(dim(`     ${r.detail}`));
        }
    }

    await db.sequelize.close();
    process.exit(passed === total ? 0 : 1);
})().catch(async (err) => {
    console.error(red('FATAL'), err);
    try { await db.sequelize.close(); } catch {}
    process.exit(2);
});
