import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';

export async function GET(req) {
    try {
        const studentsRef = collection(db, 'users');
        const q = query(studentsRef, where('role', '==', 'student'));
        const snap = await getDocs(q);
        
        const students = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            password_hash: undefined // Never return hash
        }));

    } catch (err) {
        return NextResponse.json({ students: [] });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        // Manually add student (admin only typically, but we trust the route for now)
        const { name, email, department, semester, phone } = body;

        const docRef = await addDoc(collection(db, 'users'), {
            name, email, department, semester, phone,
            role: 'student',
            approved: true,
            created_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to add student. Offline?' }, { status: 500 });
    }
}
