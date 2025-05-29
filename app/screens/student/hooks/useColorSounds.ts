import { useState, useEffect, useCallback } from "react";
import { Audio } from "expo-av";
import { ColorConfig } from "@/services/ColorConfigService";
import { loadAudioFromLocal, loadAudioFromServer } from "../utils/audioUtils";

interface UseColorSoundsReturn {
  playColorSound: (config: ColorConfig) => Promise<void>;
  stopAllColorSounds: () => Promise<void>;
  currentSound: Audio.Sound | null;
  playingSound: string | null;
  isLoadingAudio: boolean;
}

export const useColorSounds = (): UseColorSoundsReturn => {
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [playingColor, setPlayingColor] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // Initialize audio system
  useEffect(() => {
    async function initAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log("🎵 Audio system initialized for color sounds");
      } catch (err) {
        console.error("Failed to configure audio for color sounds:", err);
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
  }, [currentSound]);  const stopAllAudio = async () => {
    try {
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        setCurrentSound(null);
        setPlayingSound(null);
        setPlayingColor(null);
      }
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
  };

  const playSound = async (config: ColorConfig) => {
    try {
      const soundKey = config.serverAudioId
        ? `server_${config.serverAudioId}`
        : config.soundName || "";
      
      setIsLoadingAudio(true);

      // Stop any currently playing audio first
      await stopAllAudio();

      let sound: Audio.Sound | null = null;

      if (config.serverAudioId) {
        console.log(`🔊 Playing server audio for color: ${config.color} (looping: ${config.isLooping})`);
        sound = await loadAudioFromServer(config.serverAudioId);

        if (sound) {
          setCurrentSound(sound);
          setPlayingSound(soundKey);
          setPlayingColor(config.color);

          await sound.setIsLoopingAsync(config.isLooping || false);

          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded && status.didJustFinish && !config.isLooping) {
              setPlayingSound(null);
              setPlayingColor(null);
              setCurrentSound(null);
            }
          });

          await sound.playAsync();
          console.log(`✅ Server audio playing for color: ${config.color}`);
        } else {
          console.warn(`Failed to load server audio for color: ${config.color}`);
        }
      } else if (config.soundName) {
        console.log(`🔊 Playing local sound for color: ${config.color} (looping: ${config.isLooping})`);
        sound = await loadAudioFromLocal(config.soundName);

        if (sound) {
          setCurrentSound(sound);
          setPlayingSound(soundKey);
          setPlayingColor(config.color);

          await sound.setIsLoopingAsync(config.isLooping || false);

          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded && status.didJustFinish && !config.isLooping) {
              setPlayingSound(null);
              setPlayingColor(null);
              setCurrentSound(null);
            }
          });

          await sound.playAsync();
          console.log(`✅ Local audio playing for color: ${config.color}`);
        } else {
          console.warn(`Failed to load local sound for color: ${config.color}`);
        }
      }
    } catch (error) {
      console.error("Error playing sound for color:", error);
      setPlayingSound(null);
      setPlayingColor(null);
      setCurrentSound(null);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const playColorSound = useCallback(async (config: ColorConfig) => {
    console.log(`🎨 Playing sound for color: ${config.color}`);
    
    // If the same color is already playing, don't restart it
    if (playingColor === config.color) {
      console.log(`🎵 Sound already playing for color: ${config.color}, skipping`);
      return;
    }
    
    await playSound(config);
  }, [playingColor]);

  const stopAllColorSounds = useCallback(async () => {
    console.log(`🛑 Stopping all color sounds`);
    await stopAllAudio();
  }, []);  return {
    playColorSound,
    stopAllColorSounds,
    currentSound,
    playingSound,
    isLoadingAudio,
  };
};
