import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, query, where, doc } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearStudents() {
    console.log('Fetching all students...');
    try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            console.log('No default students found in the database.');
            process.exit(0);
        }

        console.log(`Found ${snapshot.size} students. Deleting...`);
        let deleted = 0;
        
        for (const document of snapshot.docs) {
            await deleteDoc(doc(db, 'users', document.id));
            deleted++;
            console.log(`Deleted student ${deleted}/${snapshot.size}: ${document.id}`);
        }
        
        console.log('Successfully cleared all students.');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing students. Your Firestore rules might not allow client-side deletion:', error);
        process.exit(1);
    }
}

clearStudents();
