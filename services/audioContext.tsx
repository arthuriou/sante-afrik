import React, { createContext, ReactNode, useContext, useState } from 'react';

interface AudioContextType {
  currentPlayingId: string | null;
  setCurrentPlayingId: (id: string | null) => void;
  stopAllAudio: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  const stopAllAudio = () => {
    setCurrentPlayingId(null);
  };

  return (
    <AudioContext.Provider 
      value={{ 
        currentPlayingId, 
        setCurrentPlayingId, 
        stopAllAudio 
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
