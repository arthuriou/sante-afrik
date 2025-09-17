import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { NotificationPreferences, notificationService } from '../../../services/notificationService';

export default function MedecinNotificationSettingsScreen() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Sons disponibles
  const availableSounds = [
    { value: '/sounds/notification.mp3', label: 'Notification par défaut' },
    { value: '/sounds/message.mp3', label: 'Message' },
    { value: '/sounds/appointment.mp3', label: 'Rendez-vous' },
    { value: '/sounds/reminder.mp3', label: 'Rappel' },
    { value: '/sounds/emergency.mp3', label: 'Urgence' },
  ];

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await notificationService.getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('❌ Erreur chargement préférences:', error);
      Alert.alert('Erreur', 'Impossible de charger les préférences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (updatedPrefs: Partial<NotificationPreferences>) => {
    try {
      setSaving(true);
      const newPrefs = await notificationService.updatePreferences(updatedPrefs);
      setPreferences(newPrefs);
      console.log('✅ Préférences sauvegardées');
    } catch (error) {
      console.error('❌ Erreur sauvegarde préférences:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les préférences');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    Alert.alert(
      'Réinitialiser',
      'Voulez-vous réinitialiser toutes les préférences aux valeurs par défaut ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const defaultPrefs = await notificationService.resetPreferences();
              setPreferences(defaultPrefs);
              Alert.alert('Succès', 'Préférences réinitialisées');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de réinitialiser les préférences');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    if (!preferences) return;
    
    const updatedPrefs = { ...preferences, [key]: value };
    setPreferences(updatedPrefs);
    savePreferences({ [key]: value });
  };

  const testNotification = async () => {
    try {
      await notificationService.sendImmediateNotification(
        'Test de notification',
        'Ceci est un test de notification',
        { test: true }
      );
      Alert.alert('Test envoyé', 'Une notification de test a été envoyée');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer la notification de test');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPreferences();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Chargement des préférences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>Impossible de charger les préférences</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPreferences}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Préférences de notifications</Text>
          <Text style={styles.subtitle}>Personnalisez vos notifications</Text>
        </View>

        {/* Sons et audio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 Sons et audio</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Activer les sons</Text>
              <Text style={styles.settingDescription}>Jouer un son pour les notifications</Text>
            </View>
            <Switch
              value={preferences.soundenabled}
              onValueChange={(value) => updatePreference('soundenabled', value)}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor={preferences.soundenabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          {preferences.soundenabled && (
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Son de notification</Text>
                <Text style={styles.settingDescription}>
                  {availableSounds.find(s => s.value === preferences?.soundfile)?.label || 'Son personnalisé'}
                </Text>
              </View>
              <TouchableOpacity style={styles.selectButton}>
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          )}

          {/* Le volume est géré par l'appareil. Contrôle retiré. */}

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Vibration</Text>
              <Text style={styles.settingDescription}>Vibrer lors des notifications</Text>
            </View>
            <Switch
              value={preferences.vibration}
              onValueChange={(value) => updatePreference('vibration', value)}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor={preferences.vibration ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Types de notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Types de notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifications push</Text>
              <Text style={styles.settingDescription}>Recevoir des notifications sur l'appareil</Text>
            </View>
            <Switch
              value={preferences.pushenabled}
              onValueChange={(value) => updatePreference('pushenabled', value)}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor={preferences.pushenabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifications email</Text>
              <Text style={styles.settingDescription}>Recevoir des notifications par email</Text>
            </View>
            <Switch
              value={preferences.emailenabled}
              onValueChange={(value) => updatePreference('emailenabled', value)}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor={preferences.emailenabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notifications SMS</Text>
              <Text style={styles.settingDescription}>Recevoir des notifications par SMS</Text>
            </View>
            <Switch
              value={preferences.smsenabled}
              onValueChange={(value) => updatePreference('smsenabled', value)}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor={preferences.smsenabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={testNotification}
            disabled={saving}
          >
            <Ionicons name="notifications" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Tester la notification</Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.resetButton]} 
            onPress={resetToDefaults}
            disabled={saving}
          >
            <Ionicons name="refresh" size={20} color="#FF3B30" />
            <Text style={[styles.actionButtonText, styles.resetButtonText]}>
              Réinitialiser aux valeurs par défaut
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {saving && (
          <View style={styles.savingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.savingText}>Sauvegarde en cours...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  selectButton: {
    padding: 4,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  volumeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginHorizontal: 8,
  },
  volumeFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 1,
    borderRadius: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 12,
  },
  resetButton: {
    marginTop: 8,
  },
  resetButtonText: {
    color: '#FF3B30',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  savingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
});
