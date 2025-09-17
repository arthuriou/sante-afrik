import { Audio } from 'expo-av';
import { notificationService } from './notificationService';

// Désactivé: pour éviter les erreurs Metro tant que le fichier n'est pas renommé sans espaces/parenthèses
function resolveSoundModule(_soundPath?: string): any | null { return null; }

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

      // Utiliser le son spécifié ou celui des préférences
      const soundToPlay = soundFile || preferences.soundfile || '';
      const soundModule = resolveSoundModule(soundToPlay);

      if (!soundModule) {
        console.log('⚠️ Aucun son packagé trouvé, on n\'émet pas de son in-app');
        return;
      }

      // Arrêter le son précédent s'il joue encore
      if (this.isPlaying && this.soundObject) {
        await this.soundObject.stopAsync();
        await this.soundObject.unloadAsync();
      }

      // Créer un nouvel objet audio
      this.soundObject = new Audio.Sound();
      
      // Charger le son
      await this.soundObject.loadAsync(soundModule, { shouldPlay: true, isLooping: false });

      this.isPlaying = true;

      // Écouter la fin de la lecture
      this.soundObject.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.isPlaying = false;
          this.soundObject?.unloadAsync();
          this.soundObject = null;
        }
      });

      console.log('🔊 Son de notification joué:', soundToPlay);
    } catch (error) {
      console.error('❌ Erreur lecture son notification:', error);
      this.isPlaying = false;
    }
  }

  // Jouer un son de test
  async playTestSound() {
    await this.playNotificationSound('/sounds/notification.mp3');
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
