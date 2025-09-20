import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { updateNotificationPreferences } from '../../store/slices/notificationSlice';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { preferences } = useSelector((state: RootState) => state.notifications);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  React.useEffect(() => {
    if (preferences) {
      setNotificationsEnabled(preferences.pushNotifications);
    }
  }, [preferences]);

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
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          },
        },
      ]
    );
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await dispatch(updateNotificationPreferences({ pushNotifications: value }));
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour les préférences');
      setNotificationsEnabled(!value);
    }
  };

  const navigateToEditProfile = () => {
    // TODO: Implémenter l'édition du profil
    Alert.alert('Info', 'Fonctionnalité en cours de développement');
  };

  const navigateToSettings = () => {
    // TODO: Implémenter les paramètres
    Alert.alert('Info', 'Fonctionnalité en cours de développement');
  };

  const navigateToHelp = () => {
    // TODO: Implémenter l'aide
    Alert.alert('Info', 'Fonctionnalité en cours de développement');
  };

  const navigateToAbout = () => {
    // TODO: Implémenter la page À propos
    Alert.alert('Info', 'Fonctionnalité en cours de développement');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </Text>
          </View>
          <TouchableOpacity style={styles.editAvatarButton}>
            <Ionicons name="camera" size={16} color="white" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.userName}>
          {user?.prenom} {user?.nom}
        </Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <Text style={styles.userRole}>
          {user?.role === 'PATIENT' ? 'Patient' : 'Médecin'}
        </Text>
      </View>

      {/* Profile Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionItem} onPress={navigateToEditProfile}>
          <View style={styles.actionLeft}>
            <Ionicons name="person-outline" size={24} color="#3498db" />
            <Text style={styles.actionText}>Modifier le profil</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={navigateToSettings}>
          <View style={styles.actionLeft}>
            <Ionicons name="settings-outline" size={24} color="#7f8c8d" />
            <Text style={styles.actionText}>Paramètres</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.actionItem}>
          <View style={styles.actionLeft}>
            <Ionicons name="notifications-outline" size={24} color="#f39c12" />
            <View>
              <Text style={styles.actionText}>Notifications push</Text>
              <Text style={styles.actionSubtext}>Recevoir des notifications</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: '#e1e8ed', true: '#3498db' }}
            thumbColor={notificationsEnabled ? 'white' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.actionItem} onPress={navigateToHelp}>
          <View style={styles.actionLeft}>
            <Ionicons name="help-circle-outline" size={24} color="#9b59b6" />
            <Text style={styles.actionText}>Aide</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={navigateToAbout}>
          <View style={styles.actionLeft}>
            <Ionicons name="information-circle-outline" size={24} color="#7f8c8d" />
            <Text style={styles.actionText}>À propos</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>SantéAfrik v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 10,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 15,
  },
  actionSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 15,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  logoutText: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '500',
    marginLeft: 10,
  },
  versionContainer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#bdc3c7',
  },
});
