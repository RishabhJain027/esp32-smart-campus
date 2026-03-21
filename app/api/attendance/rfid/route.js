// app/api/attendance/rfid/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { sendWhatsAppMessage, buildAttendanceMessage } from '@/lib/whatsapp';
import { appendToSheet } from '@/lib/sheets';

export async function POST(req) {
    try {
        const body = await req.json();
        const { rfid, lecture_id, gate_id, sensor_count = 1 } = body;

        if (!rfid) {
            return NextResponse.json({ error: 'RFID UID required' }, { status: 400 });
        }

        // Validate ESP32 API key (simple shared secret for hardware)
        const apiKey = req.headers.get('x-api-key');
        const token = getTokenFromRequest(req);
        const decoded = token ? verifyToken(token) : null;
        const isESP32 = apiKey === (process.env.ESP32_API_KEY || 'esp32_secret_2026');
        if (!decoded && !isESP32) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find student by RFID
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('rfid_uid', '==', rfid), where('role', '==', 'student'));
        const snap = await getDocs(q);

        if (snap.empty) {
            return NextResponse.json({ success: false, message: 'RFID not registered', gate_action: 'deny' }, { status: 404 });
        }

        const studentDoc = snap.docs[0];
        const student = { id: studentDoc.id, ...studentDoc.data() };
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString('en-IN');

        // Check duplicate scan for same lecture
        if (lecture_id) {
            const attRef = collection(db, 'attendance');
            const dupQ = query(attRef, where('student_id', '==', student.id), where('lecture_id', '==', lecture_id));
            const dupSnap = await getDocs(dupQ);
            if (!dupSnap.empty) {
                return NextResponse.json({
                    success: false, message: 'Already marked for this lecture',
                    student: { name: student.name, roll: student.roll_no },
                    gate_action: 'allow',
                });
            }
        }

        // Record attendance
        const attRef = collection(db, 'attendance');
        await addDoc(attRef, {
            student_id: student.id,
            lecture_id: lecture_id || null,
            date: dateStr,
            time: timeStr,
            method: 'RFID',
            status: 'present',
            rfid_uid: rfid,
            created_at: Timestamp.now(),
        });

        // Security check: multi-person entry
        const securityAlert = sensor_count > 1;
        if (gate_id) {
            const logsRef = collection(db, 'entry_logs');
            await addDoc(logsRef, {
                student_id: student.id,
                entry_time: Timestamp.now(),
                gate_id: gate_id || 'main',
                verification_method: 'RFID',
                sensor_count,
                security_alert: securityAlert,
            });
        }

        // WhatsApp notification
        if (student.phone) {
            await sendWhatsAppMessage(
                student.phone,
                buildAttendanceMessage(student.name, 'Today\'s Lecture', timeStr, 'Present')
            );
        }

        // Log to Google Sheets
        appendToSheet([
            dateStr,
            timeStr,
            student.roll_no || student.id,
            student.name,
            'RFID',
            'Present'
        ]).catch(console.error);

        return NextResponse.json({
            success: true,
            message: 'Attendance marked successfully',
            student: { name: student.name, roll: student.roll_no, id: student.id },
            gate_action: 'allow',
            security_alert: securityAlert,
            timestamp: now.toISOString(),
        });

    } catch (err) {
        console.error('RFID attendance error:', err);
        return NextResponse.json({ error: 'Server error', gate_action: 'deny' }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const token = getTokenFromRequest(req);
        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('student_id');
        const date = searchParams.get('date');

        const attRef = collection(db, 'attendance');
        let q = query(attRef, orderBy('created_at', 'desc'), limit(50));
        if (studentId) q = query(attRef, where('student_id', '==', studentId), orderBy('created_at', 'desc'));

        const snap = await getDocs(q);
        const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ records });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
