import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Alert, BackHandler, Platform } from 'react-native';

export default function PatientLayout() {
  const pathname = usePathname();

  useEffect(() => {
    const onBackPress = () => {
      if (pathname?.startsWith('/(patient)')) {
        if (pathname.startsWith('/(patient)/screens/home') || pathname === '/(patient)') {
          Alert.alert('Quitter', "Voulez-vous quitter l'application ?", [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Oui', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ]);
          return true;
        }
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [pathname]);

  return (
    <Tabs
      backBehavior="history"
      initialRouteName="screens/home"
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0.5,
          borderTopColor: "#E5E5EA",
          paddingBottom: 20,
          paddingTop: 8,
          height: 88,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: "#007AFF",
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 17,
          color: "#FFFFFF",
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        },
      }}
    >
      {/* Masquer toutes les sous-pages pour éviter qu'elles apparaissent comme onglets */}
      <Tabs.Screen name="auth" options={{ href: null }} />
      <Tabs.Screen name="modals" options={{ href: null }} />
      <Tabs.Screen name="screens/search" options={{ href: null }} />
      <Tabs.Screen name="screens/doctor-detail" options={{ href: null }} />
      <Tabs.Screen name="screens/appointment-motif" options={{ href: null }} />

      <Tabs.Screen
        name="screens/home"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerTitle: "SantéAfrik",
        }}
      />
      <Tabs.Screen
        name="screens/appointments"
        options={{
          title: "Rendez-vous",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
          headerTitle: "Mes rendez-vous",
        }}
      />
      <Tabs.Screen
        name="screens/sante"
        options={{
          title: "Santé",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
          headerTitle: "Ma santé",
        }}
      />
      <Tabs.Screen
        name="screens/messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble" size={size} color={color} />
          ),
          headerTitle: "Mes messages",
        }}
      />
      <Tabs.Screen
        name="screens/profile"
        options={{
          title: "Compte",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerTitle: "Mon compte",
        }}
      />
    </Tabs>
  );
}
