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

// Stałe dla BLE
const SERVICE_UUID = "12345678-1234-1234-1234-1234567890ab";
const CHARACTERISTIC_UUID = "abcd1234-5678-90ab-cdef-1234567890ab";
const DEVICE_NAME = "ESP32_RGB_DIST"; // Zaktualizowana nazwa urządzenia zgodnie z kodem Arduino

// Flaga globalna dla automatycznego ponownego połączenia
let GLOBAL_AUTO_RECONNECT_ENABLED = true;

// Minimalny próg jasności dla wykrywania kolorów
const MIN_BRIGHTNESS = 10;

// Prototypy kolorów (R,G,B) - zgodne z kodem Arduino
const COLOR_PROTOTYPES = {
  RED: { r: 62, g: 48, b: 69 },    // czerwony
  GREEN: { r: 34, g: 73, b: 75 },  // zielony
  BLUE: { r: 42, g: 112, b: 205 }, // niebieski
};

// Domyślne dźwięki dla kolorów
const DEFAULT_SOUND_FILES = {
  red: require("../assets/sounds/Adult/Male/Screaming.wav"),
  green: require("../assets/sounds/Adult/Female/Screaming.wav"),
  blue: require("../assets/sounds/Child/Screaming.wav"),
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

// Funkcja do wykrywania kolorów na podstawie odległości od prototypów
const detectComplexColor = (color: { r: number; g: number; b: number }): string => {
  const { r, g, b } = color;
  const sum = r + g + b;
  
  // Zabezpieczenie przed dzieleniem przez zero lub zbyt niską jasnością
  if (sum === 0 || sum <= MIN_BRIGHTNESS) {
    console.log("[COLOR] Insufficient brightness or zero values");
    return "none";
  }
  
  console.log("[COLOR] Raw values - R:", r, "G:", g, "B:", b);
  
  // Oblicz odległości do prototypów kolorów
  const distances = {
    red: calculateDistance(color, COLOR_PROTOTYPES.RED),
    green: calculateDistance(color, COLOR_PROTOTYPES.GREEN),
    blue: calculateDistance(color, COLOR_PROTOTYPES.BLUE)
  };
  
  console.log("[COLOR] Distances - Red:", distances.red.toFixed(2), "Green:", distances.green.toFixed(2), "Blue:", distances.blue.toFixed(2));
  
  // Znajdź kolor z najmniejszą odległością
  let minDistance = Number.MAX_VALUE;
  let detectedColor = "none";
  
  for (const [color, distance] of Object.entries(distances)) {
    if (distance < minDistance) {
      minDistance = distance;
      detectedColor = color;
    }
  }
  
  console.log(`[COLOR] Detected ${detectedColor.toUpperCase()} with distance ${minDistance.toFixed(2)}`);
  return detectedColor;
};

// Funkcja pomocnicza do obliczania odległości euklidesowej między kolorami
const calculateDistance = (color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number => {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) +
    Math.pow(color1.b - color2.b, 2)
  );
};
  
  // Dla równych wartości RGB (biały/szary)
  const isWhite = Math.abs(rRatio - gRatio) < COLOR_RATIO_THRESHOLDS.WHITE_THRESHOLD && 
                 Math.abs(rRatio - bRatio) < COLOR_RATIO_THRESHOLDS.WHITE_THRESHOLD && 
                 Math.abs(gRatio - bRatio) < COLOR_RATIO_THRESHOLDS.WHITE_THRESHOLD;
                 
  // Sprawdź, czy wartości są prawie identyczne (jak w przypadku 501, 501, 501)
  const isAllSimilar = Math.abs(r - g) < 10 && Math.abs(r - b) < 10 && Math.abs(g - b) < 10;
  
  // Jeśli wszystkie wartości są prawie identyczne, zwróć "none"
  if (isAllSimilar && r > 400 && r < 600) {
    console.log("[COLOR] All RGB values are similar and in mid-range, likely sensor error");
    return "none";
  }
  
  if (isWhite) {
    console.log("[COLOR] Detected white/gray (equal RGB values)");
    
    // Dla białego/szarego, sprawdź czy któryś kolor ma minimalną przewagę
    if (rRatio > gRatio && rRatio > bRatio) {
      console.log("[COLOR] White with slight red tint");
      return "red";
    } else if (gRatio > rRatio && gRatio > bRatio) {
      console.log("[COLOR] White with slight green tint");
      return "green";
    } else if (bRatio > rRatio && bRatio > gRatio) {
      console.log("[COLOR] White with slight blue tint");
      return "blue";
    } else {
      // Jeśli wszystkie są dokładnie równe, wybierz losowo
      const colors = ["red", "green", "blue"];
      const randomIndex = Math.floor(Math.random() * colors.length);
      console.log("[COLOR] Pure white, randomly selected:", colors[randomIndex]);
      return colors[randomIndex];
    }
  }
  
  // Oblicz podobieństwo do typowych kolorów
  const similarities = {
    red: calculateSimilarity(color, COLOR_CALIBRATION.TYPICAL_RED),
    green: calculateSimilarity(color, COLOR_CALIBRATION.TYPICAL_GREEN),
    blue: calculateSimilarity(color, COLOR_CALIBRATION.TYPICAL_BLUE),
    yellow: calculateSimilarity(color, COLOR_CALIBRATION.TYPICAL_YELLOW),
    orange: calculateSimilarity(color, COLOR_CALIBRATION.TYPICAL_ORANGE),
    purple: calculateSimilarity(color, COLOR_CALIBRATION.TYPICAL_PURPLE)
  };
  
  console.log("[COLOR] Similarities:", 
    "R:", similarities.red.toFixed(2), 
    "G:", similarities.green.toFixed(2), 
    "B:", similarities.blue.toFixed(2),
    "Y:", similarities.yellow.toFixed(2),
    "O:", similarities.orange.toFixed(2),
    "P:", similarities.purple.toFixed(2)
  );
  
  // Znajdź kolor z największym podobieństwem
  let maxSimilarity = 0;
  let dominantColor = "none";
  
  for (const [color, similarity] of Object.entries(similarities)) {
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      dominantColor = color;
    }
  }
  
  // Sprawdź, czy podobieństwo jest wystarczająco duże
  // Podwyższony próg dla bardziej precyzyjnego wykrywania kolorów
  if (maxSimilarity > 0.45) {
    console.log(`[COLOR] Detected ${dominantColor.toUpperCase()} based on similarity (${maxSimilarity.toFixed(2)})`);
    return dominantColor;
  }
  
  // Jeśli podobieństwo jest zbyt małe, zwróć "none"
  console.log(`[COLOR] No dominant color detected, max similarity (${maxSimilarity.toFixed(2)}) is below threshold`);
  return "none";
  
  // Jeśli podobieństwo jest zbyt małe, użyj tradycyjnej metody opartej na progach
  
  // Wykrywanie kolorów podstawowych
  if (rRatio > COLOR_RATIO_THRESHOLDS.RED && rRatio > gRatio * 1.1 && rRatio > bRatio * 1.1) {
    console.log("[COLOR] Detected RED based on ratio threshold");
    return "red";
  }
  
  if (gRatio > COLOR_RATIO_THRESHOLDS.GREEN && gRatio > rRatio * 1.1 && gRatio > bRatio * 1.1) {
    console.log("[COLOR] Detected GREEN based on ratio threshold");
    return "green";
  }
  
  if (bRatio > COLOR_RATIO_THRESHOLDS.BLUE && bRatio > rRatio * 1.1 && bRatio > gRatio * 1.1) {
    console.log("[COLOR] Detected BLUE based on ratio threshold");
    return "blue";
  }
  
  // Wykrywanie kolorów złożonych
  
  // Żółty (czerwony + zielony)
  if (rRatio > 0.3 && gRatio > 0.3 && bRatio < 0.25 && Math.abs(rRatio - gRatio) < 0.15) {
    console.log("[COLOR] Detected YELLOW based on R+G combination");
    return "yellow";
  }
  
  // Pomarańczowy (dużo czerwonego, trochę zielonego)
  if (rRatio > 0.4 && gRatio > 0.2 && gRatio < 0.4 && bRatio < 0.25 && rRatio > gRatio * 1.1) {
    console.log("[COLOR] Detected ORANGE based on R>G combination");
    return "orange";
  }
  
  // Fioletowy (czerwony + niebieski)
  if (rRatio > 0.3 && bRatio > 0.3 && gRatio < 0.25 && Math.abs(rRatio - bRatio) < 0.15) {
    console.log("[COLOR] Detected PURPLE based on R+B combination");
    return "purple";
  }
  
  // Znajdź największą różnicę między kolorami
  const rDiff = Math.max(rRatio - gRatio, rRatio - bRatio);
  const gDiff = Math.max(gRatio - rRatio, gRatio - bRatio);
  const bDiff = Math.max(bRatio - rRatio, bRatio - gRatio);
  
  const maxDiff = Math.max(rDiff, gDiff, bDiff);
  
  // Jeśli jest wyraźna różnica, wybierz kolor z największą różnicą
  if (maxDiff > COLOR_RATIO_THRESHOLDS.COLOR_DIFF_THRESHOLD) {
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
  console.log("[COLOR] Final random fallback:", colors[randomIndex]);
  return colors[randomIndex];
};

export default function ColorSensor() {
  // Stan BLE
  const [manager] = useState(() => new BleManager());
  const [bleState, setBleState] = useState<string>("Unknown");
  const [device, setDevice] = useState<Device | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [color, setColor] = useState({ r: 0, g: 0, b: 0 });
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
  const [loopSound, setLoopSound] = useState<boolean>(true);
  const soundRefs = useRef<{ [key: string]: Audio.Sound | null }>({
    red: null,
    green: null,
    blue: null,
  });

  // Stan dla mapowania kolorów na dźwięki
  const [soundMappings, setSoundMappings] = useState({
    red: DEFAULT_SOUND_FILES.red,
    green: DEFAULT_SOUND_FILES.green,
    blue: DEFAULT_SOUND_FILES.blue,
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
    
    // Zatrzymaj aktualnie odtwarzany dźwięk, jeśli jest inny niż ten, który chcemy odtworzyć
    if (currentSound && currentSound !== colorName) {
      await stopCurrentSound();
    }
    
    let sound = soundRefs.current[colorName];
    
    // Pobierz odpowiedni dźwięk dla koloru z mapowania
    const soundFile = soundMappings[colorName as keyof typeof soundMappings];
    
    try {
      // Sprawdź, czy dźwięk jest już załadowany i odtwarzany
      if (sound) {
        const status = await sound.getStatusAsync().catch(() => ({ } as AVPlaybackStatus));
        
        // Sprawdź, czy status to AVPlaybackStatusSuccess (zawiera isLoaded)
        if ('isLoaded' in status && status.isLoaded) {
          const isPlaying = status.isPlaying;
          
          // Jeśli dźwięk jest już odtwarzany, nie rób nic
          if (isPlaying) {
            console.log(`[AUDIO] Sound for ${colorName} is already playing`);
            if (currentSound !== colorName) setCurrentSound(colorName);
            return;
          }
          
          // Jeśli dźwięk jest załadowany, ale nie jest odtwarzany, odtwórz go
          console.log(`[AUDIO] Sound for ${colorName} is loaded but not playing, starting playback`);
          await sound.setStatusAsync({ 
            isLooping: loopSound,
            shouldPlay: true,
            positionMillis: 0
          });
          await sound.playAsync();
          setCurrentSound(colorName);
          return;
        }
      }
      
      // Jeśli dźwięk nie istnieje lub nie jest załadowany, utwórz nowy
      console.log(`[AUDIO] Creating new sound for ${colorName}`);
      sound = new Audio.Sound();
      await sound.loadAsync(soundFile);
      
      // Ustaw parametry odtwarzania
      await sound.setStatusAsync({ 
        isLooping: loopSound,
        shouldPlay: true,
        positionMillis: 0,
        volume: 1.0
      });
      
      // Dodaj nasłuchiwanie na zakończenie odtwarzania
      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish && !loopSound) {
          console.log(`[AUDIO] Sound for ${colorName} finished playing`);
          setCurrentSound(null);
        }
      });
      
      // Odtwórz dźwięk
      await sound.playAsync();
      soundRefs.current[colorName] = sound;
      setCurrentSound(colorName);
      
    } catch (error) {
      console.error(`[AUDIO] Error playing sound for ${colorName}:`, error);
      
      // W przypadku błędu, spróbuj utworzyć nowy obiekt dźwięku
      try {
        if (sound) {
          await sound.stopAsync().catch(() => {});
          await sound.unloadAsync().catch(() => {});
        }
        
        const newSound = new Audio.Sound();
        await newSound.loadAsync(soundMappings[colorName as keyof typeof soundMappings]);
        await newSound.setStatusAsync({ isLooping: loopSound, shouldPlay: true });
        await newSound.playAsync();
        
        soundRefs.current[colorName] = newSound;
        setCurrentSound(colorName);
      } catch (retryError) {
        console.error(`[AUDIO] Failed to reload sound for ${colorName}:`, retryError);
      }
    }
  };

  // Funkcja do odtwarzania dźwięku na podstawie wykrytego koloru
  const playColorSound = async (color: { r: number; g: number; b: number }) => {
    if (!audioReady) return;

    // Określ dominujący kolor na podstawie odczytów RGB
    const sumRGB = color.r + color.g + color.b;
    
    // Zabezpieczenie przed dzieleniem przez zero lub zbyt niską jasnością
    if (sumRGB === 0 || sumRGB <= MIN_BRIGHTNESS) {
      console.log("[AUDIO] Insufficient brightness, stopping sound");
      await stopCurrentSound();
      return;
    }
    
    // Wyświetl informacje diagnostyczne
    console.log("[AUDIO] RGB values for sound:", color.r, color.g, color.b, "Sum:", sumRGB);
    
    // Sprawdź, czy wszystkie wartości są prawie identyczne (potencjalny błąd czujnika)
    const isAllSimilar = Math.abs(color.r - color.g) < 10 && 
                         Math.abs(color.r - color.b) < 10 && 
                         Math.abs(color.g - color.b) < 10;
    
    // Sprawdź, czy to przypadek, gdy wszystkie wartości są dokładnie równe 1000
    const isAllExactlyEqual = color.r === 1000 && color.g === 1000 && color.b === 1000;
    
    // Jeśli wszystkie wartości są dokładnie 1000 lub są prawie identyczne,
    // to prawdopodobnie jest to błąd czujnika
    if (isAllExactlyEqual || (isAllSimilar && color.r > 400 && color.r < 600)) {
      console.log("[AUDIO] Detected potential sensor error - values are too similar or exactly 1000");
      
      // Jeśli już odtwarzamy dźwięk, zatrzymaj go
      if (currentSound) {
        console.log(`[AUDIO] Stopping sound due to potential sensor error`);
        await stopCurrentSound();
      }
      
      return;
    }
    
    // Użyj funkcji wykrywania kolorów na podstawie odległości od prototypów
    let dominantColor = detectComplexColor(color);
    console.log(`[AUDIO] Detected color: ${dominantColor}`);
    
    // Aktualizuj czas ostatniego odczytu koloru
    setLastColorUpdate(Date.now());
    
    // Jeśli nie wykryto żadnego dominującego koloru, zatrzymaj aktualnie odtwarzany dźwięk
    if (dominantColor === "none") {
      console.log("[AUDIO] No dominant color detected, stopping any playing sound");
      await stopCurrentSound();
      return;
    }
    
    // Stabilizacja wykrywania kolorów - jeśli już odtwarzamy dźwięk dla koloru,
    // a nowy kolor jest podobny, kontynuuj odtwarzanie obecnego dźwięku
    if (currentSound) {
      // Sprawdź, czy nowy kolor jest podobny do aktualnie odtwarzanego
      const isSimilarColor = (
        // Ten sam kolor - zawsze kontynuuj
        (currentSound === dominantColor) ||
        
        // Podobne kolory: czerwony i pomarańczowy
        (currentSound === "red" && dominantColor === "orange") ||
        (currentSound === "orange" && dominantColor === "red") ||
        
        // Podobne kolory: zielony i żółty
        (currentSound === "green" && dominantColor === "yellow") ||
        (currentSound === "yellow" && dominantColor === "green") ||
        
        // Podobne kolory: niebieski i fioletowy
        (currentSound === "blue" && dominantColor === "purple") ||
        (currentSound === "purple" && dominantColor === "blue")
      );
      
      // Dodatkowa stabilizacja - jeśli wykryty kolor zmienia się zbyt często,
      // kontynuuj odtwarzanie obecnego dźwięku przez pewien czas
      const timeSinceLastChange = Date.now() - lastColorUpdate;
      const isRecentChange = timeSinceLastChange < 500; // 500ms stabilizacji
      
      if (isSimilarColor || isRecentChange) {
        console.log(`[AUDIO] Continuing current sound ${currentSound} (new: ${dominantColor}, similar: ${isSimilarColor}, recent change: ${isRecentChange})`);
        return;
      }
    }
    
    // Odtwórz dźwięk dla wykrytego koloru
    await playSound(dominantColor);
  };

  // Pomocnicza funkcja do zatrzymywania aktualnie odtwarzanego dźwięku
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
      
      // W przypadku błędu, spróbuj utworzyć nowy obiekt dźwięku
      try {
        await soundRefs.current[currentSound].unloadAsync().catch(() => {});
        const newSound = new Audio.Sound();
        await newSound.loadAsync(soundMappings[currentSound as keyof typeof soundMappings]);
        soundRefs.current[currentSound] = newSound;
      } catch (unloadError) {}
      
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
                      
                      // Sprawdź, czy wszystkie wartości są dokładnie równe 1000
                      // To może wskazywać na problem z czujnikiem
                      if (r === 1000 && g === 1000 && b === 1000) {
                        console.log("[BLE] Warning: All RGB values are exactly 1000 - possible sensor issue");
                        // Ignorujemy te dane
                        return;
                      }
                      
                      // Sprawdź, czy wszystkie wartości są prawie identyczne (jak w przypadku 501, 501, 501)
                      const isAllSimilar = Math.abs(r - g) < 10 && Math.abs(r - b) < 10 && Math.abs(g - b) < 10;
                      if (isAllSimilar && r > 400 && r < 600) {
                        console.log("[BLE] Warning: All RGB values are similar and in mid-range - possible sensor issue");
                        // Ignorujemy te dane
                        return;
                      }
                      
                      // Filtrowanie szumów - ignoruj bardzo małe wartości
                      const filteredR = r < 2 ? 0 : r;
                      const filteredG = g < 2 ? 0 : g;
                      const filteredB = b < 2 ? 0 : b;
                      
                      const newColor = { r: filteredR, g: filteredG, b: filteredB };
                      console.log("[BLE] Parsed RGB:", newColor);
                      
                      // Sprawdź, czy wartości są sensowne (nie są zbyt wysokie)
                      const maxValidValue = 65535; // Maksymalna wartość dla 16-bitowego unsigned int
                      if (filteredR > maxValidValue || filteredG > maxValidValue || filteredB > maxValidValue) {
                        console.log("[BLE] Invalid color values detected, ignoring");
                        return;
                      }
                      
                      // Sprawdź, czy suma RGB jest wystarczająco duża, aby uznać odczyt za ważny
                      const sumRGB = filteredR + filteredG + filteredB;
                      if (sumRGB < COLOR_RATIO_THRESHOLDS.MIN_BRIGHTNESS) {
                        console.log("[BLE] Color brightness too low, ignoring");
                        return;
                      }
                      
                      // Aktualizuj stan koloru
                      setColor(newColor);
                      setLastColorUpdate(Date.now());
                      
                      // Ustaw timer do resetowania koloru, jeśli nie otrzymamy nowych danych
                      if (colorTimeoutRef.current) {
                        clearTimeout(colorTimeoutRef.current);
                      }
                      
                      colorTimeoutRef.current = setTimeout(async () => {
                        if (Date.now() - lastColorUpdate > 1000) {
                          console.log("[BLE] No color updates for 1 second, resetting");
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

  // Funkcja do renderowania menu konfiguracji dźwięków została usunięta
  // Konfiguracja dźwięków jest dostępna tylko po stronie egzaminatora

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <Text>Status BLE: {bleState}</Text>
        <Text>Status: {status}</Text>

        {/* Konfiguracja dźwięków jest dostępna tylko po stronie egzaminatora */}

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
  // configButtonContainer został usunięty
  connectButtonContainer: {
    marginTop: 10,
    width: '100%',
  },
  // loopSoundContainer został usunięty
  
  // Style dla menu konfiguracji dźwięków zostały usunięte
  // soundConfigTitle został usunięty
  // soundConfigItem został usunięty
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