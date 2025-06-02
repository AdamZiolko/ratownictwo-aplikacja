// Backup of audioUtils.ts - this file will be restored if needed
import { Platform } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from 'expo-file-system';
import audioApiService from "@/services/AudioApiService";
import { API_URL } from "@/constants/Config";
import { soundFiles, audioFileMap } from "../constants/soundFiles";

// Globalny cache dla dźwięków - przechowuje załadowane obiekty Audio.Sound
const audioCache: { [key: string]: Audio.Sound } = {};

// Check network connectivity before streaming
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal
      // Usunięto nagłówek 'Cache-Control', który powodował błędy CORS
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Network connectivity confirmed');
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

// Enhanced audio loading system for mobile streaming
export const loadAudioFromServer = async (audioIdOrName: string): Promise<Audio.Sound | null> => {
  const isAudioId = audioIdOrName.includes('-') && audioIdOrName.length > 30;
  let serverAudioId: string;

  try {
    console.log(`🌐 Loading audio from server: ${audioIdOrName}`);
    
    if (isAudioId) {
      serverAudioId = audioIdOrName;
      console.log(`📋 Using direct audio ID: ${serverAudioId}`);
    } else {
      serverAudioId = audioFileMap[audioIdOrName];
      if (!serverAudioId) {
        console.warn(`⚠️ No server mapping found for: ${audioIdOrName}, falling back to local`);
        return await loadAudioFromLocal(audioIdOrName);
      }
      console.log(`🗺️ Mapped sound name "${audioIdOrName}" to server ID: ${serverAudioId}`);
    }
    
    // Sprawdź, czy dźwięk jest już w cache'u
    const cacheKey = `server_${serverAudioId}`;
    if (audioCache[cacheKey]) {
      console.log(`🔄 Using cached Audio.Sound object for: ${audioIdOrName}`);
      
      // Resetuj dźwięk przed ponownym użyciem
      try {
        const status = await audioCache[cacheKey].getStatusAsync();
        if (status.isLoaded) {
          await audioCache[cacheKey].stopAsync();
          await audioCache[cacheKey].setPositionAsync(0);
          return audioCache[cacheKey];
        }
      } catch (error) {
        console.warn(`⚠️ Error resetting cached sound: ${error}`);
        // Jeśli wystąpił błąd, usuń z cache'u i załaduj ponownie
        delete audioCache[cacheKey];
      }
    }

    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      console.warn(`⚠️ No network connectivity, falling back to local for: ${audioIdOrName}`);
      return isAudioId ? null : await loadAudioFromLocal(audioIdOrName);
    }

    let response;
    try {
      console.log(`🌐 Attempting to stream audio ID: ${serverAudioId}`);
      response = await audioApiService.streamAudio(serverAudioId);
    } catch (networkError) {
      console.warn(`⚠️ Network error for ${audioIdOrName}:`, networkError);
      return isAudioId ? null : await loadAudioFromLocal(audioIdOrName);
    }
    
    if (!response.ok) {
      console.warn(`⚠️ Server audio failed for ${audioIdOrName} (${response.status}), falling back to local`);
      return isAudioId ? null : await loadAudioFromLocal(audioIdOrName);
    }

    if (Platform.OS !== 'web') {
      try {
        const localPath = `${FileSystem.documentDirectory}audio_cache_${serverAudioId}.mp3`;
        
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists) {
          console.log(`📁 Using cached audio: ${audioIdOrName}`);
        } else {
          // Pobierz plik tylko jeśli nie istnieje w cache
          console.log(`⬇️ Downloading audio ${serverAudioId} for playback...`);
          const downloadResponse = await audioApiService.streamAudio(serverAudioId);
          
          if (!downloadResponse.ok) {
            throw new Error(`HTTP ${downloadResponse.status}`);
          }
          
          const arrayBuffer = await downloadResponse.arrayBuffer();
          console.log(`📦 Downloaded ${arrayBuffer.byteLength} bytes for audio: ${serverAudioId}`);
          
          const uint8Array = new Uint8Array(arrayBuffer);
          let binaryString = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
          }
          const base64String = btoa(binaryString);
          
          await FileSystem.writeAsStringAsync(localPath, base64String, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          console.log(`💾 Audio cached to: ${localPath}`);
        }
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: localPath },
          { 
            shouldPlay: false,
            androidImplementation: 'MediaPlayer',
            progressUpdateIntervalMillis: 500,
          }
        );
        
        // Zapisz dźwięk w cache'u
        const cacheKey = `server_${serverAudioId}`;
        audioCache[cacheKey] = sound;
        
        console.log(`✅ Server audio downloaded and loaded: ${audioIdOrName}`);
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
        
        // Zapisz dźwięk w cache'u
        const cacheKey = `server_${serverAudioId}`;
        audioCache[cacheKey] = sound;
        
        console.log(`✅ Server audio loaded (web): ${audioIdOrName}`);
        return sound;
      } catch (error) {
        console.warn(`❌ Web blob creation failed for ${audioIdOrName}:`, error);
        return isAudioId ? null : await loadAudioFromLocal(audioIdOrName);
      }
    }
    
  } catch (error) {
    console.warn(`❌ Server audio loading failed for ${audioIdOrName}:`, error);
    return isAudioId ? null : await loadAudioFromLocal(audioIdOrName);
  }
};

// Fallback to local audio files
export const loadAudioFromLocal = async (soundName: string): Promise<Audio.Sound | null> => {
  try {
    // Sprawdź, czy dźwięk jest już w cache'u
    const cacheKey = `local_${soundName}`;
    if (audioCache[cacheKey]) {
      console.log(`🔄 Using cached Audio.Sound object for local: ${soundName}`);
      
      // Resetuj dźwięk przed ponownym użyciem
      try {
        const status = await audioCache[cacheKey].getStatusAsync();
        if (status.isLoaded) {
          await audioCache[cacheKey].stopAsync();
          await audioCache[cacheKey].setPositionAsync(0);
          return audioCache[cacheKey];
        }
      } catch (error) {
        console.warn(`⚠️ Error resetting cached local sound: ${error}`);
        // Jeśli wystąpił błąd, usuń z cache'u i załaduj ponownie
        delete audioCache[cacheKey];
      }
    }
    
    const soundNameWithExt = soundName.endsWith('.wav') ? soundName : `${soundName}.wav`;
    
    let soundModule = soundFiles[soundNameWithExt];
    
    if (!soundModule && soundName.endsWith('.wav')) {
      const soundNameWithoutExt = soundName.replace('.wav', '');
      soundModule = soundFiles[soundNameWithoutExt];
    }
    
    if (!soundModule) {
      console.error(`🔇 Local audio file not found: ${soundName} (tried with and without .wav extension)`);
      return null;
    }
    
    const { sound } = await Audio.Sound.createAsync(
      soundModule,
      { 
        shouldPlay: false,
        ...(Platform.OS !== 'web' && {
          androidImplementation: 'MediaPlayer',
          progressUpdateIntervalMillis: 500,
        })
      }
    );
    
    // Zapisz dźwięk w cache'u
    audioCache[cacheKey] = sound;
    
    console.log(`✅ Local audio loaded: ${soundName}`);
    return sound;
    
  } catch (error) {
    console.error(`❌ Local audio loading failed for ${soundName}:`, error);
    return null;
  }
};

// Enhanced audio loading with retry mechanism
export const loadAudioWithRetry = async (soundName: string, maxRetries: number = 3): Promise<Audio.Sound | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Audio loading attempt ${attempt}/${maxRetries} for: ${soundName}`);
      
      const sound = await loadAudioFromLocal(soundName);
      if (sound) {
        return sound;
      }
      
      if (attempt === maxRetries) {
        console.error(`❌ All attempts failed for: ${soundName}`);
        return null;
      }
      
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ Waiting ${delay}ms before retry...`);
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

// Mobile audio debugging and diagnostics
// Funkcja do czyszczenia cache'u dźwięków
export const clearAudioCache = async () => {
  console.log('🧹 Clearing audio cache...');
  
  // Wyładuj wszystkie dźwięki z cache'u
  for (const key in audioCache) {
    try {
      const sound = audioCache[key];
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
    } catch (error) {
      console.warn(`⚠️ Error unloading sound ${key}:`, error);
    }
  }
  
  // Wyczyść obiekt cache'u
  Object.keys(audioCache).forEach(key => {
    delete audioCache[key];
  });
  
  console.log('✅ Audio cache cleared');
};

export const debugMobileAudio = async () => {
  if (Platform.OS === 'web') return;
  
  console.log('🔍 Mobile Audio Diagnostics:');
  console.log(`📱 Platform: ${Platform.OS} ${Platform.Version}`);
  console.log(`🌐 API URL: ${API_URL}`);
  console.log(`🔊 Audio cache size: ${Object.keys(audioCache).length} sounds`);
  
  try {
    console.log('🌐 Testing network connectivity...');
    const networkOk = await checkNetworkConnectivity();
    console.log(`🌐 Network Status: ${networkOk ? 'Connected ✅' : 'Failed ❌'}`);
    
    const { status } = await Audio.requestPermissionsAsync();
    console.log(`📱 Audio Permission Status: ${status}`);
    
    const isEnabled = await Audio.setIsEnabledAsync(true);
    console.log(`🔊 Audio Enabled: ${isEnabled}`);
    
    const testSoundName = 'Adult/Male/Moaning.wav';
    if (soundFiles[testSoundName]) {
      console.log('🎵 Testing local audio loading...');
      try {
        const { sound: testSound } = await Audio.Sound.createAsync(
          soundFiles[testSoundName],
          { shouldPlay: false }
        );
        console.log('✅ Local audio test successful');
        await testSound.unloadAsync();
      } catch (testError) {
        console.error('❌ Local audio test failed:', testError);
      }
    }
    
    console.log('🌐 Server audio testing skipped - using local audio files only');
    
    if (Platform.OS === 'android') {
      console.log('🤖 Android Audio Check Complete');
    } else if (Platform.OS === 'ios') {
      console.log('🍎 iOS Audio Check Complete');
    }
    
  } catch (error) {
    console.error('❌ Mobile Audio Diagnostics Failed:', error);
  }
};
