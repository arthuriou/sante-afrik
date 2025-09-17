import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
    View,
} from 'react-native';
import { API_BASE_URL, apiService, Medecin, Specialite, User } from '../../../services/api';

export default function MedecinProfileScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [medecin, setMedecin] = useState<Medecin | null>(null);
  const [specialites, setSpecialites] = useState<Specialite[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);

  // Charger les données du médecin au montage
  useEffect(() => {
    loadMedecinData();
  }, []);

  const loadMedecinData = async () => {
    try {
      setLoading(true);
      
      // Récupérer le profil complet du médecin
      const response = await apiService.getProfile();
      console.log('Profil médecin chargé:', response.data);
      
      setUser(response.data);
      setMedecin(response.data.medecin || null);
      setSpecialites(response.data.medecin?.specialites || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données médecin:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du profil');
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
        await loadMedecinData();
      }
      Alert.alert('Succès', 'Photo de profil mise à jour');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Échec de la mise à jour de la photo');
    }
  };

  const menuSections = [
    {
      title: 'Informations professionnelles',
      items: [
        {
          id: 'edit-profile',
          title: 'Modifier mon profil',
          icon: 'person-outline',
          action: 'navigate',
        },
        {
          id: 'cabinet-info',
          title: 'Informations du cabinet',
          icon: 'business-outline',
          action: 'navigate',
        },
        {
          id: 'specialties',
          title: 'Mes spécialités',
          icon: 'medical-outline',
          action: 'navigate',
        },
      ],
    },
    {
      title: 'Gestion',
      items: [
        {
          id: 'availability',
          title: 'Disponibilités',
          icon: 'time-outline',
          action: 'navigate',
        },
        {
          id: 'pricing',
          title: 'Tarifs',
          icon: 'card-outline',
          action: 'navigate',
        },
        {
          id: 'patients',
          title: 'Mes patients',
          icon: 'people-outline',
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

  const handleAction = (item: any) => {
    switch (item.action) {
      case 'navigate':
        if (item.id === 'edit-profile') {
          router.navigate('/(medecin)/modals/edit-profile');
        } else if (item.id === 'notification-settings') {
          router.navigate('/(medecin)/screens/notification-settings');
        } else {
        Alert.alert('Navigation', `Navigation vers ${item.title}`);
        }
        break;
      case 'toggle':
        item.onToggle(!item.value);
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
                await AsyncStorage.removeItem('userData');
                await AsyncStorage.removeItem('userRole');
              } catch {}
              router.replace('/(auth)/medecin/login');
            }},
          ]
        );
        break;
    }
  };

  const renderMenuItem = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => handleAction(item)}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, { backgroundColor: (item.color || '#34C759') + '20' }]}>
          <Ionicons
            name={item.icon}
            size={20}
            color={item.color || '#34C759'}
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
          trackColor={{ false: '#E5E5EA', true: '#34C759' }}
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
          <ActivityIndicator size="large" color="#34C759" />
          <Text style={styles.loadingText}>Chargement de votre profil...</Text>
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
        {/* Header iOS épuré */}
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
          <Text style={styles.userName}>{user ? `Dr. ${user.prenom} ${user.nom}` : 'Dr. Médecin'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>

        {/* Carte infos de contact */}
        <View style={styles.section}> 
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Coordonnées</Text>
            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}><Ionicons name="call-outline" size={20} color="#007AFF" /></View>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactLabel}>Téléphone</Text>
                  <Text style={styles.contactText}>{user?.telephone || 'Non renseigné'}</Text>
                </View>
              </View>
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}><Ionicons name="mail-outline" size={20} color="#007AFF" /></View>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactText}>{user?.email || 'Non renseigné'}</Text>
                </View>
          </View>
          </View>
          </View>
        </View>

        {/* Sections menu */}
        {menuSections.map((section: any, sectionIndex: number) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuItems}>
                {section.items.map((item: any, index: number) => (
                  <View key={item.id}>
                    {renderMenuItem(item)}
                    {index < section.items.length - 1 && <View style={styles.menuDivider} />}
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}

        <View style={styles.versionContainer}><Text style={styles.versionText}>SantéAfrik v1.0.0</Text></View>
      </ScrollView>

      {/* Modal photo */}
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
              <Image resizeMode="contain" source={{ uri: user.photoprofil.startsWith('http') ? user.photoprofil : `${API_BASE_URL}${user.photoprofil}` }} style={styles.viewerImage} />
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
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { paddingBottom: 40 },
  profileHeader: {
    backgroundColor: '#FFFFFF', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, marginBottom: 24,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: { width: 220, height: 220, borderRadius: 110, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 220, height: 220, borderRadius: 110, backgroundColor: '#F2F2F7' },
  editAvatarButton: {
    position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  userName: {
    fontSize: 28, fontWeight: '700', color: '#000000', marginBottom: 8, textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  userEmail: { fontSize: 16, color: '#8E8E93', marginBottom: 20, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2FF',
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
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: '#000000', marginBottom: 20, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  contactInfo: { gap: 20 },
  contactItem: { flexDirection: 'row', alignItems: 'flex-start' },
  contactIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF15', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  contactDetails: { flex: 1 },
  contactLabel: { fontSize: 12, fontWeight: '500', color: '#8E8E93', marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  contactText: { fontSize: 16, fontWeight: '500', color: '#000000', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  menuItems: { gap: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16, fontWeight: '500', color: '#000000', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  menuItemSubtitle: {
    fontSize: 14, color: '#8E8E93', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  menuDivider: { height: 1, backgroundColor: '#F2F2F7', marginLeft: 52 },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  // Modal viewer styles
  viewerBackdrop: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  viewerHeader: { position: 'absolute', top: 0, left: 0, right: 0, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, zIndex: 1 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF20', justifyContent: 'center', alignItems: 'center' },
  viewerTitle: { flex: 1, color: '#FFFFFF', fontSize: 18, fontWeight: '600', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  viewerContainer: { width: '100%', height: '80%', justifyContent: 'center', alignItems: 'center' },
  viewerImage: { width: '100%', height: '85%' },
  viewerPlaceholder: { color: '#FFFFFF80', fontSize: 16, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
});
