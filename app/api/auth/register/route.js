// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { hashPassword, validatePassword } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, email, password, role, phone, department, semester } = body;

        // Validate required
        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: 'Name, email, password and role are required' }, { status: 400 });
        }

        const cleanEmail = sanitizeInput(email.trim().toLowerCase());
        const cleanName = sanitizeInput(name.trim());

        // Block admin registration
        if (role === 'admin') {
            return NextResponse.json({ error: 'Admin accounts cannot be self-registered' }, { status: 403 });
        }

        // Password policy
        const { valid, errors } = validatePassword(password);
        if (!valid) {
            return NextResponse.json({ error: `Password requirements: ${errors.join(', ')}` }, { status: 400 });
        }

        // Check duplicate
        const usersRef = collection(db, 'users');
        const dupCheck = query(usersRef, where('email', '==', cleanEmail));
        const dupSnap = await getDocs(dupCheck);
        if (!dupSnap.empty) {
            return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
        }

        const password_hash = await hashPassword(password);
        const docData = {
            uid: uuidv4(),
            name: cleanName,
            email: cleanEmail,
            password_hash,
            role,
            phone: sanitizeInput(phone || ''),
            department: sanitizeInput(department || ''),
            semester: sanitizeInput(semester || ''),
            rfid_uid: '',
            face_embedding: null,
            linkedin_url: '',
            github_url: '',
            profile_photo: '',
            parent_phone: '',
            skills: [],
            projects: [],
            approved: role === 'teacher' ? false : true, // teachers need admin approval
            firstLogin: false,
            created_at: Timestamp.now(),
        };

        const docRef = await addDoc(usersRef, docData);

        return NextResponse.json({
            success: true,
            message: role === 'teacher'
                ? 'Teacher account created. Awaiting admin approval.'
                : 'Account created successfully. You can now log in.',
            id: docRef.id,
        }, { status: 201 });

    } catch (err) {
        console.error('Register error:', err);
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}
