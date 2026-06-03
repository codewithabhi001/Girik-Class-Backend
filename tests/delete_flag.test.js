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
        const originalVesselCount = db.Vessel.count;
        const originalCertCount = db.Certificate.count;

        let destroyCalled = false;

        // Stub methods to avoid database write operations
        db.FlagAdministration.findByPk = async (id, options) => {
            return {
                id,
                destroy: async () => {
                    destroyCalled = true;
                }
            };
        };
        db.Vessel.count = async (options) => {
            return 0;
        };
        db.Certificate.count = async (options) => {
            return 0;
        };

        try {
            const response = await flagService.deleteFlag('mock-flag-id');
            assert.deepStrictEqual(response, { message: 'Flag deleted successfully' });
            assert.strictEqual(destroyCalled, true, 'destroy() should have been called on flag instance');
        } finally {
            // Restore original methods
            db.FlagAdministration.findByPk = originalFindByPk;
            db.Vessel.count = originalVesselCount;
            db.Certificate.count = originalCertCount;
        }
    });

    it('should fail to delete a flag when associated with a vessel', async () => {
        const originalFindByPk = db.FlagAdministration.findByPk;
        const originalVesselCount = db.Vessel.count;
        const originalCertCount = db.Certificate.count;

        db.FlagAdministration.findByPk = async (id, options) => {
            return {
                id,
                destroy: async () => {
                    throw new Error('destroy should not be called');
                }
            };
        };
        db.Vessel.count = async (options) => {
            return 3;
        };
        db.Certificate.count = async (options) => {
            return 0;
        };

        try {
            await assert.rejects(
                flagService.deleteFlag('mock-flag-id'),
                (err) => {
                    assert.strictEqual(err.statusCode, 409);
                    assert.ok(err.message.includes('Cannot delete this flag: it is currently assigned to 3 vessels.'));
                    return true;
                }
            );
        } finally {
            db.FlagAdministration.findByPk = originalFindByPk;
            db.Vessel.count = originalVesselCount;
            db.Certificate.count = originalCertCount;
        }
    });

    it('should fail to delete a flag when associated with a certificate', async () => {
        const originalFindByPk = db.FlagAdministration.findByPk;
        const originalVesselCount = db.Vessel.count;
        const originalCertCount = db.Certificate.count;

        db.FlagAdministration.findByPk = async (id, options) => {
            return {
                id,
                destroy: async () => {
                    throw new Error('destroy should not be called');
                }
            };
        };
        db.Vessel.count = async (options) => {
            return 0;
        };
        db.Certificate.count = async (options) => {
            return 1;
        };

        try {
            await assert.rejects(
                flagService.deleteFlag('mock-flag-id'),
                (err) => {
                    assert.strictEqual(err.statusCode, 409);
                    assert.ok(err.message.includes('Cannot delete this flag: it is referenced in 1 certificate.'));
                    return true;
                }
            );
        } finally {
            db.FlagAdministration.findByPk = originalFindByPk;
            db.Vessel.count = originalVesselCount;
            db.Certificate.count = originalCertCount;
        }
    });
});
