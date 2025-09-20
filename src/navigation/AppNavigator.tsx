import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { socketService } from '../services/socketService';
import { RootState } from '../store';

// Screens
import { LoadingScreen } from '../components';
import {
  AgendaScreen,
  BookAppointmentScreen,
  ChatScreen,
  ConversationsScreen,
  DoctorDashboardScreen,
  DoctorDetailScreen,
  LoginScreen,
  MedicalRecordScreen,
  PatientDashboardScreen,
  ProfileScreen,
  RegisterScreen,
  RendezVousScreen,
  SearchDoctorsScreen,
} from '../screens';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const PatientTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        if (route.name === 'Dashboard') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Search') {
          iconName = focused ? 'search' : 'search-outline';
        } else if (route.name === 'Messages') {
          iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        } else {
          iconName = 'help-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#3498db',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="Dashboard" 
      component={PatientDashboardScreen}
      options={{ title: 'Accueil' }}
    />
    <Tab.Screen 
      name="Search" 
      component={SearchDoctorsScreen}
      options={{ title: 'Recherche' }}
    />
    <Tab.Screen 
      name="Messages" 
      component={ConversationsScreen}
      options={{ title: 'Messages' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ title: 'Profil' }}
    />
  </Tab.Navigator>
);

const DoctorTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        if (route.name === 'Dashboard') {
          iconName = focused ? 'medical' : 'medical-outline';
        } else if (route.name === 'Agenda') {
          iconName = focused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'RendezVous') {
          iconName = focused ? 'list' : 'list-outline';
        } else if (route.name === 'Messages') {
          iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        } else {
          iconName = 'help-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#e74c3c',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="Dashboard" 
      component={DoctorDashboardScreen}
      options={{ title: 'Tableau de bord' }}
    />
    <Tab.Screen 
      name="Agenda" 
      component={AgendaScreen}
      options={{ title: 'Agenda' }}
    />
    <Tab.Screen 
      name="RendezVous" 
      component={RendezVousScreen}
      options={{ title: 'Rendez-vous' }}
    />
    <Tab.Screen 
      name="Messages" 
      component={ConversationsScreen}
      options={{ title: 'Messages' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ title: 'Profil' }}
    />
  </Tab.Navigator>
);

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { user, token, loading } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  // Debug: Afficher les informations de l'utilisateur
  console.log('🧭 AppNavigator - User:', user);
  console.log('🧭 AppNavigator - User role:', user?.role);
  console.log('🧭 AppNavigator - Token:', token);

  useEffect(() => {
    // Initialiser la connexion Socket.IO si l'utilisateur est connecté
    if (user && token) {
      socketService.connect();
    }
  }, [user, token]);

  useEffect(() => {
    // Simuler un chargement initial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            {!user.role ? (
              <Stack.Screen name="Login" component={LoginScreen} />
            ) : user.role === 'PATIENT' ? (
              <>
                <Stack.Screen name="PatientApp" component={PatientTabs} />
                <Stack.Screen 
                  name="DoctorDetail" 
                  component={DoctorDetailScreen}
                  options={{ headerShown: true, title: 'Détails du médecin' }}
                />
                <Stack.Screen 
                  name="BookAppointment" 
                  component={BookAppointmentScreen}
                  options={{ headerShown: true, title: 'Réserver un rendez-vous' }}
                />
                <Stack.Screen 
                  name="MedicalRecord" 
                  component={MedicalRecordScreen}
                  options={{ headerShown: true, title: 'Dossier médical' }}
                />
                <Stack.Screen 
                  name="Chat" 
                  component={ChatScreen}
                  options={{ headerShown: true, title: 'Conversation' }}
                />
              </>
            ) : (
              <>
                <Stack.Screen name="DoctorApp" component={DoctorTabs} />
                <Stack.Screen 
                  name="Chat" 
                  component={ChatScreen}
                  options={{ headerShown: true, title: 'Conversation' }}
                />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
