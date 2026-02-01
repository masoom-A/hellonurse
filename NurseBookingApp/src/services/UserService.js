// src/services/UserService.js
// User Data Management Service

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from './firebase';
import AuthService from './AuthService';

class UserService {
  
  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }
  
  /**
   * Update user data
   */
  async updateUser(userId, updates) {
    try {
      await updateDoc(doc(firestore, 'users', userId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update nurse location
   */
  async updateNurseLocation(nurseId, location) {
    try {
      const { latitude, longitude } = location;
      
      // Calculate geohash for efficient proximity queries
      const geohash = this.encodeGeohash(latitude, longitude, 5);
      
      await updateDoc(doc(firestore, 'users', nurseId), {
        'nurseData.currentLocation': {
          lat: latitude,
          lng: longitude,
          geohash: geohash,
          updatedAt: new Date().toISOString()
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Update location error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update nurse availability
   */
  async updateNurseAvailability(nurseId, isAvailable) {
    try {
      await updateDoc(doc(firestore, 'users', nurseId), {
        'nurseData.isAvailable': isAvailable,
        'nurseData.availabilityStatus': isAvailable ? 'online' : 'offline',
        updatedAt: new Date().toISOString()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Update availability error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Find nearby nurses
   */
  async findNearbyNurses(location, radiusKm = 10, serviceType = null) {
    try {
      const { latitude, longitude } = location;
      
      // Get geohash for the location
      const geohash = this.encodeGeohash(latitude, longitude, 5);
      
      // Query nurses in the area
      let q = query(
        collection(firestore, 'users'),
        where('userType', '==', 'nurse'),
        where('nurseData.isAvailable', '==', true)
      );
      
      // Add service type filter if specified
      if (serviceType) {
        q = query(q, where('nurseData.services', 'array-contains', serviceType));
      }
      
      const querySnapshot = await getDocs(q);
      const nurses = [];
      
      querySnapshot.forEach((doc) => {
        const nurse = doc.data();
        
        // Calculate distance
        if (nurse.nurseData.currentLocation) {
          const distance = this.calculateDistance(
            latitude,
            longitude,
            nurse.nurseData.currentLocation.lat,
            nurse.nurseData.currentLocation.lng
          );
          
          // Only include nurses within radius
          if (distance <= radiusKm) {
            nurses.push({
              ...nurse,
              distance: distance,
              distanceText: this.formatDistance(distance)
            });
          }
        }
      });
      
      // Sort by distance
      nurses.sort((a, b) => a.distance - b.distance);
      
      return nurses;
      
    } catch (error) {
      console.error('Find nearby nurses error:', error);
      return [];
    }
  }
  
  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Format distance for display
   */
  formatDistance(km) {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  }
  
  /**
   * Simple geohash encoding (for proximity queries)
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
  
  /**
   * Get nurse statistics
   */
  async getNurseStats(nurseId) {
    try {
      const nurse = await this.getUserById(nurseId);
      if (!nurse || nurse.userType !== 'nurse') return null;
      
      return {
        totalBookings: nurse.nurseData.totalBookings || 0,
        completedBookings: nurse.nurseData.completedBookings || 0,
        rating: nurse.nurseData.rating || 5.0,
        acceptanceRate: nurse.nurseData.acceptanceRate || 1.0,
        earnings: nurse.nurseData.earnings || { total: 0, thisMonth: 0 }
      };
    } catch (error) {
      console.error('Get nurse stats error:', error);
      return null;
    }
  }
  
  /**
   * Get patient statistics
   */
  async getPatientStats(patientId) {
    try {
      const patient = await this.getUserById(patientId);
      if (!patient || patient.userType !== 'patient') return null;
      
      return {
        totalBookings: patient.patientData.totalBookings || 0,
        completedBookings: patient.patientData.completedBookings || 0,
        rating: patient.patientData.rating || 5.0
      };
    } catch (error) {
      console.error('Get patient stats error:', error);
      return null;
    }
  }
}

export default new UserService();
