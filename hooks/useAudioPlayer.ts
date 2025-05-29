import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { loadAudioFromServer, loadAudioFromLocal } from '@/app/screens/student/utils/audioUtils';

export const useAudioPlayer = () => {
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [loadingAudioKey, setLoadingAudioKey] = useState<string | null>(null);

  // Initialize audio system
  useEffect(() => {
    async function initAudio() {
      try {
        if (Platform.OS !== "web") {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        }
        console.log("🎵 Audio system initialized for examiner dashboard");
      } catch (err) {
        console.error("Failed to configure audio:", err);
      }
    }
    initAudio();
  }, []);

  // Cleanup audio on unmount
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
      console.error("Error stopping audio:", error);
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

      // Stop any currently playing audio first
      await stopAllAudio();

      let sound: Audio.Sound | null = null;

      if (isServerAudio && audioId) {
        console.log(`🔊 Playing server audio: ${audioId}`);
        sound = await loadAudioFromServer(audioId);
      } else {
        console.log(`🔊 Playing local sound: ${soundName}`);
        sound = await loadAudioFromLocal(soundName);
      }

      if (sound) {
        setCurrentSound(sound);
        setPlayingSound(soundKey);

        // Set up playback status listener
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingSound(null);
            setCurrentSound(null);
          }
        });

        await sound.playAsync();
        console.log(`✅ Audio playing: ${soundKey}`);
      } else {
        console.warn(`Failed to load audio: ${soundKey}`);
        throw new Error("Nie udało się załadować pliku audio");
      }
    } catch (error) {
      console.error("Error playing sound:", error);
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
      console.error("Error stopping sound:", error);
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
