import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration for your project
const firebaseConfig = {
    apiKey: "AIzaSyB_dLHcwU9kfAZ2sd_w52Wk_hKRbD5Ee8g",
    authDomain: "collaborativelearning-ono.firebaseapp.com",
    projectId: "collaborativelearning-ono",
    storageBucket: "collaborativelearning-ono.firebasestorage.app",
    messagingSenderId: "34474671446",
    appId: "1:34474671446:web:f416421e9e20a5f1856af7",
    measurementId: "G-W51V007Y3E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

// Using production Firestore (no emulator)
console.log('🔥 Firebase initialized with project:', firebaseConfig.projectId);

// Test Firestore connection
async function testFirestoreConnection() {
  try {
    console.log('🔍 Testing Firestore connection...');
    // Try to read from a test collection
    const { getDocs, collection } = await import('firebase/firestore');
    const testSnapshot = await getDocs(collection(db, 'test'));
    console.log('✅ Firestore connection successful');
  } catch (error: any) {
    console.error('❌ Firestore connection failed:', error);
    if (error?.code === 'permission-denied') {
      console.error('🔒 Permission denied. Please check Firestore security rules.');
    } else if (error?.code === 'unavailable') {
      console.error('🌐 Firestore service unavailable. Check your internet connection.');
    }
  }
}

// Test connection after a brief delay
setTimeout(testFirestoreConnection, 1000);

export default app; 