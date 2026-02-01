import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AuthService from '../../services/AuthService';
import BookingService from '../../services/BookingService';

const PatientHomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
    loadUpcomingBookings();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await AuthService.getCurrentUserData();
      if (data) {
        setUserData(data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadUpcomingBookings = async () => {
    try {
      const user = AuthService.getCurrentUser();
      if (!user) return;

      const bookings = await BookingService.getPatientBookings(user.uid, 'pending');
      setUpcomingBookings(bookings.slice(0, 3));
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUpcomingBookings();
    setRefreshing(false);
  };

  const services = [
    { id: 1, name: 'Home Care', icon: 'home', color: '#007AFF' },
    { id: 2, name: 'Elderly Care', icon: 'people', color: '#34C759' },
    { id: 3, name: 'Post Surgery', icon: 'medical', color: '#FF3B30' },
    { id: 4, name: 'IV Therapy', icon: 'water', color: '#FF9500' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{userData?.name || 'User'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.bookNowCard}
            onPress={() => navigation.navigate('Book')}
          >
            <View>
              <Text style={styles.bookNowTitle}>Need a Nurse?</Text>
              <Text style={styles.bookNowSubtitle}>Book now for immediate care</Text>
            </View>
            <Ionicons name="add-circle" size={40} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => navigation.navigate('Book')}
              >
                <View style={[styles.serviceIcon, { backgroundColor: service.color + '20' }]}>
                  <Ionicons name={service.icon} size={28} color={service.color} />
                </View>
                <Text style={styles.serviceName}>{service.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Bookings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {upcomingBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No upcoming bookings</Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('Book')}
              >
                <Text style={styles.emptyStateButtonText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingBookings.map((booking, index) => (
              <View key={index} style={styles.bookingCard}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.nurseName}>Nurse {booking.metadata?.patientName || 'Assigned'}</Text>
                  <Text style={styles.bookingDate}>
                    {booking.scheduledDate || 'TBD'} at {booking.scheduledTime || 'TBD'}
                  </Text>
                  <Text style={styles.bookingService}>{booking.serviceType}</Text>
                </View>
                <View style={styles.bookingStatus}>
                  <Text style={styles.statusText}>Confirmed</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Why Choose Us */}
        <View style={[styles.section, { marginBottom: 30 }]}>
          <Text style={styles.sectionTitle}>Why Choose NurseCare</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={24} color="#34C759" />
              <Text style={styles.featureText}>Verified & Licensed Nurses</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="time" size={24} color="#34C759" />
              <Text style={styles.featureText}>24/7 Available Support</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="star" size={24} color="#34C759" />
              <Text style={styles.featureText}>Highly Rated Service</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  seeAll: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  bookNowCard: {
    backgroundColor: '#007AFF',
    padding: 24,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookNowTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  bookNowSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  serviceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
  },
  nurseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  bookingService: {
    fontSize: 14,
    color: '#007AFF',
  },
  bookingStatus: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
});

export default PatientHomeScreen;