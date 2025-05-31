// File: src/hooks/useAudioManager.ts

import { useState, useRef, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { useFocusEffect } from "@react-navigation/native";
import { socketService } from "@/services/SocketService";
import {
  loadAudioWithRetry,
  loadAudioFromServer,
  debugMobileAudio,
} from "../utils/audioUtils";
import type { SoundQueueItem, AudioCommand, ServerAudioCommand } from "../types";

export const useAudioManager = (
  accessCode: string | undefined,
  sessionJoined: boolean
) => {
  const [audioReady, setAudioReady] = useState(false);
  const [isPlayingServerAudio, setIsPlayingServerAudio] = useState(false);
  const soundInstances = useRef<Record<string, Audio.Sound>>({});
  const [currentLocalSound, setCurrentLocalSound] = useState<string | null>(
    null
  );
  const didUnlockWebAudio = useRef(false);

  // 1) Global initialization at mount
  useEffect(() => {
    async function initAudio() {
      try {
        if (Platform.OS !== "web") {
          const { status } = await Audio.requestPermissionsAsync();
          if (status !== "granted") {
            console.warn(
              "Brak uprawnień do odtwarzania audio – dźwięk może nie działać."
            );
          }
        }
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          playThroughEarpieceAndroid: false,
        });
        await Audio.setIsEnabledAsync(true);
        console.log(
          "✅ Audio poprawnie zainicjalizowane (platforma:",
          Platform.OS,
          ")"
        );
        setAudioReady(true);
        if (Platform.OS !== "web") {
          debugMobileAudio();
        }
      } catch (err) {
        console.warn("Błąd podczas inicjalizacji audio:", err);
        setAudioReady(true);
      }
    }
    initAudio();
  }, []);

  // 2) Unlock Web Audio on first user gesture after session join
  const unlockWebAudio = useCallback(async () => {
    if (Platform.OS !== "web" || didUnlockWebAudio.current) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/silence.mp3"),
        { shouldPlay: true }
      );
      setTimeout(async () => {
        await sound.stopAsync();
        await sound.unloadAsync();
      }, 200);
      console.log("🔓 Web audio unlocked");
      didUnlockWebAudio.current = true;
    } catch (e) {
      console.warn("⚠️ Nie udało się odblokować Web Audio:", e);
    }
  }, []);

  // 3) Preload critical sounds (mobile)
  const preloadCriticalSounds = useCallback(async () => {
    if (!audioReady) return;
    const criticalSounds = [
      "Adult/Male/Moaning.wav",
      "Adult/Female/Moaning.wav",
      "Child/Moaning.wav",
      "Adult/Male/Screaming.wav",
      "Adult/Female/Screaming.wav",
    ];
    console.log("🎵 Preloading critical sounds for mobile...");
    for (const soundName of criticalSounds) {
      if (!soundInstances.current[soundName]) {
        try {
          const sound = await loadAudioWithRetry(soundName);
          if (sound) {
            soundInstances.current[soundName] = sound;
            console.log(`✅ Preloaded via streaming: ${soundName}`);
          } else {
            console.warn(
              `⚠️ Failed to preload ${soundName}: no audio source available`
            );
          }
        } catch (error) {
          console.warn(`⚠️ Failed to preload ${soundName}:`, error);
        }
      }
    }
  }, [audioReady]);

  // 4) Handlers for playback
  const handleSoundPlayback = useCallback(
    async (soundName: string, loop: boolean) => {
      try {
        // stop & unload any existing
        for (const key of Object.keys(soundInstances.current)) {
          const inst = soundInstances.current[key];
          try {
            const status = await inst.getStatusAsync();
            if (status.isLoaded) {
              if (status.isPlaying) await inst.stopAsync();
              await inst.unloadAsync();
            }
          } catch {}
          delete soundInstances.current[key];
        }
        // load this sound
        let sound = soundInstances.current[soundName];
        if (!sound) {
          const loaded = await loadAudioWithRetry(soundName);
          if (!loaded) return;
          soundInstances.current[soundName] = loaded;
          sound = loaded;
        }
        // setup status update
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish && !status.isLooping) {
            (async () => {
              try {
                await sound.unloadAsync();
              } catch {}
              delete soundInstances.current[soundName];
            })();
          }
        });
        await sound.setIsLoopingAsync(loop);
        await sound.setPositionAsync(0);
        await sound.playAsync();
        console.log(
          `▶️ Rozpoczęto odtwarzanie: ${soundName} (loop=${loop})`
        );
        setCurrentLocalSound(soundName);
      } catch {
        // ensure cleanup
        if (soundInstances.current[soundName]) {
          try {
            await soundInstances.current[soundName].unloadAsync();
          } catch {}
          delete soundInstances.current[soundName];
        }
      }
    },
    []
  );

  const handleSoundStop = useCallback(async (soundName: string) => {
    const sound = soundInstances.current[soundName];
    if (!sound) return;
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
      delete soundInstances.current[soundName];
      if (currentLocalSound === soundName) setCurrentLocalSound(null);
    } catch (error) {
      console.error(`❌ Błąd przy STOP dla ${soundName}:`, error);
    }
  }, [currentLocalSound]);

  const handleSoundPause = useCallback(async (soundName: string) => {
    const sound = soundInstances.current[soundName];
    if (!sound) return;
    try {
      await sound.pauseAsync();
    } catch (error) {
      console.error(`❌ Błąd przy PAUSE dla ${soundName}:`, error);
    }
  }, []);

  const handleSoundResume = useCallback(async (soundName: string) => {
    const sound = soundInstances.current[soundName];
    if (!sound) return;
    try {
      await sound.playAsync();
    } catch (error) {
      console.error(`❌ Błąd przy RESUME dla ${soundName}:`, error);
    }
  }, []);

  const handleServerAudioPlayback = useCallback(
    async (audioId: string, loop: boolean) => {
      try {
        console.log(
          `🔊 Starting server audio playback: ${audioId} (loop: ${loop})`
        );
        setIsPlayingServerAudio(true);
        const sound = await loadAudioFromServer(audioId);
        if (!sound) {
          console.error(`🔇 Failed to load server audio: ${audioId}`);
          setIsPlayingServerAudio(false);
          return;
        }
        const key = `server:${audioId}`;
        soundInstances.current[key] = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish && !status.isLooping) {
            setIsPlayingServerAudio(false);
            sound.unloadAsync().catch(() => {});
            delete soundInstances.current[key];
          }
        });
        await sound.setIsLoopingAsync(loop);
        await sound.setPositionAsync(0);
        await sound.playAsync();
        console.log(
          `▶️ Successfully started playing server audio: ${audioId} (loop=${loop})`
        );
      } catch (error) {
        console.error(`❌ Error playing server audio ${audioId}:`, error);
        setIsPlayingServerAudio(false);
      }
    },
    []
  );

  // 5) Subscribe on screen focus, cleanup on unfocus
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web" && sessionJoined) {
        // unlock audio context on first gesture
        const handler = () => {
          unlockWebAudio();
          document.body.removeEventListener("click", handler);
        };
        document.body.addEventListener("click", handler);
      }

      // preload mobile
      preloadCriticalSounds();

      // subscribe to commands
      const unsubAudio = socketService.on("audio-command", async (payload: AudioCommand) => {
        if (Array.isArray(payload.soundName) && payload.command === "PLAY_QUEUE") {
          for (const item of payload.soundName) {
            if (item.delay) await new Promise((r) => setTimeout(r, item.delay));
            await handleSoundPlayback(item.soundName, false);
            await new Promise<void>((resolve) => {
              const inst = soundInstances.current[item.soundName];
              if (!inst) return resolve();
              inst.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) resolve();
              });
            });
          }
        } else if (typeof payload.soundName === "string") {
          switch (payload.command) {
            case "PLAY":
              await handleSoundPlayback(payload.soundName, payload.loop || false);
              break;
            case "STOP":
              await handleSoundStop(payload.soundName);
              break;
            case "PAUSE":
              await handleSoundPause(payload.soundName);
              break;
            case "RESUME":
              await handleSoundResume(payload.soundName);
              break;
          }
        }
      });
      const unsubServer = socketService.on(
        "server-audio-command",
        async (payload: ServerAudioCommand) => {
          switch (payload.command) {
            case "PLAY":
              await handleServerAudioPlayback(payload.audioId, payload.loop || false);
              break;
            case "STOP":
              await handleSoundStop(`server:${payload.audioId}`);
              break;
            case "PAUSE":
              await handleSoundPause(`server:${payload.audioId}`);
              break;
            case "RESUME":
              await handleSoundResume(`server:${payload.audioId}`);
              break;
          }
        }
      );

      return () => {
        unsubAudio();
        unsubServer();
      };
    }, [
      accessCode,
      sessionJoined,
      handleSoundPlayback,
      handleSoundStop,
      handleSoundPause,
      handleSoundResume,
      handleServerAudioPlayback,
      preloadCriticalSounds,
      unlockWebAudio,
    ])
  );

  // 6) Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(soundInstances.current).forEach(async (sound) => {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch {}
      });
      soundInstances.current = {};
    };
  }, []);

  return { audioReady, isPlayingServerAudio, soundInstances };
};