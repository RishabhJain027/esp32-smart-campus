// lib/auth.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'smartcampus_jwt_secret_fallback';

export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

export async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}

export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

export function validatePassword(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,32}$/;
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (password.length > 32) errors.push('Maximum 32 characters');
    if (!/[A-Z]/.test(password)) errors.push('At least 1 uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('At least 1 lowercase letter');
    if (!/\d/.test(password)) errors.push('At least 1 number');
    if (!/[@$!%*?&]/.test(password)) errors.push('At least 1 special character (@$!%*?&)');
    return { valid: regex.test(password), errors };
}

export function getTokenFromRequest(req) {
    const authHeader = req.headers.get ? req.headers.get('authorization') : req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // Also check cookies
    const cookieHeader = req.headers.get ? req.headers.get('cookie') : req.headers['cookie'];
    if (cookieHeader) {
        const cookies = Object.fromEntries(
            cookieHeader.split(';').map(c => c.trim().split('=').map(decodeURIComponent))
        );
        return cookies['sc_token'];
    }
    return null;
}

export function requireAuth(handler, allowedRoles = []) {
    return async (req, context) => {
        const token = getTokenFromRequest(req);
        if (!token) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const decoded = verifyToken(token);
        if (!decoded) {
            return Response.json({ error: 'Invalid or expired token' }, { status: 401 });
        }
        if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }
        req.user = decoded;
        return handler(req, context);
    };
}
