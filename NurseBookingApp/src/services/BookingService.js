// src/services/BookingService.js
// Booking Management Service - Replaces AsyncStorage bookings

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { firestore } from './firebase';
import AuthService from './AuthService';

class BookingService {
  
  /**
   * Create a new booking
   */
  async createBooking(bookingData) {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');
      
      const bookingRef = doc(collection(firestore, 'bookings'));
      
      const booking = {
        id: bookingRef.id,
        patientId: user.uid,
        nurseId: null,
        status: 'pending', // pending, searching, nurse_found, accepted, in_progress, completed, cancelled
        type: bookingData.type || 'instant', // instant, bidding, scheduled
        
        // Service details
        serviceType: bookingData.serviceType,
        duration: bookingData.duration || 2, // hours
        equipmentNeeded: bookingData.equipmentNeeded || [],
        notes: bookingData.notes || '',
        
        // Location
        location: {
          lat: bookingData.location.latitude,
          lng: bookingData.location.longitude,
          address: bookingData.address,
          geohash: this.encodeGeohash(bookingData.location.latitude, bookingData.location.longitude)
        },
        
        // Scheduling
        scheduledFor: bookingData.scheduledFor || 'now',
        scheduledDate: bookingData.scheduledDate || null,
        scheduledTime: bookingData.scheduledTime || null,
        
        // Pricing
        pricing: bookingData.pricing || {
          basePrice: 0,
          total: 0
        },
        
        // Urgency
        isEmergency: bookingData.isEmergency || false,
        urgency: bookingData.urgency || 'normal',
        
        // Matching data
        tier: null,
        nursesContacted: [],
        responses: {},
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt: bookingData.expiresAt || null,
        acceptedAt: null,
        completedAt: null,
        
        // Metadata
        metadata: {
          patientName: bookingData.patientName || '',
          patientRating: bookingData.patientRating || 5.0
        }
      };
      
      await setDoc(bookingRef, booking);
      
      return {
        success: true,
        bookingId: bookingRef.id,
        booking: booking
      };
      
    } catch (error) {
      console.error('Create booking error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get booking by ID
   */
  async getBooking(bookingId) {
    try {
      const bookingDoc = await getDoc(doc(firestore, 'bookings', bookingId));
      return bookingDoc.exists() ? bookingDoc.data() : null;
    } catch (error) {
      console.error('Get booking error:', error);
      return null;
    }
  }
  
  /**
   * Update booking
   */
  async updateBooking(bookingId, updates) {
    try {
      await updateDoc(doc(firestore, 'bookings', bookingId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Update booking error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId, status, additionalData = {}) {
    try {
      const updates = {
        status: status,
        updatedAt: serverTimestamp(),
        ...additionalData
      };
      
      // Add timestamps for specific statuses
      if (status === 'accepted') {
        updates.acceptedAt = serverTimestamp();
      } else if (status === 'completed') {
        updates.completedAt = serverTimestamp();
      }
      
      await updateDoc(doc(firestore, 'bookings', bookingId), updates);
      return { success: true };
    } catch (error) {
      console.error('Update status error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get patient bookings
   */
  async getPatientBookings(patientId, statusFilter = null) {
    try {
      let q = query(
        collection(firestore, 'bookings'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      );
      
      if (statusFilter) {
        q = query(q, where('status', '==', statusFilter));
      }
      
      const querySnapshot = await getDocs(q);
      const bookings = [];
      
      querySnapshot.forEach((doc) => {
        bookings.push(doc.data());
      });
      
      return bookings;
    } catch (error) {
      console.error('Get patient bookings error:', error);
      return [];
    }
  }
  
  /**
   * Get nurse bookings
   */
  async getNurseBookings(nurseId, statusFilter = null) {
    try {
      let q = query(
        collection(firestore, 'bookings'),
        where('nurseId', '==', nurseId),
        orderBy('createdAt', 'desc')
      );
      
      if (statusFilter) {
        q = query(q, where('status', '==', statusFilter));
      }
      
      const querySnapshot = await getDocs(q);
      const bookings = [];
      
      querySnapshot.forEach((doc) => {
        bookings.push(doc.data());
      });
      
      return bookings;
    } catch (error) {
      console.error('Get nurse bookings error:', error);
      return [];
    }
  }
  
  /**
   * Listen to booking updates (real-time)
   */
  listenToBooking(bookingId, callback) {
    const unsubscribe = onSnapshot(
      doc(firestore, 'bookings', bookingId),
      (doc) => {
        if (doc.exists()) {
          callback(doc.data());
        }
      },
      (error) => {
        console.error('Listen to booking error:', error);
      }
    );
    
    return unsubscribe;
  }
  
  /**
   * Listen to patient bookings (real-time)
   */
  listenToPatientBookings(patientId, callback) {
    const q = query(
      collection(firestore, 'bookings'),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const bookings = [];
        querySnapshot.forEach((doc) => {
          bookings.push(doc.data());
        });
        callback(bookings);
      },
      (error) => {
        console.error('Listen to patient bookings error:', error);
      }
    );
    
    return unsubscribe;
  }
  
  /**
   * Cancel booking
   */
  async cancelBooking(bookingId, cancelledBy) {
    try {
      await this.updateBookingStatus(bookingId, 'cancelled', {
        cancelledBy: cancelledBy, // 'patient' or 'nurse'
        cancelledAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Cancel booking error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Complete booking
   */
  async completeBooking(bookingId) {
    try {
      await this.updateBookingStatus(bookingId, 'completed');
      return { success: true };
    } catch (error) {
      console.error('Complete booking error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Simple geohash encoding
   */
  encodeGeohash(latitude, longitude, precision = 5) {
    const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    let idx = 0;
    let bit = 0;
    let evenBit = true;
    let geohash = '';
    
    let latMin = -90, latMax = 90;
    let lonMin = -180, lonMax = 180;
    
    while (geohash.length < precision) {
      if (evenBit) {
        const lonMid = (lonMin + lonMax) / 2;
        if (longitude > lonMid) {
          idx = (idx << 1) + 1;
          lonMin = lonMid;
        } else {
          idx = idx << 1;
          lonMax = lonMid;
        }
      } else {
        const latMid = (latMin + latMax) / 2;
        if (latitude > latMid) {
          idx = (idx << 1) + 1;
          latMin = latMid;
        } else {
          idx = idx << 1;
          latMax = latMid;
        }
      }
      evenBit = !evenBit;
      
      if (++bit === 5) {
        geohash += base32[idx];
        bit = 0;
        idx = 0;
      }
    }
    
    return geohash;
  }
}

export default new BookingService();
