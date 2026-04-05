// app/api/entries/route.js
import { NextResponse } from 'next/server';
import { localDB } from '@/lib/localDB';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('student_id');

    let entries = localDB.getEntries();
    if (studentId) {
        entries = localDB.getEntriesByStudent(studentId);
    }
    return NextResponse.json({ entries });
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { student_id, name, gate, method, status } = body;

        const entry = {
            id: `ent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            student_id, name, gate, method, status: status || 'granted',
            time: new Date().toISOString(),
        };

        localDB.addEntry(entry);
        return NextResponse.json({ success: true, entry }, { status: 201 });
    } catch (err) {
        console.error('Entry log error:', err);
        return NextResponse.json({ error: 'Failed to log entry' }, { status: 500 });
    }
}
