import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import {
  loadAudioFromServer,
  loadAudioFromLocal,
} from '@/app/screens/student/utils/audioUtils';

export const useAudioPlayer = () => {
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [loadingAudioKey, setLoadingAudioKey] = useState<string | null>(null);

  useEffect(() => {
    async function initAudio() {
      try {
        if (Platform.OS !== 'web') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        }
      } catch (err) {
        console.error('Failed to configure audio:', err);
      }
    }
    initAudio();
  }, []);

  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, []);

  const stopAllAudio = async () => {
    try {
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        setCurrentSound(null);
        setPlayingSound(null);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const playSound = async (
    soundName: string,
    isServerAudio = false,
    audioId?: string
  ) => {
    try {
      const soundKey =
        isServerAudio && audioId ? `server_${audioId}` : soundName;
      setIsLoadingAudio(true);
      setLoadingAudioKey(soundKey);

      await stopAllAudio();

      let sound: Audio.Sound | null = null;

      if (isServerAudio && audioId) {
        sound = await loadAudioFromServer(audioId);
      } else {
        sound = await loadAudioFromLocal(soundName);
      }

      if (sound) {
        setCurrentSound(sound);
        setPlayingSound(soundKey);

        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingSound(null);
            setCurrentSound(null);
          }
        });

        await sound.playAsync();
      } else {
        console.warn(`Failed to load audio: ${soundKey}`);
        throw new Error('Nie udało się załadować pliku audio');
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      setPlayingSound(null);
      setCurrentSound(null);
      throw error;
    } finally {
      setIsLoadingAudio(false);
      setLoadingAudioKey(null);
    }
  };

  const stopSound = async () => {
    try {
      setIsLoadingAudio(true);
      await stopAllAudio();
    } catch (error) {
      console.error('Error stopping sound:', error);
    } finally {
      setIsLoadingAudio(false);
      setLoadingAudioKey(null);
    }
  };

  return {
    currentSound,
    playingSound,
    isLoadingAudio,
    loadingAudioKey,
    playSound,
    stopSound,
    stopAllAudio,
  };
};
