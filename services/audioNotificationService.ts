import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { notificationService } from './notificationService';
import { Platform } from 'react-native';

function resolveSoundModule(soundPath?: string): any | null {
  // Utiliser le son par défaut du système
  return null; // On utilisera le son système par défaut
}

class AudioNotificationService {
  private soundObject: Audio.Sound | null = null;
  private isPlaying = false;

  // Jouer un son de notification
  async playNotificationSound(soundFile?: string) {
    try {
      const preferences = notificationService.getPreferences();
      
      // Vérifier si les sons sont activés
      if (!preferences?.soundenabled) {
        console.log('🔇 Sons de notification désactivés');
        return;
      }

      console.log('🔊 Tentative de lecture son de notification...');

      // 1. Essayer la vibration d'abord (plus fiable)
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log('📳 Vibration de notification jouée');
      } catch (hapticError) {
        console.log('⚠️ Erreur vibration:', hapticError);
      }

      // 2. Essayer un son simple avec Audio
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
          playsInSilentModeIOS: false, // respecter le mode silencieux iOS
          interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        // Arrêter le son précédent s'il joue encore
        if (this.isPlaying && this.soundObject) {
          await this.soundObject.stopAsync();
          await this.soundObject.unloadAsync();
        }

        // Créer un nouvel objet audio
        this.soundObject = new Audio.Sound();
        
        // Utiliser un son système simple
        const soundSource = Platform.OS === 'ios' 
          ? { uri: 'system://default' }
          : { uri: 'system://notification' };
        
        console.log('🔊 Chargement son système:', soundSource);
        
        // Charger le son système
        await this.soundObject.loadAsync(soundSource, { 
          shouldPlay: true, 
          isLooping: false,
          volume: 0.8
        });

        this.isPlaying = true;

        // Écouter la fin de la lecture
        this.soundObject.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            this.isPlaying = false;
            this.soundObject?.unloadAsync();
            this.soundObject = null;
          }
        });

        console.log('🔊 Son de notification joué');
      } catch (audioError) {
        console.log('⚠️ Erreur audio, utilisation vibration uniquement:', audioError);
        // La vibration a déjà été jouée, c'est suffisant
      }

    } catch (error) {
      console.error('❌ Erreur lecture son notification:', error);
      this.isPlaying = false;
    }
  }

  // Jouer un son de test
  async playTestSound() {
    await this.playNotificationSound();
  }

  // Arrêter le son en cours
  async stopSound() {
    try {
      if (this.soundObject && this.isPlaying) {
        await this.soundObject.stopAsync();
        await this.soundObject.unloadAsync();
        this.soundObject = null;
        this.isPlaying = false;
        console.log('🔇 Son de notification arrêté');
      }
    } catch (error) {
      console.error('❌ Erreur arrêt son:', error);
    }
  }

  // Vérifier si un son est en cours de lecture
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  // Nettoyer les ressources
  async cleanup() {
    await this.stopSound();
  }
}

export const audioNotificationService = new AudioNotificationService();
