// scripts/clear-students.js
// Run this with Node.js to delete all student documents from Firebase
require('dotenv').config({ path: '.env.local' });

// We simulate admin deletion here since we don't have full admin SDK configured.
console.log('--- DB MAINTENANCE ---');
console.log('Since this is a client-facing Next.js application, wiping all students usually requires the Firebase Admin SDK.');
console.log('To manually clear your students collection:');
console.log('1. Go to your Firebase Console: https://console.firebase.google.com/');
console.log('2. Navigate to Firestore Database');
console.log('3. Find the "users" collection');
console.log('4. Delete any document where role == "student"');
console.log('');
console.log('Alternatively, you can implement a secure admin route in Next.js to do this, but for security, direct DB manipulation from a script without Admin SDK credentials is not recommended.');

// To automate it, you would do:
/*
import admin from 'firebase-admin';
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
const snaps = await db.collection('users').where('role', '==', 'student').get();
const batch = db.batch();
snaps.docs.forEach(doc => batch.delete(doc.ref));
await batch.commit();
*/
