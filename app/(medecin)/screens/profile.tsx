import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function MedecinProfileScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const userInfo = {
    name: 'Dr. Martin Dubois',
    email: 'martin.dubois@email.com',
    phone: '+33 1 42 36 78 90',
    specialty: 'Médecine générale',
    experience: '15 ans',
    address: '15 rue de Rivoli, 75001 Paris',
    rpps: '12345678901',
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

  const handleAction = (item) => {
    switch (item.action) {
      case 'navigate':
        Alert.alert('Navigation', `Navigation vers ${item.title}`);
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

  const renderMenuItem = (item) => (
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* En-tête du profil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="medical" size={40} color="#8E8E93" />
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{userInfo.name}</Text>
          <Text style={styles.userSpecialty}>{userInfo.specialty}</Text>
          <Text style={styles.userExperience}>{userInfo.experience} d'expérience</Text>
          
          <TouchableOpacity style={styles.editProfileButton}>
            <Ionicons name="create-outline" size={16} color="#34C759" />
            <Text style={styles.editProfileText}>Modifier le profil</Text>
          </TouchableOpacity>
        </View>

        {/* Informations professionnelles */}
        <View style={styles.quickInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color="#34C759" />
            <Text style={styles.infoText}>{userInfo.phone}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#34C759" />
            <Text style={styles.infoText}>{userInfo.address}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="card-outline" size={20} color="#34C759" />
            <Text style={styles.infoText}>RPPS: {userInfo.rpps}</Text>
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
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  userSpecialty: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '500',
    marginBottom: 4,
  },
  userExperience: {
    fontSize: 14,
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
    color: '#34C759',
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
});
