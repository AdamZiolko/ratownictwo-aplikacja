import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  useTheme,
  Text,
  Surface,
  Button,
  Appbar,
  IconButton,
  Icon,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import BackgroundGradient from "@/components/BackgroundGradient";
import { router, useLocalSearchParams } from "expo-router";
import { Audio, AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import * as FileSystem from 'expo-file-system';
import EkgCardDisplay from "@/components/ekg/EkgCardDisplay";
import ColorSensor from "@/components/ColorSensor";
import SocketConnectionStatus from "@/components/SocketConnectionStatus";
import { socketService } from "@/services/SocketService";
import { sessionService } from "@/services/SessionService";
import audioApiService from "@/services/AudioApiService";
import type { Session } from "@/services/SessionService";
import { SoundQueueItem } from "../examiner/types/types";
import { networkMonitorService } from "@/services/NetworkMonitorService";
import { wifiKeepAliveService } from "@/services/WifiKeepAliveService";
import { API_URL } from "@/constants/Config";

interface VitalWithFluctuation {
  baseValue: number | null;
  currentValue: number | null;
  unit: string;
  fluctuationRange: number;
}

interface BloodPressure {
  systolic: number | null;
  diastolic: number | null;
  currentSystolic: number | null;
  currentDiastolic: number | null;
}

const soundFiles: Record<string, any> = {
  "Adult/Female/Breathing through contractions.wav": require("../../../assets/sounds/Adult/Female/Breathingthroughcontractions.wav"),
  "Adult/Female/Coughing.wav": require("../../../assets/sounds/Adult/Female/Coughing.wav"),
  "Adult/Female/Distressed.wav": require("../../../assets/sounds/Adult/Female/Distressed.wav"),
  "Adult/Female/Hawk.wav": require("../../../assets/sounds/Adult/Female/Hawk.wav"),
  "Adult/Female/Moaning.wav": require("../../../assets/sounds/Adult/Female/Moaning.wav"),
  "Adult/Female/No.wav": require("../../../assets/sounds/Adult/Female/No.wav"),
  "Adult/Female/Ok.wav": require("../../../assets/sounds/Adult/Female/Ok.wav"),
  "Adult/Female/Pain.wav": require("../../../assets/sounds/Adult/Female/Pain.wav"),
  "Adult/Female/Pushing - long double.wav": require("../../../assets/sounds/Adult/Female/Pushinglongdouble.wav"),
  "Adult/Female/Pushing - long.wav": require("../../../assets/sounds/Adult/Female/Pushinglong.wav"),
  "Adult/Female/Pushing - single.wav": require("../../../assets/sounds/Adult/Female/Pushingsingle.wav"),
  "Adult/Female/Screaming.wav": require("../../../assets/sounds/Adult/Female/Screaming.wav"),
  "Adult/Female/Sob breathing (type 2).wav": require("../../../assets/sounds/Adult/Female/Sobbreathing(type2).wav"),
  "Adult/Female/Sob breathing.wav": require("../../../assets/sounds/Adult/Female/Sobbreathing.wav"),
  "Adult/Female/Vomiting.wav": require("../../../assets/sounds/Adult/Female/Vomiting.wav"),
  "Adult/Female/Yes.wav": require("../../../assets/sounds/Adult/Female/Yes.wav"),
  "Adult/Male/Coughing (long).wav": require("../../../assets/sounds/Adult/Male/Coughing(long).wav"),
  "Adult/Male/Coughing.wav": require("../../../assets/sounds/Adult/Male/Coughing.wav"),
  "Adult/Male/Difficult breathing.wav": require("../../../assets/sounds/Adult/Male/Difficultbreathing.wav"),
  "Adult/Male/Hawk.wav": require("../../../assets/sounds/Adult/Male/Hawk.wav"),
  "Adult/Male/Moaning (long).wav": require("../../../assets/sounds/Adult/Male/Moaning(long).wav"),
  "Adult/Male/oaning.wav": require("../../../assets/sounds/Adult/Male/Moaning.wav"),
  "Adult/Male/No.wav": require("../../../assets/sounds/Adult/Male/No.wav"),
  "Adult/Male/Ok.wav": require("../../../assets/sounds/Adult/Male/Ok.wav"),
  "Adult/Male/Screaming (type 2).wav": require("../../../assets/sounds/Adult/Male/Screaming(type2).wav"),
  "Adult/Male/Screaming.wav": require("../../../assets/sounds/Adult/Male/Screaming.wav"),
  "Adult/Male/Sob breathing.wav": require("../../../assets/sounds/Adult/Male/Sobbreathing.wav"),
  "Adult/Male/Vomiting (type 2).wav": require("../../../assets/sounds/Adult/Male/Vomiting(type2).wav"),
  "Adult/Male/Vomiting (type 3).wav": require("../../../assets/sounds/Adult/Male/Vomiting(type3).wav"),
  "Adult/Male/Vomiting.wav": require("../../../assets/sounds/Adult/Male/Vomiting.wav"),
  "Adult/Male/Yes.wav": require("../../../assets/sounds/Adult/Male/Yes.wav"),
  "Speech/Chest hurts.wav": require("../../../assets/sounds/Speech/Chesthurts.wav"),
  "Speech/Doc I feel I could die.wav": require("../../../assets/sounds/Speech/DocIfeelIcoulddie.wav"),
  "Speech/Go away.wav": require("../../../assets/sounds/Speech/Goaway.wav"),
  "Speech/I don't feel dizzy.wav": require("../../../assets/sounds/Speech/Idontfeeldizzy.wav"),
  "Speech/I don't feel well.wav": require("../../../assets/sounds/Speech/Idontfeelwell.wav"),
  "Speech/I feel better now.wav": require("../../../assets/sounds/Speech/Ifeelbetternow.wav"),
  "Speech/I feel really bad.wav": require("../../../assets/sounds/Speech/Ifeelreallybad.wav"),
  "Speech/I'm feeling very dizzy.wav": require("../../../assets/sounds/Speech/Imfeelingverydizzy.wav"),
  "Speech/I'm fine.wav": require("../../../assets/sounds/Speech/Imfine.wav"),
  "Speech/I'm quite nauseous.wav": require("../../../assets/sounds/Speech/Imquitenauseous.wav"),
  "Speech/I'm really hungry.wav": require("../../../assets/sounds/Speech/Imreallyhungry.wav"),
  "Speech/I'm really thirsty.wav": require("../../../assets/sounds/Speech/Imreallythirsty.wav"),
  "Speech/I'm so sick.wav": require("../../../assets/sounds/Speech/Imsosick.wav"),
  "Speech/Never had pain like this before.wav": require("../../../assets/sounds/Speech/Neverhadpainlikethisbefore.wav"),
  "Speech/No allergies.wav": require("../../../assets/sounds/Speech/Noallergies.wav"),
  "Speech/No diabetes.wav": require("../../../assets/sounds/Speech/Nodiabetes.wav"),
  "Speech/No lung or cardiac problems.wav": require("../../../assets/sounds/Speech/Nolungorcardiacproblems.wav"),
  "Speech/No.wav": require("../../../assets/sounds/Speech/No.wav"),
  "Speech/Pain for 2 hours.wav": require("../../../assets/sounds/Speech/Painfor2hours.wav"),
  "Speech/Something for this pain.wav": require("../../../assets/sounds/Speech/Somethingforthispain.wav"),
  "Speech/Thank you.wav": require("../../../assets/sounds/Speech/Thankyou.wav"),
  "Speech/That helped.wav": require("../../../assets/sounds/Speech/Thathelped.wav"),
  "Speech/Yes.wav": require("../../../assets/sounds/Speech/Yes.wav"),
  "Child/Coughing.wav": require("../../../assets/sounds/Child/Coughing.wav"),
  "Child/Hawk.wav": require("../../../assets/sounds/Child/Hawk.wav"),
  "Child/Moaning.wav": require("../../../assets/sounds/Child/Moaning.wav"),
  "Child/No.wav": require("../../../assets/sounds/Child/No.wav"),
  "Child/Ok.wav": require("../../../assets/sounds/Child/Ok.wav"),
  "Child/Screaming.wav": require("../../../assets/sounds/Child/Screaming.wav"),
  "Child/Sob breathing.wav": require("../../../assets/sounds/Child/Sobbreathing.wav"),
  "Child/Vomiting (type 2).wav": require("../../../assets/sounds/Child/Vomiting(type2).wav"),
  "Child/Vomiting.wav": require("../../../assets/sounds/Child/Vomiting.wav"),
  "Child/Yes.wav": require("../../../assets/sounds/Child/Yes.wav"),
  "Geriatric/Female/Coughing.wav": require("../../../assets/sounds/Geriatric/Female/Coughing.wav"),
  "Geriatric/Female/Moaning.wav": require("../../../assets/sounds/Geriatric/Female/Moaning.wav"),
  "Geriatric/Female/No.wav": require("../../../assets/sounds/Geriatric/Female/No.wav"),
  "Geriatric/Female/Screaming.wav": require("../../../assets/sounds/Geriatric/Female/Screaming.wav"),
  "Geriatric/Female/Vomiting.wav": require("../../../assets/sounds/Geriatric/Female/Vomiting.wav"),
  "Geriatric/Female/Yes.wav": require("../../../assets/sounds/Geriatric/Female/Yes.wav"),
  "Geriatric/Male/Coughing.wav": require("../../../assets/sounds/Geriatric/Male/Coughing.wav"),
  "Geriatric/Male/Moaning.wav": require("../../../assets/sounds/Geriatric/Male/Moaning.wav"),
  "Geriatric/Male/No.wav": require("../../../assets/sounds/Geriatric/Male/No.wav"),
  "Geriatric/Male/Screaming.wav": require("../../../assets/sounds/Geriatric/Male/Screaming.wav"),
  "Geriatric/Male/Vomiting.wav": require("../../../assets/sounds/Geriatric/Male/Vomiting.wav"),
  "Geriatric/Male/Yes.wav": require("../../../assets/sounds/Geriatric/Male/Yes.wav"),
  "Infant/Content.wav": require("../../../assets/sounds/Infant/Content.wav"),
  "Infant/Cough.wav": require("../../../assets/sounds/Infant/Cough.wav"),
  "Infant/Grunt.wav": require("../../../assets/sounds/Infant/Grunt.wav"),
  "Infant/Hawk.wav": require("../../../assets/sounds/Infant/Hawk.wav"),
  "Infant/Hiccup.wav": require("../../../assets/sounds/Infant/Hiccup.wav"),
  "Infant/Screaming.wav": require("../../../assets/sounds/Infant/Screaming.wav"),
  "Infant/Strongcry (type 2).wav": require("../../../assets/sounds/Infant/Strongcry(type2).wav"),
  "Infant/Strongcry.wav": require("../../../assets/sounds/Infant/Strongcry.wav"),
  "Infant/Weakcry.wav": require("../../../assets/sounds/Infant/Weakcry.wav"),
};

// Audio file mapping for server-side streaming
const audioFileMap: Record<string, string> = {
  "Adult/Female/Breathing through contractions.wav": "adult-female-breathing-contractions",
  "Adult/Female/Coughing.wav": "adult-female-coughing",
  "Adult/Female/Distressed.wav": "adult-female-distressed",
  "Adult/Female/Hawk.wav": "adult-female-hawk",
  "Adult/Female/Moaning.wav": "adult-female-moaning",
  "Adult/Female/No.wav": "adult-female-no",
  "Adult/Female/Ok.wav": "adult-female-ok",
  "Adult/Female/Pain.wav": "adult-female-pain",
  "Adult/Female/Screaming.wav": "adult-female-screaming",
  "Adult/Female/Vomiting.wav": "adult-female-vomiting",
  "Adult/Female/Yes.wav": "adult-female-yes",
  "Adult/Male/Coughing.wav": "adult-male-coughing",
  "Adult/Male/Moaning.wav": "adult-male-moaning",
  "Adult/Male/No.wav": "adult-male-no",
  "Adult/Male/Ok.wav": "adult-male-ok",
  "Adult/Male/Screaming.wav": "adult-male-screaming",
  "Adult/Male/Vomiting.wav": "adult-male-vomiting",
  "Adult/Male/Yes.wav": "adult-male-yes",
  "Child/Coughing.wav": "child-coughing",
  "Child/Moaning.wav": "child-moaning",
  "Child/No.wav": "child-no",
  "Child/Ok.wav": "child-ok",
  "Child/Screaming.wav": "child-screaming",
  "Child/Vomiting.wav": "child-vomiting",
  "Child/Yes.wav": "child-yes",
  // Add more mappings as needed
};

// Check network connectivity before streaming
const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    // Simple ping to our API to check connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased to 5 second timeout
    
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache'
      }
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
    // If it's an abort error, the network is likely slow/unreliable
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('⚠️ Network request timed out - using local audio files');
    }
    return false;
  }
};

// Enhanced audio loading system for mobile streaming
const loadAudioFromServer = async (audioIdOrName: string): Promise<Audio.Sound | null> => {
  try {
    console.log(`🌐 Loading audio from server: ${audioIdOrName}`);
    
    // Check if this is an audio ID (UUID format) or a sound name
    const isAudioId = audioIdOrName.includes('-') && audioIdOrName.length > 30;
    let serverAudioId: string;
    
    if (isAudioId) {
      // Direct audio ID from server
      serverAudioId = audioIdOrName;
      console.log(`📋 Using direct audio ID: ${serverAudioId}`);
    } else {
      // Sound name - need to map to server ID
      serverAudioId = audioFileMap[audioIdOrName];
      if (!serverAudioId) {
        console.warn(`⚠️ No server mapping found for: ${audioIdOrName}, falling back to local`);
        return await loadAudioFromLocal(audioIdOrName);
      }
      console.log(`🗺️ Mapped sound name "${audioIdOrName}" to server ID: ${serverAudioId}`);
    }

    // Check network connectivity before streaming
    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      console.warn(`⚠️ No network connectivity, falling back to local for: ${audioIdOrName}`);
      return isAudioId ? null : await loadAudioFromLocal(audioIdOrName);
    }

    // Stream audio from server with enhanced error handling
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

    // Handle streaming differently for mobile vs web
    if (Platform.OS !== 'web') {
      // Mobile implementation - download and cache
      try {
        const localPath = `${FileSystem.documentDirectory}audio_cache_${serverAudioId}.mp3`;
        
        // Check if already cached
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists) {
          console.log(`📁 Using cached audio: ${audioIdOrName}`);
          const { sound } = await Audio.Sound.createAsync(
            { uri: localPath },
            { 
              shouldPlay: false,
              androidImplementation: 'MediaPlayer',
              progressUpdateIntervalMillis: 500,
            }
          );
          return sound;
        }

        // Download and cache
        console.log(`⬇️ Downloading audio ${serverAudioId} for playback...`);
        const downloadResponse = await audioApiService.streamAudio(serverAudioId);
        
        if (!downloadResponse.ok) {
          throw new Error(`Failed to download audio: ${downloadResponse.status} ${downloadResponse.statusText}`);
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
        
        console.log(`✅ Server audio downloaded and loaded: ${audioIdOrName}`);
        return sound;
      } catch (error) {
        console.warn(`❌ Mobile download failed for ${audioIdOrName}:`, error);
        // Fallback to local on mobile stream failure
        return isAudioId ? null : await loadAudioFromLocal(audioIdOrName);
      }
    } else {
      // Web implementation using blob
      try {
        const audioBlob = await response.blob();
        const audioUri = URL.createObjectURL(audioBlob);
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: false }
        );
        
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
const loadAudioFromLocal = async (soundName: string): Promise<Audio.Sound | null> => {
  try {
    const soundModule = soundFiles[soundName];
    if (!soundModule) {
      console.error(`🔇 Local audio file not found: ${soundName}`);
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
    
    console.log(`✅ Local audio loaded: ${soundName}`);
    return sound;
    
  } catch (error) {
    console.error(`❌ Local audio loading failed for ${soundName}:`, error);
    return null;
  }
};

// Enhanced audio loading with retry mechanism
const loadAudioWithRetry = async (soundName: string, maxRetries: number = 3): Promise<Audio.Sound | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Audio loading attempt ${attempt}/${maxRetries} for: ${soundName}`);
      
      // Try server first, then local fallback
      const sound = await loadAudioFromServer(soundName);
      if (sound) {
        return sound;
      }
      
      // If still no sound and this is our last attempt, fail
      if (attempt === maxRetries) {
        console.error(`❌ All attempts failed for: ${soundName}`);
        return null;
      }
      
      // Wait before retry (exponential backoff)
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

const StudentSessionScreen = () => {
  const theme = useTheme();
  const { firstName, lastName, albumNumber, accessCode } =
    useLocalSearchParams<{
      firstName: string;
      lastName: string;
      albumNumber: string;
      accessCode: string;
    }>();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  const isWeb = Platform.OS === "web";
  const [isSessionPanelExpanded, setIsSessionPanelExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  const soundInstances = useRef<Record<string, Audio.Sound>>({});

  const [temperature, setTemperature] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: "°C",
    fluctuationRange: 0.2,
  });

  const [bloodPressure, setBloodPressure] = useState<BloodPressure>({
    systolic: null,
    diastolic: null,
    currentSystolic: null,
    currentDiastolic: null,
  });

  const [spo2, setSpo2] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: "%",
    fluctuationRange: 1,
  });

  const [etco2, setEtco2] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: "mmHg",
    fluctuationRange: 2,
  });

  const [respiratoryRate, setRespiratoryRate] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: "breaths/min",
    fluctuationRange: 5,
  });

  const generateFluctuation = (
    value: number | null,
    fluctuationRange: number
  ): number | null => {
    if (value === null) return null;
    const fluctPercent = (Math.random() - 0.5) * 2 * fluctuationRange;
    const fluctAmount = value * (fluctPercent / 100);
    return Math.round((value + fluctAmount) * 10) / 10;
  };

  const parseBloodPressure = (
    bpString: string | null | undefined
  ): { systolic: number | null; diastolic: number | null } => {
    if (!bpString) return { systolic: null, diastolic: null };
    const parts = bpString.split("/");
    if (parts.length !== 2) return { systolic: null, diastolic: null };
    const systolic = parseInt(parts[0], 10) || null;
    const diastolic = parseInt(parts[1], 10) || null;
    return { systolic, diastolic };
  };

  const handleRetry = () => {
    fetchSession();
  };

  const fetchSession = async () => {
    if (!accessCode) {
      setError("No access code provided");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const resp = await sessionService.getSessionByCode(accessCode.toString());
      if (!resp) {
        setError("Session not found");
      } else {
        setSessionData(resp);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch session");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchSession();
  }, [accessCode]);
  useEffect(() => {
    let unsub: (() => void) | undefined;

    async function setupSessionSubscription() {
      if (!accessCode) return;

      let name = firstName || "";
      let surname = lastName || "";
      let albumNum = albumNumber || "";

      sessionService
        .subscribeToSessionUpdates(
          accessCode.toString(),
          (updated) => {
            setSessionData(updated);
            
            
            if (updated.isActive === false) {
              setError("Sesja została dezaktywowana przez egzaminatora");
              
              if (accessCode) {
                try {
                  sessionService.leaveSession(accessCode.toString());
                } catch (e) {
                  console.warn("Error leaving session on inactive:", e);
                }
              }
              
              
              setTimeout(() => {
                router.replace({
                  pathname: "/routes/student-access",
                  params: { 
                    firstName: firstName || "", 
                    lastName: lastName || "", 
                    albumNumber: albumNumber || "" 
                  }
                });
              }, 3000);
            }
          },
          {
            name,
            surname,
            albumNumber: albumNum,
          }
        )
        .then((fn) => {
          unsub = fn;
        })
        .catch(console.error);
      const sessionDeletedUnsubscribe = socketService.on('session-deleted', (data) => {
        console.log('❌ Session has been deleted by the examiner', data);
        
        setError("Sesja została zakończona przez egzaminatora");
        
        if (accessCode) {
          try {
            sessionService.leaveSession(accessCode.toString());
          } catch (e) {
            console.warn("Error leaving session on deletion:", e);
          }
        }
        
        router.replace({
          pathname: "/routes/student-access",
          params: { 
            firstName: firstName || "", 
            lastName: lastName || "", 
            albumNumber: albumNumber || "" 
          }
        });
      });

      return () => {
        unsub?.();
        sessionDeletedUnsubscribe();

        if (accessCode) {
          sessionService.leaveSession(accessCode.toString());
          console.log(`Left session ${accessCode}`);
        }
      };
    }

    setupSessionSubscription();
    return () => {
      unsub?.();

      if (accessCode) {
        sessionService.leaveSession(accessCode.toString());
        console.log(`Left session ${accessCode}`);
      }
    };
  }, [accessCode, firstName, lastName, albumNumber, router]);


useEffect(() => {  async function initAudio() {
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


useEffect(() => {
   if (!audioReady || !accessCode) {
      
      return;
    }
  console.log('🔌 Zakładam listener "audio-command" – audio jest gotowe');
  
  // Preload critical sounds for better performance on mobile
  preloadCriticalSounds();

  const handleAudioCommand = async (payload: {
    command: 'PLAY' | 'STOP' | 'PAUSE' | 'RESUME' | 'PLAY_QUEUE';
    soundName: string | SoundQueueItem[];
    loop?: boolean;
  }) => {
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

// Nowy listener dla server audio commands
useEffect(() => {
  if (!audioReady || !accessCode) return;

  const handleServerAudioCommand = async (payload: any) => {
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

// Nowe funkcje do obsługi server audio
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

// Mobile audio debugging and diagnostics
const debugMobileAudio = async () => {
  if (Platform.OS === 'web') return;
  
  console.log('🔍 Mobile Audio Diagnostics:');
  console.log(`📱 Platform: ${Platform.OS} ${Platform.Version}`);
  console.log(`🌐 API URL: ${API_URL}`);
  
  try {
    // Test network connectivity
    console.log('🌐 Testing network connectivity...');
    const networkOk = await checkNetworkConnectivity();
    console.log(`🌐 Network Status: ${networkOk ? 'Connected ✅' : 'Failed ❌'}`);
    
    // Check audio permissions
    const { status } = await Audio.requestPermissionsAsync();
    console.log(`📱 Audio Permission Status: ${status}`);
    
    // Check if audio is enabled
    const isEnabled = await Audio.setIsEnabledAsync(true);
    console.log(`🔊 Audio Enabled: ${isEnabled}`);
    
    // Test basic sound loading
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
    
    // Test server audio loading if network is available
    if (networkOk) {
      console.log('🌐 Testing server audio loading...');
      try {
        const serverSound = await loadAudioFromServer('Adult/Male/Moaning.wav');
        if (serverSound) {
          console.log('✅ Server audio test successful');
          await serverSound.unloadAsync();
        } else {
          console.warn('⚠️ Server audio test returned null');
        }
      } catch (serverError) {
        console.error('❌ Server audio test failed:', serverError);
      }
    }
    
    // Platform-specific checks
    if (Platform.OS === 'android') {
      console.log('🤖 Android Audio Check Complete');
    } else if (Platform.OS === 'ios') {
      console.log('🍎 iOS Audio Check Complete');
    }
    
  } catch (error) {
    console.error('❌ Mobile Audio Diagnostics Failed:', error);
  }
};

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

useEffect(() => {
  if (!sessionData) return;

  const tempValue =
    sessionData.temperature !== undefined && sessionData.temperature !== null
      ? typeof sessionData.temperature === "string"
        ? parseFloat(sessionData.temperature)
        : sessionData.temperature
      : null;

  const { systolic, diastolic } = parseBloodPressure(sessionData.bp);

  const spo2Value =
    sessionData.spo2 !== undefined && sessionData.spo2 !== null
      ? typeof sessionData.spo2 === "string"
        ? parseInt(sessionData.spo2, 10)
        : sessionData.spo2
      : null;

  const etco2Value =
    sessionData.etco2 !== undefined && sessionData.etco2 !== null
      ? typeof sessionData.etco2 === "string"
        ? parseInt(sessionData.etco2, 10)
        : sessionData.etco2
      : null;

  const rrValue =
    sessionData.rr !== undefined && sessionData.rr !== null
      ? typeof sessionData.rr === "string"
        ? parseInt(sessionData.rr, 10)
        : sessionData.rr
      : null;

  setTemperature((prev) => ({
    ...prev,
    baseValue: tempValue,
    currentValue: tempValue,
  }));
  setBloodPressure({
    systolic,
    diastolic,
    currentSystolic: systolic,
    currentDiastolic: diastolic,
  });
  setSpo2((prev) => ({
    ...prev,
    baseValue: spo2Value,
    currentValue: spo2Value,
  }));
  setEtco2((prev) => ({
    ...prev,
    baseValue: etco2Value,
    currentValue: etco2Value,
  }));
  setRespiratoryRate((prev) => ({
    ...prev,
    baseValue: rrValue,
    currentValue: rrValue,
  }));

  const fluctuationTimer = setInterval(() => {
    setTemperature((prev) => ({
      ...prev,
      currentValue: generateFluctuation(
        prev.baseValue,
        prev.fluctuationRange
      ),
    }));
    setBloodPressure((prev) => ({
      ...prev,
      currentSystolic: generateFluctuation(prev.systolic, 2),
      currentDiastolic: generateFluctuation(prev.diastolic, 2),
    }));
    setSpo2((prev) => ({
      ...prev,
      currentValue: generateFluctuation(
        prev.baseValue,
        prev.fluctuationRange
      ),
    }));
    setEtco2((prev) => ({
      ...prev,
      currentValue: generateFluctuation(
        prev.baseValue,
        prev.fluctuationRange
      ),
    }));
    setRespiratoryRate((prev) => ({
      ...prev,
      currentValue: generateFluctuation(
        prev.baseValue,
        prev.fluctuationRange
      ),
    }));
  }, 2000);

  return () => clearInterval(fluctuationTimer);
}, [sessionData]);

const formatBloodPressure = (): string => {
  if (
    bloodPressure.currentSystolic === null ||
    bloodPressure.currentDiastolic === null
  ) {
    return "N/A";
  }
  return `${Math.round(bloodPressure.currentSystolic)}/${Math.round(
    bloodPressure.currentDiastolic
  )}`;
};

const renderFullscreenView = () => (
  <View style={{ flex: 1 }}>
    <View style={styles.fullscreenExitButton}>
      <IconButton
        icon="arrow-collapse"
        onPress={() => setIsFullscreen(false)}
        size={24}
      />
    </View>      <View style={styles.fullscreenContent}>
      {!sessionData?.isEkdDisplayHidden && (
        <Surface style={styles.vitalItemCard} elevation={1}>
          <EkgCardDisplay
            ekgType={Number(sessionData?.rhythmType)}
            bpm={Number(sessionData?.beatsPerMinute)}
            noiseType={sessionData?.noiseLevel}
            isRunning
            title="Kardiomonitor"
          />
        </Surface>
      )}

      <Surface style={styles.vitalsCardFullscreen} elevation={3}>
        <View style={styles.cardHeaderRow}>
          <MaterialCommunityIcons
            name="clipboard-pulse"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={styles.cardHeaderTitle}>Parametry pacjenta</Text>
        </View>
        <View style={styles.fullscreenVitalsGrid}>
          <View style={styles.vitalsRow}>
            <Surface style={styles.vitalItemCard} elevation={1}>
              <MaterialCommunityIcons
                name="thermometer"
                size={22}
                color={theme.colors.tertiary}
              />
              <Text style={styles.vitalLabel}>Temperatura</Text>
              <Text style={styles.vitalValue}>
                {temperature.currentValue !== null
                  ? `${temperature.currentValue}${temperature.unit}`
                  : "N/A"}
              </Text>
            </Surface>
            <Surface style={styles.vitalItemCard} elevation={1}>
              <MaterialCommunityIcons
                name="blood-bag"
                size={22}
                color={theme.colors.error}
              />
              <Text style={styles.vitalLabel}>Ciśnienie krwi</Text>
              <Text style={styles.vitalValue}>{formatBloodPressure()}</Text>
            </Surface>
          </View>

          <View style={styles.vitalsRow}>
            <Surface style={styles.vitalItemCard} elevation={1}>
              <MaterialCommunityIcons
                name="percent"
                size={22}
                color={theme.colors.primary}
              />
              <Text style={styles.vitalLabel}>SpO₂</Text>
              <Text style={styles.vitalValue}>
                {spo2.currentValue !== null
                  ? `${spo2.currentValue}${spo2.unit}`
                  : "N/A"}
              </Text>
            </Surface>
            <Surface style={styles.vitalItemCard} elevation={1}>
              <MaterialCommunityIcons
                name="molecule-co2"
                size={22}
                color={theme.colors.secondary}
              />
              <Text style={styles.vitalLabel}>EtCO₂</Text>
              <Text style={styles.vitalValue}>
                {etco2.currentValue !== null
                  ? `${etco2.currentValue}${etco2.unit}`
                  : "N/A"}
              </Text>
            </Surface>
            <Surface style={styles.vitalItemCard} elevation={1}>
              <MaterialCommunityIcons
                name="lungs"
                size={22}
                color={theme.colors.tertiary}
              />
              <Text style={styles.vitalLabel}>Częstość oddechów</Text>
              <Text style={styles.vitalValue}>
                {respiratoryRate.currentValue !== null
                  ? `${respiratoryRate.currentValue}${respiratoryRate.unit}`
                  : "N/A"}
              </Text>
            </Surface>
          </View>
        </View>
      </Surface>
    </View>
  </View>
);

useEffect(() => {
  if (Platform.OS !== 'android') return;
  
  const setupNetworkMonitoring = async () => {
    try {
      console.log('Setting up network monitoring for Android...');
      
      await socketService.connect();
      
      setTimeout(async () => {
        try {
          await wifiKeepAliveService.enableWebSocketKeepAlive();
          console.log('WebSocket keep-alive enabled');
        } catch (error) {
          console.error('Error enabling WebSocket keep-alive:', error);
        }
        
        try {
          networkMonitorService.startMonitoring();
          console.log('Network monitoring started');
        } catch (error) {
          console.error('Error starting network monitoring:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Error setting up network monitoring:', error);
    }
  };
  
  setupNetworkMonitoring();
  
  return () => {
    if (Platform.OS !== 'android') return;
    
    try {
      Promise.all([
        wifiKeepAliveService.disableWebSocketKeepAlive()
          .then(() => console.log('WebSocket keep-alive disabled'))
          .catch(e => console.error('Error disabling WebSocket keep-alive:', e)),
        
        new Promise<void>(resolve => {
          networkMonitorService.stopMonitoring();
          console.log('Network monitoring stopped');
          resolve();
        })
      ]).catch(error => {
        console.error('Error during cleanup:', error);
      });
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };
}, []);

return (
  <BackgroundGradient>
    <Appbar.Header style={{ backgroundColor: "#8B0000" }}>
      <Appbar.BackAction onPress={() => router.back()} color="#fff" />
      <Appbar.Content
        title="Sesja studenta"
        titleStyle={{ color: "#fff", fontWeight: "bold" }}
      />
    </Appbar.Header>

    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text>Ładowanie danych sesji...</Text>
        </View>
      ) : error ? (          <Surface style={styles.center} elevation={2}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={64}
            color={theme.colors.error}
          />
          <Text style={{ color: theme.colors.error, marginVertical: 12, textAlign: 'center' }}>
            {error === "Sesja została zakończona przez egzaminatora" || error === "Sesja została dezaktywowana przez egzaminatora"
              ? error
              : `Błąd: ${error}`
            }
          </Text>
          {(error !== "Sesja została zakończona przez egzaminatora" && error !== "Sesja została dezaktywowana przez egzaminatora") && (
            <Button mode="contained" onPress={handleRetry} icon="refresh">
              Spróbuj ponownie
            </Button>
          )}
          {(error === "Sesja została zakończona przez egzaminatora" || error === "Sesja została dezaktywowana przez egzaminatora") && (
            <Text style={{ marginTop: 12, textAlign: 'center' }}>
              Przekierowuję do ekranu wpisywania kodu...
            </Text>
          )}
        </Surface>
      ) : sessionData ? (
        isFullscreen && Platform.OS !== "web" ? (
          renderFullscreenView()
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={[
              styles.contentContainer,
              { flexGrow: 1, justifyContent: "center", minHeight: "100%" },
            ]}
          >
            {Platform.OS !== "web" ? (
              <View style={styles.mobileSessionHeader}>
                <View style={styles.mobileHeaderButtons}>                    <Button
                  mode="elevated"
                    onPress={() =>
                      setIsSessionPanelExpanded(!isSessionPanelExpanded)
                    }
                    icon={
                      isSessionPanelExpanded ? "chevron-up" : "chevron-down"
                    }
                  >
                    Informacje o sesji
                  </Button>
                </View>
                {isSessionPanelExpanded && (
                  <Surface style={styles.sessionInfo} elevation={3}>
                    <View style={styles.sessionHeader}>
                      <MaterialCommunityIcons
                        name="medical-bag"
                        size={24}
                        color={theme.colors.primary}
                        style={styles.headerIcon}
                      />
                      <Text style={styles.title}>Sesja #{accessCode}</Text>
                    </View>
                    <View style={styles.patientInfoRow}>
                      <MaterialCommunityIcons
                        name="account"
                        size={20}
                        color={theme.colors.secondary}
                      />
                      <Text style={styles.patientInfoText}>
                        {firstName} {lastName} (Album: {albumNumber})
                      </Text>
                    </View>
                    {sessionData?.name && (
                      <View style={styles.patientInfoRow}>
                        <MaterialCommunityIcons
                          name="tag"
                          size={20}
                          color={theme.colors.secondary}
                        />
                        <Text style={styles.sessionName}>
                          {sessionData.name}
                        </Text>
                      </View>
                    )}
        
                    <View style={styles.sessionMetaInfo}>
                      <View style={styles.metaItemRow}>
                        <MaterialCommunityIcons
                          name={
                            sessionData?.isActive
                              ? "check-circle"
                              : "close-circle"
                          }
                          size={18}
                          color={
                            sessionData?.isActive
                              ? theme.colors.primary
                              : theme.colors.error
                          }
                        />
                        <Text style={styles.metaItemLabel}>
                          Status:{" "}
                          {sessionData?.isActive ? "Aktywna" : "Nieaktywna"}
                        </Text>
                      </View>
                      {sessionData?.createdAt && (
                        <View style={styles.metaItemRow}>
                          <MaterialCommunityIcons
                            name="clock-outline"
                            size={18}
                            color={theme.colors.secondary}
                          />
                          <Text style={styles.metaItemLabel}>
                            Utworzono:{" "}
                            {new Date(sessionData.createdAt).toLocaleString()}
                          </Text>
                        </View>
                      )}
                      {sessionData?.updatedAt && (
                        <View style={styles.metaItemRow}>
                          <MaterialCommunityIcons
                            name="update"
                            size={18}
                            color={theme.colors.secondary}
                          />
                          <Text style={styles.metaItemLabel}>
                            Ostatnia aktualizacja:{" "}
                            {new Date(sessionData.updatedAt).toLocaleString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Surface>
                )}
              </View>
            ) : (
              <Surface style={styles.sessionInfo} elevation={3}>
                <View style={styles.sessionHeader}>
                  <MaterialCommunityIcons
                    name="medical-bag"
                    size={24}
                    color={theme.colors.primary}
                    style={styles.headerIcon}
                  />
                  <Text style={styles.title}>Sesja #{accessCode}</Text>
                </View>
                <View style={styles.patientInfoRow}>
                  <MaterialCommunityIcons
                    name="account"
                    size={20}
                    color={theme.colors.secondary}
                  />
                  <Text style={styles.patientInfoText}>
                    {firstName} {lastName} (Album: {albumNumber})
                  </Text>
                </View>
                {sessionData?.name && (
                  <View style={styles.patientInfoRow}>
                    <MaterialCommunityIcons
                      name="tag"
                      size={20}
                      color={theme.colors.secondary}
                    />
                    <Text style={styles.sessionName}>{sessionData.name}</Text>
                  </View>
                )}
                <View style={styles.sessionMetaInfo}>
                  <View style={styles.metaItemRow}>
                    <MaterialCommunityIcons
                      name={
                        sessionData?.isActive
                          ? "check-circle"
                          : "close-circle"
                      }
                      size={18}
                      color={
                        sessionData?.isActive
                          ? theme.colors.primary
                          : theme.colors.error
                      }
                    />
                    <Text style={styles.metaItemLabel}>
                      Status:{" "}
                      {sessionData?.isActive ? "Aktywna" : "Nieaktywna"}
                    </Text>
                  </View>
                  {sessionData?.createdAt && (
                    <View style={styles.metaItemRow}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={18}
                        color={theme.colors.secondary}
                      />
                      <Text style={styles.metaItemLabel}>
                        Utworzono:{" "}
                        {new Date(sessionData.createdAt).toLocaleString()}
                      </Text>
                    </View>
                  )}
                  {sessionData?.updatedAt && (
                    <View style={styles.metaItemRow}>
                      <MaterialCommunityIcons
                        name="update"
                        size={18}
                        color={theme.colors.secondary}
                      />
                      <Text style={styles.metaItemLabel}>
                        Ostatnia aktualizacja:{" "}
                        {new Date(sessionData.updatedAt).toLocaleString()}
                      </Text>
                    </View>
                  )}                  </View>
              </Surface>
            )}
            {Platform.OS !== "web" ? (
              <>
                {!sessionData.isEkdDisplayHidden && (
                  <EkgCardDisplay
                    ekgType={Number(sessionData.rhythmType)}
                    bpm={Number(sessionData.beatsPerMinute)}
                    noiseType={sessionData.noiseLevel}
                    isRunning
                    title="Kardiomonitor"
                  />
                )}

                <Surface style={styles.vitalsCard} elevation={3}>
                  <View style={styles.cardHeaderRow}>
                    <MaterialCommunityIcons
                      name="clipboard-pulse"
                      size={24}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.cardHeaderTitle}>
                      Parametry pacjenta
                    </Text>
                  </View>

                  <View style={styles.vitalsRow}>
                    <Surface style={styles.vitalItemCard} elevation={1}>
                      <MaterialCommunityIcons
                        name="thermometer"
                        size={22}
                        color={theme.colors.tertiary}
                      />
                      <Text style={styles.vitalLabel}>Temperatura</Text>
                      <Text style={styles.vitalValue}>
                        {temperature.currentValue !== null
                          ? `${temperature.currentValue}${temperature.unit}`
                          : "N/A"}
                      </Text>
                    </Surface>
                    <Surface style={styles.vitalItemCard} elevation={1}>
                      <MaterialCommunityIcons
                        name="blood-bag"
                        size={22}
                        color={theme.colors.error}
                      />
                      <Text style={styles.vitalLabel}>Ciśnienie krwi</Text>
                      <Text style={styles.vitalValue}>
                        {formatBloodPressure()}
                      </Text>
                    </Surface>
                  </View>

                  <View style={styles.vitalsRow}>
                    <Surface style={styles.vitalItemCard} elevation={1}>
                      <MaterialCommunityIcons
                        name="percent"
                        size={22}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.vitalLabel}>SpO₂</Text>
                      <Text style={styles.vitalValue}>
                        {spo2.currentValue !== null
                          ? `${spo2.currentValue}${spo2.unit}`
                          : "N/A"}
                      </Text>
                    </Surface>
                    <Surface style={styles.vitalItemCard} elevation={1}>
                      <MaterialCommunityIcons
                        name="molecule-co2"
                        size={22}
                        color={theme.colors.secondary}
                      />
                      <Text style={styles.vitalLabel}>EtCO₂</Text>
                      <Text style={styles.vitalValue}>
                        {etco2.currentValue !== null
                          ? `${etco2.currentValue} ${etco2.unit}`
                          : "N/A"}
                      </Text>
                    </Surface>
                  </View>

                  <View style={styles.vitalsRow}>
                    <Surface style={styles.vitalItemCard} elevation={1}>
                      <MaterialCommunityIcons
                        name="lungs"
                        size={22}
                        color={theme.colors.tertiary}
                      />
                      <Text style={styles.vitalLabel}>Częstość oddechów</Text>
                      <Text style={styles.vitalValue}>
                        {respiratoryRate.currentValue !== null
                          ? `${respiratoryRate.currentValue} ${respiratoryRate.unit}`
                          : "N/A"}
                      </Text>
                    </Surface>
                  </View>
                </Surface>

                <Surface style={styles.vitalsCard} elevation={3}>
                  <View style={styles.cardHeaderRow}>
                    <Icon
                      source="circle-outline"
                      size={24}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.cardHeaderTitle}>Sensor RGB</Text>
                  </View>
                  <ColorSensor />
                </Surface>
              </>
            ) : (
              <>
                {!isWeb && (
                  <Surface style={styles.vitalsCard} elevation={3}>
                    <View style={styles.cardHeaderRow}>
                      <Icon
                        source="circle-outline"
                        size={24}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.cardHeaderTitle}>Sensor RGB</Text>
                    </View>
                    <ColorSensor />
                  </Surface>
                )}
                {!sessionData.isEkdDisplayHidden && (
                  <EkgCardDisplay
                    ekgType={Number(sessionData.rhythmType)}
                    bpm={Number(sessionData.beatsPerMinute)}
                    noiseType={sessionData.noiseLevel}
                    isRunning
                    title="Kardiomonitor"
                  />
                )}
                <Surface style={styles.vitalsCard} elevation={3}>
                  <View style={styles.cardHeaderRow}>
                    <MaterialCommunityIcons
                      name="clipboard-pulse"
                      size={24}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.cardHeaderTitle}>
                      Parametry pacjenta
                    </Text>
                  </View>

                  <View style={styles.vitalsRow}>
                    <Surface style={styles.vitalItemCard} elevation={1}>
                      <MaterialCommunityIcons
                        name="thermometer"
                        size={22}
                        color={theme.colors.tertiary}
                      />
                      <Text style={styles.vitalLabel}>Temperatura</Text>
                      <Text style={styles.vitalValue}>
                        {temperature.currentValue !== null
                          ? `${temperature.currentValue}${temperature.unit}`
                          : "N/A"}
                      </Text>
                    </Surface>
                  </View>

                  <View style={styles.vitalsRow}>
                    <Surface style={styles.vitalItemCard} elevation={1}>
                      <MaterialCommunityIcons
                        name="blood-bag"
                        size={22}
                        color={theme.colors.error}
                      />
                      <Text style={styles.vitalLabel}>Ciśnienie krwi</Text>
                      <Text style={styles.vitalValue}>
                        {formatBloodPressure()}
                      </Text>
                    </Surface>
                    <Surface style={styles.vitalItemCard} elevation={1}>
                      <MaterialCommunityIcons
                        name="percent"
                        size={22}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.vitalLabel}>SpO₂</Text>
                      <Text style={styles.vitalValue}>
                        {spo2.currentValue !== null
                          ? `${spo2.currentValue}${spo2.unit}`
                          : "N/A"}
                      </Text>
                    </Surface>
                  </View>

                  <View style={styles.vitalsRow}>
                    <Surface style={styles.vitalItemCard} elevation={1}>
                      <MaterialCommunityIcons
                        name="molecule-co2"
                        size={22}
                        color={theme.colors.secondary}
                      />
                      <Text style={styles.vitalLabel}>EtCO₂</Text>
                      <Text style={styles.vitalValue}>
                        {etco2.currentValue !== null
                          ? `${etco2.currentValue}${etco2.unit}`
                          : "N/A"}
                      </Text>
                    </Surface>
                    <Surface style={styles.vitalItemCard} elevation={1}>
                      <MaterialCommunityIcons
                        name="lungs"
                        size={22}
                        color={theme.colors.tertiary}
                      />
                      <Text style={styles.vitalLabel}>Częstość oddechów</Text>
                      <Text style={styles.vitalValue}>
                        {respiratoryRate.currentValue !== null
                          ? `${respiratoryRate.currentValue}${respiratoryRate.unit}`
                          : "N/A"}
                      </Text>
                    </Surface>
                  </View>
                </Surface>
              </>
            )}
            <View
              style={{ marginTop: 16, marginHorizontal: 8, marginBottom: 8 }}
            >
              <SocketConnectionStatus />
            </View>
          </ScrollView>
        )
      ) : (
        <View style={styles.center}>
          <MaterialCommunityIcons
            name="database-off"
            size={64}
            color={theme.colors.secondary}
          />
          <Text style={styles.noDataText}>Brak dostępnych danych sesji</Text>
          <Button
            mode="contained"
            onPress={handleRetry}
            icon="refresh"
            style={{ marginTop: 16 }}
          >
            Odśwież
          </Button>
        </View>
      )}
    </SafeAreaView>
  </BackgroundGradient>
);
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  fullscreenExitButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  mobileHeaderButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: "100%",
  },
  sessionInfo: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  sessionName: {
    fontSize: 16,
    marginTop: 8,
    fontStyle: "italic",
  },
  sessionMetaInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  metaItem: {
    fontSize: 14,
    marginVertical: 2,
    opacity: 0.8,
  },
  vitalsCard: {
    padding: Platform.select({
      default: 16,
      android: 12,
      ios: 12,
    }),
    margin: Platform.select({
      default: 8,
      android: 4,
      ios: 4,
    }),
    borderRadius: 8,
  },
  ekgCard: {
    padding: Platform.select({
      default: 16,
      android: 12,
      ios: 12,
    }),
    margin: Platform.select({
      default: 8,
      android: 4,
      ios: 4,
    }),
    borderRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: Platform.select({
      default: 18,
      android: 16,
      ios: 16,
    }),
    fontWeight: "bold",
    marginLeft: 8,
  },
  vitalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  vitalItemCard: {
    flex: 1,
    padding: Platform.select({
      default: 8,
      android: 6,
      ios: 6,
    }),
    margin: Platform.select({
      default: 4,
      android: 2,
      ios: 2,
    }),
    borderRadius: 8,
    alignItems: "center",
  },
  vitalLabel: {
    fontSize: Platform.select({
      default: 14,
      android: 12,
      ios: 12,
    }),
    opacity: 0.7,
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: Platform.select({
      default: 18,
      android: 16,
      ios: 16,
    }),
    fontWeight: "500",
  },
  fullscreenHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.12)",
  },
  fullscreenHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  fullscreenTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  fullscreenContent: {
    flex: 1,
    padding: 16,
  },
  ekgCardFullscreen: {
    flex: 1,
    marginBottom: 16,
    borderRadius: 8,
    padding: 16,
  },
  vitalsCardFullscreen: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
  },
  fullscreenVitalsGrid: {
    flex: 1,
    justifyContent: "space-between",
  },
  noDataText: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 16,
  },
  mobileSessionHeader: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerIcon: {
    marginRight: 8,
  },
  patientInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  patientInfoText: {
    marginLeft: 8,
    fontSize: 16,
  },
  divider: {
    marginVertical: 8,
  },
  metaItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  metaItemLabel: {
    marginLeft: 8,
    fontSize: 14,
    opacity: 0.8,
  },
  vitalUnit: {
    fontSize: 14,
    opacity: 0.7,
    marginLeft: 2,
  },
});

export default StudentSessionScreen;