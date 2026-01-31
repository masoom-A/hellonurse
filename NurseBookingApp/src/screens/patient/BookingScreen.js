import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const BookingScreen = ({ navigation }) => {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const services = [
    { id: 'home-care', name: 'Home Care', icon: 'home' },
    { id: 'elderly-care', name: 'Elderly Care', icon: 'people' },
    { id: 'post-surgery', name: 'Post Surgery Care', icon: 'medical' },
    { id: 'iv-therapy', name: 'IV Therapy', icon: 'water' },
    { id: 'wound-care', name: 'Wound Care', icon: 'bandage' },
    { id: 'medication', name: 'Medication Management', icon: 'medical-outline' },
  ];

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
    '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM',
  ];

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        const formattedAddress = `${address[0].street || ''}, ${address[0].city || ''}, ${address[0].region || ''}`;
        setAddress(formattedAddress);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get location');
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !address) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const newBooking = {
        id: Date.now(),
        service: selectedService,
        date: selectedDate,
        time: selectedTime,
        address,
        notes,
        status: 'upcoming',
        nurseName: 'Sarah Johnson', // Mock data
        createdAt: new Date().toISOString(),
      };

      // Get existing bookings
      const existingBookings = await AsyncStorage.getItem('patientBookings');
      const bookings = existingBookings ? JSON.parse(existingBookings) : [];
      
      // Add new booking
      bookings.push(newBooking);
      await AsyncStorage.setItem('patientBookings', JSON.stringify(bookings));

      Alert.alert('Success', 'Booking created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setSelectedService('');
            setSelectedDate('');
            setSelectedTime('');
            setAddress('');
            setNotes('');
            // Navigate to bookings tab
            navigation.navigate('Bookings');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Book a Nurse</Text>
            <Text style={styles.subtitle}>Fill in the details to book a nurse</Text>
          </View>

          {/* Service Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Select Service *</Text>
            <View style={styles.servicesGrid}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    selectedService === service.name && styles.serviceCardActive,
                  ]}
                  onPress={() => setSelectedService(service.name)}
                >
                  <Ionicons
                    name={service.icon}
                    size={28}
                    color={selectedService === service.name ? '#007AFF' : '#666'}
                  />
                  <Text
                    style={[
                      styles.serviceName,
                      selectedService === service.name && styles.serviceNameActive,
                    ]}
                  >
                    {service.name}
                  </Text>
                  {selectedService === service.name && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Select Date *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={selectedDate}
              onChangeText={setSelectedDate}
            />
          </View>

          {/* Time Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Select Time *</Text>
            <View style={styles.timeGrid}>
              {timeSlots.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlot,
                    selectedTime === time && styles.timeSlotActive,
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text
                    style={[
                      styles.timeText,
                      selectedTime === time && styles.timeTextActive,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Address */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Address *</Text>
              <TouchableOpacity onPress={getLocation}>
                <Text style={styles.useLocation}>
                  <Ionicons name="location" size={14} /> Use Current Location
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your full address"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Additional Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Additional Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any specific requirements or notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Booking Summary */}
          {selectedService && selectedDate && selectedTime && (
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service:</Text>
                <Text style={styles.summaryValue}>{selectedService}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>{selectedDate}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryValue}>{selectedTime}</Text>
              </View>
            </View>
          )}

          {/* Book Button */}
          <TouchableOpacity
            style={[styles.bookButton, loading && styles.bookButtonDisabled]}
            onPress={handleBooking}
            disabled={loading}
          >
            <Text style={styles.bookButtonText}>
              {loading ? 'Creating Booking...' : 'Confirm Booking'}
            </Text>
          </TouchableOpacity>
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
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  useLocation: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  serviceCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  serviceName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  serviceNameActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  timeSlotActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  timeTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  summary: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default BookingScreen;
