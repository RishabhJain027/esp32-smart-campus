// app/api/students/face-embeddings/route.js
import { NextResponse } from 'next/server';
import { localDB } from '@/lib/localDB';

export async function GET(req) {
    try {
        const students = localDB.getStudents();
        const profiles = students.filter(s => s.face_embedding && s.face_embedding.length === 128).map(s => ({
            id: s.id,
            name: s.name,
            roll_no: s.id,
            face_embedding: s.face_embedding,
        }));
        
        return NextResponse.json({ profiles, count: profiles.length });
    } catch (err) {
        console.warn('face-embeddings offline:', err.message);
        return NextResponse.json({ error: 'Failed to load face embeddings' }, { status: 500 });
    }
}
