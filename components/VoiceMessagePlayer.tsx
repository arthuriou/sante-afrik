import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AudioService } from '../services/audio';
import { useAudio } from '../services/audioContext';

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
  const updateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const { currentPlayingId, setCurrentPlayingId } = useAudio();
  
  // ID unique pour ce player
  const playerId = useRef(audioUri).current;

  useEffect(() => {
    return () => {
      // Nettoyer l'intervalle au démontage
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, []);

  // Vérifier si un autre audio est en cours de lecture
  useEffect(() => {
    if (currentPlayingId !== playerId && isPlaying) {
      // Un autre audio est en cours, arrêter celui-ci
      setIsPlaying(false);
      stopProgressTracking();
    }
  }, [currentPlayingId, playerId, isPlaying]);

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
        setCurrentPlayingId(null);
        stopProgressTracking();
      } else {
        // Play - arrêter tous les autres audios d'abord
        setCurrentPlayingId(playerId);
        setIsLoading(true);
        await audioService.playAudio(audioUri);
        setIsPlaying(true);
        startProgressTracking();
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Erreur lecture audio:', error);
      setIsLoading(false);
      setCurrentPlayingId(null);
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
          <Ionicons name="hourglass-outline" size={20} color={isMine ? "#FFFFFF" : "#007AFF"} />
        ) : (
          <Ionicons 
            name={isPlaying ? "pause-outline" : "play-outline"} 
            size={20} 
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 220,
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.15)',
  },
  containerMine: {
    backgroundColor: '#007AFF',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  playButtonMine: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressContainer: {
    flex: 1,
  },
  progressContainerMine: {
    // Pas de changement de style pour le conteneur
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 6,
  },
  progressTrackMine: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
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
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  timeTextMine: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
