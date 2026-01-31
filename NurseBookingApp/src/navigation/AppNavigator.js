import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Patient Screens
import PatientHomeScreen from '../screens/patient/PatientHomeScreen';
import BookingScreen from '../screens/patient/BookingScreen';
import PatientBookingsScreen from '../screens/patient/PatientBookingsScreen';
import PatientProfileScreen from '../screens/patient/PatientProfileScreen';

// Nurse Screens
import NurseHomeScreen from '../screens/nurse/NurseHomeScreen';
import NurseScheduleScreen from '../screens/nurse/NurseScheduleScreen';
import NurseBookingsScreen from '../screens/nurse/NurseBookingsScreen';
import NurseProfileScreen from '../screens/nurse/NurseProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Patient Tab Navigator
const PatientTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Book') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={PatientHomeScreen} />
      <Tab.Screen name="Book" component={BookingScreen} />
      <Tab.Screen name="Bookings" component={PatientBookingsScreen} />
      <Tab.Screen name="Profile" component={PatientProfileScreen} />
    </Tab.Navigator>
  );
};

// Nurse Tab Navigator
const NurseTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#34C759',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={NurseHomeScreen} />
      <Tab.Screen name="Schedule" component={NurseScheduleScreen} />
      <Tab.Screen name="Bookings" component={NurseBookingsScreen} />
      <Tab.Screen name="Profile" component={NurseProfileScreen} />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Auth Stack */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        
        {/* Patient Stack */}
        <Stack.Screen name="PatientMain" component={PatientTabs} />
        
        {/* Nurse Stack */}
        <Stack.Screen name="NurseMain" component={NurseTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
