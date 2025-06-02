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
  const [soundMappings, setSoundMappings] =
    useState<SoundMappings>(DEFAULT_SOUND_FILES);

  const soundRefs = useRef<{ [key: string]: Audio.Sound | null }>({
    red: null,
    green: null,
    blue: null,
  });

  const lastColorUpdate = useRef<number>(0);

  useEffect(() => {
    async function initAudio() {
      try {
        if (Platform.OS !== 'web') {
          const { status } = await Audio.requestPermissionsAsync();
          if (status !== 'granted') {
            console.warn(
              '[AUDIO] Brak uprawnień do odtwarzania audio – dźwięk może nie działać.'
            );
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
          console.warn('[AUDIO] Error setting audio mode:', audioModeError);
        }

        setAudioReady(true);
        console.log('✅ Audio poprawnie zainicjalizowane');
      } catch (error) {
        console.error('❌ Błąd inicjalizacji audio:', error);
        setTimeout(initAudio, 2000);
      }
    }

    initAudio();
  }, []);

  useEffect(() => {
    if (!audioReady) return;

    async function loadSounds() {
      try {
        console.log('[AUDIO] Starting to load all sounds');

        for (const [color, sound] of Object.entries(soundRefs.current)) {
          if (sound) {
            try {
              await sound.stopAsync().catch(() => {});
              await sound.unloadAsync().catch(() => {});
              soundRefs.current[color] = null;
              console.log(`[AUDIO] Unloaded previous sound for ${color}`);
            } catch (unloadError) {
              console.warn(
                `[AUDIO] Error unloading previous sound for ${color}:`,
                unloadError
              );
            }
          }
        }

        await Promise.all(
          Object.entries(soundMappings).map(async ([color, soundFile]) => {
            try {
              const sound = new Audio.Sound();
              await sound.loadAsync(soundFile, {
                shouldPlay: false,
                positionMillis: 0,
              });

              await sound.setVolumeAsync(1.0);
              sound.setOnPlaybackStatusUpdate(status => {
                if ('error' in status) {
                  console.error(`[AUDIO] Playback error for ${color}`);
                }
              });

              soundRefs.current[color] = sound;
            } catch (error) {
              setTimeout(async () => {
                try {
                  const retrySound = new Audio.Sound();
                  await retrySound.loadAsync(
                    soundMappings[color as keyof typeof soundMappings]
                  );
                  soundRefs.current[color] = retrySound;
                } catch (retryError) {}
              }, 1000);
            }
          })
        );

        console.log('[AUDIO] All sounds loaded successfully');
      } catch (error) {
        console.error('[AUDIO] Error during sound loading process:', error);
      }
    }

    loadSounds();

    return () => {
      console.log('[AUDIO] Cleaning up sounds on unmount');

      Object.entries(soundRefs.current).forEach(([color, sound]) => {
        if (sound) {
          try {
            console.log(`[AUDIO] Unloading sound for ${color} on cleanup`);
            sound
              .stopAsync()
              .catch(() => {})
              .finally(() => {
                sound
                  .unloadAsync()
                  .catch(err =>
                    console.warn(
                      `[AUDIO] Error unloading sound for ${color}:`,
                      err
                    )
                  );
              });
          } catch (cleanupError) {
            console.warn(
              `[AUDIO] Error during cleanup for ${color}:`,
              cleanupError
            );
          }
        }
      });

      setCurrentSound(null);
    };
  }, [audioReady, soundMappings]);

  const playSound = async (colorName: string) => {
    if (!audioReady) return;

    console.log(`[AUDIO] Attempting to play sound for ${colorName}`);

    if (currentSound && currentSound !== colorName) {
      await stopCurrentSound();
    }

    let sound = soundRefs.current[colorName];

    const soundFile = soundMappings[colorName as keyof typeof soundMappings];

    try {
      if (sound) {
        const status = await sound
          .getStatusAsync()
          .catch(() => ({} as AVPlaybackStatus));

        if ('isLoaded' in status && status.isLoaded) {
          const isPlaying = status.isPlaying;

          if (isPlaying) {
            console.log(`[AUDIO] Sound for ${colorName} is already playing`);
            if (currentSound !== colorName) setCurrentSound(colorName);
            return;
          }

          console.log(
            `[AUDIO] Sound for ${colorName} is loaded but not playing, starting playback`
          );
          await sound.setStatusAsync({
            isLooping: loopSound,
            shouldPlay: true,
            positionMillis: 0,
          });
          await sound.playAsync();
          setCurrentSound(colorName);
          return;
        }
      }

      console.log(`[AUDIO] Creating new sound for ${colorName}`);
      sound = new Audio.Sound();
      await sound.loadAsync(soundFile);

      await sound.setStatusAsync({
        isLooping: loopSound,
        shouldPlay: true,
        positionMillis: 0,
        volume: 1.0,
      });

      sound.setOnPlaybackStatusUpdate(status => {
        if ('didJustFinish' in status && status.didJustFinish && !loopSound) {
          console.log(`[AUDIO] Sound for ${colorName} finished playing`);
          setCurrentSound(null);
        }
      });

      await sound.playAsync();
      soundRefs.current[colorName] = sound;
      setCurrentSound(colorName);
    } catch (error) {
      console.error(`[AUDIO] Error playing sound for ${colorName}:`, error);

      try {
        if (sound) {
          await sound.stopAsync().catch(() => {});
          await sound.unloadAsync().catch(() => {});
        }

        const newSound = new Audio.Sound();
        await newSound.loadAsync(
          soundMappings[colorName as keyof typeof soundMappings]
        );
        await newSound.setStatusAsync({
          isLooping: loopSound,
          shouldPlay: true,
        });
        await newSound.playAsync();

        soundRefs.current[colorName] = newSound;
        setCurrentSound(colorName);
      } catch (retryError) {
        console.error(
          `[AUDIO] Failed to reload sound for ${colorName}:`,
          retryError
        );
      }
    }
  };

  const stopCurrentSound = async () => {
    if (!currentSound || !soundRefs.current[currentSound]) return;

    try {
      console.log(`[AUDIO] Stopping sound for ${currentSound}`);

      const sound = soundRefs.current[currentSound];

      const status = await sound
        .getStatusAsync()
        .catch(() => ({} as AVPlaybackStatus));

      if ('isLoaded' in status && status.isLoaded) {
        await sound
          .setStatusAsync({
            isLooping: false,
            shouldPlay: false,
            positionMillis: 0,
          })
          .catch(() => {});

        await sound.stopAsync().catch(() => {});

        console.log(`[AUDIO] Successfully stopped sound for ${currentSound}`);
      } else {
        console.log(
          `[AUDIO] Sound for ${currentSound} is not loaded, no need to stop`
        );
      }

      setCurrentSound(null);
    } catch (error) {
      console.error(`[AUDIO] Error stopping sound for ${currentSound}:`, error);

      try {
        await soundRefs.current[currentSound]?.unloadAsync().catch(() => {});
        const newSound = new Audio.Sound();
        await newSound.loadAsync(
          soundMappings[currentSound as keyof typeof soundMappings]
        );
        soundRefs.current[currentSound] = newSound;
      } catch (unloadError) {}

      setCurrentSound(null);
    }
  };

  const playColorSound = async (color: ColorValue) => {
    if (!audioReady) return;

    const sumRGB = color.r + color.g + color.b;

    if (sumRGB === 0 || sumRGB <= 20) {
      console.log('[AUDIO] Insufficient brightness, stopping sound');
      await stopCurrentSound();
      return;
    }

    console.log(
      '[AUDIO] RGB values for sound:',
      color.r,
      color.g,
      color.b,
      'Sum:',
      sumRGB
    );

    const isAllSimilar =
      Math.abs(color.r - color.g) < 10 &&
      Math.abs(color.r - color.b) < 10 &&
      Math.abs(color.g - color.b) < 10;

    const isAllExactlyEqual =
      color.r === 1000 && color.g === 1000 && color.b === 1000;

    if (isAllExactlyEqual || (isAllSimilar && color.r > 400 && color.r < 600)) {
      console.log(
        '[AUDIO] Detected potential sensor error - values are too similar or exactly 1000'
      );

      if (currentSound) {
        console.log(`[AUDIO] Stopping sound due to potential sensor error`);
        await stopCurrentSound();
      }

      return;
    }

    let dominantColor = detectColorAdvanced(color);
    console.log(`[AUDIO] Detected color: ${dominantColor}`);

    lastColorUpdate.current = Date.now();

    if (dominantColor === 'none') {
      console.log(
        '[AUDIO] No dominant color detected, stopping any playing sound'
      );
      await stopCurrentSound();
      return;
    }

    if (currentSound) {
      const isSimilarColor =
        currentSound === dominantColor ||
        (currentSound === 'red' && dominantColor === 'orange') ||
        (currentSound === 'orange' && dominantColor === 'red') ||
        (currentSound === 'green' && dominantColor === 'yellow') ||
        (currentSound === 'yellow' && dominantColor === 'green') ||
        (currentSound === 'blue' && dominantColor === 'purple') ||
        (currentSound === 'purple' && dominantColor === 'blue');

      const timeSinceLastChange = Date.now() - lastColorUpdate.current;
      const isRecentChange = timeSinceLastChange < 500;

      if (isSimilarColor || isRecentChange) {
        console.log(
          `[AUDIO] Continuing current sound ${currentSound} (new: ${dominantColor}, similar: ${isSimilarColor}, recent change: ${isRecentChange})`
        );
        return;
      }
    }

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
