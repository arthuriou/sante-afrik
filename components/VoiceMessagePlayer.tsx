import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AudioService } from '../services/audio';

interface VoiceMessagePlayerProps {
  audioUri: string;
  duration: number;
  isMine?: boolean;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  audioUri,
  duration,
  isMine = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioService = useRef(new AudioService()).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Nettoyer l'intervalle au démontage
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateProgress = () => {
    if (duration > 0) {
      const progress = currentTime / duration;
      progressAnim.setValue(progress);
    }
  };

  const startProgressTracking = () => {
    updateInterval.current = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 0.1;
        if (newTime >= duration) {
          setIsPlaying(false);
          setCurrentTime(0);
          progressAnim.setValue(0);
          if (updateInterval.current) {
            clearInterval(updateInterval.current);
          }
          return 0;
        }
        return newTime;
      });
    }, 100);
  };

  const stopProgressTracking = () => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
    }
  };

  const togglePlayPause = async () => {
    try {
      if (isPlaying) {
        // Pause
        await audioService.pauseAudio();
        setIsPlaying(false);
        stopProgressTracking();
      } else {
        // Play
        setIsLoading(true);
        await audioService.playAudio(audioUri);
        setIsPlaying(true);
        startProgressTracking();
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Erreur lecture audio:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    updateProgress();
  }, [currentTime, duration]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, isMine && styles.containerMine]}>
      {/* Bouton play/pause */}
      <TouchableOpacity
        style={[styles.playButton, isMine && styles.playButtonMine]}
        onPress={togglePlayPause}
        disabled={isLoading}
      >
        {isLoading ? (
          <Ionicons name="hourglass" size={16} color={isMine ? "#FFFFFF" : "#007AFF"} />
        ) : (
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={16} 
            color={isMine ? "#FFFFFF" : "#007AFF"} 
          />
        )}
      </TouchableOpacity>

      {/* Barre de progression */}
      <View style={[styles.progressContainer, isMine && styles.progressContainerMine]}>
        <View style={[styles.progressTrack, isMine && styles.progressTrackMine]}>
          <Animated.View
            style={[
              styles.progressFill,
              isMine && styles.progressFillMine,
              { width: progressWidth }
            ]}
          />
        </View>
        
        {/* Indicateurs de temps */}
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, isMine && styles.timeTextMine]}>
            {formatTime(currentTime)}
          </Text>
          <Text style={[styles.timeText, isMine && styles.timeTextMine]}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* Indicateur de statut */}
      {isMine && (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-done" size={12} color="#34C759" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 200,
    maxWidth: 280,
  },
  containerMine: {
    backgroundColor: '#007AFF',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playButtonMine: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressContainer: {
    flex: 1,
  },
  progressContainerMine: {
    // Pas de changement de style pour le conteneur
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressTrackMine: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressFillMine: {
    backgroundColor: '#FFFFFF',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  timeTextMine: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statusContainer: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
