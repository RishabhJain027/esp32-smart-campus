import { NextResponse } from 'next/server';
import { localDB } from '@/lib/localDB';
import fs from 'fs';
import path from 'path';

// Store profile photos in public/uploads/profiles/
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'profiles');

function ensureUploadsDir() {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
}

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('photo');
        const userId = formData.get('userId');

        if (!file || !userId) {
            return NextResponse.json({ error: 'Photo file and userId are required' }, { status: 400 });
        }

        // Validate it's an image
        if (!file.type?.startsWith('image/')) {
            return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
        }

        // Validate user exists
        const user = localDB.getUserById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        ensureUploadsDir();

        // Save file to public/uploads/profiles/
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const fileName = `${userId}_${Date.now()}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        fs.writeFileSync(filePath, buffer);

        // Public URL (served by Next.js static assets)
        const publicUrl = `/uploads/profiles/${fileName}`;

        // Delete old photo if it exists and was stored locally
        if (user.profile_photo && user.profile_photo.startsWith('/uploads/')) {
            const oldPath = path.join(process.cwd(), 'public', user.profile_photo);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        // Update user in DB
        localDB.updateUser(userId, { profile_photo: publicUrl });

        return NextResponse.json({
            success: true,
            message: 'Profile photo updated successfully',
            url: publicUrl,
        });

    } catch (err) {
        console.error('Photo upload error:', err);
        return NextResponse.json({ error: 'Failed to upload photo: ' + err.message }, { status: 500 });
    }
}
