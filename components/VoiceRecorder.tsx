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
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const startRecording = async () => {
    try {
      await audioService.startRecording();
      setIsRecording(true);
      setDuration(0);

      // Animation de pulsation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
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
      scaleAnim.stopAnimation();
      scaleAnim.setValue(1);

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
      scaleAnim.stopAnimation();
      scaleAnim.setValue(1);

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
    <Modal visible={true} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <View style={styles.recordingInfo}>
            <Text style={styles.duration}>{formatDuration(duration)}</Text>
            {isRecording && (
              <Animated.View style={[styles.recordingIndicator, { transform: [{ scale: scaleAnim }] }]}>
                <View style={styles.recordingDot} />
              </Animated.View>
            )}
          </View>

          <View style={styles.controls}>
            {!isRecording ? (
              <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
                <Ionicons name="mic" size={24} color="white" />
                <Text style={styles.recordText}>Enregistrer</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                  <Ionicons name="stop" size={24} color="white" />
                  <Text style={styles.stopText}>Arrêter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelRecording}>
                  <Ionicons name="close" size={24} color="white" />
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 20,
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  duration: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 15,
  },
  recordingIndicator: {
    marginLeft: 10,
  },
  recordingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  recordText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stopText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#8E8E93',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});
