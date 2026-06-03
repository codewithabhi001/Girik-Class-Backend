/**
 * Integration/Unit Test for deleting flag service logic using stubs.
 * Run: node --test --test-force-exit tests/delete_flag.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import db from '../src/models/index.js';
import * as flagService from '../src/modules/flags/flag.service.js';

describe('Flag Deletion Service (Mocked)', () => {
    it('should successfully delete a flag when not associated with any vessels or certificates', async () => {
        const originalFindByPk = db.FlagAdministration.findByPk;
        let destroyCalled = false;

        // Stub findByPk to return a mock flag object with destroy method
        db.FlagAdministration.findByPk = async (id, options) => {
            return {
                id,
                destroy: async () => {
                    destroyCalled = true;
                }
            };
        };

        try {
            const response = await flagService.deleteFlag('mock-flag-id');
            assert.deepStrictEqual(response, { message: 'Flag deleted successfully' });
            assert.strictEqual(destroyCalled, true, 'destroy() should have been called on flag instance');
        } finally {
            // Restore original methods
            db.FlagAdministration.findByPk = originalFindByPk;
        }
    });
});
