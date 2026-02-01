import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import PriceEstimator from '../../components/PricingEstimator';
import pricingEngine from '../../services/pricingEngine';
import { calculateDistanceAndETA } from '../../utils/distanceCalculator';
import BookingService from '../../services/BookingService';
import AuthService from '../../services/AuthService';

const BookingScreen = ({ navigation }) => {
  // ─── Smart defaults ─────────────────────────────────────────────────────
  const getDefaultDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDefaultHour = () => {
    const h = new Date().getHours();
    return h === 0 ? 12 : h > 12 ? h - 12 : h;
  };

  const getDefaultMinute = () => {
    // Round up to next 30-min slot
    const m = new Date().getMinutes();
    return m <= 30 ? 30 : 0;
  };

  const getDefaultPeriod = () => (new Date().getHours() < 12 ? 'AM' : 'PM');

  // ─── Form state ──────────────────────────────────────────────────────────
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── Inline picker state ─────────────────────────────────────────────────
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth]   = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear]     = useState(new Date().getFullYear());
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [selectedHour, setSelectedHour]     = useState(getDefaultHour());
  const [selectedMinute, setSelectedMinute] = useState(getDefaultMinute());
  const [selectedPeriod, setSelectedPeriod] = useState(getDefaultPeriod());

  // ─── Derived: 24h string for pricing engine (HH:MM) ────────────────────
  const selectedTime = (() => {
    let h = selectedHour;
    if (selectedPeriod === 'AM' && h === 12) h = 0;
    if (selectedPeriod === 'PM' && h !== 12) h += 12;
    return `${String(h).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
  })();

  // ─── Display string (e.g. "02:30 PM") ───────────────────────────────────
  const selectedTimeDisplay = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')} ${selectedPeriod}`;

  // ─── Shortcut pills ──────────────────────────────────────────────────────
  const TIME_SHORTCUTS = [
    { label: 'Now',       icon: 'time-outline',        hour: getDefaultHour(),  minute: getDefaultMinute(), period: getDefaultPeriod() },
    { label: 'Morning',   icon: 'sunny-outline',       hour: 8,  minute: 0,  period: 'AM' },
    { label: 'Afternoon', icon: 'partly-sunny-outline', hour: 2,  minute: 0,  period: 'PM' },
    { label: 'Evening',   icon: 'moon-outline',        hour: 6,  minute: 0,  period: 'PM' },
    { label: 'Night',     icon: 'moon-half-outline',   hour: 10, minute: 0,  period: 'PM' },
  ];

  // ─── Check if a shortcut matches current selection ──────────────────────
  const isShortcutActive = (s) =>
    selectedHour === s.hour && selectedMinute === s.minute && selectedPeriod === s.period;

  // ─── Location state ──────────────────────────────────────────────────────
  const [patientLocation, setPatientLocation] = useState(null); // { lat, lng }
  const [locationLoading, setLocationLoading] = useState(false);

  // ─── Pricing state ───────────────────────────────────────────────────────
  const [pricing, setPricing] = useState(null);
  const [distanceInfo, setDistanceInfo] = useState(null); // { distanceKm, etaMinutes }

  // ─── Mock nurse experience (placeholder until Phase 2 nurse cards) ────────
  const MOCK_NURSE_EXPERIENCE = 8; // years → resolves to 'senior'

  // ─── Services ────────────────────────────────────────────────────────────
  const services = [
    { id: 'home-care',    name: 'Home Care',           icon: 'home' },
    { id: 'elderly-care', name: 'Elderly Care',        icon: 'people' },
    { id: 'post-surgery', name: 'Post Surgery Care',   icon: 'medical' },
    { id: 'iv-therapy',   name: 'IV Therapy',          icon: 'water' },
    { id: 'wound-care',   name: 'Wound Care',          icon: 'bandage' },
    { id: 'emergency',    name: 'Emergency',           icon: 'alert-circle' },
  ];

  // ─── Duration options (hours) ────────────────────────────────────────────
  const durationOptions = [1, 2, 3, 4, 6, 8];

  // ─── Recalculate pricing whenever relevant inputs change ─────────────────
  const recalculatePricing = useCallback(() => {
    if (!selectedService || !patientLocation) {
      setPricing(null);
      setDistanceInfo(null);
      return;
    }

    // Mock nurse location (placeholder until Phase 2)
    // Using a point ~4.2 km away from a typical Hyderabad coordinate
    const mockNurseLocation = {
      lat: patientLocation.lat + 0.02,
      lng: patientLocation.lng + 0.03,
    };

    // Calculate distance + ETA
    const distResult = calculateDistanceAndETA(
      patientLocation,
      mockNurseLocation,
      selectedService
    );
    setDistanceInfo(distResult);

    // Build the scheduled time for surge calc
    // If user picked a date + time, use that. Otherwise use now.
    let scheduledTime = null;
    if (selectedDate && selectedTime) {
      scheduledTime = `${selectedDate}T${selectedTime}`;
    }

    // Run pricing engine
    const result = pricingEngine.calculate({
      serviceType: selectedService,
      distanceKm: distResult.distanceKm,
      durationHours: selectedDuration,
      nurseExperience: MOCK_NURSE_EXPERIENCE,
      isEmergency: selectedService === 'Emergency',
      scheduledTime,
    });

    setPricing(result);
  }, [selectedService, patientLocation, selectedDuration, selectedDate, selectedTime]);

  useEffect(() => {
    recalculatePricing();
  }, [recalculatePricing]);

  // ─── Get current location ────────────────────────────────────────────────
  const getLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setPatientLocation({ lat: latitude, lng: longitude });

      // Reverse geocode for display
      const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocoded[0]) {
        const formatted = `${geocoded[0].street || ''}, ${geocoded[0].city || ''}, ${geocoded[0].region || ''}`;
        setAddress(formatted);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get location');
    } finally {
      setLocationLoading(false);
    }
  };

  // ─── Confirm booking ─────────────────────────────────────────────────────
  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !address || !patientLocation) {
      Alert.alert('Error', 'Please fill in all required fields and set your location');
      return;
    }

    setLoading(true);

    try {
      const user = AuthService.getCurrentUser();
      const userData = await AuthService.getCurrentUserData();

      const result = await BookingService.createBooking({
        serviceType: selectedService,
        duration: selectedDuration,
        notes,
        location: {
          latitude: patientLocation.lat,
          longitude: patientLocation.lng,
        },
        address,
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        isEmergency: selectedService === 'Emergency',
        type: 'instant',
        patientName: userData?.name || '',
        patientRating: userData?.patientData?.rating || 5.0,
        pricing: pricing, // full pricing object stored in Firestore
      });

      if (result.success) {
        Alert.alert('Success', 'Booking created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedService('');
              setSelectedDate(getDefaultDate());
              setSelectedDuration(1);
              setAddress('');
              setNotes('');
              setPatientLocation(null);
              setPricing(null);
              setDistanceInfo(null);
              setDateInputOpen(false);
              setTimePickerOpen(false);
              setSelectedHour(getDefaultHour());
              setSelectedMinute(getDefaultMinute());
              setSelectedPeriod(getDefaultPeriod());
              navigation.navigate('Bookings');
            },
          },
        ]);
      } else {
        Alert.alert('Booking Failed', result.error);
      }
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

          {/* Address + Location */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Address *</Text>
              <TouchableOpacity onPress={getLocation} disabled={locationLoading}>
                <Text style={styles.useLocation}>
                  <Ionicons name="location" size={14} />{' '}
                  {locationLoading ? 'Getting location...' : 'Use Current Location'}
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
            {/* Distance + ETA badge — shown once location is set */}
            {distanceInfo && (
              <View style={styles.distanceBadge}>
                <Ionicons name="location-outline" size={14} color="#007AFF" />
                <Text style={styles.distanceBadgeText}>
                  {distanceInfo.distanceKm} km away · ~{distanceInfo.etaMinutes} min arrival
                </Text>
              </View>
            )}
          </View>

          {/* When? — Combined date + time row */}
          <View style={styles.section}>
            <Text style={styles.label}>When? *</Text>

            {/* Date + Time chips side by side */}
            <View style={styles.whenRow}>
              <TouchableOpacity
                style={[styles.whenChip, styles.whenChipDate]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#007AFF" />
                <Text style={styles.whenChipText}>{selectedDate}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.whenChip, styles.whenChipTime]}
                onPress={() => setTimePickerOpen(!timePickerOpen)}
              >
                <Ionicons name="time-outline" size={18} color="#007AFF" />
                <Text style={styles.whenChipText}>{selectedTimeDisplay}</Text>
              </TouchableOpacity>
            </View>

            {/* Inline JS calendar */}
            {showDatePicker && (() => {
              const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
              const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
              const today  = new Date();

              // First day of the displayed month (0 = Sunday)
              const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
              // Total days in the displayed month
              const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

              // Navigate prev/next month
              const goToPrev = () => {
                if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
                else setCalendarMonth(calendarMonth - 1);
              };
              const goToNext = () => {
                if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
                else setCalendarMonth(calendarMonth + 1);
              };

              // Is a given day in the past?
              const isPast = (day) => {
                const d = new Date(calendarYear, calendarMonth, day);
                d.setHours(0, 0, 0, 0);
                const t = new Date(); t.setHours(0, 0, 0, 0);
                return d < t;
              };

              // Is a given day the currently selected date?
              const isSelected = (day) => {
                const d = new Date(calendarYear, calendarMonth, day);
                return selectedDate === `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
              };

              // Is a given day today?
              const isToday = (day) =>
                calendarYear === today.getFullYear() &&
                calendarMonth === today.getMonth() &&
                day === today.getDate();

              // Pick a day → update selectedDate, close picker
              const pickDay = (day) => {
                const d = new Date(calendarYear, calendarMonth, day);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                setSelectedDate(`${y}-${m}-${dd}`);
                setShowDatePicker(false);
              };

              // Build the 42-cell grid (6 rows × 7 cols)
              const cells = [];
              for (let i = 0; i < firstDay; i++) cells.push(null); // leading blanks
              for (let d = 1; d <= daysInMonth; d++) cells.push(d);
              while (cells.length < 42) cells.push(null); // trailing blanks

              return (
                <View style={styles.calendarContainer}>
                  {/* Month / Year header with nav arrows */}
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={goToPrev} style={styles.calendarNavBtn}>
                      <Ionicons name="chevron-back" size={22} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.calendarHeaderText}>
                      {MONTHS[calendarMonth]} {calendarYear}
                    </Text>
                    <TouchableOpacity onPress={goToNext} style={styles.calendarNavBtn}>
                      <Ionicons name="chevron-forward" size={22} color="#007AFF" />
                    </TouchableOpacity>
                  </View>

                  {/* Weekday labels */}
                  <View style={styles.calendarWeekRow}>
                    {DAYS.map((d) => (
                      <Text key={d} style={styles.calendarWeekLabel}>{d}</Text>
                    ))}
                  </View>

                  {/* Day grid — 6 rows */}
                  {[0,1,2,3,4,5].map((row) => (
                    <View key={row} style={styles.calendarWeekRow}>
                      {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                        if (day === null) {
                          return <View key={col} style={styles.calendarDayCell} />;
                        }
                        const past     = isPast(day);
                        const selected = isSelected(day);
                        const todayDay = isToday(day);

                        return (
                          <TouchableOpacity
                            key={col}
                            style={[
                              styles.calendarDayCell,
                              selected && styles.calendarDayCellSelected,
                              !selected && todayDay && styles.calendarDayCellToday,
                            ]}
                            onPress={() => !past && pickDay(day)}
                            disabled={past}
                          >
                            <Text
                              style={[
                                styles.calendarDayText,
                                past     && styles.calendarDayTextPast,
                                selected && styles.calendarDayTextSelected,
                                !selected && todayDay && styles.calendarDayTextToday,
                              ]}
                            >
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              );
            })()}

            {/* Time picker — expands when time chip is tapped */}
            {timePickerOpen && (
              <View style={styles.timePickerContainer}>
                {/* Shortcut pills */}
                <View style={styles.shortcutsRow}>
                  {TIME_SHORTCUTS.map((s) => (
                    <TouchableOpacity
                      key={s.label}
                      style={[
                        styles.shortcutPill,
                        isShortcutActive(s) && styles.shortcutPillActive,
                      ]}
                      onPress={() => {
                        setSelectedHour(s.hour);
                        setSelectedMinute(s.minute);
                        setSelectedPeriod(s.period);
                      }}
                    >
                      <Ionicons
                        name={s.icon}
                        size={14}
                        color={isShortcutActive(s) ? '#fff' : '#007AFF'}
                      />
                      <Text
                        style={[
                          styles.shortcutText,
                          isShortcutActive(s) && styles.shortcutTextActive,
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Hour | Minute | AM/PM columns */}
                <View style={styles.timeColumnsRow}>
                  {/* Hours column (1–12) */}
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeColumnLabel}>Hour</Text>
                    <ScrollView
                      style={styles.timeColumnScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map((h) => (
                        <TouchableOpacity
                          key={h}
                          style={[
                            styles.timeColumnItem,
                            selectedHour === h && styles.timeColumnItemActive,
                          ]}
                          onPress={() => setSelectedHour(h)}
                        >
                          <Text
                            style={[
                              styles.timeColumnItemText,
                              selectedHour === h && styles.timeColumnItemTextActive,
                            ]}
                          >
                            {String(h).padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Minutes column (00, 15, 30, 45) */}
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeColumnLabel}>Min</Text>
                    <ScrollView
                      style={styles.timeColumnScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      {[0, 15, 30, 45].map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.timeColumnItem,
                            selectedMinute === m && styles.timeColumnItemActive,
                          ]}
                          onPress={() => setSelectedMinute(m)}
                        >
                          <Text
                            style={[
                              styles.timeColumnItemText,
                              selectedMinute === m && styles.timeColumnItemTextActive,
                            ]}
                          >
                            {String(m).padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* AM / PM toggle */}
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeColumnLabel}>Period</Text>
                    <View style={styles.periodToggle}>
                      <TouchableOpacity
                        style={[
                          styles.periodButton,
                          selectedPeriod === 'AM' && styles.periodButtonActive,
                        ]}
                        onPress={() => setSelectedPeriod('AM')}
                      >
                        <Text
                          style={[
                            styles.periodButtonText,
                            selectedPeriod === 'AM' && styles.periodButtonTextActive,
                          ]}
                        >
                          AM
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.periodButton,
                          selectedPeriod === 'PM' && styles.periodButtonActive,
                        ]}
                        onPress={() => setSelectedPeriod('PM')}
                      >
                        <Text
                          style={[
                            styles.periodButtonText,
                            selectedPeriod === 'PM' && styles.periodButtonTextActive,
                          ]}
                        >
                          PM
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Done button */}
                <TouchableOpacity
                  style={styles.timePickerDone}
                  onPress={() => setTimePickerOpen(false)}
                >
                  <Text style={styles.timePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Duration Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Duration (hours)</Text>
            <View style={styles.durationGrid}>
              {durationOptions.map((hrs) => (
                <TouchableOpacity
                  key={hrs}
                  style={[
                    styles.durationSlot,
                    selectedDuration === hrs && styles.durationSlotActive,
                  ]}
                  onPress={() => setSelectedDuration(hrs)}
                >
                  <Text
                    style={[
                      styles.durationText,
                      selectedDuration === hrs && styles.durationTextActive,
                    ]}
                  >
                    {hrs}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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

          {/* Price Estimator — appears once service + location are selected */}
          {selectedService && patientLocation && (
            <PriceEstimator pricing={pricing} loading={locationLoading} />
          )}

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
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>{selectedDuration} hr{selectedDuration > 1 ? 's' : ''}</Text>
              </View>
              {pricing && (
                <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                  <Text style={styles.summaryTotalLabel}>Estimated Total:</Text>
                  <Text style={styles.summaryTotalValue}>₹{pricing.clientEstimate}</Text>
                </View>
              )}
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

  // Services grid
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

  // Input
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

  // Distance badge
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eef4ff',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  distanceBadgeText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },

  // Shortcuts
  shortcutsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  shortcutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    backgroundColor: '#fff',
  },
  shortcutPillActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  shortcutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  shortcutTextActive: {
    color: '#fff',
  },

  // ─── When? row ───────────────────────────────────────────────────────────
  whenRow: {
    flexDirection: 'row',
    gap: 10,
  },
  whenChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#007AFF',
  },
  whenChipDate: {
    // slightly wider on larger screens, flex handles it
  },
  whenChipTime: {
    // same
  },
  whenChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },

  // Inline JS calendar
  calendarContainer: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarNavBtn: {
    padding: 4,
  },
  calendarHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  calendarWeekRow: {
    flexDirection: 'row',
  },
  calendarWeekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    paddingVertical: 6,
  },
  calendarDayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    margin: 1,
  },
  calendarDayCellSelected: {
    backgroundColor: '#007AFF',
  },
  calendarDayCellToday: {
    borderWidth: 1.5,
    borderColor: '#007AFF',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  calendarDayTextPast: {
    color: '#ccc',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: '#007AFF',
    fontWeight: '700',
  },

  // Inline time picker container
  timePickerContainer: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
  },

  // Three columns side by side
  timeColumnsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  timeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timeColumnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  timeColumnScroll: {
    height: 160,
  },
  timeColumnItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 2,
  },
  timeColumnItemActive: {
    backgroundColor: '#eef4ff',
  },
  timeColumnItemText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  timeColumnItemTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },

  // AM/PM toggle
  periodToggle: {
    flexDirection: 'column',
    gap: 6,
    marginTop: 4,
  },
  periodButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },

  // Done button
  timePickerDone: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f7ff',
  },
  timePickerDoneText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },

  // Duration grid
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationSlot: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  durationSlotActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  durationText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  durationTextActive: {
    color: '#fff',
  },

  // Summary
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
  summaryTotalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 0,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },

  // Book button
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