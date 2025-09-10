import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Alert, BackHandler } from 'react-native';

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
      initialRouteName="screens/dashboard"
      screenOptions={{
        tabBarActiveTintColor: "#34C759",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#E5E5EA",
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: "#34C759",
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      {/* Masquer les sous-pages pour ne pas polluer les onglets */}
      <Tabs.Screen name="auth" options={{ href: null }} />
      <Tabs.Screen
        name="screens/dashboard"
        options={{
          title: "Tableau de bord",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
          headerTitle: "Tableau de bord",
        }}
      />
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
        name="screens/rendezvous"
        options={{
          title: "Rendez-vous",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          headerTitle: "Mes rendez-vous",
        }}
      />
      <Tabs.Screen
        name="screens/creneaux"
        options={{
          title: "Créneaux",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
          headerTitle: "Gestion des créneaux",
        }}
      />
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
