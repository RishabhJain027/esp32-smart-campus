import { NextResponse } from 'next/server';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('photo');
        const userId = formData.get('userId');

        if (!file || !userId) {
            return NextResponse.json({ error: 'Photo file and userId are required' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `profiles/${userId}_${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, fileName);

        // Upload to Firebase Storage
        const snapshot = await uploadBytes(storageRef, new Uint8Array(buffer), {
            contentType: file.type || 'image/jpeg',
        });

        // Get public URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Update user doc in Firestore
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            profile_photo: downloadURL
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Photo uploaded successfully',
            url: downloadURL 
        });

    } catch (err) {
        console.error('Photo upload error:', err);
        return NextResponse.json({ error: 'Failed to upload photo to Cloud Storage' }, { status: 500 });
    }
}
