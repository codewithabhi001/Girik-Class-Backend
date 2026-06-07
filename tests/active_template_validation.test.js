/**
 * Integration Test for Active Certificate Template Validation.
 * Run: node --test tests/active_template_validation.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { v7 as uuidv7 } from 'uuid';
import db from '../src/models/index.js';
import * as templateService from '../src/modules/templates/template.service.js';

describe('Certificate Template Active Constraint Validation', () => {
    it('should enforce only one active template per certificate type and term', async () => {
        const typeId = uuidv7();

        // 1. Create a certificate type first
        await db.CertificateType.create({
            id: typeId,
            name: `Test Unique Type ${Date.now()}`,
            issuing_authority: 'GR CLASS',
            validity_years: 5,
            status: 'ACTIVE'
        });

        const templateIds = [];

        try {
            // 2. Create first active SHORT_TERM template
            const t1 = await templateService.createTemplate({
                template_name: 'Short Term active 1',
                certificate_type_id: typeId,
                certificate_term: 'SHORT_TERM',
                template_file_url: 'templates/t1.docx',
                is_active: true
            });
            templateIds.push(t1.id);
            assert.ok(t1.id, 'First active template should be created successfully');

            // 3. Try creating second active SHORT_TERM template (should fail)
            let errorCreate = null;
            try {
                await templateService.createTemplate({
                    template_name: 'Short Term active 2',
                    certificate_type_id: typeId,
                    certificate_term: 'SHORT_TERM',
                    template_file_url: 'templates/t2.docx',
                    is_active: true
                });
            } catch (err) {
                errorCreate = err;
            }
            assert.ok(errorCreate, 'Should throw an error when creating a second active SHORT_TERM template');
            assert.strictEqual(errorCreate.statusCode, 400);
            assert.match(errorCreate.message, /An active template already exists/);

            // 4. Create first active FULL_TERM template (should succeed)
            const t3 = await templateService.createTemplate({
                template_name: 'Full Term active 1',
                certificate_type_id: typeId,
                certificate_term: 'FULL_TERM',
                template_file_url: 'templates/t3.docx',
                is_active: true
            });
            templateIds.push(t3.id);
            assert.ok(t3.id, 'Active FULL_TERM template should be created successfully alongside active SHORT_TERM template');

            // 5. Create inactive SHORT_TERM template (should succeed)
            const t4 = await templateService.createTemplate({
                template_name: 'Short Term inactive 1',
                certificate_type_id: typeId,
                certificate_term: 'SHORT_TERM',
                template_file_url: 'templates/t4.docx',
                is_active: false
            });
            templateIds.push(t4.id);
            assert.ok(t4.id, 'Inactive SHORT_TERM template should be created successfully');

            // 6. Try updating inactive SHORT_TERM template to active (should fail)
            let errorUpdate = null;
            try {
                await templateService.updateTemplate(t4.id, {
                    is_active: true
                });
            } catch (err) {
                errorUpdate = err;
            }
            assert.ok(errorUpdate, 'Should throw an error when updating template to active if another active template of same term exists');
            assert.strictEqual(errorUpdate.statusCode, 400);
            assert.match(errorUpdate.message, /An active template already exists/);

            // 7. Deactivate first active template, then activate the second one (should succeed)
            await templateService.updateTemplate(t1.id, { is_active: false });
            const updatedT4 = await templateService.updateTemplate(t4.id, { is_active: true });
            assert.strictEqual(updatedT4.is_active, true, 'Should successfully activate template once the other is deactivated');

        } finally {
            // Cleanup
            for (const id of templateIds) {
                await db.CertificateTemplate.destroy({ where: { id } });
            }
            await db.CertificateType.destroy({ where: { id: typeId } });
        }
    });
});
