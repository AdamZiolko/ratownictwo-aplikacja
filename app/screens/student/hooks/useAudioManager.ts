import { useState, useRef, useEffect } from "react";
import { Platform } from "react-native";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { socketService } from "@/services/SocketService";
import { loadAudioWithRetry, loadAudioFromServer, debugMobileAudio } from "../utils/audioUtils";
import { soundFiles } from "../constants/soundFiles";
import type { SoundQueueItem, AudioCommand, ServerAudioCommand } from "../types";

export const useAudioManager = (accessCode: string | undefined) => {
  const [audioReady, setAudioReady] = useState(false);
  const soundInstances = useRef<Record<string, Audio.Sound>>({});

  // Initialize audio system
  useEffect(() => {
    async function initAudio() {
      try {
        if (Platform.OS !== 'web') {
          // Request audio permissions
          const { status } = await Audio.requestPermissionsAsync();
          if (status !== 'granted') {
            console.warn('Brak uprawnień do odtwarzania audio – dźwięk może nie działać.');
          }
        }

        // Configure audio mode for mobile
        const audioModeConfig = {
          allowsRecordingIOS: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true, // Enable background audio for mobile
          shouldDuckAndroid: false, // Don't duck audio on Android
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          playThroughEarpieceAndroid: false,
        };

        await Audio.setAudioModeAsync(audioModeConfig);
        
        // Enable audio
        await Audio.setIsEnabledAsync(true);
        console.log('✅ Audio poprawnie zainicjalizowane (platforma:', Platform.OS, ')');
        setAudioReady(true);
        
        // Run mobile audio diagnostics
        if (Platform.OS !== 'web') {
          debugMobileAudio();
        }
      } catch (err) {
        console.warn('Błąd podczas inicjalizacji audio:', err);
        // Still set audio ready to allow graceful degradation
        setAudioReady(true);
      }
    }
    initAudio();
  }, []);

  // Preload critical sounds for better mobile performance
  const preloadCriticalSounds = async () => {
    if (!audioReady) return;
    
    const criticalSounds = [
      'Adult/Male/Moaning.wav',
      'Adult/Female/Moaning.wav', 
      'Child/Moaning.wav',
      'Adult/Male/Screaming.wav',
      'Adult/Female/Screaming.wav'
    ];
    
    console.log('🎵 Preloading critical sounds for mobile...');
    for (const soundName of criticalSounds) {
      if (!soundInstances.current[soundName]) {
        try {
          // Use server streaming for preloading as well
          const sound = await loadAudioWithRetry(soundName);
          if (sound) {
            soundInstances.current[soundName] = sound;
            console.log(`✅ Preloaded via streaming: ${soundName}`);
          } else {
            console.warn(`⚠️ Failed to preload ${soundName}: no audio source available`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to preload ${soundName}:`, error);
        }
      }
    }
  };

  // Enhanced server audio playback function
  const handleServerAudioPlayback = async (audioId: string, loop: boolean): Promise<void> => {
    try {
      console.log(`🔊 Starting server audio playback: ${audioId} (loop: ${loop})`);
      
      // Try to load audio from server using the audioId
      const sound = await loadAudioFromServer(audioId);
      
      if (!sound) {
        console.error(`🔇 Failed to load server audio: ${audioId}`);
        return;
      }
      
      console.log(`✅ Successfully loaded server audio: ${audioId}`);
      
      // Store the sound instance with a server prefix to avoid conflicts
      const serverSoundKey = `server:${audioId}`;
      soundInstances.current[serverSoundKey] = sound;

      // Set up playback status updates
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish && !status.isLooping) {
            console.log(`✅ Finished playing server audio: ${audioId}`);
            sound.unloadAsync().catch(() => {});
            delete soundInstances.current[serverSoundKey];
          }
        } else {
          console.error(`❌ Server audio loading error for ${audioId}:`, status.error || 'Unknown error');
        }
      });

      console.log(`🔄 Setting loop mode: ${loop} for server audio: ${audioId}`);
      await sound.setIsLoopingAsync(loop);
      await sound.setPositionAsync(0);
      
      console.log(`🎵 Starting playback of server audio: ${audioId}`);
      await sound.playAsync();
      
      console.log(`▶️ Started playing server audio: ${audioId} (loop=${loop})`);
    } catch (error) {
      console.error(`❌ Error playing server audio ${audioId}:`, error);
    }
  };

  const handleSoundPlayback = async (soundName: string, loop: boolean): Promise<void> => {
    try {
      let sound = soundInstances.current[soundName];

      if (!sound) {
        console.log(`🔄 Loading audio: ${soundName} (server streaming)`);
        
        // Try server streaming first, then fallback to local
        const loadedSound = await loadAudioWithRetry(soundName);
        
        if (!loadedSound) {
          console.error(`🔇 Failed to load audio from all sources: ${soundName}`);
          return;
        }
        
        soundInstances.current[soundName] = loadedSound;
        sound = loadedSound;
      }

      // Set up playback status updates for better error handling
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish && !status.isLooping) {
            console.log(`✅ Finished playing: ${soundName}`);
          }
        } else {
          // Handle loading errors
          console.error(`❌ Audio loading error for ${soundName}:`, status.error || 'Unknown error');
        }
      });

      await sound.setIsLoopingAsync(loop);
      
      // Stop and reset position if already playing
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await sound.stopAsync();
        }
      } catch (_) {
        // Ignore stop errors
      }
      
      await sound.setPositionAsync(0);

      // Play with retry mechanism for mobile
      let playAttempts = 0;
      const maxAttempts = 3;
      
      while (playAttempts < maxAttempts) {
        try {
          await sound.playAsync();
          console.log(`▶️ Rozpoczęto odtwarzanie: ${soundName} (loop=${loop})`);
          break;
        } catch (playError) {
          playAttempts++;
          console.warn(`⚠️ Attempt ${playAttempts} failed for ${soundName}:`, playError);
          
          if (playAttempts >= maxAttempts) {
            throw playError;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
    } catch (error) {
      console.error('❌ Błąd podczas odtwarzania dźwięku:', error);
      
      // Attempt recovery by removing the failed sound instance
      if (soundInstances.current[soundName]) {
        try {
          await soundInstances.current[soundName].unloadAsync();
        } catch (_) {}
        delete soundInstances.current[soundName];
      }
    }
  };

  const handleSoundStop = async (soundName: string) => {
    const sound = soundInstances.current[soundName];
    if (!sound) return;
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
      delete soundInstances.current[soundName];
    } catch (error) {
      console.error(`❌ Błąd przy STOP dla ${soundName}:`, error);
    }
  };

  const handleSoundPause = async (soundName: string) => {
    const sound = soundInstances.current[soundName];
    if (!sound) return;
    try {
      await sound.pauseAsync();
    } catch (error) {
      console.error(`❌ Błąd przy PAUSE dla ${soundName}:`, error);
    }
  };

  const handleSoundResume = async (soundName: string): Promise<void> => {
    const sound = soundInstances.current[soundName];
    if (!sound) return;
    try {
      await sound.playAsync();
    } catch (error) {
      console.error(`❌ Błąd przy RESUME dla ${soundName}:`, error);
    }
  };

  // Server audio control functions
  const handleServerAudioStop = async (audioId: string): Promise<void> => {
    const serverSoundKey = `server:${audioId}`;
    const sound = soundInstances.current[serverSoundKey];
    if (!sound) return;
    
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
      delete soundInstances.current[serverSoundKey];
      console.log(`⏹️ Stopped server audio: ${audioId}`);
    } catch (error) {
      console.error(`❌ Error stopping server audio ${audioId}:`, error);
    }
  };

  const handleServerAudioPause = async (audioId: string): Promise<void> => {
    const serverSoundKey = `server:${audioId}`;
    const sound = soundInstances.current[serverSoundKey];
    if (!sound) return;
    
    try {
      await sound.pauseAsync();
      console.log(`⏸️ Paused server audio: ${audioId}`);
    } catch (error) {
      console.error(`❌ Error pausing server audio ${audioId}:`, error);
    }
  };

  const handleServerAudioResume = async (audioId: string): Promise<void> => {
    const serverSoundKey = `server:${audioId}`;
    const sound = soundInstances.current[serverSoundKey];
    if (!sound) return;
    
    try {
      await sound.playAsync();
      console.log(`▶️ Resumed server audio: ${audioId}`);
    } catch (error) {
      console.error(`❌ Error resuming server audio ${audioId}:`, error);
    }
  };

  // Audio command listeners
  useEffect(() => {
    if (!audioReady || !accessCode) {
      return;
    }
    console.log('🔌 Zakładam listener "audio-command" – audio jest gotowe');
    
    // Preload critical sounds for better performance on mobile
    preloadCriticalSounds();

    const handleAudioCommand = async (payload: AudioCommand) => {
      console.log('▶️ Otrzymano komendę audio:', payload);

      if (payload.command === 'PLAY_QUEUE' && Array.isArray(payload.soundName)) {
        for (const item of payload.soundName) {
          try {
            if (item.delay && item.delay > 0) {
              await new Promise((r) => setTimeout(r, item.delay));
            }

            const soundModule = soundFiles[item.soundName];
            if (!soundModule) {
              console.error(`🔇 Nie znaleziono pliku dźwiękowego: ${item.soundName}`);
              continue;
            }

            const { sound: qSound } = await Audio.Sound.createAsync(
              soundModule,
              { shouldPlay: true, isLooping: false }
            );

            await new Promise<void>((resolve) => {
              qSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                  qSound.unloadAsync().catch(() => {});
                  resolve();
                }
              });
            });

          } catch (e) {
            console.error('Błąd w PLAY_QUEUE item:', e);
          }
        }
        return;
      }

      if (typeof payload.soundName === 'string') {
        switch (payload.command) {
          case 'PLAY':
            await handleSoundPlayback(payload.soundName, payload.loop || false);
            break;
          case 'STOP':
            await handleSoundStop(payload.soundName);
            break;
          case 'PAUSE':
            await handleSoundPause(payload.soundName);
            break;
          case 'RESUME':
            await handleSoundResume(payload.soundName);
            break;
          default:
            break;
        }
      }
    };

    const unsubscribe = socketService.on('audio-command', handleAudioCommand);
    return () => {
      console.log('🧹 Odpinam listener "audio-command"');
      unsubscribe();
    };
  }, [audioReady, accessCode]);

  // Server audio command listener
  useEffect(() => {
    if (!audioReady || !accessCode) return;

    const handleServerAudioCommand = async (payload: ServerAudioCommand) => {
      console.log('🔊 Received server audio command:', payload);
      
      if (!payload || !payload.command || !payload.audioId) {
        console.warn('⚠️ Invalid server audio command payload:', payload);
        return;
      }

      const { command, audioId, loop } = payload;
      console.log(`🎵 Processing server audio command: ${command} for audio ID: ${audioId} (loop: ${loop})`);

      switch (command) {
        case 'PLAY':
          console.log(`▶️ Executing PLAY command for server audio: ${audioId}`);
          await handleServerAudioPlayback(audioId, loop || false);
          break;
        case 'STOP':
          console.log(`⏹️ Executing STOP command for server audio: ${audioId}`);
          await handleServerAudioStop(audioId);
          break;
        case 'PAUSE':
          console.log(`⏸️ Executing PAUSE command for server audio: ${audioId}`);
          await handleServerAudioPause(audioId);
          break;
        case 'RESUME':
          console.log(`▶️ Executing RESUME command for server audio: ${audioId}`);
          await handleServerAudioResume(audioId);
          break;
        default:
          console.warn('⚠️ Unknown server audio command:', command);
          break;
      }
    };

    const unsubscribeServerAudio = socketService.on('server-audio-command', handleServerAudioCommand);
    return () => {
      console.log('🧹 Unsubscribing from "server-audio-command"');
      unsubscribeServerAudio();
    };
  }, [audioReady, accessCode]);

  // Cleanup audio instances on unmount
  useEffect(() => {
    return () => {
      Object.values(soundInstances.current).forEach(async (sound) => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (error) {
          console.error("Error unloading sound:", error);
        }
      });
      soundInstances.current = {};
    };
  }, []);

  return {
    audioReady,
    soundInstances
  };
};
