// app/api/students/route.js
import { NextResponse } from 'next/server';
import { localDB } from '@/lib/localDB';

export async function GET(req) {
    const students = localDB.getStudents().map(s => ({
        id: s.id, name: s.name, email: s.email,
        department: s.department, semester: s.semester,
        phone: s.phone, approved: s.approved,
        rfid_uid: s.rfid_uid, face_status: s.face_status, profile_photo: s.profile_photo,
    }));
    return NextResponse.json({ students });
}
