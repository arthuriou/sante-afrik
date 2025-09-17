import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { API_BASE_URL, apiService, User } from '../../../services/api';

export default function PatientProfileScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);

  type MenuAction = 'navigate' | 'toggle' | 'logout';
  interface MenuItem {
    id: string;
    title: string;
    icon: any;
    action: MenuAction;
    color?: string;
    value?: boolean;
    onToggle?: (next: boolean) => void;
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

  const handlePickAndUploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', "Autorisez l'accès à la galerie pour changer la photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const uri = asset.uri as string;
      const nameGuess = (uri.split('/').pop() || `photo_${Date.now()}.jpg`).replace(/\?.*$/, '');
      const typeGuess = (asset as any).mimeType || 'image/jpeg';

      const resp = await apiService.updateProfilePhotoFromAsset({ uri, name: nameGuess, type: typeGuess });
      if (resp?.data?.user) {
        setUser(resp.data.user);
      } else {
        await loadProfile();
      }
      Alert.alert('Succès', 'Photo de profil mise à jour');
    } catch (e: any) {
      console.error('❌ Erreur upload:', e);
      Alert.alert('Erreur', e?.message || 'Échec de la mise à jour de la photo');
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
        {
          id: 'medical-info',
          title: 'Informations médicales',
          icon: 'medical-outline',
          action: 'navigate',
        },
        {
          id: 'emergency-contacts',
          title: 'Contacts d\'urgence',
          icon: 'call-outline',
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
        {
          id: 'location',
          title: 'Localisation',
          icon: 'location-outline',
          action: 'toggle',
          value: locationEnabled,
          onToggle: setLocationEnabled,
        },
        {
          id: 'language',
          title: 'Langue',
          icon: 'language-outline',
          action: 'navigate',
          subtitle: 'Français',
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
          router.navigate('/(patient)/modals/edit-profile');
        } else if (item.id === 'notification-settings') {
          router.navigate('/(patient)/screens/notification-settings');
        } else {
          Alert.alert('Navigation', `Navigation vers ${item.title}`);
        }
        break;
      case 'toggle':
        if (item.onToggle) {
          item.onToggle(!Boolean(item.value));
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
      
      {item.action === 'toggle' ? (
        <Switch
          value={item.value}
          onValueChange={item.onToggle}
          trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
          thumbColor={item.value ? 'white' : '#8E8E93'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
      )}
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
            <Pressable onPress={() => user?.photoprofil && setViewerVisible(true)}>
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
            </Pressable>
            <TouchableOpacity style={styles.editAvatarButton} onPress={handlePickAndUploadPhoto}>
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
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

      {/* Modal de visualisation de photo */}
      <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
        <View style={styles.viewerBackdrop}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => setViewerVisible(false)} style={styles.headerIconBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.viewerTitle}>Photo de profil</Text>
            <TouchableOpacity onPress={handlePickAndUploadPhoto} style={styles.headerIconBtn}>
              <Ionicons name="create-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.viewerContainer}>
            {user?.photoprofil ? (
              <Image
                resizeMode="contain"
                source={{ uri: user.photoprofil.startsWith('http') ? user.photoprofil : `${API_BASE_URL}${user.photoprofil}` }}
                style={styles.viewerImage}
              />
            ) : (
              <Text style={styles.viewerPlaceholder}>Aucune photo de profil</Text>
            )}
          </View>
        </View>
      </Modal>
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  userEmail: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  contactText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Photo Viewer Modal
  viewerBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 1,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  viewerContainer: {
    width: '100%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '85%',
  },
  viewerPlaceholder: {
    color: '#FFFFFF80',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});