// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import { isFirebaseConfigured, db } from '@/lib/firebase';
import { hashPassword, validatePassword } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';
import { localDB } from '@/lib/localDB';

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, email, password, role, phone, department, semester } = body;

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: 'Name, email, password and role are required' }, { status: 400 });
        }

        const cleanEmail = sanitizeInput(email.trim().toLowerCase());
        const cleanName = sanitizeInput(name.trim());

        if (role === 'admin') {
            return NextResponse.json({ error: 'Admin accounts cannot be self-registered' }, { status: 403 });
        }

        const { valid, errors } = validatePassword(password);
        if (!valid) {
            return NextResponse.json({ error: `Password requirements: ${errors.join(', ')}` }, { status: 400 });
        }

        // Check duplicate
        const existing = localDB.getUserByEmail(cleanEmail);
        if (existing) {
            return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
        }

        const password_hash = await hashPassword(password);
        const newUser = {
            id: `${role}_${Date.now()}`,
            name: cleanName,
            email: cleanEmail,
            password_hash,
            role,
            phone: sanitizeInput(phone || ''),
            department: sanitizeInput(department || ''),
            semester: sanitizeInput(semester || ''),
            approved: true, // auto-approve for demo
            created_at: new Date().toISOString(),
        };

        // Try Firebase first
        if (isFirebaseConfigured) {
            try {
                const { collection, addDoc, Timestamp } = await import('firebase/firestore');
                const docRef = await addDoc(collection(db, 'users'), {
                    ...newUser,
                    created_at: Timestamp.now(),
                });
                newUser.id = docRef.id;
            } catch (e) {
                console.warn('Firebase save failed, using local DB:', e.message);
            }
        }

        // Also save to local DB
        localDB.addUser(newUser);

        return NextResponse.json({
            success: true,
            message: 'Account created successfully! You can now log in.',
            id: newUser.id,
        }, { status: 201 });

    } catch (err) {
        console.error('Register error:', err);
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}
