import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        console.log('Fetching students to delete...');
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const snapshot = await getDocs(q);
        
        let deletedCount = 0;
        for (const document of snapshot.docs) {
            await deleteDoc(doc(db, 'users', document.id));
            deletedCount++;
        }
        
        return NextResponse.json({ success: true, message: `Deleted ${deletedCount} students.` });
    } catch (error) {
        console.error('Clear students error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
