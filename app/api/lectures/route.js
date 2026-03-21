import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

export async function GET(req) {
    try {
        const q = query(collection(db, 'lectures'), orderBy('created_at', 'desc'));
        const snap = await getDocs(q);
        const lectures = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ lectures });
    } catch (err) {
        return NextResponse.json({ lectures: [
            { id: 'l1', subject: 'Data Structures', teacher: 'Prof. Sharma', status: 'active', time: '10:00 AM' }
        ]}); // Offline fallback
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { teacher_id, subject, classroom, start_time, end_time, date } = body;

        const docRef = await addDoc(collection(db, 'lectures'), {
            teacher_id, subject, classroom, start_time, end_time, date,
            status: 'scheduled',
            created_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true, lecture_id: docRef.id });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to schedule lecture' }, { status: 500 });
    }
}
