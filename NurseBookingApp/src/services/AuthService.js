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
   * Build the user document object
   */
  buildUserDoc(uid, { email, name, userType, licenseNumber, specialization }) {
    return {
      uid,
      email,
      name,
      userType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      ...(userType === 'patient' && {
        patientData: {
          totalBookings: 0,
          completedBookings: 0,
          rating: 5.0,
          savedAddresses: [],
          favoriteNurses: []
        }
      }),

      ...(userType === 'nurse' && {
        nurseData: {
          licenseNumber: licenseNumber || '',
          specialization: specialization || '',
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
  }

  /**
   * Register new user (Patient or Nurse)
   */
  async register(userData) {
    try {
      const { email, password, name, userType, licenseNumber, specialization } = userData;
      let user;

      try {
        // 1. Try to create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
      } catch (authError) {
        // If email already exists, check if it's an orphaned Auth user (no Firestore doc)
        if (authError.code === 'auth/email-already-in-use') {
          const signInCredential = await signInWithEmailAndPassword(auth, email, password);
          const existingUser = signInCredential.user;

          // Check if Firestore doc exists
          const existingDoc = await getDoc(doc(firestore, 'users', existingUser.uid));
          if (existingDoc.exists()) {
            // Doc exists — genuine duplicate registration
            return {
              success: false,
              error: 'This email is already registered'
            };
          }

          // Doc doesn't exist — orphaned Auth user, recover it
          user = existingUser;
        } else {
          throw authError;
        }
      }

      // 2. Create user document in Firestore
      const userDoc = this.buildUserDoc(user.uid, { email, name, userType, licenseNumber, specialization });
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 2. Get user data from Firestore
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      
      if (!userDoc.exists()) {
        return {
          success: false,
          error: 'Account is incomplete. Please register again.'
        };
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
      'auth/invalid-credential': 'Invalid email or password',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Check your connection',
      'auth/operation-not-allowed': 'Email/password sign-in is not enabled',
      'auth/internal-error': 'An internal error occurred. Please try again',
    };
    
    return errorMessages[errorCode] || 'An error occurred. Please try again';
  }
}

export default new AuthService();