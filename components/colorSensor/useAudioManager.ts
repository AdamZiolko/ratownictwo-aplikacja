import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { DEFAULT_SOUND_FILES } from './constants';
import { detectColorAdvanced, ColorValue } from './colorUtils';

export interface SoundMappings {
  red: any;
  green: any;
  blue: any;
}

export const useAudioManager = () => {
  const [audioReady, setAudioReady] = useState(false);
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [loopSound, setLoopSound] = useState<boolean>(true);
  const [soundMappings, setSoundMappings] = useState<SoundMappings>(DEFAULT_SOUND_FILES);
  
  const soundRefs = useRef<{ [key: string]: Audio.Sound | null }>({
    red: null,
    green: null,
    blue: null,
  });

  const lastColorUpdate = useRef<number>(0);

  // Initialize audio
  useEffect(() => {
    async function initAudio() {
      try {
        if (Platform.OS !== "web") {
          const { status } = await Audio.requestPermissionsAsync();
          if (status !== "granted") {
            console.warn("[AUDIO] Brak uprawnień do odtwarzania audio – dźwięk może nie działać.");
          }
        }

        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        } catch (audioModeError) {
          console.warn("[AUDIO] Error setting audio mode:", audioModeError);
        }

        setAudioReady(true);
        console.log("✅ Audio poprawnie zainicjalizowane");
      } catch (error) {
        console.error("❌ Błąd inicjalizacji audio:", error);
        setTimeout(initAudio, 2000);
      }
    }

    initAudio();
  }, []);

  // Load sounds when audio is ready or sound mappings change
  useEffect(() => {
    if (!audioReady) return;

    async function loadSounds() {
      try {
        console.log("[AUDIO] Starting to load all sounds");
        
        // Clear previous sounds if they exist
        for (const [color, sound] of Object.entries(soundRefs.current)) {
          if (sound) {
            try {
              await sound.stopAsync().catch(() => {});
              await sound.unloadAsync().catch(() => {});
              soundRefs.current[color] = null;
              console.log(`[AUDIO] Unloaded previous sound for ${color}`);
            } catch (unloadError) {
              console.warn(`[AUDIO] Error unloading previous sound for ${color}:`, unloadError);
            }
          }
        }
        
        // Load all sounds in parallel
        await Promise.all(
          Object.entries(soundMappings).map(async ([color, soundFile]) => {
            try {
              const sound = new Audio.Sound();
              await sound.loadAsync(soundFile, {
                shouldPlay: false,
                positionMillis: 0
              });
              
              await sound.setVolumeAsync(1.0);
              sound.setOnPlaybackStatusUpdate((status) => {
                if ('error' in status) {
                  console.error(`[AUDIO] Playback error for ${color}`);
                }
              });
              
              soundRefs.current[color] = sound;
            } catch (error) {
              // Try to reload sound after short delay
              setTimeout(async () => {
                try {
                  const retrySound = new Audio.Sound();
                  await retrySound.loadAsync(soundMappings[color as keyof typeof soundMappings]);
                  soundRefs.current[color] = retrySound;
                } catch (retryError) {}
              }, 1000);
            }
          })
        );
        
        console.log("[AUDIO] All sounds loaded successfully");
      } catch (error) {
        console.error("[AUDIO] Error during sound loading process:", error);
      }
    }

    loadSounds();

    return () => {
      console.log("[AUDIO] Cleaning up sounds on unmount");
      
      // Cleanup function - unload all sounds
      Object.entries(soundRefs.current).forEach(([color, sound]) => {
        if (sound) {
          try {
            console.log(`[AUDIO] Unloading sound for ${color} on cleanup`);
            sound.stopAsync()
              .catch(() => {})
              .finally(() => {
                sound.unloadAsync()
                  .catch((err) => console.warn(`[AUDIO] Error unloading sound for ${color}:`, err));
              });
          } catch (cleanupError) {
            console.warn(`[AUDIO] Error during cleanup for ${color}:`, cleanupError);
          }
        }
      });
      
      // Clear currently playing sound
      setCurrentSound(null);
    };
  }, [audioReady, soundMappings]);

  // Helper function to play sound for a given color
  const playSound = async (colorName: string) => {
    if (!audioReady) return;
    
    console.log(`[AUDIO] Attempting to play sound for ${colorName}`);
    
    // Stop currently playing sound if it's different from the one we want to play
    if (currentSound && currentSound !== colorName) {
      await stopCurrentSound();
    }
    
    let sound = soundRefs.current[colorName];
    
    // Get appropriate sound for color from mapping
    const soundFile = soundMappings[colorName as keyof typeof soundMappings];
    
    try {
      // Check if sound is already loaded and playing
      if (sound) {
        const status = await sound.getStatusAsync().catch(() => ({ } as AVPlaybackStatus));
        
        // Check if status is AVPlaybackStatusSuccess (contains isLoaded)
        if ('isLoaded' in status && status.isLoaded) {
          const isPlaying = status.isPlaying;
          
          // If sound is already playing, do nothing
          if (isPlaying) {
            console.log(`[AUDIO] Sound for ${colorName} is already playing`);
            if (currentSound !== colorName) setCurrentSound(colorName);
            return;
          }
          
          // If sound is loaded but not playing, play it
          console.log(`[AUDIO] Sound for ${colorName} is loaded but not playing, starting playback`);
          await sound.setStatusAsync({ 
            isLooping: loopSound,
            shouldPlay: true,
            positionMillis: 0
          });
          await sound.playAsync();
          setCurrentSound(colorName);
          return;
        }
      }
      
      // If sound doesn't exist or isn't loaded, create new one
      console.log(`[AUDIO] Creating new sound for ${colorName}`);
      sound = new Audio.Sound();
      await sound.loadAsync(soundFile);
      
      // Set playback parameters
      await sound.setStatusAsync({ 
        isLooping: loopSound,
        shouldPlay: true,
        positionMillis: 0,
        volume: 1.0
      });
      
      // Add listener for playback finish
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish && !loopSound) {
          console.log(`[AUDIO] Sound for ${colorName} finished playing`);
          setCurrentSound(null);
        }
      });
      
      // Play sound
      await sound.playAsync();
      soundRefs.current[colorName] = sound;
      setCurrentSound(colorName);
      
    } catch (error) {
      console.error(`[AUDIO] Error playing sound for ${colorName}:`, error);
      
      // In case of error, try to create new sound object
      try {
        if (sound) {
          await sound.stopAsync().catch(() => {});
          await sound.unloadAsync().catch(() => {});
        }
        
        const newSound = new Audio.Sound();
        await newSound.loadAsync(soundMappings[colorName as keyof typeof soundMappings]);
        await newSound.setStatusAsync({ isLooping: loopSound, shouldPlay: true });
        await newSound.playAsync();
        
        soundRefs.current[colorName] = newSound;
        setCurrentSound(colorName);
      } catch (retryError) {
        console.error(`[AUDIO] Failed to reload sound for ${colorName}:`, retryError);
      }
    }
  };

  // Helper function to stop currently playing sound
  const stopCurrentSound = async () => {
    if (!currentSound || !soundRefs.current[currentSound]) return;
    
    try {
      console.log(`[AUDIO] Stopping sound for ${currentSound}`);
      
      const sound = soundRefs.current[currentSound];
      
      // Check if sound is loaded
      const status = await sound.getStatusAsync().catch(() => ({ } as AVPlaybackStatus));
      
      // Check if status is AVPlaybackStatusSuccess (contains isLoaded)
      if ('isLoaded' in status && status.isLoaded) {
        // First disable loop and stop playback
        await sound.setStatusAsync({ 
          isLooping: false,
          shouldPlay: false,
          positionMillis: 0  // Reset position
        }).catch(() => {});
        
        // Stop sound
        await sound.stopAsync().catch(() => {});
        
        console.log(`[AUDIO] Successfully stopped sound for ${currentSound}`);
      } else {
        console.log(`[AUDIO] Sound for ${currentSound} is not loaded, no need to stop`);
      }
      
      // Clear reference to currently playing sound
      setCurrentSound(null);
      
    } catch (error) {
      console.error(`[AUDIO] Error stopping sound for ${currentSound}:`, error);
      
      // In case of error, try to create new sound object
      try {
        await soundRefs.current[currentSound]?.unloadAsync().catch(() => {});
        const newSound = new Audio.Sound();
        await newSound.loadAsync(soundMappings[currentSound as keyof typeof soundMappings]);
        soundRefs.current[currentSound] = newSound;
      } catch (unloadError) {}
      
      // Clear reference to currently playing sound
      setCurrentSound(null);
    }
  };

  // Function to play sound based on detected color
  const playColorSound = async (color: ColorValue) => {
    if (!audioReady) return;

    // Determine dominant color based on RGB readings
    const sumRGB = color.r + color.g + color.b;
    
    // Protection against division by zero or too low brightness
    if (sumRGB === 0 || sumRGB <= 20) {
      console.log("[AUDIO] Insufficient brightness, stopping sound");
      await stopCurrentSound();
      return;
    }
    
    // Display diagnostic information
    console.log("[AUDIO] RGB values for sound:", color.r, color.g, color.b, "Sum:", sumRGB);
    
    // Check if all values are almost identical (potential sensor error)
    const isAllSimilar = Math.abs(color.r - color.g) < 10 && 
                         Math.abs(color.r - color.b) < 10 && 
                         Math.abs(color.g - color.b) < 10;
    
    // Check if all values are exactly equal to 1000
    const isAllExactlyEqual = color.r === 1000 && color.g === 1000 && color.b === 1000;
    
    // If all values are exactly 1000 or are almost identical,
    // this is probably a sensor error
    if (isAllExactlyEqual || (isAllSimilar && color.r > 400 && color.r < 600)) {
      console.log("[AUDIO] Detected potential sensor error - values are too similar or exactly 1000");
      
      // If we're already playing sound, stop it
      if (currentSound) {
        console.log(`[AUDIO] Stopping sound due to potential sensor error`);
        await stopCurrentSound();
      }
      
      return;
    }
    
    // Use color detection function based on distance from prototypes
    let dominantColor = detectColorAdvanced(color);
    console.log(`[AUDIO] Detected color: ${dominantColor}`);
    
    // Update last color update time
    lastColorUpdate.current = Date.now();
    
    // If no dominant color detected, stop currently playing sound
    if (dominantColor === "none") {
      console.log("[AUDIO] No dominant color detected, stopping any playing sound");
      await stopCurrentSound();
      return;
    }
    
    // Color detection stabilization - if we're already playing sound for a color,
    // and new color is similar, continue playing current sound
    if (currentSound) {
      // Check if new color is similar to currently playing one
      const isSimilarColor = (
        // Same color - always continue
        (currentSound === dominantColor) ||
        
        // Similar colors: red and orange
        (currentSound === "red" && dominantColor === "orange") ||
        (currentSound === "orange" && dominantColor === "red") ||
        
        // Similar colors: green and yellow
        (currentSound === "green" && dominantColor === "yellow") ||
        (currentSound === "yellow" && dominantColor === "green") ||
        
        // Similar colors: blue and purple
        (currentSound === "blue" && dominantColor === "purple") ||
        (currentSound === "purple" && dominantColor === "blue")
      );
      
      // Additional stabilization - if detected color changes too frequently,
      // continue playing current sound for some time
      const timeSinceLastChange = Date.now() - lastColorUpdate.current;
      const isRecentChange = timeSinceLastChange < 500; // 500ms stabilization
      
      if (isSimilarColor || isRecentChange) {
        console.log(`[AUDIO] Continuing current sound ${currentSound} (new: ${dominantColor}, similar: ${isSimilarColor}, recent change: ${isRecentChange})`);
        return;
      }
    }
    
    // Play sound for detected color
    await playSound(dominantColor);
  };

  return {
    audioReady,
    currentSound,
    loopSound,
    setLoopSound,
    soundMappings,
    setSoundMappings,
    playSound,
    stopCurrentSound,
    playColorSound,
  };
};
