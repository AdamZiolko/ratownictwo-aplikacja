import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Text,
  Button,
  ActivityIndicator,
} from 'react-native';
import { BleManager, Device, Subscription, BleError } from 'react-native-ble-plx';
import { decode as atob } from 'base-64';
import { Audio } from 'expo-av';

// Stałe i konfiguracja
const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const CHARACTERISTIC_UUID = 'abcd1234-5678-90ab-cdef-1234567890ab';
const DEVICE_NAME = 'ESP32C3_RGB';

// Globalna flaga do kontrolowania automatycznego ponownego łączenia
let GLOBAL_AUTO_RECONNECT_ENABLED = true;

// Definicje progów kolorów dla różnych dźwięków
const COLOR_RATIO_THRESHOLDS = {
  RED: 0.4,    // Czerwony musi stanowić co najmniej 40% sumy RGB
  GREEN: 0.4,  // Zielony musi stanowić co najmniej 40% sumy RGB
  BLUE: 0.4,   // Niebieski musi stanowić co najmniej 40% sumy RGB
  MIN_BRIGHTNESS: 1000  // Minimalna suma RGB, aby uznać, że to nie jest czarny
};

// Ścieżki do plików dźwiękowych
const SOUND_FILES = {
  red: require('../assets/sounds/serce.mp3'),
  green: require('../assets/sounds/drzwi.mp3'),
  blue: require('../assets/sounds/kaszel.mp3'),
};

export default function ColorSensor() {
  // Stan BLE
  const [manager] = useState(() => new BleManager());
  const [bleState, setBleState] = useState<string>('Unknown');
  const [device, setDevice] = useState<Device | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [color, setColor] = useState({ r: 0, g: 0, b: 0 });
  const [status, setStatus] = useState<'idle'|'scanning'|'connected'|'monitoring'|'error'>('idle');
  const [error, setError] = useState<string|null>(null);
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [autoReconnect, setAutoReconnect] = useState<boolean>(true);
  
  // Stan audio
  const [audioReady, setAudioReady] = useState(false);
  const soundRefs = useRef<{[key: string]: Audio.Sound | null}>({
    red: null, green: null, blue: null,
  });
  
  // Inicjalizacja audio
  useEffect(() => {
    async function initAudio() {
      try {
        if (Platform.OS !== 'web') {
          const { status } = await Audio.requestPermissionsAsync();
          if (status !== 'granted') {
            console.warn('[AUDIO] Brak uprawnień do odtwarzania audio – dźwięk może nie działać.');
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
  
  // Ładowanie dźwięków
  useEffect(() => {
    if (!audioReady) return;
    
    async function loadSounds() {
      try {
        for (const [color, soundFile] of Object.entries(SOUND_FILES)) {
          try {
            const sound = new Audio.Sound();
            await sound.loadAsync(soundFile);
            soundRefs.current[color] = sound;
            console.log(`[AUDIO] Loaded sound for ${color} successfully`);
          } catch (error) {
            console.error(`[AUDIO] Error loading sound for ${color}:`, error);
          }
        }
      } catch (error) {
        console.error('[AUDIO] Error loading sounds:', error);
      }
    }
    
    loadSounds();
    
    return () => {
      Object.entries(soundRefs.current).forEach(([color, sound]) => {
        if (sound) {
          sound.unloadAsync()
            .catch(err => console.warn(`[AUDIO] Error unloading sound for ${color}:`, err));
        }
      });
    };
  }, [audioReady]);
  
  // Monitorowanie stanu BLE
  useEffect(() => {
    const stateSub = manager.onStateChange(state => {
      console.log('[BLE] State changed:', state);
      setBleState(state);
    }, true);
    return () => stateSub.remove();
  }, [manager]);
  
  // Efekt reagujący na zmiany stanu autoReconnect
  useEffect(() => {
    console.log(`[BLE] React autoReconnect state changed to: ${autoReconnect}`);
    
    if (!autoReconnect) {
      GLOBAL_AUTO_RECONNECT_ENABLED = false;
      console.log('[BLE] Global auto-reconnect flag disabled due to React state change');
      
      try {
        manager.stopDeviceScan();
      } catch (e) {
        console.warn('[BLE] Error stopping device scan:', e);
      }
      
      setIsReconnecting(true);
      console.log('[BLE] Setting reconnection flag to true to prevent auto-reconnect');
    } else {
      GLOBAL_AUTO_RECONNECT_ENABLED = true;
      console.log('[BLE] Global auto-reconnect flag enabled due to React state change');
    }
  }, [autoReconnect]);
  
  // Czyszczenie przy odmontowaniu komponentu
  useEffect(() => {
    return () => {
      console.log('[BLE] Cleanup on unmount');
      cleanupBleConnection();
    };
  }, []);
  
  // Funkcja do odtwarzania dźwięku w zależności od wykrytego koloru
  const playColorSound = async (color: { r: number, g: number, b: number }) => {
    if (!audioReady) return;
    
    // Określenie dominującego koloru na podstawie proporcji
    let dominantColor = 'none';
    const sumRGB = color.r + color.g + color.b;
    const rRatio = color.r / sumRGB;
    const gRatio = color.g / sumRGB;
    const bRatio = color.b / sumRGB;
    
    // Sprawdź, czy jasność jest wystarczająca (nie czarny)
    if (sumRGB > COLOR_RATIO_THRESHOLDS.MIN_BRIGHTNESS) {
      // Określ dominujący kolor na podstawie proporcji
      if (rRatio > COLOR_RATIO_THRESHOLDS.RED && rRatio > gRatio && rRatio > bRatio) {
        dominantColor = 'red';
      } else if (gRatio > COLOR_RATIO_THRESHOLDS.GREEN && gRatio > rRatio && gRatio > bRatio) {
        dominantColor = 'green';
      } else if (bRatio > COLOR_RATIO_THRESHOLDS.BLUE && bRatio > rRatio && bRatio > gRatio) {
        dominantColor = 'blue';
      }
    }
    
    // Jeśli wykryto dominujący kolor i jest inny niż aktualnie odtwarzany
    if (dominantColor !== 'none' && dominantColor !== currentSound) {
      try {
        // Zatrzymaj aktualnie odtwarzany dźwięk
        if (currentSound && soundRefs.current[currentSound]) {
          await soundRefs.current[currentSound]?.stopAsync().catch(() => {});
        }
        
        // Odtwórz nowy dźwięk
        const sound = soundRefs.current[dominantColor];
        if (sound) {
          try {
            await sound.setPositionAsync(0); // Przewiń do początku
            await sound.playAsync();
            setCurrentSound(dominantColor);
          } catch (playError) {
            console.error(`[AUDIO] Error playing sound: ${playError}`);
            
            // Próba ponownego załadowania dźwięku w przypadku błędu
            try {
              await sound.unloadAsync();
              await sound.loadAsync(SOUND_FILES[dominantColor as keyof typeof SOUND_FILES]);
              await sound.playAsync();
              setCurrentSound(dominantColor);
            } catch (reloadError) {
              console.error(`[AUDIO] Failed to reload sound: ${reloadError}`);
            }
          }
        }
      } catch (error) {
        console.error(`[AUDIO] Error in playColorSound:`, error);
      }
    }
  };
  
  // Funkcja do żądania uprawnień BLE
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const perms = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
      if (Platform.Version >= 31) {
        perms.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
      }
      const granted = await PermissionsAndroid.requestMultiple(perms);
      const allGranted = perms.every(p => granted[p] === PermissionsAndroid.RESULTS.GRANTED);
      if (!allGranted) throw new Error('Brak wymaganych uprawnień BLE');
    }
  };
  
  // Funkcja do czyszczenia połączenia BLE
  const cleanupBleConnection = async () => {
    console.log('[BLE] Cleaning up BLE connection');
    
    try {
      // Zatrzymaj skanowanie
      try { manager.stopDeviceScan(); } catch (e) {}
      
      // Usuń subskrypcję monitorowania
      if (sub) {
        try { sub.remove(); } catch (e) {}
        setSub(null);
      }
      
      // Rozłącz urządzenie
      if (device) {
        try {
          const isConnected = await manager.isDeviceConnected(device.id).catch(() => false);
          if (isConnected) {
            await manager.cancelDeviceConnection(device.id);
            console.log(`[BLE] Successfully disconnected from device ${device.id}`);
          }
        } catch (e) {}
        setDevice(null);
      }
      
      // Zatrzymaj odtwarzanie dźwięku
      if (currentSound && soundRefs.current[currentSound]) {
        try { await soundRefs.current[currentSound]?.stopAsync(); } catch (e) {}
      }
    } catch (error) {
      console.error('[BLE] Error during cleanup:', error);
    }
  };
  
  // Funkcja do skanowania i monitorowania urządzeń BLE
  const scanAndMonitor = async () => {
    console.log('[BLE] scanAndMonitor called, global autoReconnect:', GLOBAL_AUTO_RECONNECT_ENABLED, 'React autoReconnect:', autoReconnect);
    
    // Sprawdź, czy już trwa proces ponownego łączenia
    if (isReconnecting) {
      console.log('[BLE] Reconnection already in progress, skipping');
      return;
    }
    
    // Włącz flagi autoReconnect
    GLOBAL_AUTO_RECONNECT_ENABLED = true;
    if (!autoReconnect) setAutoReconnect(true);
    
    // Ustaw flagę, że trwa proces ponownego łączenia
    setIsReconnecting(true);
    
    try {
      // Najpierw wyczyść poprzednie połączenie
      await cleanupBleConnection();
      
      // Zresetuj stan
      setError(null);
      setStatus('scanning');
      
      // Żądaj uprawnień
      await requestPermissions();
      
      console.log('[BLE] Starting scan…');
      
      // Rozpocznij skanowanie urządzeń BLE
      manager.startDeviceScan(null, null, (error, dev) => {
        if (error) {
          console.error('[BLE] Scan error', error);
          setError(error.message);
          setStatus('error');
          
          try { manager.stopDeviceScan(); } catch (e) {}
          
          // Spróbuj ponownie po dłuższym czasie, ale tylko jeśli autoReconnect jest włączone
          setTimeout(() => {
            if (autoReconnect) {
              console.log('[BLE] Attempting to scan again after error...');
              setStatus('idle');
              scanAndMonitor();
            }
          }, 10000);
          
          return;
        }
        if (!dev) return;
        
        // Sprawdź, czy to nasze urządzenie
        const nameMatches = dev.name === DEVICE_NAME || dev.localName === DEVICE_NAME;
        const hasService = dev.serviceUUIDs?.includes(SERVICE_UUID);
        
        if (nameMatches || hasService) {
          console.log('[BLE] Matching device, connecting…');
          manager.stopDeviceScan();
          
          // Funkcja do łączenia z urządzeniem z ponownymi próbami
          const connectWithRetry = async (device: Device, maxRetries = 3) => {
            for (let retries = 0; retries < maxRetries; retries++) {
              try {
                console.log(`[BLE] Connecting to device, attempt ${retries + 1}/${maxRetries}...`);
                
                // Sprawdź, czy urządzenie jest już połączone
                const isConnected = await manager.isDeviceConnected(device.id).catch(() => false);
                
                if (isConnected) {
                  console.log(`[BLE] Device ${device.id} is already connected`);
                  return device;
                } else {
                  // Połącz z urządzeniem
                  const connectedDevice = await manager.connectToDevice(device.id);
                  console.log(`[BLE] Connection successful on attempt ${retries + 1}`);
                  return connectedDevice;
                }
              } catch (e) {
                console.error(`[BLE] Connection error`, e);
                
                if (retries < maxRetries - 1) {
                  // Opóźnienie przed kolejną próbą
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            }
            
            throw new Error(`Failed to connect after ${maxRetries} attempts`);
          };
          
          // Połącz z urządzeniem
          connectWithRetry(dev)
            .then(d => {
              console.log('[BLE] Successfully connected to device');
              setDevice(d);
              setStatus('connected');
              
              // Obsługa rozłączenia urządzenia
              const disconnectHandler = (error: BleError | null, disconnectedDevice: Device) => {
                console.log(`Device ${disconnectedDevice.id} was disconnected`, error);
                
                // Wyczyść stan tylko jeśli to jest nasze aktualne urządzenie
                if (disconnectedDevice.id === d.id) {
                  setStatus('idle');
                  setDevice(null);
                  
                  if (sub) {
                    try { sub.remove(); } catch (e) {}
                    setSub(null);
                  }
                  
                  // Jeśli globalna flaga autoReconnect jest włączona, spróbuj ponownie połączyć się po opóźnieniu
                  if (GLOBAL_AUTO_RECONNECT_ENABLED) {
                    console.log('[BLE] Global auto-reconnect flag is enabled, scheduling reconnect');
                    
                    setTimeout(() => {
                      if (GLOBAL_AUTO_RECONNECT_ENABLED && !isReconnecting) {
                        console.log('[BLE] Global auto-reconnect flag is still enabled, attempting to reconnect...');
                        scanAndMonitor();
                      }
                    }, 3000);
                  }
                }
              };
              
              // Ustaw handler rozłączenia
              d.onDisconnected(disconnectHandler);
              
              // Odkryj usługi i charakterystyki
              return d.discoverAllServicesAndCharacteristics();
            })
            .then(d => {
              if (!d) return;
              console.log('[BLE] Discovered services, start monitoring');
              
              // Monitoruj charakterystykę
              const subscription = d.monitorCharacteristicForService(
                SERVICE_UUID,
                CHARACTERISTIC_UUID,
                (error, characteristic) => {
                  if (error) {
                    console.error('[BLE] Monitor error', error);
                    return;
                  }
                  if (!characteristic?.value) return;
                  
                  try {
                    const rawData = atob(characteristic.value);
                    const r16 = (rawData.charCodeAt(0) << 8) | rawData.charCodeAt(1);
                    const g16 = (rawData.charCodeAt(2) << 8) | rawData.charCodeAt(3);
                    const b16 = (rawData.charCodeAt(4) << 8) | rawData.charCodeAt(5);
                    
                    // Normalizacja do zakresu 0-255 * 100 (dla lepszej precyzji)
                    const rNorm = (r16 / 65535) * 25500;
                    const gNorm = (g16 / 65535) * 25500;
                    const bNorm = (b16 / 65535) * 25500;
                    
                    const newColor = {
                      r: Math.round(rNorm),
                      g: Math.round(gNorm),
                      b: Math.round(bNorm)
                    };
                    
                    setColor(newColor);
                    console.log('[BLE] Raw RGB:', r16, g16, b16);
                    
                    // Odtwarzanie dźwięku na podstawie wykrytego koloru
                    playColorSound(newColor);
                  } catch (error) {
                    console.error('[BLE] Error processing characteristic data:', error);
                  }
                }
              );
              
              setSub(subscription);
              setStatus('monitoring');
            })
            .catch(e => {
              console.error('[BLE] Error during connection or monitoring', e);
              setError(e.message);
              setStatus('error');
              
              // Spróbuj ponownie po czasie, ale tylko jeśli autoReconnect jest włączone
              if (autoReconnect) {
                setTimeout(() => {
                  if (autoReconnect && !isReconnecting) {
                    console.log('[BLE] Attempting to reconnect after error...');
                    setStatus('idle');
                    scanAndMonitor();
                  }
                }, 5000);
              }
            });
        }
      });
    } catch (e) {
      console.error('[BLE] Fatal error', e);
      setError((e as Error).message);
      setStatus('error');
    } finally {
      // Resetuj stan ponownego łączenia po zakończeniu, ale tylko jeśli globalna flaga autoReconnect jest włączone
      setTimeout(() => {
        if (GLOBAL_AUTO_RECONNECT_ENABLED) {
          console.log('[BLE] Resetting reconnection flag after timeout');
          setIsReconnecting(false);
        }
      }, 2000);
    }
  };
  
  // Funkcja do rozłączania urządzenia
  const disconnectDevice = async () => {
    try {
      // Wyłącz flagi autoReconnect
      GLOBAL_AUTO_RECONNECT_ENABLED = false;
      setAutoReconnect(false);
      setIsReconnecting(true);
      
      // Zatrzymaj skanowanie
      try { manager.stopDeviceScan(); } catch (e) {}
      
      // Usuń subskrypcję monitorowania
      if (sub) {
        try { sub.remove(); } catch (e) {}
        setSub(null);
      }
      
      // Zatrzymaj odtwarzanie dźwięku
      if (currentSound && soundRefs.current[currentSound]) {
        try { 
          await soundRefs.current[currentSound]?.stopAsync();
          setCurrentSound(null);
        } catch (e) {}
      }
      
      // Rozłącz urządzenie
      if (device) {
        try {
          const isConnected = await manager.isDeviceConnected(device.id).catch(() => false);
          if (isConnected) {
            await manager.cancelDeviceConnection(device.id);
            console.log(`[BLE] Successfully disconnected from device ${device.id}`);
          }
        } catch (e) {}
        setDevice(null);
      }
      
      // Ustaw stan na idle i wyczyść błędy
      setStatus('idle');
      setError(null);
      
      console.log('[BLE] Manual disconnect complete');
    } catch (error) {
      console.error('[BLE] Error during manual disconnect:', error);
      setStatus('idle');
      setError(null);
      GLOBAL_AUTO_RECONNECT_ENABLED = false;
      setAutoReconnect(false);
      setIsReconnecting(true);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text>Status BLE: {bleState}</Text>
      <Text>Status: {status}</Text>
      
      {status === 'idle' && (
        <View>
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
      
      {status === 'scanning' && !isReconnecting && (
        <View>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Skanowanie i łączenie...</Text>
        </View>
      )}
      
      {status === 'monitoring' && (
        <View>
          <Text style={styles.statusOk}>Połączono z czujnikiem</Text>
          <View 
            style={[
              styles.colorBox, 
              { 
                backgroundColor: `rgb(${Math.min(255, Math.floor(color.r/100))}, ${Math.min(255, Math.floor(color.g/100))}, ${Math.min(255, Math.floor(color.b/100))})` 
              }
            ]} 
          />
          <Text>R: {color.r}, G: {color.g}, B: {color.b}</Text>
          
          {currentSound && (
            <Text style={styles.soundInfo}>
              Odtwarzany dźwięk: {
                currentSound === 'red' ? 'Czerwony (serce)' :
                currentSound === 'green' ? 'Zielony (drzwi)' :
                currentSound === 'blue' ? 'Niebieski (kaszel)' : 'Nieznany'
              }
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
      
      {error && !isReconnecting && <Text style={styles.error}>Błąd: {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 16 },
  colorBox: { width: 100, height: 100, marginVertical: 8, borderWidth: 1, borderColor: '#000' },
  error: { color: 'red', marginTop: 8 },
  soundInfo: { fontSize: 16, marginVertical: 4, fontWeight: 'bold' },
  statusOk: { color: 'green', fontWeight: 'bold' },
  statusWaiting: { color: 'orange', fontWeight: 'bold' },
  disconnectButton: { marginTop: 16 },
  infoText: { marginTop: 8, marginBottom: 8 },
});