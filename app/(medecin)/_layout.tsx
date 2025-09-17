import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Alert, BackHandler, Platform, Text, View } from 'react-native';
import { AudioProvider } from '../../services/audioContext';
import { NotificationProvider, useNotifications } from '../../services/notificationContext';

function MedecinTabs() {
  const pathname = usePathname();
  const { unreadMessagesCount, unreadNotificationsCount, totalUnreadCount } = useNotifications();

  useEffect(() => {
    const onBackPress = () => {
      if (pathname?.startsWith('/(medecin)')) {
        if (pathname.startsWith('/(medecin)/screens/agenda') || pathname === '/(medecin)') {
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
      {/* Dashboard supprimé */}
      {/* Détails messages masqués */}
      <Tabs.Screen name="screens/messages/[id]" options={{ href: null }} />
      {/* Détails rendezvous masqués */}
      <Tabs.Screen name="screens/rendezvous/[id]" options={{ href: null }} />
      {/* Notification settings masqué */}
      <Tabs.Screen name="screens/notification-settings" options={{ href: null }} />
      {/* Modal edit profil médecin masqué */}
      <Tabs.Screen name="modals/edit-profile" options={{ href: null }} />
      <Tabs.Screen
        name="screens/patients"
        options={{
          title: "Patients",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
          headerTitle: "Mes patients",
        }}
      />
      <Tabs.Screen
        name="screens/messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name="chatbubbles" size={size} color={color} />
              {unreadMessagesCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -2,
                  right: -8,
                  backgroundColor: '#FF3B30',
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                }}>
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: '700',
                  }}>
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </Text>
                </View>
              )}
            </View>
          ),
          headerTitle: "Messages",
        }}
      />
      <Tabs.Screen
        name="screens/agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
          headerTitle: "Agenda",
        }}
      />
      <Tabs.Screen
        name="screens/rendezvous"
        options={{
          title: "Rendez-vous",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-number" size={size} color={color} />
          ),
          headerTitle: "Mes rendez-vous",
        }}
      />
          <Tabs.Screen
            name="screens/notifications"
            options={{
              title: "Notifications",
              tabBarIcon: ({ color, size }) => (
                <View style={{ position: 'relative' }}>
                  <Ionicons name="notifications" size={size} color={color} />
                  {unreadNotificationsCount > 0 && (
                    <View style={{
                      position: 'absolute',
                      top: -2,
                      right: -8,
                      backgroundColor: '#FF3B30',
                      borderRadius: 10,
                      minWidth: 20,
                      height: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                    }}>
                      <Text style={{
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: '700',
                      }}>
                        {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                      </Text>
                    </View>
                  )}
                </View>
              ),
              headerTitle: "Mes notifications",
            }}
          />
      <Tabs.Screen name="screens/creneaux" options={{ href: null }} />
      <Tabs.Screen
        name="screens/profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerTitle: "Mon profil",
        }}
      />
    </Tabs>
  );
}

export default function MedecinLayout() {
  return (
    <AudioProvider>
      <NotificationProvider>
        <MedecinTabs />
      </NotificationProvider>
    </AudioProvider>
  );
}
