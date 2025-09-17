import { Audio } from 'expo-av';

export class AudioService {
  private recording: Audio.Recording | null = null;
  private isRecording = false;
  private currentSound: Audio.Sound | null = null;

  async startRecording(): Promise<void> {
    try {
      // Demander les permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission microphone refusée');
      }

      // Configurer l'audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Créer l'enregistrement
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      // Démarrer l'enregistrement
      await this.recording.startAsync();
      this.isRecording = true;
    } catch (error) {
      console.error('Erreur démarrage enregistrement:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<string | null> {
    if (!this.recording || !this.isRecording) {
      return null;
    }

    try {
      await this.recording.stopAndUnloadAsync();
      this.isRecording = false;

      const uri = this.recording.getURI();
      this.recording = null;

      return uri;
    } catch (error) {
      console.error('Erreur arrêt enregistrement:', error);
      throw error;
    }
  }

  async cancelRecording(): Promise<void> {
    if (this.recording && this.isRecording) {
      try {
        await this.recording.stopAndUnloadAsync();
        this.isRecording = false;
        this.recording = null;
      } catch (error) {
        console.error('Erreur annulation enregistrement:', error);
      }
    }
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  // Obtenir la durée d'un fichier audio
  async getAudioDuration(uri: string): Promise<number> {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      const status = await sound.getStatusAsync();
      const duration = (status as any).durationMillis / 1000; // en secondes
      await sound.unloadAsync();
      return duration;
    } catch (error) {
      console.error('Erreur lecture durée:', error);
      return 0;
    }
  }

  // Jouer un fichier audio
  async playAudio(uri: string): Promise<void> {
    try {
      // Arrêter le son actuel s'il y en a un
      if (this.currentSound) {
        await this.currentSound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri });
      this.currentSound = sound;
      await sound.playAsync();
      
      // Attendre la fin de la lecture avant de nettoyer
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.currentSound = null;
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Erreur lecture audio:', error);
      throw error;
    }
  }

  // Mettre en pause l'audio actuel
  async pauseAudio(): Promise<void> {
    try {
      if (this.currentSound) {
        await this.currentSound.pauseAsync();
      }
    } catch (error) {
      console.error('Erreur pause audio:', error);
      throw error;
    }
  }

  // Reprendre l'audio
  async resumeAudio(): Promise<void> {
    try {
      if (this.currentSound) {
        await this.currentSound.playAsync();
      }
    } catch (error) {
      console.error('Erreur reprise audio:', error);
      throw error;
    }
  }

  // Arrêter complètement l'audio
  async stopAudio(): Promise<void> {
    try {
      if (this.currentSound) {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      }
    } catch (error) {
      console.error('Erreur arrêt audio:', error);
      throw error;
    }
  }
}
