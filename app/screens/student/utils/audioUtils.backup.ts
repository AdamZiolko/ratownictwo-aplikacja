import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import audioApiService from '@/services/AudioApiService';
import { API_URL } from '@/constants/Config';
import { soundFiles, audioFileMap } from '../constants/soundFiles';

export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return true;
    } else {
      console.warn(`⚠️ Server responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.warn('⚠️ Network connectivity check failed:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('⚠️ Network request timed out - using local audio files');
    }
    return false;
  }
};

export const loadAudioFromServer = async (
  audioIdOrName: string
): Promise<Audio.Sound | null> => {
  const isAudioId = audioIdOrName.includes('-') && audioIdOrName.length > 30;
  let serverAudioId: string;

  try {
    if (isAudioId) {
      serverAudioId = audioIdOrName;
    } else {
      serverAudioId = audioFileMap[audioIdOrName];
      if (!serverAudioId) {
        console.warn(
          `⚠️ No server mapping found for: ${audioIdOrName}, falling back to local`
        );
        return await loadAudioFromLocal(audioIdOrName);
      }
    }

    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      console.warn(
        `⚠️ No network connectivity, falling back to local for: ${audioIdOrName}`
      );
      return isAudioId ? null : await loadAudioFromLocal(audioIdOrName);
    }

    let response;
    try {
      response = await audioApiService.streamAudio(serverAudioId);
    } catch (networkError) {
      console.warn(`⚠️ Network error for ${audioIdOrName}:`, networkError);
      return isAudioId ? null : await loadAudioFromLocal(audioIdOrName);
    }

    if (!response.ok) {
      console.warn(
        `⚠️ Server audio failed for ${audioIdOrName} (${response.status}), falling back to local`
      );
      return isAudioId ? null : await loadAudioFromLocal(audioIdOrName);
    }

    if (Platform.OS !== 'web') {
      try {
        const localPath = `${FileSystem.documentDirectory}audio_cache_${serverAudioId}.mp3`;

        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists) {
        }
        const downloadResponse = await audioApiService.streamAudio(
          serverAudioId
        );

        if (!downloadResponse.ok) {
          throw new Error(`HTTP ${downloadResponse.status}`);
        }

        const arrayBuffer = await downloadResponse.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i]);
        }
        const base64String = btoa(binaryString);

        await FileSystem.writeAsStringAsync(localPath, base64String, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: localPath },
          {
            shouldPlay: false,
            androidImplementation: 'MediaPlayer',
            progressUpdateIntervalMillis: 500,
          }
        );

        return sound;
      } catch (error) {
        console.warn(`❌ Mobile download failed for ${audioIdOrName}:`, error);
        return isAudioId ? null : await loadAudioFromLocal(audioIdOrName);
      }
    } else {
      try {
        const audioBlob = await response.blob();
        const audioUri = URL.createObjectURL(audioBlob);

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: false }
        );

        return sound;
      } catch (error) {
        console.warn(
          `❌ Web blob creation failed for ${audioIdOrName}:`,
          error
        );
        return isAudioId ? null : await loadAudioFromLocal(audioIdOrName);
      }
    }
  } catch (error) {
    console.warn(`❌ Server audio loading failed for ${audioIdOrName}:`, error);
    return isAudioId ? null : await loadAudioFromLocal(audioIdOrName);
  }
};

export const loadAudioFromLocal = async (
  soundName: string
): Promise<Audio.Sound | null> => {
  try {
    const soundNameWithExt = soundName.endsWith('.wav')
      ? soundName
      : `${soundName}.wav`;

    let soundModule = soundFiles[soundNameWithExt];

    if (!soundModule && soundName.endsWith('.wav')) {
      const soundNameWithoutExt = soundName.replace('.wav', '');
      soundModule = soundFiles[soundNameWithoutExt];
    }

    if (!soundModule) {
      console.error(
        `🔇 Local audio file not found: ${soundName} (tried with and without .wav extension)`
      );
      return null;
    }

    const { sound } = await Audio.Sound.createAsync(soundModule, {
      shouldPlay: false,
      ...(Platform.OS !== 'web' && {
        androidImplementation: 'MediaPlayer',
        progressUpdateIntervalMillis: 500,
      }),
    });

    return sound;
  } catch (error) {
    console.error(`❌ Local audio loading failed for ${soundName}:`, error);
    return null;
  }
};

export const loadAudioWithRetry = async (
  soundName: string,
  maxRetries: number = 3
): Promise<Audio.Sound | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const sound = await loadAudioFromLocal(soundName);
      if (sound) {
        return sound;
      }

      if (attempt === maxRetries) {
        console.error(`❌ All attempts failed for: ${soundName}`);
        return null;
      }

      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt} failed for ${soundName}:`, error);

      if (attempt === maxRetries) {
        console.error(`❌ Final attempt failed for: ${soundName}`);
        return null;
      }
    }
  }

  return null;
};

export const debugMobileAudio = async () => {
  if (Platform.OS === 'web') return;

  try {
    const networkOk = await checkNetworkConnectivity();
    const { status } = await Audio.requestPermissionsAsync();
    const isEnabled = await Audio.setIsEnabledAsync(true);
    const testSoundName = 'Adult/Male/Moaning.wav';
    if (soundFiles[testSoundName]) {
      try {
        const { sound: testSound } = await Audio.Sound.createAsync(
          soundFiles[testSoundName],
          { shouldPlay: false }
        );
        await testSound.unloadAsync();
      } catch (testError) {
        console.error('❌ Local audio test failed:', testError);
      }
    }

    if (Platform.OS === 'android') {
    } else if (Platform.OS === 'ios') {
    }
  } catch (error) {
    console.error('❌ Mobile Audio Diagnostics Failed:', error);
  }
};
