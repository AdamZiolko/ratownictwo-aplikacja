import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Text,
  Button,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import {
  BleManager,
  Device,
  Subscription,
  BleError,
} from "react-native-ble-plx";
import { decode as atob } from "base-64";
import { Audio, AVPlaybackStatus } from "expo-av";
import colorConfigService, { ColorConfig } from "@/services/ColorConfigService";
import { socketService } from "@/services/SocketService";
import audioApiService from "@/services/AudioApiService";

// Stałe dla BLE
const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const CHARACTERISTIC_UUID = "abcd1234-5678-90ab-cdef-1234567890ab";
const DEVICE_NAME = "ESP32C3_RGB";

// Flaga globalna dla automatycznego ponownego połączenia
let GLOBAL_AUTO_RECONNECT_ENABLED = true;

// Progi dla wykrywania kolorów
const COLOR_RATIO_THRESHOLDS = {
  RED: 0.4,    // Próg dla czerwonego
  GREEN: 0.4,  // Próg dla zielonego
  BLUE: 0.4,   // Próg dla niebieskiego
  MIN_BRIGHTNESS: 5, // Minimalny próg jasności
};

// Kalibracja kolorów - dostosowana do równych wartości RGB
const COLOR_CALIBRATION = {
  RED_BOOST: 1.0,    // Bez wzmocnienia dla czerwonego
  GREEN_BOOST: 1.0,  // Zielony bez zmian
  BLUE_BOOST: 1.0,   // Niebieski bez zmian
  
  // Typowe wartości dla poszczególnych kolorów
  TYPICAL_RED: { r: 20, g: 5, b: 5 },
  TYPICAL_GREEN: { r: 5, g: 20, b: 5 },
  TYPICAL_BLUE: { r: 5, g: 5, b: 20 },
};

// Domyślne dźwięki dla kolorów
const DEFAULT_SOUND_FILES = {
  red: require("../assets/sounds/Adult/Male/Screaming.wav"),
  green: require("../assets/sounds/Adult/Female/Screaming.wav"),
  blue: require("../assets/sounds/Child/Screaming.wav"),
  yellow: require("../assets/sounds/Infant/Screaming.wav"),
  orange: require("../assets/sounds/Speech/Chesthurts.wav"),
  purple: require("../assets/sounds/Speech/Imfeelingverydizzy.wav"),
};

// Lista dostępnych dźwięków do wyboru
const AVAILABLE_SOUNDS = [
  // Dźwięki z folderu Adult/Male
  { id: "male_coughing", name: "Kaszel (M)", file: require("../assets/sounds/Adult/Male/Coughing.wav") },
  { id: "male_coughing_long", name: "Kaszel długi (M)", file: require("../assets/sounds/Adult/Male/Coughing(long).wav") },
  { id: "male_breathing", name: "Trudne oddychanie (M)", file: require("../assets/sounds/Adult/Male/Difficultbreathing.wav") },
  { id: "male_hawk", name: "Odchrząkiwanie (M)", file: require("../assets/sounds/Adult/Male/Hawk.wav") },
  { id: "male_moaning", name: "Jęk (M)", file: require("../assets/sounds/Adult/Male/Moaning.wav") },
  { id: "male_moaning_long", name: "Jęk długi (M)", file: require("../assets/sounds/Adult/Male/Moaning(long).wav") },
  { id: "male_no", name: "Nie (M)", file: require("../assets/sounds/Adult/Male/No.wav") },
  { id: "male_ok", name: "OK (M)", file: require("../assets/sounds/Adult/Male/Ok.wav") },
  { id: "male_screaming", name: "Krzyk (M)", file: require("../assets/sounds/Adult/Male/Screaming.wav") },
  { id: "male_screaming2", name: "Krzyk 2 (M)", file: require("../assets/sounds/Adult/Male/Screaming(type2).wav") },
  { id: "male_sobbing", name: "Szlochanie (M)", file: require("../assets/sounds/Adult/Male/Sobbreathing.wav") },
  { id: "male_vomiting", name: "Wymioty (M)", file: require("../assets/sounds/Adult/Male/Vomiting.wav") },
  { id: "male_vomiting2", name: "Wymioty 2 (M)", file: require("../assets/sounds/Adult/Male/Vomiting(type2).wav") },
  { id: "male_vomiting3", name: "Wymioty 3 (M)", file: require("../assets/sounds/Adult/Male/Vomiting(type3).wav") },
  { id: "male_yes", name: "Tak (M)", file: require("../assets/sounds/Adult/Male/Yes.wav") },
  
  // Dźwięki z folderu Adult/Female
  { id: "female_breathing", name: "Oddychanie w skurczach (K)", file: require("../assets/sounds/Adult/Female/Breathingthroughcontractions.wav") },
  { id: "female_coughing", name: "Kaszel (K)", file: require("../assets/sounds/Adult/Female/Coughing.wav") },
  { id: "female_distressed", name: "Niepokój (K)", file: require("../assets/sounds/Adult/Female/Distressed.wav") },
  { id: "female_hawk", name: "Odchrząkiwanie (K)", file: require("../assets/sounds/Adult/Female/Hawk.wav") },
  { id: "female_moaning", name: "Jęk (K)", file: require("../assets/sounds/Adult/Female/Moaning.wav") },
  { id: "female_no", name: "Nie (K)", file: require("../assets/sounds/Adult/Female/No.wav") },
  { id: "female_ok", name: "OK (K)", file: require("../assets/sounds/Adult/Female/Ok.wav") },
  { id: "female_pain", name: "Ból (K)", file: require("../assets/sounds/Adult/Female/Pain.wav") },
  { id: "female_pushing_long", name: "Parcie długie (K)", file: require("../assets/sounds/Adult/Female/Pushinglong.wav") },
  { id: "female_pushing_long_double", name: "Parcie długie podwójne (K)", file: require("../assets/sounds/Adult/Female/Pushinglongdouble.wav") },
  { id: "female_pushing_single", name: "Parcie pojedyncze (K)", file: require("../assets/sounds/Adult/Female/Pushingsingle.wav") },
  { id: "female_screaming", name: "Krzyk (K)", file: require("../assets/sounds/Adult/Female/Screaming.wav") },
  { id: "female_sobbing", name: "Szlochanie (K)", file: require("../assets/sounds/Adult/Female/Sobbreathing.wav") },
  { id: "female_sobbing2", name: "Szlochanie 2 (K)", file: require("../assets/sounds/Adult/Female/Sobbreathing(type2).wav") },
  { id: "female_vomiting", name: "Wymioty (K)", file: require("../assets/sounds/Adult/Female/Vomiting.wav") },
  { id: "female_yes", name: "Tak (K)", file: require("../assets/sounds/Adult/Female/Yes.wav") },
  
  // Dźwięki z folderu Child
  { id: "child_coughing", name: "Kaszel (Dziecko)", file: require("../assets/sounds/Child/Coughing.wav") },
  { id: "child_hawk", name: "Odchrząkiwanie (Dziecko)", file: require("../assets/sounds/Child/Hawk.wav") },
  { id: "child_moaning", name: "Jęk (Dziecko)", file: require("../assets/sounds/Child/Moaning.wav") },
  { id: "child_no", name: "Nie (Dziecko)", file: require("../assets/sounds/Child/No.wav") },
  { id: "child_ok", name: "OK (Dziecko)", file: require("../assets/sounds/Child/Ok.wav") },
  { id: "child_screaming", name: "Krzyk (Dziecko)", file: require("../assets/sounds/Child/Screaming.wav") },
  { id: "child_sobbing", name: "Szlochanie (Dziecko)", file: require("../assets/sounds/Child/Sobbreathing.wav") },
  { id: "child_vomiting", name: "Wymioty (Dziecko)", file: require("../assets/sounds/Child/Vomiting.wav") },
  { id: "child_vomiting2", name: "Wymioty 2 (Dziecko)", file: require("../assets/sounds/Child/Vomiting(type2).wav") },
  { id: "child_yes", name: "Tak (Dziecko)", file: require("../assets/sounds/Child/Yes.wav") },
  
  // Dźwięki z folderu Geriatric/Male
  { id: "geriatric_male_coughing", name: "Kaszel (Starszy M)", file: require("../assets/sounds/Geriatric/Male/Coughing.wav") },
  { id: "geriatric_male_moaning", name: "Jęk (Starszy M)", file: require("../assets/sounds/Geriatric/Male/Moaning.wav") },
  { id: "geriatric_male_no", name: "Nie (Starszy M)", file: require("../assets/sounds/Geriatric/Male/No.wav") },
  { id: "geriatric_male_screaming", name: "Krzyk (Starszy M)", file: require("../assets/sounds/Geriatric/Male/Screaming.wav") },
  { id: "geriatric_male_vomiting", name: "Wymioty (Starszy M)", file: require("../assets/sounds/Geriatric/Male/Vomiting.wav") },
  { id: "geriatric_male_yes", name: "Tak (Starszy M)", file: require("../assets/sounds/Geriatric/Male/Yes.wav") },
  
  // Dźwięki z folderu Geriatric/Female
  { id: "geriatric_female_coughing", name: "Kaszel (Starsza K)", file: require("../assets/sounds/Geriatric/Female/Coughing.wav") },
  { id: "geriatric_female_moaning", name: "Jęk (Starsza K)", file: require("../assets/sounds/Geriatric/Female/Moaning.wav") },
  { id: "geriatric_female_no", name: "Nie (Starsza K)", file: require("../assets/sounds/Geriatric/Female/No.wav") },
  { id: "geriatric_female_screaming", name: "Krzyk (Starsza K)", file: require("../assets/sounds/Geriatric/Female/Screaming.wav") },
  { id: "geriatric_female_vomiting", name: "Wymioty (Starsza K)", file: require("../assets/sounds/Geriatric/Female/Vomiting.wav") },
  { id: "geriatric_female_yes", name: "Tak (Starsza K)", file: require("../assets/sounds/Geriatric/Female/Yes.wav") },
  
  // Dźwięki z folderu Infant
  { id: "infant_content", name: "Spokojne (Niemowlę)", file: require("../assets/sounds/Infant/Content.wav") },
  { id: "infant_cough", name: "Kaszel (Niemowlę)", file: require("../assets/sounds/Infant/Cough.wav") },
  { id: "infant_grunt", name: "Chrząknięcie (Niemowlę)", file: require("../assets/sounds/Infant/Grunt.wav") },
  { id: "infant_hawk", name: "Odchrząkiwanie (Niemowlę)", file: require("../assets/sounds/Infant/Hawk.wav") },
  { id: "infant_hiccup", name: "Czkawka (Niemowlę)", file: require("../assets/sounds/Infant/Hiccup.wav") },
  { id: "infant_screaming", name: "Krzyk (Niemowlę)", file: require("../assets/sounds/Infant/Screaming.wav") },
  { id: "infant_strongcry", name: "Silny płacz (Niemowlę)", file: require("../assets/sounds/Infant/Strongcry.wav") },
  { id: "infant_strongcry2", name: "Silny płacz 2 (Niemowlę)", file: require("../assets/sounds/Infant/Strongcry(type2).wav") },
  { id: "infant_weakcry", name: "Słaby płacz (Niemowlę)", file: require("../assets/sounds/Infant/Weakcry.wav") },
  
  // Dźwięki z folderu Speech
  { id: "speech_chesthurts", name: "Ból w klatce", file: require("../assets/sounds/Speech/Chesthurts.wav") },
  { id: "speech_coulddie", name: "Czuję, że umieram", file: require("../assets/sounds/Speech/DocIfeelIcoulddie.wav") },
  { id: "speech_goaway", name: "Odejdź", file: require("../assets/sounds/Speech/Goaway.wav") },
  { id: "speech_notdizzy", name: "Nie mam zawrotów", file: require("../assets/sounds/Speech/Idontfeeldizzy.wav") },
  { id: "speech_idontfeelwell", name: "Złe samopoczucie", file: require("../assets/sounds/Speech/Idontfeelwell.wav") },
  { id: "speech_feelbetter", name: "Czuję się lepiej", file: require("../assets/sounds/Speech/Ifeelbetternow.wav") },
  { id: "speech_feelbad", name: "Czuję się źle", file: require("../assets/sounds/Speech/Ifeelreallybad.wav") },
  { id: "speech_dizzy", name: "Zawroty głowy", file: require("../assets/sounds/Speech/Imfeelingverydizzy.wav") },
  { id: "speech_fine", name: "Dobrze się czuję", file: require("../assets/sounds/Speech/Imfine.wav") },
  { id: "speech_nauseous", name: "Nudności", file: require("../assets/sounds/Speech/Imquitenauseous.wav") },
  { id: "speech_hungry", name: "Jestem głodny", file: require("../assets/sounds/Speech/Imreallyhungry.wav") },
  { id: "speech_thirsty", name: "Jestem spragniony", file: require("../assets/sounds/Speech/Imreallythirsty.wav") },
  { id: "speech_sick", name: "Jestem chory", file: require("../assets/sounds/Speech/Imsosick.wav") },
  { id: "speech_neverpain", name: "Nigdy taki ból", file: require("../assets/sounds/Speech/Neverhadpainlikethisbefore.wav") },
  { id: "speech_no", name: "Nie", file: require("../assets/sounds/Speech/No.wav") },
  { id: "speech_noallergies", name: "Brak alergii", file: require("../assets/sounds/Speech/Noallergies.wav") },
  { id: "speech_nodiabetes", name: "Brak cukrzycy", file: require("../assets/sounds/Speech/Nodiabetes.wav") },
  { id: "speech_nolungproblems", name: "Brak problemów z płucami", file: require("../assets/sounds/Speech/Nolungorcardiacproblems.wav") },
  { id: "speech_pain2hours", name: "Ból od 2 godzin", file: require("../assets/sounds/Speech/Painfor2hours.wav") },
  { id: "speech_pain", name: "Coś na ból", file: require("../assets/sounds/Speech/Somethingforthispain.wav") },
  { id: "speech_thankyou", name: "Dziękuję", file: require("../assets/sounds/Speech/Thankyou.wav") },
  { id: "speech_helped", name: "To pomogło", file: require("../assets/sounds/Speech/Thathelped.wav") },
  { id: "speech_yes", name: "Tak", file: require("../assets/sounds/Speech/Yes.wav") },
];

// Funkcja pomocnicza do porównywania plików dźwiękowych
const isSameSound = (file1: any, file2: any) => {
  return JSON.stringify(file1) === JSON.stringify(file2);
};

// Funkcja do wykrywania kolorów złożonych
const detectComplexColor = (color: { r: number; g: number; b: number }): string => {
  const { r, g, b } = color;
  const sum = r + g + b;
  
  // Zabezpieczenie przed dzieleniem przez zero
  if (sum === 0) return "none";
  
  // Oblicz proporcje kolorów
  const rRatio = r / sum;
  const gRatio = g / sum;
  const bRatio = b / sum;
  
  console.log("[COLOR] Analyzing color ratios - R:", rRatio.toFixed(2), "G:", gRatio.toFixed(2), "B:", bRatio.toFixed(2));
  console.log("[COLOR] Raw values - R:", r, "G:", g, "B:", b);
  
  // Dla równych wartości RGB (biały/szary), zwróć "none"
  const isAllEqual = Math.abs(rRatio - gRatio) < 0.05 && Math.abs(rRatio - bRatio) < 0.05 && Math.abs(gRatio - bRatio) < 0.05;
  if (isAllEqual) {
    console.log("[COLOR] All colors are equal, likely white/gray");
    
    // Losowo wybierz kolor, aby nie zawsze był ten sam
    const colors = ["red", "green", "blue"];
    const randomIndex = Math.floor(Math.random() * colors.length);
    console.log("[COLOR] Randomly selected:", colors[randomIndex]);
    return colors[randomIndex];
  }
  
  // Progi dla kolorów podstawowych
  const RED_THRESHOLD = 0.36;
  const GREEN_THRESHOLD = 0.36;
  const BLUE_THRESHOLD = 0.36;
  
  // Wykrywanie kolorów podstawowych z mniejszym progiem różnicy
  if (rRatio > RED_THRESHOLD && rRatio > gRatio * 1.1 && rRatio > bRatio * 1.1) {
    console.log("[COLOR] Detected RED based on ratio");
    return "red";
  }
  
  if (gRatio > GREEN_THRESHOLD && gRatio > rRatio * 1.1 && gRatio > bRatio * 1.1) {
    console.log("[COLOR] Detected GREEN based on ratio");
    return "green";
  }
  
  if (bRatio > BLUE_THRESHOLD && bRatio > rRatio * 1.1 && bRatio > gRatio * 1.1) {
    console.log("[COLOR] Detected BLUE based on ratio");
    return "blue";
  }
  
  // Wykrywanie kolorów złożonych
  
  // Żółty (czerwony + zielony)
  if (rRatio > 0.3 && gRatio > 0.3 && bRatio < 0.3 && Math.abs(rRatio - gRatio) < 0.15) {
    console.log("[COLOR] Detected YELLOW based on R+G combination");
    return "yellow";
  }
  
  // Pomarańczowy (dużo czerwonego, trochę zielonego)
  if (rRatio > 0.4 && gRatio > 0.2 && gRatio < 0.4 && bRatio < 0.3 && rRatio > gRatio * 1.1) {
    console.log("[COLOR] Detected ORANGE based on R>G combination");
    return "orange";
  }
  
  // Fioletowy (czerwony + niebieski)
  if (rRatio > 0.3 && bRatio > 0.3 && gRatio < 0.3 && Math.abs(rRatio - bRatio) < 0.15) {
    console.log("[COLOR] Detected PURPLE based on R+B combination");
    return "purple";
  }
  
  // Znajdź największą różnicę między kolorami
  const rDiff = Math.max(rRatio - gRatio, rRatio - bRatio);
  const gDiff = Math.max(gRatio - rRatio, gRatio - bRatio);
  const bDiff = Math.max(bRatio - rRatio, bRatio - gRatio);
  
  const maxDiff = Math.max(rDiff, gDiff, bDiff);
  
  // Jeśli jest wyraźna różnica, wybierz kolor z największą różnicą
  if (maxDiff > 0.05) {
    if (maxDiff === rDiff) {
      console.log("[COLOR] Selected RED based on maximum difference");
      return "red";
    }
    if (maxDiff === gDiff) {
      console.log("[COLOR] Selected GREEN based on maximum difference");
      return "green";
    }
    if (maxDiff === bDiff) {
      console.log("[COLOR] Selected BLUE based on maximum difference");
      return "blue";
    }
  }
  
  // Jeśli wszystkie wartości są zbliżone, wybierz najwyższą
  if (r > g && r > b) {
    console.log("[COLOR] Last resort fallback to RED based on highest value");
    return "red";
  }
  if (g > r && g > b) {
    console.log("[COLOR] Last resort fallback to GREEN based on highest value");
    return "green";
  }
  if (b > r && b > g) {
    console.log("[COLOR] Last resort fallback to BLUE based on highest value");
    return "blue";
  }
  
  // Jeśli wszystko zawiedzie, wybierz losowo
  const colors = ["red", "green", "blue"];
  const randomIndex = Math.floor(Math.random() * colors.length);
  console.log("[COLOR] Final random fallback:", colors[randomIndex]);  return colors[randomIndex];
};

interface ColorSensorProps {
  sessionId?: string | null;
}

export default function ColorSensor({ sessionId }: ColorSensorProps = {}) {
  // Stan BLE
  const [manager] = useState(() => new BleManager());
  const [bleState, setBleState] = useState<string>("Unknown");
  const [device, setDevice] = useState<Device | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [color, setColor] = useState({ r: 0, g: 0, b: 0 });
  
  // Stan konfiguracji kolorów
  const [colorConfigs, setColorConfigs] = useState<ColorConfig[]>([]);
  const [status, setStatus] = useState<
    "idle" | "scanning" | "connected" | "monitoring" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [autoReconnect, setAutoReconnect] = useState<boolean>(true);
  const [lastColorUpdate, setLastColorUpdate] = useState<number>(0);
  const colorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stan audio
  const [audioReady, setAudioReady] = useState(false);
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [showSoundMenu, setShowSoundMenu] = useState<boolean>(false);
  const [loopSound, setLoopSound] = useState<boolean>(true);
  const soundRefs = useRef<{ [key: string]: Audio.Sound | null }>({
    red: null,
    green: null,
    blue: null,
    yellow: null,
    orange: null,
    purple: null,
  });

  // Stan dla mapowania kolorów na dźwięki
  const [soundMappings, setSoundMappings] = useState({
    red: DEFAULT_SOUND_FILES.red,
    green: DEFAULT_SOUND_FILES.green,
    blue: DEFAULT_SOUND_FILES.blue,
    yellow: DEFAULT_SOUND_FILES.yellow,
    orange: DEFAULT_SOUND_FILES.orange,
    purple: DEFAULT_SOUND_FILES.purple,
  });

  // Inicjalizacja audio
  useEffect(() => {
    async function initAudio() {
      try {
        if (Platform.OS !== "web") {
          const { status } = await Audio.requestPermissionsAsync();
          if (status !== "granted") {
            console.warn(
              "[AUDIO] Brak uprawnień do odtwarzania audio – dźwięk może nie działać.",
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
  // Ładowanie konfiguracji kolorów z serwera
  useEffect(() => {
    if (!sessionId) return;

    async function loadColorConfigs() {
      try {
        const configs = await colorConfigService.getColorConfigs(sessionId!);
        setColorConfigs(configs);
        console.log("✅ Color configurations loaded:", configs);
      } catch (error) {
        console.error("❌ Error loading color configurations:", error);
      }
    }

    loadColorConfigs();    // Nasłuchiwanie na zmiany konfiguracji kolorów przez WebSocket
    const handleColorConfigListUpdate = (data: { sessionId: string; colorConfigs: ColorConfig[] }) => {
      console.log("� Color config list updated:", data);
      setColorConfigs(data.colorConfigs);
    };

    // Zarejestruj nasłuchiwanie WebSocket i zapisz funkcje cleanup
    const cleanupListUpdate = socketService.on('color-config-list-update', handleColorConfigListUpdate);    // Cleanup przy odmontowaniu
    return () => {
      cleanupListUpdate();
    };
  }, [sessionId]);

  // Ładowanie dźwięków
  useEffect(() => {
    if (!audioReady) return;

    async function loadSounds() {
      try {
        console.log("[AUDIO] Starting to load all sounds");
        
        // Wyczyść poprzednie dźwięki, jeśli istnieją
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
        
        // Załaduj wszystkie dźwięki równolegle
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
              // Spróbuj ponownie załadować dźwięk po krótkim opóźnieniu
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
      
      // Funkcja czyszcząca - wyładuj wszystkie dźwięki
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
      
      // Wyczyść aktualnie odtwarzany dźwięk
      setCurrentSound(null);
    };
  }, [audioReady, soundMappings]);

  // Monitorowanie stanu BLE
  useEffect(() => {
    const stateSub = manager.onStateChange((state) => {
      console.log("[BLE] State changed:", state);
      setBleState(state);
    }, true);
    return () => stateSub.remove();
  }, [manager]);

  // Monitorowanie flagi auto-reconnect
  useEffect(() => {
    console.log(`[BLE] React autoReconnect state changed to: ${autoReconnect}`);

    if (!autoReconnect) {
      GLOBAL_AUTO_RECONNECT_ENABLED = false;
      console.log(
        "[BLE] Global auto-reconnect flag disabled due to React state change",
      );

      try {
        manager.stopDeviceScan();
      } catch (e) {
        console.warn("[BLE] Error stopping device scan:", e);
      }

      setIsReconnecting(true);
      console.log(
        "[BLE] Setting reconnection flag to true to prevent auto-reconnect",
      );
    } else {
      GLOBAL_AUTO_RECONNECT_ENABLED = true;
      console.log(
        "[BLE] Global auto-reconnect flag enabled due to React state change",
      );
    }
  }, [autoReconnect]);

  // Czyszczenie przy odmontowaniu komponentu
  useEffect(() => {
    return () => {
      console.log("[BLE] Cleanup on unmount");
      
      // Wyczyść timer koloru
      if (colorTimeoutRef.current) {
        clearTimeout(colorTimeoutRef.current);
        colorTimeoutRef.current = null;
      }
      
      cleanupBleConnection();
    };
  }, []);

  // Funkcja do obliczania podobieństwa kolorów
  const calculateColorSimilarity = (color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number => {
    const sum1 = color1.r + color1.g + color1.b;
    const sum2 = color2.r + color2.g + color2.b;
    
    if (sum1 === 0 || sum2 === 0) return 0;
    
    const r1Ratio = color1.r / sum1;
    const g1Ratio = color1.g / sum1;
    const b1Ratio = color1.b / sum1;
    
    const r2Ratio = color2.r / sum2;
    const g2Ratio = color2.g / sum2;
    const b2Ratio = color2.b / sum2;
    
    // Oblicz odległość euklidesową między proporcjami kolorów
    const distance = Math.sqrt(
      Math.pow(r1Ratio - r2Ratio, 2) +
      Math.pow(g1Ratio - g2Ratio, 2) +
      Math.pow(b1Ratio - b2Ratio, 2)
    );
    
    // Przekształć odległość na podobieństwo (im mniejsza odległość, tym większe podobieństwo)
    return 1 / (1 + distance);
  };
    // Pomocnicza funkcja do odtwarzania dźwięku dla danego koloru
  const playSound = async (colorName: string) => {
    if (!audioReady) return;
    
    console.log(`[AUDIO] Attempting to play sound for ${colorName}`);
    
    // Znajdź konfigurację dla tego koloru
    const colorConfig = colorConfigs.find(config => 
      config.color.toLowerCase() === colorName.toLowerCase() && config.isEnabled
    );
    
    if (!colorConfig) {
      console.log(`[AUDIO] No configuration found for color ${colorName}, using default sound`);
      // Fallback do domyślnego dźwięku
      const defaultSoundFile = DEFAULT_SOUND_FILES[colorName as keyof typeof DEFAULT_SOUND_FILES];
      if (!defaultSoundFile) {
        console.log(`[AUDIO] No default sound available for color ${colorName}`);
        return;
      }
      await playLocalSound(colorName, defaultSoundFile, 1.0, loopSound);
      return;
    }
    
    console.log(`[AUDIO] Found configuration for ${colorName}:`, colorConfig);
    
    // Zatrzymaj aktualnie odtwarzany dźwięk, jeśli jest inny niż ten, który chcemy odtworzyć
    if (currentSound && currentSound !== colorName) {
      await stopCurrentSound();
    }
    
    try {      if (colorConfig.serverAudioId) {
        // Odtwarzaj dźwięk ze serwera
        console.log(`[AUDIO] Playing server audio for ${colorName}, serverAudioId: ${colorConfig.serverAudioId}`);
        await playServerSound(colorName, colorConfig.serverAudioId, colorConfig.volume, colorConfig.isLooping);
      } else if (colorConfig.soundName) {
        // Odtwarzaj lokalny dźwięk
        console.log(`[AUDIO] Playing local sound for ${colorName}, soundName: ${colorConfig.soundName}`);
        const localSoundFile = getLocalSoundFile(colorConfig.soundName);
        if (localSoundFile) {
          await playLocalSound(colorName, localSoundFile, colorConfig.volume, colorConfig.isLooping);
        } else {
          console.error(`[AUDIO] Local sound file not found for soundName: ${colorConfig.soundName}`);
        }
      } else {
        console.error(`[AUDIO] Invalid configuration for ${colorName}: no soundName or serverAudioId`);
      }
    } catch (error) {
      console.error(`[AUDIO] Error playing configured sound for ${colorName}:`, error);
    }
  };

  // Funkcja do odtwarzania lokalnego dźwięku
  const playLocalSound = async (colorName: string, soundFile: any, volume: number, loop: boolean) => {
    let sound = soundRefs.current[colorName];
    
    try {
      // Sprawdź, czy dźwięk jest już załadowany i odtwarzany
      if (sound) {
        const status = await sound.getStatusAsync().catch(() => ({ } as AVPlaybackStatus));
        
        // Sprawdź, czy status to AVPlaybackStatusSuccess (zawiera isLoaded)
        if ('isLoaded' in status && status.isLoaded) {
          const isPlaying = status.isPlaying;
          
          // Jeśli dźwięk jest już odtwarzany, nie rób nic
          if (isPlaying) {
            console.log(`[AUDIO] Local sound for ${colorName} is already playing`);
            if (currentSound !== colorName) setCurrentSound(colorName);
            return;
          }
          
          // Jeśli dźwięk jest załadowany, ale nie jest odtwarzany, odtwórz go
          console.log(`[AUDIO] Local sound for ${colorName} is loaded but not playing, starting playback`);
          await sound.setStatusAsync({ 
            isLooping: loop,
            shouldPlay: true,
            positionMillis: 0,
            volume: volume
          });
          await sound.playAsync();
          setCurrentSound(colorName);
          return;
        }
      }
      
      // Jeśli dźwięk nie istnieje lub nie jest załadowany, utwórz nowy
      console.log(`[AUDIO] Creating new local sound for ${colorName}`);
      sound = new Audio.Sound();
      await sound.loadAsync(soundFile);
      
      // Ustaw parametry odtwarzania
      await sound.setStatusAsync({ 
        isLooping: loop,
        shouldPlay: true,
        positionMillis: 0,
        volume: volume
      });
      
      // Dodaj nasłuchiwanie na zakończenie odtwarzania
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish && !loop) {
          console.log(`[AUDIO] Local sound for ${colorName} finished playing`);
          setCurrentSound(null);
        }
      });
      
      // Odtwórz dźwięk
      await sound.playAsync();
      soundRefs.current[colorName] = sound;
      setCurrentSound(colorName);
      
    } catch (error) {
      console.error(`[AUDIO] Error playing local sound for ${colorName}:`, error);
      
      // W przypadku błędu, spróbuj utworzyć nowy obiekt dźwięku
      try {
        if (sound) {
          await sound.stopAsync().catch(() => {});
          await sound.unloadAsync().catch(() => {});
        }
        
        const newSound = new Audio.Sound();
        await newSound.loadAsync(soundFile);
        await newSound.setStatusAsync({ isLooping: loop, shouldPlay: true, volume: volume });
        await newSound.playAsync();
        
        soundRefs.current[colorName] = newSound;
        setCurrentSound(colorName);
      } catch (retryError) {
        console.error(`[AUDIO] Failed to reload local sound for ${colorName}:`, retryError);
      }
    }
  };
  // Funkcja do odtwarzania dźwięku ze serwera
  const playServerSound = async (colorName: string, serverAudioId: string, volume: number, loop: boolean) => {
    try {
      console.log(`[AUDIO] Starting server audio playback for ${colorName}, serverAudioId: ${serverAudioId}`);
      
      // Jeśli już odtwarzamy ten sam dźwięk serwera, nie uruchamiaj ponownie
      if (currentSound === colorName) {
        console.log(`[AUDIO] Server sound for ${colorName} is already playing`);
        return;
      }
      
      // Pobierz strumień audio ze serwera
      const response = await audioApiService.streamAudio(serverAudioId);
      
      if (!response.ok) {
        throw new Error(`Failed to stream audio: ${response.status} ${response.statusText}`);
      }
      
      // Konwertuj response na blob
      const audioBlob = await response.blob();
      
      // Utwórz URL do blob'a
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Utwórz nowy obiekt Audio.Sound
      const sound = new Audio.Sound();
      
      // Załaduj dźwięk z URL
      await sound.loadAsync({ uri: audioUrl });
      
      // Ustaw parametry odtwarzania
      await sound.setStatusAsync({ 
        isLooping: loop,
        shouldPlay: true,
        positionMillis: 0,
        volume: volume
      });
      
      // Dodaj nasłuchiwanie na zakończenie odtwarzania
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish && !loop) {
          console.log(`[AUDIO] Server sound for ${colorName} finished playing`);
          setCurrentSound(null);
          // Zwolnij URL blob'a
          URL.revokeObjectURL(audioUrl);
        }
      });
      
      // Odtwórz dźwięk
      await sound.playAsync();
      
      // Zapisz referencję do dźwięku
      soundRefs.current[colorName] = sound;
      setCurrentSound(colorName);
      
      console.log(`✅ Server audio started for ${colorName}`);
      
    } catch (error) {
      console.error(`[AUDIO] Error playing server sound for ${colorName}:`, error);
    }
  };

  // Funkcja pomocnicza do znajdowania lokalnego pliku dźwiękowego na podstawie nazwy
  const getLocalSoundFile = (soundName: string) => {
    const sound = AVAILABLE_SOUNDS.find(s => s.id === soundName || s.name === soundName);
    return sound ? sound.file : null;
  };

  // Funkcja do odtwarzania dźwięku na podstawie wykrytego koloru
  const playColorSound = async (color: { r: number; g: number; b: number }) => {
    if (!audioReady) return;

    // Określ dominujący kolor na podstawie odczytów RGB
    const sumRGB = color.r + color.g + color.b;
    
    // Zabezpieczenie przed dzieleniem przez zero lub zbyt niską jasnością
    if (sumRGB === 0 || sumRGB <= COLOR_RATIO_THRESHOLDS.MIN_BRIGHTNESS) {
      console.log("[AUDIO] Insufficient brightness, stopping sound");
      await stopCurrentSound();
      return;
    }
    
    // Wyświetl informacje diagnostyczne
    console.log("[AUDIO] RGB values for sound:", color.r, color.g, color.b, "Sum:", sumRGB);
    
    // Sprawdź, czy wszystkie wartości są równe (biały/szary)
    const isAllEqual = Math.abs(color.r - color.g) < 10 && Math.abs(color.r - color.b) < 10 && Math.abs(color.g - color.b) < 10;
    
    if (isAllEqual && color.r > 900 && color.g > 900 && color.b > 900) {
      console.log("[AUDIO] Detected white/gray color with high values, using random color selection");
      
      // Jeśli już odtwarzamy dźwięk, nie zmieniaj go
      if (currentSound) {
        console.log(`[AUDIO] Already playing sound for ${currentSound}, continuing`);
        return;
      }
      
      // Losowo wybierz kolor, aby nie zawsze był ten sam
      const colors = ["red", "green", "blue", "yellow", "orange", "purple"];
      const randomIndex = Math.floor(Math.random() * colors.length);
      const randomColor = colors[randomIndex];
      
      console.log(`[AUDIO] Randomly selected color: ${randomColor}`);
      await playSound(randomColor);
      return;
    }
    
    // Zastosuj kalibrację kolorów, aby poprawić rozpoznawanie
    const calibratedColor = {
      r: Math.round(color.r * COLOR_CALIBRATION.RED_BOOST),
      g: Math.round(color.g * COLOR_CALIBRATION.GREEN_BOOST),
      b: Math.round(color.b * COLOR_CALIBRATION.BLUE_BOOST)
    };
    
    console.log("[AUDIO] Calibrated RGB values:", calibratedColor.r, calibratedColor.g, calibratedColor.b);
    
    // Określ dominujący kolor z ulepszoną logiką rozpoznawania
    let dominantColor = detectComplexColor(calibratedColor);
    console.log(`[AUDIO] Detected color: ${dominantColor}`);
    
    // Aktualizuj czas ostatniego odczytu koloru
    setLastColorUpdate(Date.now());
    
    // Jeśli nie wykryto żadnego dominującego koloru, zatrzymaj aktualnie odtwarzany dźwięk
    if (dominantColor === "none") {
      console.log("[AUDIO] No dominant color detected, stopping any playing sound");
      await stopCurrentSound();
      return;
    }
    
    // Odtwórz dźwięk dla wykrytego koloru
    await playSound(dominantColor);
  };

  // Pomocnicza funkcja do zatrzymywania aktualnie odtwarzanego dźwięku  const stopCurrentSound = async () => {  // Funkcja do zatrzymywania aktualnie odtwarzanego dźwięku
  const stopCurrentSound = async () => {
    if (!currentSound || !soundRefs.current[currentSound]) return;
    
    try {
      console.log(`[AUDIO] Stopping sound for ${currentSound}`);
      
      const sound = soundRefs.current[currentSound];
      
      // Sprawdź, czy dźwięk jest załadowany
      const status = await sound.getStatusAsync().catch(() => ({ } as AVPlaybackStatus));
      
      // Sprawdź, czy status to AVPlaybackStatusSuccess (zawiera isLoaded)
      if ('isLoaded' in status && status.isLoaded) {
        // Najpierw wyłącz pętlę i zatrzymaj odtwarzanie
        await sound.setStatusAsync({ 
          isLooping: false,
          shouldPlay: false,
          positionMillis: 0  // Resetuj pozycję
        }).catch(() => {});
        
        // Zatrzymaj dźwięk
        await sound.stopAsync().catch(() => {});
        
        console.log(`[AUDIO] Successfully stopped sound for ${currentSound}`);
      } else {
        console.log(`[AUDIO] Sound for ${currentSound} is not loaded, no need to stop`);
      }
      
      // Wyczyść referencję do aktualnie odtwarzanego dźwięku
      setCurrentSound(null);
      
    } catch (error) {
      console.error(`[AUDIO] Error stopping sound for ${currentSound}:`, error);
      
      // Wyczyść referencję do aktualnie odtwarzanego dźwięku
      setCurrentSound(null);
    }
  };

  // Funkcja do czyszczenia połączenia BLE
  const cleanupBleConnection = async () => {
    console.log("[BLE] Cleaning up BLE connection");

    try {
      // Wyczyść timer koloru
      if (colorTimeoutRef.current) {
        clearTimeout(colorTimeoutRef.current);
        colorTimeoutRef.current = null;
      }
      
      // Zatrzymaj skanowanie
      try {
        console.log("[BLE] Stopping device scan...");
        manager.stopDeviceScan();
      } catch (e) {
        console.warn("[BLE] Error stopping device scan:", e);
      }

      // Usuń subskrypcję
      if (sub) {
        try {
          console.log("[BLE] Removing subscription...");
          sub.remove();
        } catch (e) {
          console.warn("[BLE] Error removing subscription:", e);
        }
        setSub(null);
      }

      // Zatrzymaj dźwięk
      if (currentSound && soundRefs.current[currentSound]) {
        try {
          console.log("[BLE] Stopping current sound...");
          await soundRefs.current[currentSound]?.stopAsync();
          setCurrentSound(null);
        } catch (e) {
          console.warn("[BLE] Error stopping sound:", e);
        }
      }

      // Rozłącz urządzenie
      if (device) {
        try {
          console.log(`[BLE] Checking if device ${device.id} is connected...`);
          const isConnected = await manager
            .isDeviceConnected(device.id)
            .catch((e) => {
              console.warn("[BLE] Error checking device connection:", e);
              return false;
            });
            
          if (isConnected) {
            console.log(`[BLE] Cancelling connection to device ${device.id}...`);
            await manager.cancelDeviceConnection(device.id)
              .catch(e => console.warn("[BLE] Error cancelling device connection:", e));
            console.log(`[BLE] Successfully disconnected from device ${device.id}`);
          } else {
            console.log(`[BLE] Device ${device.id} is already disconnected`);
          }
        } catch (e) {
          console.error("[BLE] Error during device disconnection:", e);
        }
        setDevice(null);
      }
      
      // Resetuj stan
      setColor({ r: 0, g: 0, b: 0 });
      
      console.log("[BLE] Connection cleanup completed successfully");
    } catch (error) {
      console.error("[BLE] Error during cleanup:", error);
    }
  };

  // Funkcja do żądania uprawnień BLE
  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      const perms = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
      if (Platform.Version >= 31) {
        perms.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        );
      }
      const granted = await PermissionsAndroid.requestMultiple(perms);
      const allGranted = perms.every(
        (p) => granted[p] === PermissionsAndroid.RESULTS.GRANTED,
      );
      if (!allGranted) throw new Error("Brak wymaganych uprawnień BLE");
    }
  };

  // Funkcja do skanowania i monitorowania urządzeń BLE
  const scanAndMonitor = async () => {
    console.log(
      "[BLE] scanAndMonitor called, global autoReconnect:",
      GLOBAL_AUTO_RECONNECT_ENABLED,
      "React autoReconnect:",
      autoReconnect,
    );

    // Sprawdź, czy już trwa próba ponownego połączenia
    if (isReconnecting) {
      console.log("[BLE] Reconnection already in progress, skipping");
      return;
    }

    // Ustaw flagi ponownego połączenia
    GLOBAL_AUTO_RECONNECT_ENABLED = true;
    if (!autoReconnect) setAutoReconnect(true);

    // Ustaw stan ponownego łączenia
    setIsReconnecting(true);

    try {
      // Najpierw wyczyść poprzednie połączenie
      console.log("[BLE] Cleaning up previous connection...");
      await cleanupBleConnection();

      // Resetuj stan błędu i ustaw status na skanowanie
      setError(null);
      setStatus("scanning");

      // Poproś o uprawnienia
      console.log("[BLE] Requesting permissions...");
      await requestPermissions();

      console.log("[BLE] Starting scan for devices...");

      // Rozpocznij skanowanie urządzeń
      manager.startDeviceScan(null, { allowDuplicates: false }, (error, dev) => {
        if (error) {
          console.error("[BLE] Scan error:", error);
          setError(error.message);
          setStatus("error");

          try {
            console.log("[BLE] Stopping device scan due to error...");
            manager.stopDeviceScan();
          } catch (e) {
            console.warn("[BLE] Error stopping device scan:", e);
          }

          // Spróbuj ponownie po opóźnieniu
          setTimeout(() => {
            if (autoReconnect) {
              console.log("[BLE] Attempting to scan again after error...");
              setStatus("idle");
              setIsReconnecting(false); // Resetuj flagę, aby umożliwić ponowne połączenie
              scanAndMonitor();
            }
          }, 5000);

          return;
        }
        
        // Sprawdź, czy urządzenie zostało znalezione
        if (!dev) {
          console.log("[BLE] No device found in scan callback");
          return;
        }

        // Sprawdź, czy to nasze urządzenie
        const nameMatches =
          dev.name === DEVICE_NAME || dev.localName === DEVICE_NAME;
        const hasService = dev.serviceUUIDs?.includes(SERVICE_UUID);

        if (nameMatches || hasService) {
          console.log(`[BLE] Found matching device: ${dev.name || dev.localName || 'unnamed'} (${dev.id})`);
          
          // Zatrzymaj skanowanie po znalezieniu urządzenia
          try {
            console.log("[BLE] Stopping device scan after finding target device...");
            manager.stopDeviceScan();
          } catch (e) {
            console.warn("[BLE] Error stopping device scan:", e);
          }

          // Funkcja do łączenia z urządzeniem z ponowną próbą
          const connectWithRetry = async (device: Device, maxRetries = 3) => {
            for (let retries = 0; retries < maxRetries; retries++) {
              try {
                console.log(
                  `[BLE] Connecting to device, attempt ${retries + 1}/${maxRetries}...`,
                );

                // Sprawdź, czy urządzenie jest już połączone
                const isConnected = await manager
                  .isDeviceConnected(device.id)
                  .catch(() => false);

                if (isConnected) {
                  console.log(`[BLE] Device ${device.id} is already connected`);
                  return device;
                } else {
                  // Połącz z urządzeniem
                  const connectedDevice = await manager.connectToDevice(
                    device.id,
                  );
                  console.log(
                    `[BLE] Connection successful on attempt ${retries + 1}`,
                  );
                  return connectedDevice;
                }
              } catch (e) {
                console.error(`[BLE] Connection error`, e);

                if (retries < maxRetries - 1) {
                  // Poczekaj przed kolejną próbą
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                }
              }
            }

            throw new Error(`Failed to connect after ${maxRetries} attempts`);
          };

          // Połącz z urządzeniem
          connectWithRetry(dev)
            .then((d) => {
              console.log("[BLE] Successfully connected to device");
              setDevice(d);
              setStatus("connected");

              // Obsługa rozłączenia urządzenia
              const disconnectHandler = (
                error: BleError | null,
                disconnectedDevice: Device,
              ) => {
                console.log(
                  `Device ${disconnectedDevice.id} was disconnected`,
                  error,
                );

                // Sprawdź, czy to nasze urządzenie
                if (disconnectedDevice.id === d.id) {
                  setStatus("idle");
                  setDevice(null);

                  if (sub) {
                    try {
                      sub.remove();
                    } catch (e) {}
                    setSub(null);
                  }

                  // Automatyczne ponowne połączenie, jeśli włączone
                  if (GLOBAL_AUTO_RECONNECT_ENABLED) {
                    console.log(
                      "[BLE] Global auto-reconnect flag is enabled, scheduling reconnect",
                    );

                    setTimeout(() => {
                      if (GLOBAL_AUTO_RECONNECT_ENABLED && !isReconnecting) {
                        console.log(
                          "[BLE] Global auto-reconnect flag is still enabled, attempting to reconnect...",
                        );
                        setIsReconnecting(false); // Resetuj flagę, aby umożliwić ponowne połączenie
                        scanAndMonitor();
                      }
                    }, 2000);
                  }
                }
              };

              // Nasłuchuj na rozłączenie urządzenia
              d.onDisconnected(disconnectHandler);

              // Odkryj usługi i charakterystyki
              return d.discoverAllServicesAndCharacteristics();
            })
            .then((d) => {
              if (!d) return;
              console.log("[BLE] Discovered services, start monitoring");

              // Monitoruj charakterystykę
              const subscription = d.monitorCharacteristicForService(
                SERVICE_UUID,
                CHARACTERISTIC_UUID,
                async (error, characteristic) => {
                  if (error) {
                    console.error("[BLE] Monitor error", error);
                    return;
                  }
                  if (!characteristic?.value) return;

                  try {
                    // Dekoduj dane z base64
                    const rawData = atob(characteristic.value);
                    
                    // Wypisz surowe dane do debugowania
                    console.log("[BLE] Raw data length:", rawData.length);
                    
                    // Parsuj dane RGB (format: 2 bajty na kolor, big-endian)
                    if (rawData.length >= 6) {
                      const r = (rawData.charCodeAt(0) << 8) + rawData.charCodeAt(1);
                      const g = (rawData.charCodeAt(2) << 8) + rawData.charCodeAt(3);
                      const b = (rawData.charCodeAt(4) << 8) + rawData.charCodeAt(5);
                      
                      const newColor = { r, g, b };
                      console.log("[BLE] Parsed RGB:", newColor);
                      
                      // Aktualizuj stan koloru
                      setColor(newColor);
                      setLastColorUpdate(Date.now());
                      
                      // Ustaw timer do resetowania koloru, jeśli nie otrzymamy nowych danych
                      if (colorTimeoutRef.current) {
                        clearTimeout(colorTimeoutRef.current);
                      }
                      
                      colorTimeoutRef.current = setTimeout(async () => {
                        if (Date.now() - lastColorUpdate > 1000) {
                          await stopCurrentSound();
                          setColor({ r: 0, g: 0, b: 0 });
                        }
                      }, 1000);
                      
                      // Odtwórz dźwięk dla wykrytego koloru
                      await playColorSound(newColor);
                    }
                  } catch (error) {
                    console.error(
                      "[BLE] Error processing characteristic data:",
                      error,
                    );
                  }
                },
              );

              setSub(subscription);
              setStatus("monitoring");
            })
            .catch((e) => {
              console.error("[BLE] Error during connection or monitoring", e);
              setError(e.message);
              setStatus("error");

              // Spróbuj ponownie po opóźnieniu
              if (autoReconnect) {
                setTimeout(() => {
                  if (autoReconnect && !isReconnecting) {
                    console.log("[BLE] Attempting to reconnect after error...");
                    setStatus("idle");
                    setIsReconnecting(false); // Resetuj flagę, aby umożliwić ponowne połączenie
                    scanAndMonitor();
                  }
                }, 3000);
              }
            });
        }
      });
    } catch (e) {
      console.error("[BLE] Fatal error", e);
      setError((e as Error).message);
      setStatus("error");
    } finally {
      // Resetuj flagę ponownego łączenia po opóźnieniu
      setTimeout(() => {
        if (GLOBAL_AUTO_RECONNECT_ENABLED) {
          console.log("[BLE] Resetting reconnection flag after timeout");
          setIsReconnecting(false);
        }
      }, 2000);
    }
  };

  // Funkcja do rozłączania urządzenia
  const disconnectDevice = async () => {
    try {
      // Wyłącz automatyczne ponowne połączenie
      GLOBAL_AUTO_RECONNECT_ENABLED = false;
      setAutoReconnect(false);
      setIsReconnecting(true);

      // Zatrzymaj skanowanie
      try {
        console.log("[BLE] Stopping device scan...");
        manager.stopDeviceScan();
      } catch (e) {
        console.warn("[BLE] Error stopping device scan:", e);
      }

      // Usuń subskrypcję
      if (sub) {
        try {
          console.log("[BLE] Removing subscription...");
          sub.remove();
        } catch (e) {
          console.warn("[BLE] Error removing subscription:", e);
        }
        setSub(null);
      }

      // Zatrzymaj dźwięk
      if (currentSound && soundRefs.current[currentSound]) {
        try {
          console.log("[BLE] Stopping current sound...");
          await soundRefs.current[currentSound]?.stopAsync();
          setCurrentSound(null);
        } catch (e) {
          console.warn("[BLE] Error stopping sound:", e);
        }
      }

      // Rozłącz urządzenie
      if (device) {
        try {
          console.log(`[BLE] Checking if device ${device.id} is connected...`);
          const isConnected = await manager
            .isDeviceConnected(device.id)
            .catch(() => false);
          if (isConnected) {
            await manager.cancelDeviceConnection(device.id);
            console.log(
              `[BLE] Successfully disconnected from device ${device.id}`,
            );
          }
        } catch (e) {
          console.error("[BLE] Error during device disconnection:", e);
        }
        setDevice(null);
      }

      // Resetuj stan
      setStatus("idle");
      setError(null);

      console.log("[BLE] Manual disconnect complete");
      
      // Resetuj flagę ponownego łączenia po opóźnieniu
      setTimeout(() => {
        setIsReconnecting(false);
      }, 2000);
    } catch (error) {
      console.error("[BLE] Error during manual disconnect:", error);
      setStatus("idle");
      setError(null);
      GLOBAL_AUTO_RECONNECT_ENABLED = false;
      setAutoReconnect(false);
      setIsReconnecting(false);
    }
  };

  // Funkcja do renderowania menu konfiguracji dźwięków
  const renderSoundConfigMenu = () => {
    if (!showSoundMenu) return null;
    
    const colorNames = {
      red: "Czerwony",
      green: "Zielony",
      blue: "Niebieski",
      yellow: "Żółty",
      orange: "Pomarańczowy",
      purple: "Fioletowy"
    };
    
    // Grupowanie dźwięków według kategorii
    const soundCategories = {
      "Dorosły (M)": AVAILABLE_SOUNDS.filter(s => s.id.startsWith("male_")),
      "Dorosły (K)": AVAILABLE_SOUNDS.filter(s => s.id.startsWith("female_")),
      "Starszy (M)": AVAILABLE_SOUNDS.filter(s => s.id.startsWith("geriatric_male_")),
      "Starsza (K)": AVAILABLE_SOUNDS.filter(s => s.id.startsWith("geriatric_female_")),
      "Dziecko": AVAILABLE_SOUNDS.filter(s => s.id.startsWith("child_")),
      "Niemowlę": AVAILABLE_SOUNDS.filter(s => s.id.startsWith("infant_")),
      "Mowa": AVAILABLE_SOUNDS.filter(s => s.id.startsWith("speech_"))
    };
    
    // Funkcja do odtwarzania podglądu dźwięku
    const previewSound = async (soundFile: any) => {
      try {
        // Zatrzymaj aktualnie odtwarzany dźwięk
        if (currentSound && soundRefs.current[currentSound]) {
          await soundRefs.current[currentSound]?.stopAsync().catch(() => {});
        }
        
        const sound = new Audio.Sound();
        await sound.loadAsync(soundFile);
        await sound.playAsync();
        
        // Automatycznie wyładuj dźwięk po zakończeniu odtwarzania
        sound.setOnPlaybackStatusUpdate((status) => {
          if ('didJustFinish' in status && status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
          }
        });
      } catch (error) {
        console.error("[AUDIO] Error previewing sound:", error);
      }
    };
    
    // Funkcja do przypisania dźwięku do koloru
    const assignSoundToColor = (color: string, soundFile: any) => {
      console.log(`[AUDIO] Assigning sound to color ${color}`);
      
      // Zatrzymaj aktualnie odtwarzany dźwięk dla tego koloru, jeśli istnieje
      const sound = soundRefs.current[color];
      if (sound) {
        sound.stopAsync().catch(() => {})
          .finally(() => sound.unloadAsync().catch(() => {}));
        soundRefs.current[color] = null;
      }
      
      // Aktualizuj mapowanie dźwięków
      setSoundMappings(prev => {
        const newMappings = {
          ...prev,
          [color]: soundFile
        };
        console.log(`[AUDIO] Updated sound mappings for ${color}`);
        return newMappings;
      });
      
      // Jeśli aktualnie odtwarzany dźwięk jest dla tego koloru, zatrzymaj go
      if (currentSound === color) {
        setCurrentSound(null);
      }
    };
    
    // Znajdź nazwę dźwięku na podstawie pliku
    const getSoundNameByFile = (file: any) => {
      const sound = AVAILABLE_SOUNDS.find(s => isSameSound(s.file, file));
      return sound ? sound.name : "Nieznany";
    };
    
    // Używamy globalnej funkcji isSameSound zdefiniowanej na początku pliku
    
    return (
      <ScrollView 
        style={styles.soundConfigMenu}
        contentContainerStyle={{ paddingBottom: 20 }} // Dodajemy padding na dole
        showsVerticalScrollIndicator={true} // Pokazujemy wskaźnik przewijania pionowego
      >
        <Text style={styles.soundConfigTitle}>Konfiguracja dźwięków</Text>
        
        <View style={styles.loopSoundContainer}>
          <Text>Odtwarzaj dźwięk w pętli:</Text>
          <Switch
            value={loopSound}
            onValueChange={setLoopSound}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={loopSound ? "#007AFF" : "#f4f3f4"}
          />
        </View>
        
        {Object.entries(colorNames).map(([colorKey, colorName]) => (
          <View key={colorKey} style={styles.soundConfigItem}>
            <View style={styles.colorHeader}>
              <View style={[styles.colorSample, { backgroundColor: colorKey }]} />
              <Text style={styles.soundConfigColorName}>{colorName}</Text>
              <Text style={styles.currentSoundName}>
                Aktualny: {getSoundNameByFile(soundMappings[colorKey as keyof typeof soundMappings])}
              </Text>
              <TouchableOpacity
                style={styles.previewButton}
                onPress={() => previewSound(soundMappings[colorKey as keyof typeof soundMappings])}
              >
                <Text style={styles.previewButtonText}>▶</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.soundCategoriesContainer}>
              {Object.entries(soundCategories).map(([category, sounds]) => (
                <View key={category} style={styles.soundCategory}>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={true} 
                    contentContainerStyle={{ paddingBottom: 15 }} // Dodajemy padding na dole kontenera
                  >
                    <View style={styles.soundOptionsRow}>
                      {sounds.map(sound => (
                        <TouchableOpacity
                          key={sound.id}
                          style={[
                            styles.soundOption,
                            isSameSound(soundMappings[colorKey as keyof typeof soundMappings], sound.file) && 
                            styles.selectedSoundOption
                          ]}
                          onPress={() => assignSoundToColor(colorKey, sound.file)}
                        >
                          <Text 
                            style={[
                              styles.soundOptionText,
                              isSameSound(soundMappings[colorKey as keyof typeof soundMappings], sound.file) && 
                              styles.selectedSoundOptionText
                            ]}
                            numberOfLines={2} // Ograniczamy do 2 linii
                            ellipsizeMode="tail" // Dodajemy wielokropek na końcu
                          >
                            {sound.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              ))}
            </View>
          </View>
        ))}
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowSoundMenu(false)}
        >
          <Text style={styles.closeButtonText}>Zamknij</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <Text>Status BLE: {bleState}</Text>
        <Text>Status: {status}</Text>

        {/* Przycisk konfiguracji dźwięków - dostępny zawsze */}
        <View style={styles.configButtonContainer}>
          <Button
            title={showSoundMenu ? "Ukryj konfigurację dźwięków" : "Konfiguruj dźwięki"}
            onPress={() => setShowSoundMenu(!showSoundMenu)}
            color="#007AFF"
          />
        </View>

        {/* Menu konfiguracji dźwięków */}
        {renderSoundConfigMenu()}

      {status === "idle" && (
        <View style={styles.connectButtonContainer}>
          <Button
            title="Skanuj i połącz"
            onPress={() => {
              GLOBAL_AUTO_RECONNECT_ENABLED = true;
              setAutoReconnect(true);
              setIsReconnecting(false);
              setError(null);
              scanAndMonitor();
            }}
          />
        </View>
      )}

      {status === "scanning" && !isReconnecting && (
        <View>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Skanowanie i łączenie...</Text>
        </View>
      )}

      {status === "monitoring" && (
        <View>
          <Text style={styles.statusOk}>Połączono z czujnikiem</Text>
          <View
            style={[
              styles.colorBox,
              {
                backgroundColor: `rgb(${Math.min(255, Math.floor(color.r / 100))}, ${Math.min(255, Math.floor(color.g / 100))}, ${Math.min(255, Math.floor(color.b / 100))})`,
              },
            ]}
          />
          <Text>
            R: {color.r}, G: {color.g}, B: {color.b}
          </Text>

          {currentSound && (
            <Text style={styles.soundInfo}>
              Odtwarzany dźwięk:{" "}
              {currentSound === "red"
                ? "Czerwony"
                : currentSound === "green"
                  ? "Zielony"
                  : currentSound === "blue"
                    ? "Niebieski"
                    : currentSound === "yellow"
                      ? "Żółty"
                      : currentSound === "orange"
                        ? "Pomarańczowy"
                        : currentSound === "purple"
                          ? "Fioletowy"
                          : "Nieznany"}
            </Text>
          )}

          <View style={styles.disconnectButton}>
            <Button
              title="Rozłącz"
              onPress={disconnectDevice}
              color="#ff3b30"
            />
          </View>
        </View>
      )}

      {error && !isReconnecting && (
        <Text style={styles.error}>Błąd: {error}</Text>
      )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    alignItems: "center", 
    marginVertical: 16,
    padding: 16,
    flex: 1, // Dodajemy flex: 1, aby kontener zajmował całą dostępną przestrzeń
    width: '100%', // Zapewniamy, że kontener zajmuje całą szerokość
  },
  colorBox: {
    width: 100,
    height: 100,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#000",
  },
  error: { 
    color: "red", 
    marginTop: 8 
  },
  soundInfo: { 
    fontSize: 16, 
    marginVertical: 4, 
    fontWeight: "bold" 
  },
  statusOk: { 
    color: "green", 
    fontWeight: "bold" 
  },
  statusWaiting: { 
    color: "orange", 
    fontWeight: "bold" 
  },
  disconnectButton: { 
    marginTop: 16 
  },
  infoText: { 
    marginTop: 8, 
    marginBottom: 8 
  },
  configButtonContainer: {
    marginVertical: 10,
    width: '100%',
  },
  connectButtonContainer: {
    marginTop: 10,
    width: '100%',
  },
  loopSoundContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  
  // Style dla menu konfiguracji dźwięków
  soundConfigMenu: {
    marginTop: 10,
    marginBottom: 20,
    padding: 15, // Zwiększamy padding
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    width: '100%',
    // Usuwamy maxHeight, aby umożliwić pełne przewijanie
    borderWidth: 1, // Dodajemy obramowanie
    borderColor: '#ddd',
    flexGrow: 1, // Pozwala na rozciągnięcie zawartości
  },
  soundConfigTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  soundConfigItem: {
    flexDirection: 'column',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
  },
  colorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  colorSample: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  soundConfigColorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  currentSoundName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  soundConfigControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    flexWrap: 'wrap',
  },
  soundCategoriesContainer: {
    marginTop: 5,
  },
  soundCategory: {
    marginBottom: 15, // Zwiększamy odstęp między kategoriami
    paddingBottom: 5, // Dodajemy padding na dole kategorii
    borderBottomWidth: 1, // Dodajemy linię oddzielającą kategorie
    borderBottomColor: '#eee',
  },
  categoryTitle: {
    fontSize: 15, // Zwiększamy rozmiar czcionki
    fontWeight: 'bold',
    marginBottom: 8, // Zwiększamy odstęp pod tytułem
    color: '#444', // Ciemniejszy kolor dla lepszej widoczności
    paddingLeft: 5, // Dodajemy padding z lewej strony
  },
  soundOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 10, // Dodajemy padding na dole, aby ostatni wiersz był w pełni widoczny
  },
  soundOption: {
    padding: 10, // Zwiększamy padding
    backgroundColor: '#e0e0e0',
    borderRadius: 6, // Zwiększamy zaokrąglenie
    marginRight: 10, // Zwiększamy margines z prawej
    marginBottom: 10, // Zwiększamy margines na dole
    minWidth: 120, // Zwiększamy minimalną szerokość przycisku
    maxWidth: 150, // Dodajemy maksymalną szerokość
    height: 50, // Ustalamy stałą wysokość
    justifyContent: 'center', // Wyśrodkowanie w pionie
    alignItems: 'center', // Wyśrodkowanie w poziomie
    borderWidth: 1, // Dodajemy obramowanie
    borderColor: '#ccc', // Kolor obramowania
  },
  selectedSoundOption: {
    backgroundColor: '#007AFF',
  },
  soundOptionText: {
    fontSize: 13, // Zmniejszamy rozmiar czcionki dla lepszego dopasowania
    color: '#000',
    textAlign: 'center', // Wyśrodkowanie tekstu
    flexWrap: 'wrap', // Zawijanie tekstu
    width: '100%', // Zapewniamy, że tekst zajmuje całą szerokość przycisku
  },
  selectedSoundOptionText: {
    color: '#fff',
    fontWeight: 'bold', // Pogrubienie wybranego tekstu
  },
  previewButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#ff3b30',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});