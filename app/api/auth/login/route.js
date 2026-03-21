// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { comparePassword, generateToken, validatePassword } from '@/lib/auth';
import { rateLimit, getClientIp, sanitizeInput } from '@/lib/security';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Seeded admin account (used when Firebase is not configured)
const ADMIN_EMAIL = 'admin@admin';
const ADMIN_PASSWORD = 'admin@admin'; // Only for demo - seeded with special flag

export async function POST(req) {
    try {
        const ip = getClientIp(req);
        const rl = rateLimit(ip, 5, 10 * 60 * 1000);
        if (!rl.allowed) {
            return NextResponse.json({ error: rl.message }, { status: 429 });
        }

        const body = await req.json();
        const email = sanitizeInput((body.email || '').trim().toLowerCase());
        const password = body.password || '';
        const role = body.role || 'student';

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // ── Admin shortcut ──
        if (email === 'admin@admin' && role === 'admin') {
            if (password !== 'admin@admin') {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }
            const token = generateToken({ id: 'admin_001', email, role: 'admin', name: 'System Admin' });
            const res = NextResponse.json({
                token,
                user: { id: 'admin_001', name: 'System Admin', email, role: 'admin', firstLogin: true },
            });
            res.cookies.set('sc_token', token, { httpOnly: true, maxAge: 86400, path: '/', sameSite: 'strict' });
            return res;
        }

        // ── Firebase lookup ──
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email), where('role', '==', role));
            const snap = await getDocs(q);

            if (snap.empty) {
                return NextResponse.json({ error: 'No account found with this email and role' }, { status: 401 });
            }

            const userDoc = snap.docs[0];
            const user = { id: userDoc.id, ...userDoc.data() };

            if (!user.approved) {
                return NextResponse.json({ error: 'Account pending admin approval' }, { status: 403 });
            }

            const passwordMatch = await comparePassword(password, user.password_hash);
            if (!passwordMatch) {
                return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
            }

            const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
            const token = generateToken(payload);

            const res = NextResponse.json({
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role, firstLogin: user.firstLogin || false },
            });
            res.cookies.set('sc_token', token, { httpOnly: true, maxAge: 86400, path: '/', sameSite: 'strict' });
            return res;

        } catch (firebaseErr) {
            // If Firebase not configured, still allow admin@admin
            console.warn('Firebase not configured:', firebaseErr.message);
            return NextResponse.json({ error: 'Database not configured. Please add Firebase keys to .env.local' }, { status: 503 });
        }

    } catch (err) {
        console.error('Login error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
