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
        for (const [color, sound] of Object.entries(soundRefs.current)) {
          if (sound) {
            try {
              await sound.stopAsync().catch(() => {});
              await sound.unloadAsync().catch(() => {});
              soundRefs.current[color] = null;
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
      } catch (error) {
        console.error('[AUDIO] Error during sound loading process:', error);
      }
    }

    loadSounds();

    return () => {
      Object.entries(soundRefs.current).forEach(([color, sound]) => {
        if (sound) {
          try {
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
            if (currentSound !== colorName) setCurrentSound(colorName);
            return;
          }

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
      } else {
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
      await stopCurrentSound();
      return;
    }

    const isAllSimilar =
      Math.abs(color.r - color.g) < 10 &&
      Math.abs(color.r - color.b) < 10 &&
      Math.abs(color.g - color.b) < 10;

    const isAllExactlyEqual =
      color.r === 1000 && color.g === 1000 && color.b === 1000;

    if (isAllExactlyEqual || (isAllSimilar && color.r > 400 && color.r < 600)) {
      if (currentSound) {
        await stopCurrentSound();
      }

      return;
    }

    let dominantColor = detectColorAdvanced(color);
    lastColorUpdate.current = Date.now();

    if (dominantColor === 'none') {
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
