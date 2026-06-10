/**
 * ═══════════════════════════════════════════════════════════════
 * Redis Cache Service  —  gr-class-backend
 * ═══════════════════════════════════════════════════════════════
 * Centralised helper for all Redis caching.
 *
 * Usage:
 *   import * as cache from '../../services/cache.service.js';
 *
 *   const data = await cache.getOrSet('my:key', () => heavyDbQuery(), 60);
 *   await cache.del('my:key');
 *   await cache.invalidatePattern('dashboard:*');
 *
 * TTL Guide:
 *   Dashboard stats      → 60  s  (1 min  — near-realtime feel)
 *   User profile (/me)   → 300 s  (5 min)
 *   Site static content  → 3600 s (1 hour — changes rarely)
 *   Certificate types    → 3600 s (1 hour — reference data)
 *   Vessels per client   → 120 s  (2 min)
 * ═══════════════════════════════════════════════════════════════
 */

import { createClient } from 'redis';
import logger from '../utils/logger.js';

const NS = 'gr-class:cache'; // namespace prefix

let _client = null;
let _initPromise = null;

/** Lazy-init: only connects once, reuses the singleton. */
async function getClient() {
    const url = process.env.REDIS_URL;
    if (!url) return null; // Redis not configured — graceful no-op

    if (_client) return _client;

    if (!_initPromise) {
        _initPromise = (async () => {
            try {
                const c = createClient({ url });
                c.on('error', (err) =>
                    logger.warn('[cache] Redis error — cache disabled temporarily', { message: err.message })
                );
                await c.connect();
                logger.info('[cache] Redis cache connected');
                _client = c;
                return c;
            } catch (err) {
                logger.warn('[cache] Redis unavailable — running without cache', { message: err.message });
                return null;
            }
        })();
    }

    return _initPromise;
}

/** Build namespaced key */
const k = (key) => `${NS}:${key}`;

/**
 * Get a cached value.
 * @returns {Promise<any|null>} Parsed JSON value or null on miss.
 */
export async function get(key) {
    try {
        const client = await getClient();
        if (!client) return null;
        const raw = await client.get(k(key));
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        logger.warn('[cache] GET failed', { key, message: err.message });
        return null;
    }
}

/**
 * Set a cached value with TTL.
 * @param {string} key
 * @param {any} value  — will be JSON-serialised
 * @param {number} ttlSeconds
 */
export async function set(key, value, ttlSeconds = 60) {
    try {
        const client = await getClient();
        if (!client) return;
        await client.set(k(key), JSON.stringify(value), { EX: ttlSeconds });
    } catch (err) {
        logger.warn('[cache] SET failed', { key, message: err.message });
    }
}

/**
 * Delete a specific cache key.
 */
export async function del(key) {
    try {
        const client = await getClient();
        if (!client) return;
        await client.del(k(key));
    } catch (err) {
        logger.warn('[cache] DEL failed', { key, message: err.message });
    }
}

/**
 * Delete all keys matching a glob pattern (e.g. 'dashboard:*').
 * Uses SCAN to avoid blocking Redis on large keyspaces.
 */
export async function invalidatePattern(pattern) {
    try {
        const client = await getClient();
        if (!client) return;
        const fullPattern = `${NS}:${pattern}`;
        let cursor = 0;
        do {
            const result = await client.scan(cursor, { MATCH: fullPattern, COUNT: 100 });
            cursor = result.cursor;
            if (result.keys.length) {
                await client.del(result.keys);
                logger.debug('[cache] invalidatePattern deleted keys', { pattern, count: result.keys.length });
            }
        } while (cursor !== 0);
    } catch (err) {
        logger.warn('[cache] invalidatePattern failed', { pattern, message: err.message });
    }
}

/**
 * Convenience: get from cache or compute + store.
 *
 * @param {string} key       Cache key (without namespace)
 * @param {Function} fn      Async function to call on cache miss
 * @param {number} ttl       TTL in seconds
 * @returns {Promise<any>}
 */
export async function getOrSet(key, fn, ttl = 60) {
    const cached = await get(key);
    if (cached !== null) {
        logger.debug('[cache] HIT', { key });
        return cached;
    }
    logger.debug('[cache] MISS — computing', { key });
    const fresh = await fn();
    await set(key, fresh, ttl);
    return fresh;
}

export const TTL = {
    DASHBOARD: 60,        // 1 min  — stats feel near-realtime
    USER_PROFILE: 300,    // 5 min
    SITE_STATIC: 3600,    // 1 hr   — FAQ, news, terms, about
    REFERENCE: 3600,      // 1 hr   — cert types, flag admins (rarely changes)
    VESSELS: 120,         // 2 min  — per-client vessel lists
};

/**
 * Bust ALL dashboard caches (admin, gm, tm, to, all per-user surveyor/client keys).
 * Call this after any mutation that affects dashboard counters:
 *   - Job status change, new job created/cancelled
 *   - Survey status change
 *   - Certificate created/issued/rejected
 *   - New client or vessel created
 *   - Non-conformity opened/closed
 */
export async function invalidateDashboards() {
    await invalidatePattern('dashboard:*');
}

/**
 * Bust the cached /users/me + detail for a specific user.
 * @param {string} userId
 */
export async function invalidateUserProfile(userId) {
    if (!userId) return;
    await Promise.all([
        del(`user:profile:${userId}`),
        del(`user:detail:${userId}`),
    ]);
}

