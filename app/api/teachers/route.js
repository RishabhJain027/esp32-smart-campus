import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';

export async function GET(req) {
    try {
        const teachersRef = collection(db, 'users');
        const q = query(teachersRef, where('role', '==', 'teacher'));
        const snap = await getDocs(q);
        
        const teachers = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            password_hash: undefined
        }));

        return NextResponse.json({ teachers });
    } catch (err) {
        console.warn('Firebase /teachers fetching error (Offline Mode):', err.message);
        return NextResponse.json({ teachers: [
            { id: 't1', name: 'Prof. Sharma', email: 'sharma@college.edu', role: 'teacher', department: 'Computer Science' }
        ]});
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, email, department, phone } = body;

        const docRef = await addDoc(collection(db, 'users'), {
            name, email, department, phone,
            role: 'teacher',
            approved: true,
            created_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true, id: docRef.id });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to add teacher' }, { status: 500 });
    }
}
