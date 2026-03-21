// lib/security.js

const rateLimitMap = new Map();

export function rateLimit(ip, maxRequests = 5, windowMs = 10 * 60 * 1000) {
    const now = Date.now();
    const key = ip;

    if (!rateLimitMap.has(key)) {
        rateLimitMap.set(key, { count: 1, firstRequest: now, blocked: false, blockedUntil: 0 });
        return { allowed: true };
    }

    const record = rateLimitMap.get(key);

    if (record.blocked) {
        if (now < record.blockedUntil) {
            const remaining = Math.ceil((record.blockedUntil - now) / 1000 / 60);
            return { allowed: false, message: `Too many attempts. Try again in ${remaining} minutes.` };
        } else {
            rateLimitMap.set(key, { count: 1, firstRequest: now, blocked: false, blockedUntil: 0 });
            return { allowed: true };
        }
    }

    if (now - record.firstRequest > windowMs) {
        rateLimitMap.set(key, { count: 1, firstRequest: now, blocked: false, blockedUntil: 0 });
        return { allowed: true };
    }

    record.count += 1;
    if (record.count > maxRequests) {
        record.blocked = true;
        record.blockedUntil = now + windowMs;
        return { allowed: false, message: 'Too many login attempts. Account locked for 10 minutes.' };
    }

    return { allowed: true };
}

export function sanitizeInput(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

export function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    const sanitized = {};
    for (const [key, val] of Object.entries(obj)) {
        sanitized[key] = typeof val === 'string' ? sanitizeInput(val) : val;
    }
    return sanitized;
}

export function getClientIp(req) {
    return (
        req.headers.get?.('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        '127.0.0.1'
    );
}

export function securityHeaders() {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=self',
    };
}
