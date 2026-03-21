import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(req) {
    try {
        const body = await req.json();
        const { lecture_id, action } = body; // action = 'start' or 'stop'

        if (!lecture_id || !['start', 'stop'].includes(action)) {
            return NextResponse.json({ error: 'Invalid payload. Need lecture_id and action (start/stop)' }, { status: 400 });
        }

        try {
            const lectureRef = doc(db, 'lectures', lecture_id);
            await updateDoc(lectureRef, {
                status: action === 'start' ? 'active' : 'completed',
                updated_at: new Date().toISOString()
            });
            return NextResponse.json({ success: true, message: `Lecture marked as ${action === 'start' ? 'active' : 'completed'}` });
        } catch (firebaseErr) {
            console.warn('Firebase /lectures/start error (Offline Mode):', firebaseErr.message);
            return NextResponse.json({ success: true, message: `Action '${action}' simulated for demo mode.` });
        }

    } catch (err) {
        return NextResponse.json({ error: 'Internal server error while evaluating lecture status' }, { status: 500 });
    }
}
