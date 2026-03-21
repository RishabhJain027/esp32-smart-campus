import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

export async function GET(req) {
    try {
        const q = query(collection(db, 'campus_entries'), orderBy('timestamp', 'desc'), limit(50));
        const snap = await getDocs(q);
        const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({ logs });
    } catch (err) {
        return NextResponse.json({ logs: [
            { id: 'e1', student_name: 'Rishabh Jain', method: 'RFID', gate: 'Main Gate', timestamp: new Date().toISOString() }
        ]}); // Offline dummy data
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        // Hardware ESP32 sends UID when someone enters the gate
        const { hardware_uid, rfid, method } = body;

        let entryData = {
            method: method || 'RFID',
            gate: 'Main Gate',
            timestamp: new Date().toISOString(),
            rfid_scanned: rfid,
            hardware_reported: hardware_uid
        };

        const docRef = await addDoc(collection(db, 'campus_entries'), entryData);

        return NextResponse.json({ success: true, message: 'Campus entry logged', id: docRef.id });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to log campus entry' }, { status: 500 });
    }
}
