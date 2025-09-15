import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Alert, BackHandler, Platform } from 'react-native';

export default function MedecinLayout() {
  const pathname = usePathname();

  useEffect(() => {
    const onBackPress = () => {
      if (pathname?.startsWith('/(medecin)')) {
        if (pathname.startsWith('/(medecin)/screens/dashboard') || pathname === '/(medecin)') {
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
      initialRouteName="screens/agenda"
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
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: "#007AFF",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
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
      {/* Masquer les sous-pages pour ne pas polluer les onglets */}
      <Tabs.Screen name="auth" options={{ href: null }} />
      {/* Dashboard supprimé de la tab bar */}
      <Tabs.Screen name="screens/dashboard" options={{ href: null }} />
      {/* Détails messages masqués */}
      <Tabs.Screen name="screens/messages/[id]" options={{ href: null }} />
      {/* Détails rendezvous masqués */}
      <Tabs.Screen name="screens/rendezvous/[id]" options={{ href: null }} />
      <Tabs.Screen
        name="screens/patients"
        options={{
          title: "Patients",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
          headerTitle: "Mes patients",
        }}
      />
      <Tabs.Screen
        name="screens/messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
          headerTitle: "Messages",
        }}
      />
      <Tabs.Screen
        name="screens/agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          headerTitle: "Agenda",
        }}
      />
      <Tabs.Screen
        name="screens/rendezvous"
        options={{
          title: "Rendez-vous",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-number-outline" size={size} color={color} />
          ),
          headerTitle: "Mes rendez-vous",
        }}
      />
      <Tabs.Screen name="screens/creneaux" options={{ href: null }} />
      <Tabs.Screen
        name="screens/profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          headerTitle: "Mon profil",
        }}
      />
    </Tabs>
  );
}
