import { useState, useEffect, useCallback, useRef } from "react";
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
  
  // Use a ref to track if we're currently in the process of playing a sound
  // This helps prevent multiple simultaneous calls to playSound
  const isPlayingRef = useRef<boolean>(false);
  // Track the last time a sound was started
  const lastPlayTimeRef = useRef<number>(0);
  // Track the current sound instance in a ref to avoid race conditions with state updates
  const currentSoundRef = useRef<Audio.Sound | null>(null);
  // Track if a sound is currently playing to completion
  const isPlayingToCompletionRef = useRef<boolean>(false);
  // Track the time when the current sound started playing
  const soundStartTimeRef = useRef<number>(0);
  // Track the current sound key in a ref
  const currentSoundKeyRef = useRef<string | null>(null);
  // Maximum time to wait before allowing a new sound to play (in milliseconds)
  const MAX_SOUND_PLAY_TIME = 500; // 500ms

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
  }, [currentSound]);
  
  // Keep refs in sync with state
  useEffect(() => {
    currentSoundRef.current = currentSound;
  }, [currentSound]);
  
  useEffect(() => {
    currentSoundKeyRef.current = playingSound;
  }, [playingSound]);  const stopAllAudio = async () => {
    // Create a unique ID for this stop operation
    const stopId = Date.now().toString();
    console.log(`🛑 [${stopId}] Stopping all audio`);
    
    // Capture current values to local variables to avoid race conditions
    const soundToStop = currentSoundRef.current || currentSound;
    const soundName = currentSoundKeyRef.current || playingSound;
    const colorName = playingColor;
    
    // Immediately clear state variables to prevent new plays during cleanup
    setCurrentSound(null);
    setPlayingSound(null);
    setPlayingColor(null);
    
    // Clear refs immediately to prevent race conditions
    currentSoundRef.current = null;
    currentSoundKeyRef.current = null;
    isPlayingToCompletionRef.current = false;
    soundStartTimeRef.current = 0;
    
    try {
      if (soundToStop) {
        console.log(`🛑 [${stopId}] Stopping sound: ${soundName} for color: ${colorName}`);
        
        try {
          // Check if sound is loaded before attempting to stop
          const status = await soundToStop.getStatusAsync();
          
          if (status.isLoaded) {
            console.log(`🔄 [${stopId}] Sound is loaded, proceeding with stop sequence`);
            
            // First set looping to false to prevent auto-restart
            await soundToStop.setIsLoopingAsync(false).catch(e => 
              console.warn(`⚠️ [${stopId}] Error disabling loop:`, e)
            );
            
            // Then stop the sound
            await soundToStop.stopAsync().catch(e => 
              console.warn(`⚠️ [${stopId}] Error stopping sound:`, e)
            );
            
            // Finally unload to free resources
            await soundToStop.unloadAsync().catch(e => 
              console.warn(`⚠️ [${stopId}] Error unloading sound:`, e)
            );
            
            console.log(`✅ [${stopId}] Successfully stopped and unloaded sound: ${soundName}`);
          } else {
            console.log(`⚠️ [${stopId}] Sound was not loaded, skipping stop operations`);
            
            // Try unloading anyway just to be safe
            await soundToStop.unloadAsync().catch(() => {});
          }
        } catch (stopError) {
          console.warn(`⚠️ [${stopId}] Error during sound stop/unload:`, stopError);
          
          // Last resort: try individual operations with try/catch for each
          try { await soundToStop.setIsLoopingAsync(false); } catch {}
          try { await soundToStop.stopAsync(); } catch {}
          try { await soundToStop.unloadAsync(); } catch {}
        }
      } else {
        console.log(`ℹ️ [${stopId}] No sound currently playing, nothing to stop`);
      }
      
      console.log(`✅ [${stopId}] Audio stop operation completed`);
    } catch (error) {
      console.error(`❌ [${stopId}] Unexpected error in stopAllAudio:`, error);
      // State variables and refs already cleared above
    } finally {
      // Reset all flags to allow new sounds to be played
      isPlayingRef.current = false;
      isPlayingToCompletionRef.current = false;
      soundStartTimeRef.current = 0;
    }
  };

  const playSound = async (config: ColorConfig) => {
    // Create a unique ID for this specific playSound call to track it
    const playId = Date.now().toString();
    console.log(`🎯 [${playId}] Starting playSound for ${config.color}`);
    
    try {
      const soundKey = config.serverAudioId
        ? `server_${config.serverAudioId}`
        : config.soundName || "";
      
      // If no sound source is specified, exit early
      if (!config.serverAudioId && !config.soundName) {
        console.warn(`⚠️ [${playId}] No sound source specified for color: ${config.color}`);
        return;
      }
      
      setIsLoadingAudio(true);

      // CRITICAL CHECK: If any sound is currently playing, don't proceed
      // This is a global lock to prevent multiple sounds playing at once
      const currentSoundInstance = currentSoundRef.current;
      if (currentSoundKeyRef.current && currentSoundInstance) {
        try {
          const status = await currentSoundInstance.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            console.log(`🔊 [${playId}] A sound (${currentSoundKeyRef.current}) is already playing, updating color reference to ${config.color}`);
            setPlayingColor(config.color);
            setIsLoadingAudio(false);
            return;
          }
        } catch (error) {
          console.warn(`⚠️ [${playId}] Error checking current sound status:`, error);
          // If we can't check status, assume we need to stop and reload
          await stopAllAudio();
        }
      } else if (playingSound || currentSound) {
        // If state is inconsistent (one is set but not the other), clean up
        console.log(`🧹 [${playId}] Cleaning up inconsistent audio state`);
        await stopAllAudio();
      }

      // At this point, we should have no playing sounds
      console.log(`🔍 [${playId}] Verified no sounds are currently playing, proceeding with ${soundKey}`);

      let sound: Audio.Sound | null = null;

      if (config.serverAudioId) {
        console.log(`🔊 [${playId}] Loading server audio for color: ${config.color} (looping: ${config.isLooping})`);
        sound = await loadAudioFromServer(config.serverAudioId);
      } else if (config.soundName) {
        console.log(`🔊 [${playId}] Loading local sound for color: ${config.color} (looping: ${config.isLooping})`);
        sound = await loadAudioFromLocal(config.soundName);
      }

      // If we couldn't load the sound, exit
      if (!sound) {
        console.warn(`⚠️ [${playId}] Failed to load sound for color: ${config.color}`);
        setIsLoadingAudio(false);
        return;
      }

      // Double-check that no other sound started playing while we were loading
      if (currentSoundRef.current || currentSoundKeyRef.current) {
        console.log(`⚠️ [${playId}] Another sound started playing while loading, aborting`);
        await sound.unloadAsync().catch(e => console.warn("Error unloading aborted sound:", e));
        setIsLoadingAudio(false);
        return;
      }

      // Update state to reflect the new sound
      setCurrentSound(sound);
      setPlayingSound(soundKey);
      setPlayingColor(config.color);
      
      // Update refs to reflect the new sound
      currentSoundRef.current = sound;
      currentSoundKeyRef.current = soundKey;
      
      // Mark that we're playing a sound to completion and record the start time
      isPlayingToCompletionRef.current = true;
      soundStartTimeRef.current = Date.now();

      // Configure sound
      await sound.setIsLoopingAsync(config.isLooping || false);
      
      // Set volume based on config
      if (typeof config.volume === 'number') {
        await sound.setVolumeAsync(Math.min(1, Math.max(0, config.volume)));
      }

      // Set up playback status listener
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          // If the sound has been playing for at least 500ms, allow new sounds to be played
          // This ensures that sounds can be played in sequence without long gaps
          const now = Date.now();
          const soundPlayTime = now - soundStartTimeRef.current;
          if (soundPlayTime >= 500 && isPlayingToCompletionRef.current) {
            console.log(`⏱️ [${playId}] Sound has been playing for ${soundPlayTime}ms, allowing new sounds`);
            isPlayingToCompletionRef.current = false;
          }
          
          if (status.didJustFinish && !config.isLooping) {
            console.log(`✅ [${playId}] Audio finished for color: ${config.color}`);
            // Only clear state if this is still the current sound
            if (currentSoundKeyRef.current === soundKey) {
              // Reset all state and refs
              setPlayingSound(null);
              setPlayingColor(null);
              setCurrentSound(null);
              currentSoundRef.current = null;
              currentSoundKeyRef.current = null;
              isPlayingToCompletionRef.current = false;
              soundStartTimeRef.current = 0;
            }
          }
        } else if (status.error) {
          console.error(`❌ [${playId}] Audio error for ${config.color}:`, status.error);
          // Only clear state if this is still the current sound
          if (currentSoundKeyRef.current === soundKey) {
            // Reset all state and refs
            setPlayingSound(null);
            setPlayingColor(null);
            setCurrentSound(null);
            currentSoundRef.current = null;
            currentSoundKeyRef.current = null;
            isPlayingToCompletionRef.current = false;
            soundStartTimeRef.current = 0;
          }
        }
      });

      // Start playback
      await sound.playAsync();
      console.log(`✅ [${playId}] Audio playing for color: ${config.color}`);
      
    } catch (error) {
      console.error(`❌ [${playId}] Error playing sound for color:`, error);
      // Clean up state on error
      setPlayingSound(null);
      setPlayingColor(null);
      setCurrentSound(null);
      currentSoundRef.current = null;
      currentSoundKeyRef.current = null;
      isPlayingToCompletionRef.current = false;
      soundStartTimeRef.current = 0;
    } finally {
      setIsLoadingAudio(false);
      console.log(`🏁 [${playId}] Completed playSound process for ${config.color}`);
    }
  };

  const playColorSound = useCallback(async (config: ColorConfig) => {
    console.log(`🎨 Request to play sound for color: ${config.color}`);
    
    // Determine the sound key for this config
    const soundKey = config.serverAudioId
      ? `server_${config.serverAudioId}`
      : config.soundName || "";
    
    // If no sound source is specified, exit early
    if (!config.serverAudioId && !config.soundName) {
      console.warn(`⚠️ No sound source specified for color: ${config.color}`);
      return;
    }
    
    // Prevent rapid consecutive calls (debounce) - increase to 500ms
    const now = Date.now();
    const timeSinceLastPlay = now - lastPlayTimeRef.current;
    if (timeSinceLastPlay < 500) { // 500ms debounce
      console.log(`🛑 Debouncing sound request for ${config.color}, too soon after last request (${timeSinceLastPlay}ms)`);
      return;
    }
    
    // If we're already in the process of playing a sound, don't start another one
    if (isPlayingRef.current) {
      console.log(`🛑 Already in process of playing a sound, ignoring request for ${config.color}`);
      return;
    }
    
    // If a sound is playing to completion, don't interrupt it
    // This ensures that sounds are played to completion
    if (isPlayingToCompletionRef.current) {
      console.log(`🛑 A sound is currently playing to completion, ignoring request for ${config.color}`);
      return;
    }
    
    // If the same color is already playing, don't restart it
    if (playingColor === config.color) {
      console.log(`🎵 Sound already playing for color: ${config.color}, skipping`);
      return;
    }
    
    // If the same sound is already playing (even if for a different color), don't restart it
    const currentSoundInstance = currentSoundRef.current;
    if (currentSoundKeyRef.current === soundKey && currentSoundInstance) {
      try {
        // Double-check if the sound is actually playing
        const status = await currentSoundInstance.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          console.log(`🎵 Sound ${soundKey} already playing, updating playingColor to: ${config.color}`);
          // Update the playing color to match the new detection
          setPlayingColor(config.color);
          return;
        }
      } catch (error) {
        console.warn(`Error checking sound status: ${error}`);
        // If we can't check status, assume it's not playing properly and continue
      }
    }
    
    // Set the flag to indicate we're starting to play a sound
    isPlayingRef.current = true;
    lastPlayTimeRef.current = now;
    
    try {
      await playSound(config);
    } finally {
      // Always reset the flag when done, even if there was an error
      isPlayingRef.current = false;
    }
  }, [playingColor, playingSound, currentSound]);

  const stopAllColorSounds = useCallback(async () => {
    console.log(`🛑 Stopping all color sounds (external call)`);
    // Reset all flags to ensure new sounds can be played after stopping
    isPlayingRef.current = false;
    isPlayingToCompletionRef.current = false;
    soundStartTimeRef.current = 0;
    await stopAllAudio();
  }, []);  return {
    playColorSound,
    stopAllColorSounds,
    currentSound,
    playingSound,
    isLoadingAudio,
  };
};
