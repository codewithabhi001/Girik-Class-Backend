/**
 * Spam detection utility for contact and enquiry forms.
 * Provides checks for:
 * 1. Disposable / temporary email domains
 * 2. High-risk spam keywords and URL spam clusters
 * 3. Gibberish / random character patterns (high consonant ratio, character entropy)
 */

// Common disposable email domains
const DISPOSABLE_EMAIL_DOMAINS = new Set([
    'mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com',
    'trashmail.com', 'sharklasers.com', 'dispostable.com', 'getnada.com',
    'yopmail.com', 'tempmailo.com', 'throwawaymail.com', 'temp-mail.org',
    'boun.cr', 'mytemp.email', 'fakeinbox.com', 'generator.email',
    'mohmal.com', 'crazymailing.com', 'tmail.ws', 'inboxalias.com'
]);

// Known spam keywords (case-insensitive search)
const SPAM_KEYWORDS = [
    'casino', 'crypto', 'bitcoin', 'usdt', 'viagra', 'cialis',
    'backlink', 'seo ranking', 'whatsapp group', 'telegram channel',
    'make money fast', 'earn cash', 'slot online', 'poker online',
    'adult dating', 'sex video', 'porn', 'pyramid scheme', 'fast loan'
];

/**
 * Check if email belongs to a disposable / temporary email provider
 */
export const isDisposableEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const parts = email.trim().toLowerCase().split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1];
    return DISPOSABLE_EMAIL_DOMAINS.has(domain);
};

/**
 * Check if text contains known spam keywords or excess link URLs
 */
export const containsSpamKeywords = (text) => {
    if (!text || typeof text !== 'string') return false;
    const lowerText = text.toLowerCase();

    // Check keyword matches
    const hasKeyword = SPAM_KEYWORDS.some(keyword => lowerText.includes(keyword));
    if (hasKeyword) return true;

    // Check excess URL links (more than 2 http/https links)
    const urlMatches = lowerText.match(/https?:\/\/[^\s]+/g);
    if (urlMatches && urlMatches.length > 2) return true;

    return false;
};

/**
 * Calculate Shannon Entropy of a string to detect randomized gibberish
 */
const calculateEntropy = (str) => {
    if (!str) return 0;
    const len = str.length;
    const frequencies = {};
    for (let i = 0; i < len; i++) {
        const char = str[i];
        frequencies[char] = (frequencies[char] || 0) + 1;
    }
    let entropy = 0;
    for (const char in frequencies) {
        const p = frequencies[char] / len;
        entropy -= p * Math.log2(p);
    }
    return entropy;
};

/**
 * Check if string looks like random gibberish text
 */
export const isGibberish = (text) => {
    if (!text || typeof text !== 'string') return false;
    const cleaned = text.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (cleaned.length < 6) return false;

    // 1. Repeating single character pattern (e.g. "aaaaaaa", "zzzzzzz")
    if (/^(.)\1{4,}$/.test(cleaned)) return true;

    // 2. High consonant ratio (> 85% consonants with no vowels)
    const vowels = (cleaned.match(/[aeiou]/g) || []).length;
    const consonants = cleaned.length - vowels;
    const consonantRatio = consonants / cleaned.length;
    if (consonantRatio > 0.85 && vowels === 0) return true;

    // 3. High entropy for short random strings (e.g. "zkxjfghvqp")
    if (cleaned.length >= 8 && cleaned.length <= 30) {
        const entropy = calculateEntropy(cleaned);
        if (entropy > 3.8 && vowels <= 1) return true;
    }

    return false;
};

/**
 * Combined scan for enquiry payload
 */
export const scanEnquiryPayload = ({ full_name, corporate_email, subject, message }) => {
    if (isDisposableEmail(corporate_email)) {
        return { isSpam: true, reason: 'REJECTED_DISPOSABLE_EMAIL' };
    }

    if (isGibberish(full_name)) {
        return { isSpam: true, reason: 'REJECTED_GIBBERISH_NAME' };
    }

    if (subject && isGibberish(subject)) {
        return { isSpam: true, reason: 'REJECTED_GIBBERISH_SUBJECT' };
    }

    if (containsSpamKeywords(message) || containsSpamKeywords(subject)) {
        return { isSpam: true, reason: 'REJECTED_SPAM_KEYWORD' };
    }

    if (isGibberish(message)) {
        return { isSpam: true, reason: 'REJECTED_GIBBERISH_MESSAGE' };
    }

    return { isSpam: false, reason: null };
};
