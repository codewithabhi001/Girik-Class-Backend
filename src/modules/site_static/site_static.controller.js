import db from '../../models/index.js';
import * as fileAccessService from '../../services/fileAccess.service.js';
import * as cache from '../../services/cache.service.js';

// Helper to resolve model instance
const getContentByKey = async (key) => {
    if (key === 'faq') {
        return await db.SiteStaticContent.findOne({ where: { key }, attributes: { exclude: ['updatedAt', 'createdAt', 'deletedAt', 'news_items'] } });
    }
    if (key === 'news') {
        return await db.SiteStaticContent.findOne({ where: { key }, attributes: { exclude: ['updatedAt', 'createdAt', 'deletedAt', 'faq_items'] } });
    }
    if (key === 'about-us' || key === 'privacy' || key === 'terms-compliance') {
        return await db.SiteStaticContent.findOne({ where: { key }, attributes: { exclude: ['updatedAt', 'createdAt', 'deletedAt', 'faq_items', 'news_items'] } });
    }
    return await db.SiteStaticContent.findOne({ where: { key } });
};

// 1. FAQ Endpoint
export const getFaq = async (req, res, next) => {
    try {
        const data = await cache.getOrSet('site:faq', async () => {
            const record = await getContentByKey('faq');
            if (!record) return null;
            return await fileAccessService.resolveEntity(record);
        }, cache.TTL.SITE_STATIC);
        if (!data) return res.status(404).json({ success: false, message: 'FAQ content not found.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 2. NEWS Endpoint
export const getNews = async (req, res, next) => {
    try {
        const data = await cache.getOrSet('site:news', async () => {
            const record = await getContentByKey('news');
            if (!record) return null;
            return await fileAccessService.resolveEntity(record.news_items || []);
        }, cache.TTL.SITE_STATIC);
        if (!data) return res.status(404).json({ success: false, message: 'News content not found.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 3. Privacy Endpoint
export const getPrivacy = async (req, res, next) => {
    try {
        const data = await cache.getOrSet('site:privacy', async () => {
            const record = await getContentByKey('privacy');
            if (!record) return null;
            return await fileAccessService.resolveEntity(record);
        }, cache.TTL.SITE_STATIC);
        if (!data) return res.status(404).json({ success: false, message: 'Privacy policy not found.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 4. Terms and Compliance Endpoint
export const getTerms = async (req, res, next) => {
    try {
        const data = await cache.getOrSet('site:terms', async () => {
            const record = await getContentByKey('terms-compliance');
            if (!record) return null;
            return await fileAccessService.resolveEntity(record);
        }, cache.TTL.SITE_STATIC);
        if (!data) return res.status(404).json({ success: false, message: 'Terms and compliance content not found.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// 5. About Us Endpoint
export const getAboutUs = async (req, res, next) => {
    try {
        const data = await cache.getOrSet('site:about-us', async () => {
            const record = await getContentByKey('about-us');
            if (!record) return null;
            return await fileAccessService.resolveEntity(record);
        }, cache.TTL.SITE_STATIC);
        if (!data) return res.status(404).json({ success: false, message: 'About Us content not found.' });
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const getCacheKey = (key) => {
    if (key === 'terms-compliance') return 'site:terms';
    return `site:${key}`;
};

// Admin Update Endpoint — invalidate cache on save
export const updateContent = async (req, res, next) => {
    try {
        const { key } = req.params;
        const record = await getContentByKey(key);
        if (!record) {
            return res.status(404).json({ success: false, message: `Static content for key '${key}' not found.` });
        }

        const { title, body_html, faq_items, news_items } = req.body;

        if (title !== undefined) record.title = title;
        if (body_html !== undefined) record.body_html = body_html;
        if (faq_items !== undefined) record.faq_items = faq_items;
        if (news_items !== undefined) record.news_items = news_items;

        await record.save();

        // Bust cache so next request fetches fresh content
        await cache.del(getCacheKey(key));

        res.status(200).json({ success: true, message: 'Content updated successfully.', data: await fileAccessService.resolveEntity(record) });
    } catch (error) {
        next(error);
    }
};

export const createContent = async (req, res, next) => {
    try {
        const { key, title, body_html, faq_items, news_items } = req.body;
        const existing = await getContentByKey(key);
        if (existing) {
            return res.status(400).json({ success: false, message: `Content with key '${key}' already exists.` });
        }
        const record = await db.SiteStaticContent.create({
            key,
            title,
            body_html,
            faq_items,
            news_items
        });
        
        // Invalidate cache in case there is some stale/empty data in cache
        await cache.del(getCacheKey(key));

        res.status(201).json({ success: true, message: 'Content created successfully.', data: await fileAccessService.resolveEntity(record) });
    } catch (error) {
        next(error);
    }
};
