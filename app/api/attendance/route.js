// app/api/attendance/route.js
import { NextResponse } from 'next/server';
import { localDB } from '@/lib/localDB';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { appendToSheet } from '@/lib/sheets';


// GET — get attendance records (filtered by student_id, subject, date)
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('student_id');
    const subject = searchParams.get('subject');
    const date = searchParams.get('date');

    let records = localDB.getAttendance();
    if (studentId) records = records.filter(r => r.student_id === studentId);
    if (subject) records = records.filter(r => r.subject === subject);
    if (date) records = records.filter(r => r.date === date);

    // Calculate subject-wise summary for student
    if (studentId && !subject && !date) {
        const subjects = {};
        records.forEach(r => {
            if (!subjects[r.subject]) subjects[r.subject] = { subject: r.subject, present: 0, total: 0 };
            subjects[r.subject].total++;
            if (r.status === 'present') subjects[r.subject].present++;
        });
        const summary = Object.values(subjects).map(s => ({
            ...s,
            percentage: Math.round((s.present / s.total) * 100),
        }));
        return NextResponse.json({ records, summary });
    }

    return NextResponse.json({ records });
}

// POST — mark attendance
export async function POST(req) {
    try {
        const body = await req.json();
        const { student_id, student_name, subject, date, status, method, teacher_id } = body;

        if (!student_id || !subject || !date || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const record = {
            id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            student_id, student_name: student_name || '', subject, date,
            status, method: method || 'Manual', teacher_id: teacher_id || '',
            created_at: new Date().toISOString(),
        };

        // Save local
        localDB.addAttendance(record);

        // Save to Google Sheets
        try {
            await appendToSheet([
                record.id, record.student_id, record.student_name,
                record.subject, record.date, record.status, record.method, record.created_at
            ]);
        } catch(e) {
            console.warn("Sheet append failed", e);
        }

        return NextResponse.json({ success: true, record }, { status: 201 });
    } catch (err) {
        console.error('Attendance error:', err);
        return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
    }
}
