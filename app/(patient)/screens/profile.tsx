import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { API_BASE_URL, apiService, User } from '../../../services/api';

export default function PatientProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  type MenuAction = 'navigate' | 'logout';
  interface MenuItem {
    id: string;
    title: string;
    icon: any;
    action: MenuAction;
    color?: string;
    subtitle?: string;
  }

  useEffect(() => {
    loadProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };


  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Informations personnelles',
      items: [
        {
          id: 'edit-profile',
          title: 'Modifier mon profil',
          icon: 'person-outline',
          action: 'navigate',
        },
      ],
    },
    {
      title: 'Préférences',
      items: [
        {
          id: 'notification-settings',
          title: 'Préférences de notifications',
          icon: 'notifications-outline',
          action: 'navigate',
          subtitle: 'Sons, vibrations, types',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Aide et support',
          icon: 'help-circle-outline',
          action: 'navigate',
        },
        {
          id: 'contact',
          title: 'Nous contacter',
          icon: 'mail-outline',
          action: 'navigate',
        },
        {
          id: 'feedback',
          title: 'Donner votre avis',
          icon: 'star-outline',
          action: 'navigate',
        },
      ],
    },
    {
      title: 'Légal',
      items: [
        {
          id: 'privacy',
          title: 'Politique de confidentialité',
          icon: 'shield-outline',
          action: 'navigate',
        },
        {
          id: 'terms',
          title: 'Conditions d\'utilisation',
          icon: 'document-text-outline',
          action: 'navigate',
        },
        {
          id: 'logout',
          title: 'Se déconnecter',
          icon: 'log-out-outline',
          action: 'logout',
          color: '#FF3B30',
        },
      ],
    },
  ];

  const handleAction = (item: MenuItem) => {
    switch (item.action) {
      case 'navigate':
        if (item.id === 'edit-profile') {
          router.push('/(modals)/edit-profile');
        } else if (item.id === 'consultations') {
          router.push('/(modals)/consultations');
        } else if (item.id === 'ordonnances') {
          router.push('/(modals)/ordonnances');
        } else if (item.id === 'notification-settings') {
          router.navigate('/(patient)/screens/notification-settings');
        } else {
          Alert.alert('Navigation', `Navigation vers ${item.title}`);
        }
        break;
      case 'logout':
        Alert.alert(
          'Déconnexion',
          'Êtes-vous sûr de vouloir vous déconnecter ?',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Déconnexion', style: 'destructive', onPress: async () => {
              try {
                await AsyncStorage.removeItem('userToken');
                router.replace('/');
              } catch (error) {
                console.error('Erreur lors de la déconnexion:', error);
                router.replace('/');
              }
            }},
          ]
        );
        break;
    }
  };

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => handleAction(item)}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, { backgroundColor: (item.color || '#007AFF') + '15' }]}>
          <Ionicons
            name={item.icon}
            size={20}
            color={item.color || '#007AFF'}
          />
        </View>
        <View style={styles.menuItemText}>
          <Text style={[styles.menuItemTitle, item.color && { color: item.color }]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header du profil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.photoprofil ? (
              <Image
                source={{ uri: user.photoprofil.startsWith('http') ? user.photoprofil : `${API_BASE_URL}${user.photoprofil}` }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={100} color="#8E8E93" />
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>
            {user ? `${user.prenom} ${user.nom}` : 'Chargement...'}
          </Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          
        </View>

        {/* Informations rapides */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Informations de contact</Text>
            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}>
            <Ionicons name="call-outline" size={20} color="#007AFF" />
                </View>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactLabel}>Téléphone</Text>
                  <Text style={styles.contactText}>{user?.telephone || 'Non renseigné'}</Text>
                </View>
          </View>
              
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}>
            <Ionicons name="location-outline" size={20} color="#007AFF" />
                </View>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactLabel}>Adresse</Text>
                  <Text style={styles.contactText}>
              {user?.patient?.adresse || 'Non renseigné'}
            </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Menu */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuItems}>
                {section.items.map((item, index) => (
                  <View key={item.id}>
                    {renderMenuItem(item)}
                    {index < section.items.length - 1 && <View style={styles.menuDivider} />}
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}

        {/* Version de l'app */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>SantéAfrik v1.0.0</Text>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS System Gray 6
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: 'System',
  },
  
  // Profile Header
  profileHeader: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#F2F2F7',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'System',
  },
  userEmail: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'System',
  },
  
  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Gros coins arrondis iOS
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
    fontFamily: 'System',
  },
  
  // Contact Info
  contactInfo: {
    gap: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactDetails: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
    fontFamily: 'System',
  },
  contactText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'System',
  },
  
  // Menu
  menuItems: {
    gap: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'System',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    fontFamily: 'System',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginLeft: 52,
  },
  
  // Version
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'System',
  },
});