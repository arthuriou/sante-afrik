import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE_URL, apiService, User } from '../../../services/api';

export default function PatientProfileScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

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
      // Recharger le profil à chaque focus pour refléter les dernières modifications
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

      console.log('🔍 DEBUG UPLOAD:');
      console.log('URI:', uri);
      console.log('Name:', nameGuess);
      console.log('Type:', typeGuess);

      const form = new FormData();
      // @ts-ignore: React Native file type
      form.append('file', { uri, name: nameGuess, type: typeGuess });

      console.log('FormData créé, envoi...');
      const resp = await apiService.updateProfilePhoto(form);
      console.log('✅ Réponse reçue:', resp);
      
      if ((resp as any)?.data?.user) {
        setUser((resp as any).data.user);
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
          id: 'notifications',
          title: 'Notifications',
          icon: 'notifications-outline',
          action: 'toggle',
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
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
        <View style={[styles.menuIcon, { backgroundColor: (item.color || '#007AFF') + '20' }]}>
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* En-tête du profil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user?.photoprofil ? (
              <Image
                source={{ uri: user.photoprofil.startsWith('http') ? user.photoprofil : `${API_BASE_URL}${user.photoprofil}` }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color="#8E8E93" />
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton} onPress={handlePickAndUploadPhoto}>
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>
            {user ? `${user.prenom} ${user.nom}` : 'Chargement...'}
          </Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => router.navigate('/(patient)/modals/edit-profile')}
          >
            <Ionicons name="create-outline" size={16} color="#007AFF" />
            <Text style={styles.editProfileText}>Modifier le profil</Text>
          </TouchableOpacity>
        </View>

        {/* Informations rapides */}
        <View style={styles.quickInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color="#007AFF" />
            <Text style={styles.infoText}>{user?.telephone || 'Non renseigné'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              {user?.patient?.adresse || 'Non renseigné'}
            </Text>
          </View>
        </View>

        {/* Menu */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuItems}>
              {section.items.map(renderMenuItem)}
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
    backgroundColor: '#F2F2F7',
  },
  profileHeader: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editProfileText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  quickInfo: {
    backgroundColor: 'white',
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  menuSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  menuItems: {
    backgroundColor: 'white',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
});
