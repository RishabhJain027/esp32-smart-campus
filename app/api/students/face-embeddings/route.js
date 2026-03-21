// app/api/students/face-embeddings/route.js
// Returns all enrolled face embeddings so the client can build a local matcher
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function GET(req) {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('face_registered', '==', true), where('role', '==', 'student'));
        const snap = await getDocs(q);

        const profiles = snap.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                name: d.name,
                roll_no: d.roll_no || '',
                department: d.department || '',
                phone: d.phone || '',
                face_embedding: d.face_embedding || [],
            };
        });

        return NextResponse.json({ profiles, count: profiles.length });
    } catch (err) {
        console.warn('face-embeddings offline:', err.message);
        // Return demo profile so the UI still works without Firebase
        return NextResponse.json({
            profiles: [
                {
                    id: 'demo_student',
                    name: 'Demo Student',
                    roll_no: 'CS2021001',
                    department: 'Computer Science',
                    phone: '',
                    face_embedding: Array.from({ length: 128 }, () => 0),
                }
            ],
            count: 1,
            offline: true
        });
    }
}
