import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('patient'); // 'patient' or 'nurse'
  const [loading, setLoading] = useState(false);

  // Additional fields for nurse
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialization, setSpecialization] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (userType === 'nurse' && (!licenseNumber || !specialization)) {
      Alert.alert('Error', 'Please fill in all nurse credentials');
      return;
    }

    setLoading(true);

    try {
      // Simulate API call - Replace with actual registration
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const userData = {
        name,
        email,
        userType,
        ...(userType === 'nurse' && { licenseNumber, specialization }),
      };

      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      Alert.alert('Success', 'Registration successful!', [
        {
          text: 'OK',
          onPress: () => {
            if (userType === 'nurse') {
              navigation.replace('NurseMain');
            } else {
              navigation.replace('PatientMain');
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join NurseCare today</Text>
            </View>

            {/* User Type Selection */}
            <View style={styles.userTypeContainer}>
              <Text style={styles.label}>I am a:</Text>
              <View style={styles.userTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === 'patient' && styles.userTypeButtonActive,
                  ]}
                  onPress={() => setUserType('patient')}
                >
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      userType === 'patient' && styles.userTypeButtonTextActive,
                    ]}
                  >
                    Patient
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.userTypeButton,
                    userType === 'nurse' && styles.userTypeButtonActive,
                  ]}
                  onPress={() => setUserType('nurse')}
                >
                  <Text
                    style={[
                      styles.userTypeButtonText,
                      userType === 'nurse' && styles.userTypeButtonTextActive,
                    ]}
                  >
                    Nurse
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {userType === 'nurse' && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>License Number</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your license number"
                      value={licenseNumber}
                      onChangeText={setLicenseNumber}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Specialization</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., General Care, ICU, Pediatrics"
                      value={specialization}
                      onChangeText={setSpecialization}
                    />
                  </View>
                </>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Text>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  userTypeContainer: {
    marginBottom: 20,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  userTypeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  userTypeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  userTypeButtonTextActive: {
    color: '#fff',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  loginText: {
    color: '#666',
    fontSize: 16,
  },
  loginLink: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;
