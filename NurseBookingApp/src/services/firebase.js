// src/services/firebase.js
// Firebase Configuration and Initialization

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

// Firebase configuration
// TODO: Replace with your Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyD5YoL0mFulCru2zT80pR6Mxj1VQbkD7ZQ",
  authDomain: "nursebookingapp.firebaseapp.com",
  projectId: "nursebookingapp",
  storageBucket: "nursebookingapp.firebasestorage.app",
  messagingSenderId: "799723761248",
  appId: "1:799723761248:web:7996e1420b7b507428dd05"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);

export default app;

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project or select existing
 * 3. Add a Web app to your project
 * 4. Copy the firebaseConfig object
 * 5. Replace the config above with your values
 * 
 * 6. Enable the following in Firebase Console:
 *    - Authentication > Sign-in method > Email/Password
 *    - Firestore Database > Create database (start in test mode)
 *    - Realtime Database > Create database
 *    - Cloud Messaging (for notifications)
 * 
 * 7. Install required packages:
 *    npm install firebase
 *    npm install @react-native-firebase/app (if using native modules)
 */
