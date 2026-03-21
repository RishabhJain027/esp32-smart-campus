// app/api/attendance/face/route.js
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { sendWhatsAppMessage, buildAttendanceMessage } from '@/lib/whatsapp';
import { appendToSheet } from '@/lib/sheets';

export async function POST(req) {
    try {
        const token = getTokenFromRequest(req);
        const decoded = verifyToken(token);
        if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { faceId, lecture_id, timestamp } = body;

        if (!faceId) {
            return NextResponse.json({ error: 'Face ID required' }, { status: 400 });
        }

        // Find student by face embedding ID
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('face_id', '==', faceId));
        const snap = await getDocs(q);

        let student;
        if (snap.empty) {
            // Fallback: use token user (student scanning their own face)
            student = { id: decoded.id, name: decoded.name, roll_no: '', phone: '' };
        } else {
            const doc = snap.docs[0];
            student = { id: doc.id, ...doc.data() };
        }

        const now = new Date(timestamp || Date.now());
        const timeStr = now.toLocaleTimeString('en-IN');

        // Duplicate check
        if (lecture_id) {
            const attRef = collection(db, 'attendance');
            const dupQ = query(attRef, where('student_id', '==', student.id), where('lecture_id', '==', lecture_id), where('method', '==', 'Face'));
            const dupSnap = await getDocs(dupQ);
            if (!dupSnap.empty) {
                return NextResponse.json({ success: false, message: 'Already marked via face for this lecture' });
            }
        }

        // Record
        const attRef = collection(db, 'attendance');
        const docRef = await addDoc(attRef, {
            student_id: student.id,
            lecture_id: lecture_id || null,
            date: now.toISOString().split('T')[0],
            time: timeStr,
            method: 'Face',
            status: 'present',
            face_id: faceId,
            created_at: Timestamp.now(),
        });

        // WhatsApp
        if (student.phone) {
            await sendWhatsAppMessage(
                student.phone,
                buildAttendanceMessage(student.name, 'Today\'s Lecture', timeStr, 'Present')
            );
        }

        // Log to Google Sheets
        appendToSheet([
            now.toISOString().split('T')[0],
            timeStr,
            student.roll_no || student.id,
            student.name,
            'Face',
            'Present'
        ]).catch(console.error);

        return NextResponse.json({
            success: true,
            message: 'Face attendance marked',
            student: { name: student.name, roll: student.roll_no },
            attendance_id: docRef.id,
        });

    } catch (err) {
        console.error('Face attendance error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
