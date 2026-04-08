import { NextResponse } from 'next/server';
import { localDB } from '@/lib/localDB';

export async function POST(req) {
    try {
        const { userId, ...updates } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const user = localDB.getUserById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Apply updates
        localDB.updateUser(userId, updates);

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            user: { ...user, ...updates }
        });

    } catch (err) {
        console.error('Update profile error:', err);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
