import { useState, useEffect, useCallback } from "react";
import { Audio } from "expo-av";
import { ColorConfig } from "@/services/ColorConfigService";
import { loadAudioFromLocal, loadAudioFromServer } from "../utils/audioUtils";

interface UseColorSoundsReturn {
  playColorSound: (config: ColorConfig) => Promise<void>;
  stopColorSound: (color: string) => Promise<void>;
  currentSound: Audio.Sound | null;
  playingSound: string | null;
  isLoadingAudio: boolean;
  stopSound: () => Promise<void>;
}

export const useColorSounds = (): UseColorSoundsReturn => {
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [playingColor, setPlayingColor] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  // Semaphore to track which colors are currently playing or being processed
  const [colorSemaphores, setColorSemaphores] = useState<Map<string, boolean>>(new Map());

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
        
        // Clear all semaphores when stopping all audio
        setColorSemaphores(new Map());
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
        // Handle server audio        console.log(`🔊 Playing server audio for color: ${config.color} (looping: ${config.isLooping})`);
        sound = await loadAudioFromServer(config.serverAudioId);        if (sound) {
          setCurrentSound(sound);
          setPlayingSound(soundKey);
          setPlayingColor(config.color);

          // Set looping based on config
          await sound.setIsLoopingAsync(config.isLooping || false);

          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded && status.didJustFinish && !config.isLooping) {
              setPlayingSound(null);
              setPlayingColor(null);
              setCurrentSound(null);
              
              // Clear semaphore when server sound finishes naturally
              const colorKey = config.color.toLowerCase();
              setColorSemaphores(prev => {
                const newMap = new Map(prev);
                newMap.delete(colorKey);
                return newMap;
              });
            }
          });

          await sound.playAsync();
          console.log(`✅ Server audio playing for color: ${config.color} (looping: ${config.isLooping})`);
        } else {
          console.warn(`Failed to load server audio for color: ${config.color}`);
        }
      } else if (config.soundName) {
        // Handle local sound        console.log(`🔊 Playing local sound for color: ${config.color} (looping: ${config.isLooping})`);
        sound = await loadAudioFromLocal(config.soundName);        if (sound) {
          setCurrentSound(sound);
          setPlayingSound(soundKey);
          setPlayingColor(config.color);

          // Set looping based on config
          await sound.setIsLoopingAsync(config.isLooping || false);

          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded && status.didJustFinish && !config.isLooping) {
              setPlayingSound(null);
              setPlayingColor(null);
              setCurrentSound(null);
              
              // Clear semaphore when local sound finishes naturally
              const colorKey = config.color.toLowerCase();
              setColorSemaphores(prev => {
                const newMap = new Map(prev);
                newMap.delete(colorKey);
                return newMap;
              });
            }
          });

          await sound.playAsync();
          console.log(`✅ Local audio playing for color: ${config.color} (looping: ${config.isLooping})`);
        } else {
          console.warn(`Failed to load local sound for color: ${config.color}`);
        }
      }    } catch (error) {
      console.error("Error playing sound for color:", error);
      setPlayingSound(null);
      setPlayingColor(null);
      setCurrentSound(null);
      
      // Clear semaphore on error
      const colorKey = config.color.toLowerCase();
      setColorSemaphores(prev => {
        const newMap = new Map(prev);
        newMap.delete(colorKey);
        return newMap;
      });
    } finally {
      setIsLoadingAudio(false);
    }
  };  const playColorSound = useCallback(async (config: ColorConfig) => {
    const colorKey = config.color.toLowerCase();
    console.log(`🎨 Color detected: ${config.color}, checking if sound should be played`);
    
    // Check semaphore - if this color is already being processed or playing, skip
    if (colorSemaphores.get(colorKey)) {
      console.log(`🎵 Sound already playing or being processed for color: ${config.color}, skipping`);
      return;
    }
    
    // Set semaphore to true to indicate this color is being processed
    setColorSemaphores(prev => new Map(prev).set(colorKey, true));
    
    console.log(`🎵 Starting sound for color: ${config.color}`);
    await playSound(config);
  }, [colorSemaphores]);  const stopColorSound = useCallback(async (color: string) => {
    try {
      const colorKey = color.toLowerCase();
      console.log(`🛑 Request to stop sound for color: ${color}`);
      console.log(`🛑 Currently playing color: ${playingColor}`);
      console.log(`🛑 Current sound exists: ${!!currentSound}`);
      console.log(`🛑 Color semaphore status: ${colorSemaphores.get(colorKey)}`);
      
      // Check if this color has an active semaphore (is playing or being processed)
      if (!colorSemaphores.get(colorKey)) {
        console.log(`🛑 No active semaphore for color: ${color}, nothing to stop`);
        return;
      }
      
      // Only stop if the currently playing sound matches this color
      if (currentSound && playingColor) {
        const isCurrentColorSound = playingColor.toLowerCase() === colorKey;
        console.log(`🛑 Is current color sound: ${isCurrentColorSound}`);
        
        if (isCurrentColorSound) {
          console.log(`🛑 Stopping sound for color: ${color}`);
          await stopAllAudio();
          
          // Clear the semaphore for this specific color
          setColorSemaphores(prev => {
            const newMap = new Map(prev);
            newMap.delete(colorKey);
            return newMap;
          });
        } else {
          console.log(`🛑 Not stopping - different color is playing (${playingColor} vs ${color})`);
        }
      } else {
        console.log(`🛑 No sound currently playing, but clearing semaphore for color: ${color}`);
        // Clear the semaphore even if no sound is playing
        setColorSemaphores(prev => {
          const newMap = new Map(prev);
          newMap.delete(colorKey);
          return newMap;
        });
      }
    } catch (error) {
      console.error(`Error stopping sound for color ${color}:`, error);
      // Clear the semaphore on error
      const colorKey = color.toLowerCase();
      setColorSemaphores(prev => {
        const newMap = new Map(prev);
        newMap.delete(colorKey);
        return newMap;
      });
    }
  }, [currentSound, playingColor, colorSemaphores]);

  const stopSound = useCallback(async () => {
    await stopAllAudio();
  }, []);
  return {
    playColorSound,
    stopColorSound,
    currentSound,
    playingSound,
    isLoadingAudio,
    stopSound,
  };
};
