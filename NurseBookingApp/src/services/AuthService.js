// src/services/AuthService.js
// Authentication Service - Replaces AsyncStorage with Firebase Auth

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from './firebase';

class AuthService {
  
  /**
   * Register new user (Patient or Nurse)
   */
  async register(userData) {
    try {
      const { email, password, name, userType, ...additionalData } = userData;
      
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        email, 
        password
      );
      
      const user = userCredential.user;
      
      // 2. Create user document in Firestore
      const userDoc = {
        uid: user.uid,
        email: email,
        name: name,
        userType: userType, // 'patient' or 'nurse'
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        
        // Patient specific fields
        ...(userType === 'patient' && {
          patientData: {
            totalBookings: 0,
            completedBookings: 0,
            rating: 5.0,
            savedAddresses: [],
            favoriteNurses: []
          }
        }),
        
        // Nurse specific fields
        ...(userType === 'nurse' && {
          nurseData: {
            licenseNumber: additionalData.licenseNumber || '',
            specialization: additionalData.specialization || '',
            experience: 'junior',
            yearsOfExperience: 0,
            certifications: [],
            services: [],
            isAvailable: false,
            availabilityStatus: 'offline',
            rating: 5.0,
            totalBookings: 0,
            completedBookings: 0,
            acceptanceRate: 1.0,
            earnings: {
              total: 0,
              thisMonth: 0,
              lastPayout: null
            },
            currentLocation: null
          }
        })
      };
      
      await setDoc(doc(firestore, 'users', user.uid), userDoc);
      
      return {
        success: true,
        user: userDoc
      };
      
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }
  
  /**
   * Login user
   */
  async login(email, password) {
    try {
      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        email, 
        password
      );
      
      const user = userCredential.user;
      
      // 2. Get user data from Firestore
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }
      
      const userData = userDoc.data();
      
      return {
        success: true,
        user: userData
      };
      
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }
  
  /**
   * Logout user
   */
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get current user
   */
  getCurrentUser() {
    return auth.currentUser;
  }
  
  /**
   * Get current user data from Firestore
   */
  async getCurrentUserData() {
    try {
      const user = this.getCurrentUser();
      if (!user) return null;
      
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  }
  
  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = await this.getCurrentUserData();
        callback(userData);
      } else {
        callback(null);
      }
    });
  }
  
  /**
   * Update user profile
   */
  async updateProfile(updates) {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('No user logged in');
      
      await setDoc(
        doc(firestore, 'users', user.uid),
        {
          ...updates,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get user-friendly error messages
   */
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Check your connection'
    };
    
    return errorMessages[errorCode] || 'An error occurred. Please try again';
  }
}

export default new AuthService();
