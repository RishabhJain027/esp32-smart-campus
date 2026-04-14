import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(req) {
    try {
        const body = await req.json();
        const { userId, faceDescriptor } = body;

        if (!userId || !faceDescriptor || faceDescriptor.length !== 128) {
            return NextResponse.json({ error: 'Invalid face descriptor data' }, { status: 400 });
        }

        // Update localDB for offline/local functionality
        try {
            const { localDB } = await import('@/lib/localDB');
            localDB.updateUser(userId, {
                face_embedding: faceDescriptor,
                face_status: 'trained'
            });
        } catch (localErr) {
            console.error('Local JSON update error:', localErr.message);
        }

        // We use a mock admin handling if Firebase is down, but normally we update doc:
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                face_embedding: faceDescriptor,
                face_registered: true
            });
            return NextResponse.json({ success: true, message: 'Face data updated' });
        } catch (firebaseErr) {
            console.error('Firebase face upload error:', firebaseErr.message);
            // Return success anyway for the frontend demo layer to proceed if offline
            return NextResponse.json({ success: true, message: 'Face data processed (Offline Mode)' });
        }

    } catch (err) {
        return NextResponse.json({ error: 'Internal server error while uploading face' }, { status: 500 });
    }
}
