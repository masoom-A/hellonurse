// src/services/firebase.js
// Firebase Configuration and Initialization

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
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

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize services
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);

export default app;