import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthService from '../../services/AuthService';

const NurseProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserData();
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

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          const result = await AuthService.logout();
          if (result.success) {
            navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
          } else {
            Alert.alert('Error', result.error);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.nurseInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userData?.name?.charAt(0).toUpperCase() || 'N'}
          </Text>
        </View>
        <Text style={styles.name}>{userData?.name || 'Nurse'}</Text>
        <Text style={styles.email}>{userData?.email || ''}</Text>
        <Text style={styles.specialization}>
          {userData?.nurseData?.specialization || 'General Care'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userData?.nurseData?.totalBookings || 0}</Text>
          <Text style={styles.statLabel}>Total Jobs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{userData?.nurseData?.rating || 5.0}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {((userData?.nurseData?.acceptanceRate || 1) * 100).toFixed(0)}%
          </Text>
          <Text style={styles.statLabel}>Acceptance</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  nurseInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  email: { fontSize: 14, color: '#666', marginBottom: 4 },
  specialization: { fontSize: 14, color: '#34C759', fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666' },
  logoutButton: { backgroundColor: '#FF3B30', padding: 16, borderRadius: 12 },
  logoutText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});

export default NurseProfileScreen;