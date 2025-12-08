import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { AudioService } from '../services/audio';
import { useAudio } from '../services/audioContext';

interface VoiceMessagePlayerProps {
  audioUri: string;
  duration: number;
  isMine?: boolean;
  senderPhoto?: string;
  senderName?: string;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  audioUri,
  duration,
  isMine = false,
  senderPhoto,
  senderName,
}) => {
  console.log('🎵 VoiceMessagePlayer props:', {
    audioUri,
    duration,
    isMine,
    senderPhoto,
    senderName
  });
  
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
      console.log('🎵 Tentative de lecture audio:', audioUri);
      
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
        
        // Vérifier que l'URI est valide
        if (!audioUri || audioUri === 'undefined' || audioUri === 'null') {
          throw new Error('URI audio invalide');
        }
        
        console.log('🎵 Lecture de l\'audio:', audioUri);
        await audioService.playAudio(audioUri);
        setIsPlaying(true);
        startProgressTracking();
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Erreur lecture audio:', error);
      setIsLoading(false);
      setCurrentPlayingId(null);
      // Afficher une alerte pour l'utilisateur
      Alert.alert('Erreur', `Impossible de lire le message vocal: ${(error as Error).message}`);
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
      {/* Photo de profil pour les messages reçus */}
      {!isMine && (
        <View style={styles.profileContainer}>
          <View style={styles.profileImageContainer}>
            {senderPhoto ? (
              <Image
                source={{ uri: senderPhoto }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImageText}>
                  {senderName?.[0] || 'U'}
                </Text>
              </View>
            )}
            {/* Icône microphone */}
            <View style={styles.micIcon}>
              <Ionicons name="mic" size={8} color="#FFFFFF" />
            </View>
          </View>
        </View>
      )}

      {/* Bouton play/pause */}
      <TouchableOpacity
        style={[styles.playButton, isMine && styles.playButtonMine]}
        onPress={togglePlayPause}
        disabled={isLoading}
      >
        {isLoading ? (
          <Ionicons name="hourglass-outline" size={20} color="#FFFFFF" />
        ) : (
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={20} 
            color="#FFFFFF" 
            style={isPlaying ? {} : { marginLeft: 2 }}
          />
        )}
      </TouchableOpacity>

      {/* Visualisation audio avec barres */}
      <View style={[styles.audioVisualization, isMine && styles.audioVisualizationMine]}>
        {Array.from({ length: 12 }, (_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.audioBar,
              isMine && styles.audioBarMine,
              isPlaying && styles.audioBarPlaying,
              {
                height: Math.random() * 20 + 8,
                opacity: isPlaying ? 1 : 0.6,
              }
            ]}
          />
        ))}
      </View>

      {/* Durée */}
      <Text style={[styles.durationText, isMine && styles.durationTextMine]}>
        {formatTime(duration)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 220,
    maxWidth: 300,
    overflow: 'hidden',
  },
  containerMine: {
    backgroundColor: '#DCF8C6',
  },
  profileContainer: {
    marginRight: 8,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C7C7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  micIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playButtonMine: {
    backgroundColor: '#34C759',
  },
  audioVisualization: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  audioVisualizationMine: {
    // Pas de changement pour les messages envoyés
  },
  audioBar: {
    width: 2,
    backgroundColor: '#C7C7CC',
    borderRadius: 1,
    marginHorizontal: 1,
  },
  audioBarMine: {
    backgroundColor: '#8E8E93',
  },
  audioBarPlaying: {
    backgroundColor: '#34C759',
  },
  durationText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginLeft: 8,
  },
  durationTextMine: {
    color: '#8E8E93',
  },
});
