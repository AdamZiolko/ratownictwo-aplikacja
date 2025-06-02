import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import { ColorConfig } from '@/services/ColorConfigService';
import { loadAudioFromLocal, loadAudioFromServer } from '../utils/audioUtils';

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

  const isPlayingRef = useRef<boolean>(false);

  const lastPlayTimeRef = useRef<number>(0);

  const currentSoundRef = useRef<Audio.Sound | null>(null);

  const isPlayingToCompletionRef = useRef<boolean>(false);

  const soundStartTimeRef = useRef<number>(0);

  const currentSoundKeyRef = useRef<string | null>(null);

  const MAX_SOUND_PLAY_TIME = 500;

  useEffect(() => {
    async function initAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log('🎵 Audio system initialized for color sounds');
      } catch (err) {
        console.error('Failed to configure audio for color sounds:', err);
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
  }, [currentSound]);

  useEffect(() => {
    currentSoundRef.current = currentSound;
  }, [currentSound]);

  useEffect(() => {
    currentSoundKeyRef.current = playingSound;
  }, [playingSound]);
  const stopAllAudio = async () => {
    const stopId = Date.now().toString();
    console.log(`🛑 [${stopId}] Stopping all audio`);

    const soundToStop = currentSoundRef.current || currentSound;
    const soundName = currentSoundKeyRef.current || playingSound;
    const colorName = playingColor;

    setCurrentSound(null);
    setPlayingSound(null);
    setPlayingColor(null);

    currentSoundRef.current = null;
    currentSoundKeyRef.current = null;
    isPlayingToCompletionRef.current = false;
    soundStartTimeRef.current = 0;

    try {
      if (soundToStop) {
        console.log(
          `🛑 [${stopId}] Stopping sound: ${soundName} for color: ${colorName}`
        );

        try {
          const status = await soundToStop.getStatusAsync();

          if ('isLoaded' in status && status.isLoaded) {
            console.log(
              `🔄 [${stopId}] Sound is loaded, proceeding with stop sequence`
            );

            await soundToStop
              .setIsLoopingAsync(false)
              .catch(e =>
                console.warn(`⚠️ [${stopId}] Error disabling loop:`, e)
              );

            await soundToStop
              .stopAsync()
              .catch(e =>
                console.warn(`⚠️ [${stopId}] Error stopping sound:`, e)
              );

            await soundToStop
              .unloadAsync()
              .catch(e =>
                console.warn(`⚠️ [${stopId}] Error unloading sound:`, e)
              );

            console.log(
              `✅ [${stopId}] Successfully stopped and unloaded sound: ${soundName}`
            );
          } else {
            console.log(
              `⚠️ [${stopId}] Sound was not loaded, skipping stop operations`
            );

            await soundToStop.unloadAsync().catch(() => {});
          }
        } catch (stopError) {
          console.warn(
            `⚠️ [${stopId}] Error during sound stop/unload:`,
            stopError
          );

          try {
            await soundToStop.setIsLoopingAsync(false);
          } catch {}
          try {
            await soundToStop.stopAsync();
          } catch {}
          try {
            await soundToStop.unloadAsync();
          } catch {}
        }
      } else {
        console.log(
          `ℹ️ [${stopId}] No sound currently playing, nothing to stop`
        );
      }

      console.log(`✅ [${stopId}] Audio stop operation completed`);
    } catch (error) {
      console.error(`❌ [${stopId}] Unexpected error in stopAllAudio:`, error);
    } finally {
      isPlayingRef.current = false;
      isPlayingToCompletionRef.current = false;
      soundStartTimeRef.current = 0;
    }
  };

  const playSound = async (config: ColorConfig) => {
    const playId = Date.now().toString();
    console.log(`🎯 [${playId}] Starting playSound for ${config.color}`);

    try {
      const soundKey = config.serverAudioId
        ? `server_${config.serverAudioId}`
        : config.soundName || '';

      if (!config.serverAudioId && !config.soundName) {
        console.warn(
          `⚠️ [${playId}] No sound source specified for color: ${config.color}`
        );
        return;
      }

      setIsLoadingAudio(true);

      const currentSoundInstance = currentSoundRef.current;
      if (currentSoundKeyRef.current && currentSoundInstance) {
        try {
          const status = await currentSoundInstance.getStatusAsync();
          if (status.isLoaded && 'isPlaying' in status && status.isPlaying) {
            console.log(
              `🔊 [${playId}] A sound (${currentSoundKeyRef.current}) is already playing, updating color reference to ${config.color}`
            );
            setPlayingColor(config.color);
            setIsLoadingAudio(false);
            return;
          }
        } catch (error) {
          console.warn(
            `⚠️ [${playId}] Error checking current sound status:`,
            error
          );

          await stopAllAudio();
        }
      } else if (playingSound || currentSound) {
        console.log(`🧹 [${playId}] Cleaning up inconsistent audio state`);
        await stopAllAudio();
      }

      console.log(
        `🔍 [${playId}] Verified no sounds are currently playing, proceeding with ${soundKey}`
      );

      let sound: Audio.Sound | null = null;

      if (config.serverAudioId) {
        console.log(
          `🔊 [${playId}] Loading server audio for color: ${config.color} (looping: ${config.isLooping})`
        );
        sound = await loadAudioFromServer(config.serverAudioId);
      } else if (config.soundName) {
        console.log(
          `🔊 [${playId}] Loading local sound for color: ${config.color} (looping: ${config.isLooping})`
        );
        sound = await loadAudioFromLocal(config.soundName);
      }

      if (!sound) {
        console.warn(
          `⚠️ [${playId}] Failed to load sound for color: ${config.color}`
        );
        setIsLoadingAudio(false);
        return;
      }

      if (currentSoundRef.current || currentSoundKeyRef.current) {
        console.log(
          `⚠️ [${playId}] Another sound started playing while loading, aborting`
        );
        await sound
          .unloadAsync()
          .catch(e => console.warn('Error unloading aborted sound:', e));
        setIsLoadingAudio(false);
        return;
      }

      if (playingSound === soundKey) {
        console.log(
          `⚠️ [${playId}] This sound is already in state as playing, updating color reference only`
        );
        setPlayingColor(config.color);
        await sound.unloadAsync().catch(() => {});
        setIsLoadingAudio(false);
        return;
      }

      setCurrentSound(sound);
      setPlayingSound(soundKey);
      setPlayingColor(config.color);

      currentSoundRef.current = sound;
      currentSoundKeyRef.current = soundKey;

      isPlayingToCompletionRef.current = true;
      soundStartTimeRef.current = Date.now();

      await sound.setIsLoopingAsync(config.isLooping || false);

      if (typeof config.volume === 'number') {
        await sound.setVolumeAsync(Math.min(1, Math.max(0, config.volume)));
      }

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if ('isLoaded' in status && status.isLoaded) {
          const now = Date.now();
          const soundPlayTime = now - soundStartTimeRef.current;
          if (soundPlayTime >= 500 && isPlayingToCompletionRef.current) {
            console.log(
              `⏱️ [${playId}] Sound has been playing for ${soundPlayTime}ms, allowing new sounds`
            );
            isPlayingToCompletionRef.current = false;
          }

          if (status.didJustFinish && !config.isLooping) {
            console.log(
              `✅ [${playId}] Audio finished for color: ${config.color}`
            );

            if (currentSoundKeyRef.current === soundKey) {
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
          console.error(
            `❌ [${playId}] Audio error for ${config.color}:`,
            status.error
          );

          if (currentSoundKeyRef.current === soundKey) {
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

      await sound.playAsync();
      console.log(`✅ [${playId}] Audio playing for color: ${config.color}`);
    } catch (error) {
      console.error(`❌ [${playId}] Error playing sound for color:`, error);

      setPlayingSound(null);
      setPlayingColor(null);
      setCurrentSound(null);
      currentSoundRef.current = null;
      currentSoundKeyRef.current = null;
      isPlayingToCompletionRef.current = false;
      soundStartTimeRef.current = 0;
    } finally {
      setIsLoadingAudio(false);
      console.log(
        `🏁 [${playId}] Completed playSound process for ${config.color}`
      );
    }
  };

  const playColorSound = useCallback(
    async (config: ColorConfig) => {
      console.log(`🎨 Request to play sound for color: ${config.color}`);

      const soundKey = config.serverAudioId
        ? `server_${config.serverAudioId}`
        : config.soundName || '';

      if (!config.serverAudioId && !config.soundName) {
        console.warn(`⚠️ No sound source specified for color: ${config.color}`);
        return;
      }

      const now = Date.now();
      const timeSinceLastPlay = now - lastPlayTimeRef.current;
      if (timeSinceLastPlay < 300) {
        console.log(
          `🛑 Debouncing sound request for ${config.color}, too soon after last request (${timeSinceLastPlay}ms)`
        );

        if (playingColor !== config.color) {
          console.log(
            `🔄 Updating playing color from ${playingColor} to ${config.color} during debounce`
          );
          setPlayingColor(config.color);
        }
        return;
      }

      if (isPlayingRef.current) {
        const timeSinceLastPlayStart = now - lastPlayTimeRef.current;
        if (timeSinceLastPlayStart > 3000) {
          console.log(
            `🔄 Safety check: isPlayingRef has been true for ${timeSinceLastPlayStart}ms, resetting it`
          );
          isPlayingRef.current = false;
        } else {
          console.log(
            `🛑 Already in process of playing a sound, ignoring request for ${config.color}`
          );
          return;
        }
      }

      if (isPlayingToCompletionRef.current) {
        const timeSinceSoundStart = now - soundStartTimeRef.current;
        if (timeSinceSoundStart > 5000) {
          console.log(
            `🔄 Safety check: Sound has been playing for ${timeSinceSoundStart}ms, resetting completion flag`
          );
          isPlayingToCompletionRef.current = false;
        } else {
          console.log(
            `🛑 A sound is currently playing to completion, ignoring request for ${config.color}`
          );
          return;
        }
      }

      if (currentSoundRef.current) {
        try {
          const status = await currentSoundRef.current.getStatusAsync();

          if (status.isLoaded) {
            if (!('isPlaying' in status) || !status.isPlaying) {
              console.log(
                `🔄 Safety check: Sound not playing but flags still set, resetting flags`
              );

              await currentSoundRef.current.unloadAsync().catch(() => {});
              currentSoundRef.current = null;
              currentSoundKeyRef.current = null;
              setCurrentSound(null);
              setPlayingSound(null);
              isPlayingToCompletionRef.current = false;
            }
          } else {
            console.log(
              `🔄 Safety check: Sound status is an error, resetting flags`
            );
            await currentSoundRef.current.unloadAsync().catch(() => {});
            currentSoundRef.current = null;
            currentSoundKeyRef.current = null;
            setCurrentSound(null);
            setPlayingSound(null);
            isPlayingToCompletionRef.current = false;
          }
        } catch (error) {
          console.warn(
            `Error checking sound status during safety check: ${error}`
          );

          currentSoundRef.current = null;
          currentSoundKeyRef.current = null;
          setCurrentSound(null);
          setPlayingSound(null);
          isPlayingToCompletionRef.current = false;
        }
      }

      if (playingColor === config.color) {
        console.log(
          `🎵 Sound already playing for color: ${config.color}, skipping`
        );

        const currentSoundInstance = currentSoundRef.current;
        if (currentSoundInstance) {
          try {
            const status = await currentSoundInstance.getStatusAsync();
            if (
              'isLoaded' in status &&
              status.isLoaded &&
              'isPlaying' in status &&
              status.isPlaying
            ) {
              console.log(
                `✅ Verified sound is actually playing for color: ${config.color}`
              );
              return;
            } else {
              console.log(
                `⚠️ Sound for ${config.color} is in state but not playing, will restart it`
              );
            }
          } catch (error) {
            console.warn(
              `Error checking sound status for ${config.color}:`,
              error
            );
          }
        } else {
          console.log(
            `⚠️ Sound for ${config.color} is marked as playing but no sound instance found, will restart it`
          );
        }
      }

      const currentSoundInstance = currentSoundRef.current;
      if (currentSoundKeyRef.current === soundKey && currentSoundInstance) {
        try {
          const status = await currentSoundInstance.getStatusAsync();
          if (status.isLoaded) {
            if ('isPlaying' in status && status.isPlaying) {
              console.log(
                `🎵 Sound ${soundKey} already playing, updating playingColor to: ${config.color}`
              );

              setPlayingColor(config.color);
              return;
            } else {
              console.log(`🔄 Found non-playing sound in state, replacing it`);
              await currentSoundInstance.unloadAsync().catch(() => {});
              currentSoundRef.current = null;
              currentSoundKeyRef.current = null;
            }
          } else {
            console.log(`🔄 Sound status is an error, cleaning up`);
            await currentSoundInstance.unloadAsync().catch(() => {});
            currentSoundRef.current = null;
            currentSoundKeyRef.current = null;
          }
        } catch (error) {
          console.warn(`Error checking sound status: ${error}`);

          currentSoundRef.current = null;
          currentSoundKeyRef.current = null;
        }
      }

      isPlayingRef.current = true;
      lastPlayTimeRef.current = now;

      try {
        await playSound(config);
      } catch (error) {
        console.error(`Error in playColorSound for ${config.color}:`, error);
      } finally {
        isPlayingRef.current = false;
      }
    },
    [playingColor, playingSound, currentSound]
  );

  const stopAllColorSounds = useCallback(async () => {
    console.log(`🛑 Stopping all color sounds (external call)`);

    isPlayingRef.current = false;
    isPlayingToCompletionRef.current = false;
    soundStartTimeRef.current = 0;
    await stopAllAudio();
  }, []);
  return {
    playColorSound,
    stopAllColorSounds,
    currentSound,
    playingSound,
    isLoadingAudio,
  };
};
