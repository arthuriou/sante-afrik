import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AudioService } from '../services/audio';

interface VoiceRecorderProps {
  onRecordingComplete: (audioUri: string, duration: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const audioService = useRef(new AudioService()).current;
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startRecording = async () => {
    try {
      await audioService.startRecording();
      setIsRecording(true);
      setDuration(0);

      // Animation de pulsation minimaliste
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Timer de durée
      durationInterval.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Erreur démarrage:', error);
    }
  };

  const stopRecording = async () => {
    try {
      const uri = await audioService.stopRecording();
      if (uri) {
        const audioDuration = await audioService.getAudioDuration(uri);
        onRecordingComplete(uri, audioDuration);
      }
      setIsRecording(false);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    } catch (error) {
      console.error('Erreur arrêt:', error);
    }
  };

  const cancelRecording = async () => {
    try {
      await audioService.cancelRecording();
      setIsRecording(false);
      setDuration(0);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }

      onCancel();
    } catch (error) {
      console.error('Erreur annulation:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Header minimaliste */}
          <View style={styles.header}>
            <Text style={styles.title}>Note vocale</Text>
            <TouchableOpacity onPress={cancelRecording} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Zone d'enregistrement */}
          <View style={styles.recordingArea}>
            {isRecording ? (
              <View style={styles.recordingContainer}>
                <Animated.View style={[styles.recordingButton, { transform: [{ scale: pulseAnim }] }]}>
                  <Ionicons name="mic" size={24} color="white" />
                </Animated.View>
                <Text style={styles.recordingText}>Enregistrement en cours...</Text>
                <Text style={styles.duration}>{formatDuration(duration)}</Text>
              </View>
            ) : (
              <View style={styles.readyContainer}>
                <TouchableOpacity style={styles.readyButton} onPress={startRecording}>
                  <Ionicons name="mic" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.readyText}>Appuyez pour enregistrer</Text>
              </View>
            )}
          </View>

          {/* Contrôles */}
          {isRecording && (
            <View style={styles.controls}>
              <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                <Ionicons name="stop" size={20} color="white" />
                <Text style={styles.stopText}>Arrêter</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  recordingArea: {
    padding: 32,
    alignItems: 'center',
  },
  recordingContainer: {
    alignItems: 'center',
  },
  recordingButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recordingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
  },
  duration: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  readyContainer: {
    alignItems: 'center',
  },
  readyButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  readyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stopText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
});
