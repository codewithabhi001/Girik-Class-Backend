/**
 * Unit tests for certificate RBAC (getCertificateScopeFilter / buildCertificateScopeWhere).
 * Run: node --test tests/certificate-rbac.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildCertificateScopeWhere } from '../src/modules/certificates/certificate-scope.js';
import { Op } from 'sequelize';

describe('Certificate RBAC – buildCertificateScopeWhere', () => {
    it('admin sees all (empty where)', async () => {
        const where = await buildCertificateScopeWhere(
            { id: 'admin-1', role: 'ADMIN' },
            { JobRequest: { findAll: () => Promise.resolve([]) }, Vessel: { findAll: () => Promise.resolve([]) } }
        );
        assert.deepStrictEqual(where, {});
    });

    it('GM sees all (empty where)', async () => {
        const where = await buildCertificateScopeWhere(
            { id: 'gm-1', role: 'GM' },
            { JobRequest: { findAll: () => Promise.resolve([]) }, Vessel: { findAll: () => Promise.resolve([]) } }
        );
        assert.deepStrictEqual(where, {});
    });

    it('TM sees all (empty where)', async () => {
        const where = await buildCertificateScopeWhere(
            { id: 'tm-1', role: 'TM' },
            { JobRequest: { findAll: () => Promise.resolve([]) }, Vessel: { findAll: () => Promise.resolve([]) } }
        );
        assert.deepStrictEqual(where, {});
    });

    it('TO sees all (empty where)', async () => {
        const where = await buildCertificateScopeWhere(
            { id: 'to-1', role: 'TO' },
            { JobRequest: { findAll: () => Promise.resolve([]) }, Vessel: { findAll: () => Promise.resolve([]) } }
        );
        assert.deepStrictEqual(where, {});
    });

    it('surveyor sees only certs for vessels in their assigned jobs', async () => {
        const vesselA = 'vessel-a';
        const vesselB = 'vessel-b';
        const JobRequest = {
            findAll: () => Promise.resolve([{ vessel_id: vesselA }, { vessel_id: vesselB }, { vessel_id: vesselA }]),
        };
        const where = await buildCertificateScopeWhere(
            { id: 'surveyor-1', role: 'SURVEYOR' },
            { JobRequest, Vessel: { findAll: () => Promise.resolve([]) } }
        );
        assert.ok(where.vessel_id);
        assert.ok(where.vessel_id[Op.in]);
        assert.strictEqual(where.vessel_id[Op.in].length, 2);
        assert.ok(where.vessel_id[Op.in].includes(vesselA));
        assert.ok(where.vessel_id[Op.in].includes(vesselB));
    });

    it('surveyor with no assigned jobs sees no certs (vessel_id in [null])', async () => {
        const JobRequest = { findAll: () => Promise.resolve([]) };
        const where = await buildCertificateScopeWhere(
            { id: 'surveyor-2', role: 'SURVEYOR' },
            { JobRequest, Vessel: { findAll: () => Promise.resolve([]) } }
        );
        assert.deepStrictEqual(where, { vessel_id: { [Op.in]: [null] } });
    });

    it('client sees only certs for their company vessels', async () => {
        const vessel1 = 'v1';
        const vessel2 = 'v2';
        const Vessel = {
            findAll: () => Promise.resolve([{ id: vessel1 }, { id: vessel2 }]),
        };
        const where = await buildCertificateScopeWhere(
            { id: 'client-1', role: 'CLIENT', client_id: 'company-1' },
            { JobRequest: { findAll: () => Promise.resolve([]) }, Vessel }
        );
        assert.ok(where.vessel_id);
        assert.ok(where.vessel_id[Op.in]);
        assert.strictEqual(where.vessel_id[Op.in].length, 2);
        assert.ok(where.vessel_id[Op.in].includes(vessel1));
        assert.ok(where.vessel_id[Op.in].includes(vessel2));
    });

    it('client with no vessels sees no certs (vessel_id in [null])', async () => {
        const Vessel = { findAll: () => Promise.resolve([]) };
        const where = await buildCertificateScopeWhere(
            { id: 'client-2', role: 'CLIENT', client_id: 'company-2' },
            { JobRequest: { findAll: () => Promise.resolve([]) }, Vessel }
        );
        assert.deepStrictEqual(where, { vessel_id: { [Op.in]: [null] } });
    });

    it('client with no client_id sees no certs (vessel_id in [null])', async () => {
        const where = await buildCertificateScopeWhere(
            { id: 'client-3', role: 'CLIENT', client_id: null },
            { JobRequest: { findAll: () => Promise.resolve([]) }, Vessel: { findAll: () => Promise.resolve([]) } }
        );
        assert.deepStrictEqual(where, { vessel_id: { [Op.in]: [null] } });
    });

    it('null user returns empty where', async () => {
        const where = await buildCertificateScopeWhere(null, {
            JobRequest: { findAll: () => Promise.resolve([]) },
            Vessel: { findAll: () => Promise.resolve([]) },
        });
        assert.deepStrictEqual(where, {});
    });
});
