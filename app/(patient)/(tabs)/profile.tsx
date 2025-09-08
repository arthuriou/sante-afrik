import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['userToken', 'userData']);
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Erreur déconnexion:', error);
            }
          },
        },
      ]
    );
  };

  const ProfileSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const ProfileItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent,
    showChevron = true 
  }: { 
    icon: string; 
    title: string; 
    subtitle?: string; 
    onPress?: () => void; 
    rightComponent?: React.ReactNode;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.profileItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemLeft}>
        <Ionicons name={icon as any} size={20} color="#007AFF" />
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.profileItemRight}>
        {rightComponent}
        {showChevron && !rightComponent && (
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informations utilisateur */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={40} color="#007AFF" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.prenom} {user?.nom}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userRole}>Patient</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => Alert.alert('Modifier', 'Édition du profil à venir')}
          >
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Informations médicales */}
        <ProfileSection title="Informations médicales">
          <ProfileItem
            icon="medical"
            title="Dossier médical"
            subtitle="Consultez vos documents et ordonnances"
            onPress={() => router.push('/(patient)/(tabs)/medical-record')}
          />
          <ProfileItem
            icon="heart"
            title="Groupe sanguin"
            subtitle={user?.patient?.groupesanguin || 'Non renseigné'}
            onPress={() => Alert.alert('Groupe sanguin', 'Modification à venir')}
          />
          <ProfileItem
            icon="fitness"
            title="Poids & Taille"
            subtitle={`${user?.patient?.poids || 'N/A'}kg - ${user?.patient?.taille || 'N/A'}cm`}
            onPress={() => Alert.alert('Poids & Taille', 'Modification à venir')}
          />
        </ProfileSection>

        {/* Paramètres */}
        <ProfileSection title="Paramètres">
          <ProfileItem
            icon="notifications"
            title="Notifications"
            subtitle="Recevez des rappels pour vos RDV"
            rightComponent={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#ccc', true: '#007AFF' }}
                thumbColor="white"
              />
            }
            showChevron={false}
          />
          <ProfileItem
            icon="moon"
            title="Mode sombre"
            subtitle="Activez le thème sombre"
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#ccc', true: '#007AFF' }}
                thumbColor="white"
              />
            }
            showChevron={false}
          />
          <ProfileItem
            icon="language"
            title="Langue"
            subtitle="Français"
            onPress={() => Alert.alert('Langue', 'Sélection de langue à venir')}
          />
        </ProfileSection>

        {/* Sécurité */}
        <ProfileSection title="Sécurité">
          <ProfileItem
            icon="lock-closed"
            title="Changer le mot de passe"
            subtitle="Modifiez votre mot de passe"
            onPress={() => Alert.alert('Mot de passe', 'Changement de mot de passe à venir')}
          />
          <ProfileItem
            icon="finger-print"
            title="Authentification biométrique"
            subtitle="Activez Touch ID / Face ID"
            onPress={() => Alert.alert('Biométrie', 'Configuration biométrique à venir')}
          />
        </ProfileSection>

        {/* Support */}
        <ProfileSection title="Support">
          <ProfileItem
            icon="help-circle"
            title="Centre d'aide"
            subtitle="FAQ et guides d'utilisation"
            onPress={() => Alert.alert('Aide', 'Centre d\'aide à venir')}
          />
          <ProfileItem
            icon="mail"
            title="Nous contacter"
            subtitle="Envoyez-nous vos questions"
            onPress={() => Alert.alert('Contact', 'Formulaire de contact à venir')}
          />
          <ProfileItem
            icon="star"
            title="Évaluer l'application"
            subtitle="Donnez votre avis sur l'App Store"
            onPress={() => Alert.alert('Évaluation', 'Redirection vers App Store à venir')}
          />
        </ProfileSection>

        {/* À propos */}
        <ProfileSection title="À propos">
          <ProfileItem
            icon="information-circle"
            title="Version de l'application"
            subtitle="1.0.0"
            showChevron={false}
          />
          <ProfileItem
            icon="document-text"
            title="Conditions d'utilisation"
            onPress={() => Alert.alert('CGU', 'Conditions d\'utilisation à venir')}
          />
          <ProfileItem
            icon="shield"
            title="Politique de confidentialité"
            onPress={() => Alert.alert('Confidentialité', 'Politique de confidentialité à venir')}
          />
        </ProfileSection>

        {/* Déconnexion */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#FF5722" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        {/* Version et copyright */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>SantéAfrik v1.0.0</Text>
          <Text style={styles.footerText}>© 2024 SantéAfrik. Tous droits réservés.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemText: {
    marginLeft: 12,
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  profileItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  profileItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutSection: {
    marginBottom: 30,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF5722',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF5722',
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textAlign: 'center',
  },
});