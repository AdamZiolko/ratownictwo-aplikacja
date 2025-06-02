import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ScrollView,
  NativeModules,
  Linking,
} from 'react-native';
import BluetoothSerial from 'react-native-bluetooth-classic';
import { Audio } from 'expo-av';
import { Picker } from '@react-native-picker/picker';
import sounds from '../soundList';
import { useTheme } from 'react-native-paper';

interface Device {
  id: string;
  name: string | null;
  address: string;
  connected: boolean;
  deviceClass: number | null;
  profiles?: string[];
}
export interface BluetoothComponentRef {
  playSound: (soundName: string) => Promise<void>;
  disconnectAll: () => Promise<void>;
}
type NativeBluetoothModule = {
  disconnectAudio(): void;
  getDeviceProfiles(deviceAddress: string): Promise<string[]>;
  connectToDevice(deviceAddress: string): Promise<string>;
  openBluetoothSettings(): Promise<void>;
};

const { BluetoothModule } = NativeModules;
const nativeBluetoothModule = BluetoothModule as NativeBluetoothModule;

export const BluetoothComponent = forwardRef<BluetoothComponentRef>(
  (props, ref) => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [showConnectionStatus, setShowConnectionStatus] = useState(false);
    const [selectedSound, setSelectedSound] = useState<
      (typeof sounds)[0] | null
    >(null);
    const [soundObjects, setSoundObjects] = useState<{
      [key: string]: Audio.Sound;
    }>({});
    const [isSoundListExpanded, setIsSoundListExpanded] = useState(false);
    const { colors } = useTheme();

    useImperativeHandle(ref, () => ({
      playSound: async (soundName: string) => {
        const soundToPlay = sounds.find(s => s.name === soundName);
        if (!soundToPlay) {
          setError(`Dźwięk ${soundName} nie znaleziony`);
          return;
        }
        await handlePlaySound(soundToPlay);
      },
      disconnectAll: disconnectAllDevices,
    }));

    useEffect(() => {
      initBluetooth();
      prepareSounds();

      return () => {
        cleanup();
      };
    }, []);

    useEffect(() => {
      let timer: NodeJS.Timeout;
      if (showConnectionStatus) {
        timer = setTimeout(() => {
          setShowConnectionStatus(false);
        }, 3000);
      }
      return () => clearTimeout(timer);
    }, [showConnectionStatus]);

    useEffect(() => {
      return () => {
        Audio.setIsEnabledAsync(true);
      };
    }, []);

    useEffect(() => {
      const subscription = BluetoothSerial.onDeviceDisconnected(
        disconnectedDevice => {
          setConnectedDevices(prev =>
            prev.filter(d => d.address !== disconnectedDevice.address)
          );
          setDevices(prev =>
            prev.map(d =>
              d.address === disconnectedDevice.address
                ? { ...d, connected: false }
                : d
            )
          );
          console.log(
            `Rozłączono urządzenie: ${
              disconnectedDevice.name || disconnectedDevice.address
            }`
          );
        }
      );

      return () => {
        subscription.remove();
      };
    }, []);

    const cleanup = () => {
      try {
        if (
          BluetoothSerial &&
          typeof BluetoothSerial.cancelDiscovery === 'function'
        ) {
          try {
            BluetoothSerial.cancelDiscovery();
          } catch (error) {
            console.warn(
              'Błąd podczas anulowania wyszukiwania Bluetooth:',
              error
            );
          }
        }

        Object.values(soundObjects).forEach(sound => {
          if (sound) {
            sound.release();
          }
        });
      } catch (error) {
        console.warn('Błąd podczas czyszczenia zasobów:', error);
      }
    };
    const prepareSounds = async () => {
      if (Platform && Platform.OS === 'web') {
        console.log('Odtwarzanie dźwięku na Web może nie być wspierane');
        return;
      }

      try {
        await Audio.setIsEnabledAsync(true);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });

        const loadedSounds: { [key: string]: Audio.Sound } = {};
        let successCount = 0;
        let failureCount = 0;

        for (const soundItem of sounds) {
          try {
            const { sound } = await Audio.Sound.createAsync(soundItem.file, {
              shouldPlay: false,

              ...(Platform.OS !== 'web' && {
                androidImplementation: 'MediaPlayer',
                progressUpdateIntervalMillis: 1000,
              }),
            });
            loadedSounds[soundItem.name] = sound;
            successCount++;
            console.log(`✅ Loaded sound: ${soundItem.name}`);
          } catch (soundError) {
            failureCount++;
            console.warn(
              `❌ Failed to load sound ${soundItem.name}:`,
              soundError
            );
          }
        }

        setSoundObjects(loadedSounds);
        console.log(
          `🎵 Audio preparation complete: ${successCount} loaded, ${failureCount} failed`
        );

        if (failureCount > 0) {
          setError(
            `Załadowano ${successCount}/${sounds.length} dźwięków. ${failureCount} nie udało się załadować.`
          );
          setShowConnectionStatus(true);
        }
      } catch (err) {
        console.error('❌ Critical error in audio preparation:', err);
        setError(
          'Nie można załadować plików dźwiękowych. Sprawdź połączenie sieciowe.'
        );
        setShowConnectionStatus(true);
      }
    };

    const checkDeviceProfiles = async (
      deviceAddress: string
    ): Promise<string[]> => {
      try {
        if (Platform.OS === 'android') {
          const profiles = await nativeBluetoothModule.getDeviceProfiles(
            deviceAddress
          );
          return profiles || [];
        }
        return [];
      } catch (error) {
        console.log('Błąd sprawdzania profili:', error);
        return [];
      }
    };

    const handlePlaySound = async (soundItem: (typeof sounds)[0]) => {
      try {
        console.log(`[DEBUG] Rozpoczynam odtwarzanie '${soundItem.name}'`);

        if (!soundObjects[soundItem.name]) {
          console.log('[ERROR] Dźwięk nie został załadowany');
          return;
        }

        const audioDevices = connectedDevices.filter(
          d => d.profiles?.includes('A2DP') || d.profiles?.includes('HFP')
        );

        if (audioDevices.length > 0) {
          console.log(
            `[AUDIO] Odtwarzam lokalnie dla ${audioDevices.length} urządzeń`
          );
          await soundObjects[soundItem.name].replayAsync();
        }

        const sppDevices = connectedDevices.filter(
          d => !d.profiles?.includes('A2DP') && !d.profiles?.includes('HFP')
        );

        if (sppDevices.length > 0) {
          console.log(`[SPP] Wysyłam 'PLAY' do ${sppDevices.length} urządzeń`);
          await Promise.all(
            sppDevices.map(async device => {
              try {
                await BluetoothSerial.writeToDevice(device.address, 'PLAY\n');
                console.log(`[SPP] Wysłano do ${device.address}`);
              } catch (err) {
                console.error(`[SPP] Błąd dla ${device.address}:`, err);
              }
            })
          );
        }

        console.log('[SUKCES] Kompletne wykonanie');
      } catch (err) {
        console.error('[KRYTYCZNY BŁĄD]', err);
      }
    };
    const playSound = async (soundName: string) => {
      if (!soundObjects[soundName]) {
        setError(`Dźwięk ${soundName} nie jest gotowy do odtworzenia`);
        setShowConnectionStatus(true);
        return;
      }

      try {
        await soundObjects[soundName].replayAsync();
        console.log(`Dźwięk ${soundName} odtworzony`);
      } catch (err) {
        console.log(`Błąd odtwarzania dźwięku ${soundName}:`, err);
        setError(`Błąd podczas odtwarzania dźwięku ${soundName}`);
        setShowConnectionStatus(true);
      }
    };

    const sendPlayCommand = async () => {
      if (!selectedSound || connectedDevices.length === 0) return;

      try {
        const activeConnections = connectedDevices.filter(
          device => device.connected
        );

        if (selectedSound && soundObjects[selectedSound.name]) {
          await playSound(selectedSound.name);
        }

        const sendPromises = activeConnections.map(async device => {
          try {
            if (
              device.profiles?.includes('A2DP') ||
              device.profiles?.includes('HFP')
            ) {
              console.log(
                `Pominięto wysyłanie PLAY do urządzenia audio: ${device.name}`
              );
              return;
            } else {
              await BluetoothSerial.writeToDevice(device.address, 'PLAY\n');
              console.log(
                `Komenda PLAY wysłana do ${device.name || device.address}`
              );
            }
          } catch (err) {
            console.log(
              `Błąd wysyłania do ${device.name || device.address}:`,
              err
            );
          }
        });

        await Promise.all(sendPromises);
        console.log('Komendy wysłane do wszystkich urządzeń');
      } catch (err) {
        console.log('Błąd wysyłania komendy PLAY:', err);
        setError('Błąd podczas wysyłania komendy PLAY');
        setShowConnectionStatus(true);
      }
    };

    const disconnectDevice = async (device: Device) => {
      try {
        console.log('Rozpoczynanie pełnego rozłączania:', device.name);

        for (const sound of Object.values(soundObjects)) {
          if (sound) {
            await sound.pauseAsync();
          }
        }
        await Audio.setIsEnabledAsync(false);

        if (Platform.OS === 'android') {
          await nativeBluetoothModule.disconnectAudio();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await BluetoothSerial.disconnectFromDevice(device.address);

        await new Promise(resolve => setTimeout(resolve, 500));

        setConnectedDevices(prev =>
          prev.filter(d => d.address !== device.address)
        );

        setDevices(prev =>
          prev.map(d =>
            d.address === device.address ? { ...d, connected: false } : d
          )
        );

        console.log('Pełne rozłączenie zakończone:', device.name);
      } catch (err) {
        console.error('Błąd rozłączania:', err);
        setError('Rozłączenie nie powiodło się. Sprawdź ustawienia Bluetooth.');
        setShowConnectionStatus(true);
      }
    };

    const disconnectAllDevices = async () => {
      try {
        await Audio.setIsEnabledAsync(false);

        if (Platform.OS === 'android') {
          nativeBluetoothModule.disconnectAudio();
        }

        const results = await Promise.allSettled(
          connectedDevices.map(device =>
            BluetoothSerial.disconnectFromDevice(device.address)
          )
        );

        const failedDevices = results
          .map((result, index) => ({ result, device: connectedDevices[index] }))
          .filter(({ result }) => result.status === 'rejected');

        setConnectedDevices([]);
        setDevices(prev => prev.map(d => ({ ...d, connected: false })));

        if (failedDevices.length > 0) {
          const names = failedDevices.map(
            ({ device }) => device.name || device.address
          );
          setError(`Nie udało się rozłączyć: ${names.join(', ')}`);
        } else {
          setError('Wszystkie urządzenia rozłączone');
        }

        await Audio.setIsEnabledAsync(true);
      } catch (err) {
        console.error('Błąd rozłączania wszystkich:', err);
        setError('Błąd podczas rozłączania wszystkich urządzeń');
      } finally {
        setShowConnectionStatus(true);
      }
    };

    const initBluetooth = async () => {
      try {
        if (!BluetoothSerial) {
          setError('Moduł Bluetooth nie jest dostępny');
          return false;
        }
        const enabled = await BluetoothSerial.isBluetoothEnabled();
        if (!enabled) {
          const result = await BluetoothSerial.requestBluetoothEnabled();
          if (!result) {
            setError('Bluetooth musi być włączony');
            setShowConnectionStatus(true);
            return false;
          }
        }
        return true;
      } catch (err) {
        const error = err as Error;
        setError('Błąd inicjalizacji Bluetooth: ' + error.message);
        setShowConnectionStatus(true);
        return false;
      }
    };

    const scanDevices = async () => {
      try {
        const isReady = await initBluetooth();
        if (!isReady) return;
        if (!BluetoothSerial) {
          setError('Moduł Bluetooth nie jest dostępny');
          setIsScanning(false);
          setRefreshing(false);
          return;
        }
        setIsScanning(true);
        setRefreshing(true);
        setError(null);
        setDevices([]);
        const bondedDevices = await BluetoothSerial.getBondedDevices();
        const enhancedBondedDevices = bondedDevices.map(device => ({
          id: device.address,
          name: device.name,
          address: device.address,
          connected: false,
          isComputer: isLikelyComputer(device),
        }));
        setDevices(enhancedBondedDevices);
        const discoverySubscription = BluetoothSerial.onDeviceDiscovered(
          device => {
            setDevices(prevDevices => {
              const exists = prevDevices.some(
                d => d.address === device.address
              );
              if (exists) return prevDevices;
              return [
                ...prevDevices,
                {
                  id: device.address,
                  name: device.name,
                  address: device.address,
                  connected: false,
                  isComputer: isLikelyComputer(device),
                },
              ];
            });
          }
        );
        await BluetoothSerial.startDiscovery();
        setTimeout(async () => {
          try {
            if (BluetoothSerial) {
              await BluetoothSerial.cancelDiscovery();
            }
            if (discoverySubscription) {
              discoverySubscription.remove();
            }
          } catch (error) {
            console.warn('Błąd podczas anulowania wyszukiwania:', error);
          } finally {
            setIsScanning(false);
            setRefreshing(false);
          }
        }, 5000);
      } catch (err) {
        const error = err as Error;
        setError('Błąd skanowania: ' + error.message);
        setShowConnectionStatus(true);
        setIsScanning(false);
        setRefreshing(false);
      }
    };

    const isLikelyComputer = (device: { name: string | null }): boolean => {
      if (!device.name) return false;
      const computerKeywords = [
        'pc',
        'laptop',
        'notebook',
        'computer',
        'desktop',
      ];
      const name = device.name.toLowerCase();
      return computerKeywords.some(keyword => name.includes(keyword));
    };

    const connectToDevice = async (device: Device) => {
      try {
        if (!BluetoothSerial) {
          setError('Moduł Bluetooth nie jest dostępny');
          return;
        }

        const isAlreadyConnected = connectedDevices.some(
          d => d.address === device.address
        );
        if (isAlreadyConnected) {
          setError(`Już połączono z ${device.name || device.address}`);
          setShowConnectionStatus(true);
          return;
        }

        const profiles = await checkDeviceProfiles(device.address);
        console.log('Dostępne profile:', profiles);

        let connection;
        if (profiles.includes('A2DP') || profiles.includes('HFP')) {
          console.log('Próba połączenia przez natywny moduł...');
          const result = await nativeBluetoothModule.connectToDevice(
            device.address
          );
          connection = result === 'SUCCESS';
        } else {
          console.log('Próba standardowego połączenia SPP...');
          connection = await BluetoothSerial.connectToDevice(device.address);
        }

        if (connection) {
          await Audio.setIsEnabledAsync(true);

          const updatedDevice = {
            ...device,
            connected: true,
            profiles: profiles,
          };

          setConnectedDevices(prev => [...prev, updatedDevice]);
          setDevices(prev =>
            prev.map(d => (d.id === device.id ? updatedDevice : d))
          );

          setError(`Połączono z ${device.name || device.address}`);
          setShowConnectionStatus(true);

          BluetoothSerial.onDeviceDisconnected(disconnectedDevice => {
            if (disconnectedDevice.address === device.address) {
              setConnectedDevices(prev =>
                prev.filter(d => d.address !== disconnectedDevice.address)
              );
              setDevices(prev =>
                prev.map(d =>
                  d.id === disconnectedDevice.address
                    ? { ...d, connected: false }
                    : d
                )
              );
            }
          });
        } else {
          setError(`Nie udało się połączyć z ${device.name || device.address}`);
          setShowConnectionStatus(true);
        }
      } catch (err) {
        const error = err as Error;
        console.error('Pełny błąd połączenia:', error);
        setError('Błąd połączenia: ' + error.message);
        setShowConnectionStatus(true);

        if (
          error.message.includes('socket') ||
          error.message.includes('timeout')
        ) {
          try {
            console.log('Próba alternatywnej metody połączenia...');
            await nativeBluetoothModule.connectToDevice(device.address);
            await Audio.setIsEnabledAsync(true);

            const updatedDevice = {
              ...device,
              connected: true,
              profiles: ['A2DP/HFP (alternatywne połączenie)'],
            };

            setConnectedDevices(prev => [...prev, updatedDevice]);
            setDevices(prev =>
              prev.map(d => (d.id === device.id ? updatedDevice : d))
            );

            setError(
              `Połączono z ${
                device.name || device.address
              } (alternatywna metoda)`
            );
            setShowConnectionStatus(true);
          } catch (altErr) {
            console.error('Błąd alternatywnej metody:', altErr);
          }
        }
      }
    };

    const renderSoundItem = ({ item }: { item: (typeof sounds)[0] }) => (
      <TouchableOpacity
        style={[
          styles.soundItem,
          selectedSound?.name === item.name && styles.selectedSoundItem,
        ]}
        onPress={() => {
          setSelectedSound(item);
          setIsSoundListExpanded(false);
        }}
      >
        <Text style={styles.soundItemText}>{item.name}</Text>
      </TouchableOpacity>
    );

    const renderDeviceItem = ({ item }: { item: Device }) => (
      <TouchableOpacity
        style={[
          styles.deviceCard,
          {
            backgroundColor: colors.surface,
            shadowColor: colors.shadow,
          },
          item.connected && {
            borderLeftWidth: 6,
            borderLeftColor: colors.success,
          },
          item.isComputer && {
            borderRightWidth: 6,
            borderRightColor: colors.tertiary,
          },
        ]}
        onPress={() => connectToDevice(item)}
      >
        <View style={styles.deviceInfo}>
          <Text
            style={[styles.deviceName, { color: colors.onSurface }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name || 'Nieznane urządzenie'}
          </Text>
          <Text style={[styles.deviceType, { color: colors.onSurfaceVariant }]}>
            {item.isComputer ? 'Komputer' : 'Inne urządzenie'}
          </Text>
          <Text
            style={[styles.deviceAddress, { color: colors.onSurfaceVariant }]}
          >
            {item.address}
          </Text>
        </View>
        <View style={styles.deviceStatus}>
          {item.connected ? (
            <TouchableOpacity onPress={() => disconnectDevice(item)}>
              <Text style={[styles.connectedText, { color: colors.error }]}>
                Rozłącz
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.connectText, { color: colors.primary }]}>
              Dotknij aby połączyć
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={{ color: colors.text }}>Bluetooth</Text>
          <Button
            title={isScanning ? 'Skanowanie...' : 'Skanuj urządzenia'}
            onPress={scanDevices}
            disabled={isScanning}
            color={colors.primary}
          />
        </View>

        {error && showConnectionStatus && (
          <View
            style={[styles.errorContainer, { backgroundColor: colors.error }]}
          >
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {connectedDevices.length > 0 && (
          <View
            style={[
              styles.connectedBanner,
              { backgroundColor: colors.success },
            ]}
          >
            <Text style={styles.connectedBannerText}>Połączono z:</Text>
            {connectedDevices.map(device => (
              <View key={device.id} style={styles.connectedDeviceItem}>
                <Text style={styles.connectedBannerText}>
                  {device.name || device.address}
                </Text>
                <Text style={styles.connectionStatus}>
                  {device.connected ? 'Połączono' : 'Rozłączony'}
                </Text>
                <TouchableOpacity
                  onPress={() => disconnectDevice(device)}
                  style={[
                    styles.disconnectButton,
                    { backgroundColor: colors.error },
                  ]}
                >
                  <Text style={styles.disconnectButtonText}>Rozłącz</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.soundSelection}>
              <TouchableOpacity
                onPress={() => setIsSoundListExpanded(!isSoundListExpanded)}
                style={[
                  styles.soundDropdownHeader,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
                <Text
                  style={[
                    styles.soundSelectionTitle,
                    { color: colors.onPrimaryContainer },
                  ]}
                >
                  {selectedSound ? selectedSound.name : 'Wybierz dźwięk ▼'}
                </Text>
              </TouchableOpacity>

              {isSoundListExpanded && (
                <ScrollView
                  style={[
                    styles.soundDropdownList,
                    { backgroundColor: colors.surfaceVariant },
                  ]}
                  contentContainerStyle={styles.soundListContent}
                  nestedScrollEnabled={true}
                >
                  {sounds.map(item => (
                    <TouchableOpacity
                      key={item.name}
                      style={[
                        styles.soundItem,
                        { borderBottomColor: colors.outline },
                        selectedSound?.name === item.name && {
                          backgroundColor: colors.secondaryContainer,
                        },
                      ]}
                      onPress={() => {
                        setSelectedSound(item);
                        setIsSoundListExpanded(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.soundItemText,
                          { color: colors.onSurface },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <View style={styles.buttonColumn}>
                <Button
                  title="Odtwórz dźwięk"
                  onPress={() => selectedSound && playSound(selectedSound.name)}
                  color={colors.secondary}
                  disabled={!selectedSound}
                />
                <Button
                  title="Odtwórz na wszystkich"
                  onPress={sendPlayCommand}
                  color={colors.primary}
                  disabled={!selectedSound}
                />
                <Button
                  title="Rozłącz wszystkie"
                  onPress={disconnectAllDevices}
                  color={colors.error}
                />
              </View>
            </View>
          </View>
        )}

        <FlatList
          data={devices}
          renderItem={renderDeviceItem}
          keyExtractor={item => item.address}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={scanDevices}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text
                style={[styles.emptyText, { color: colors.onSurfaceVariant }]}
              >
                {isScanning
                  ? 'Wyszukiwanie urządzeń...'
                  : 'Nie znaleziono urządzeń. Pociągnij w dół aby odświeżyć lub naciśnij Skanuj.'}
              </Text>
            </View>
          }
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
  connectedBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  connectedBannerText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  connectedDeviceItem: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  disconnectButton: {
    marginLeft: 10,
    padding: 5,
    borderRadius: 5,
  },
  disconnectButtonText: {
    color: 'white',
  },
  soundSelection: {
    marginTop: 10,
  },
  soundSelectionTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  soundDropdownHeader: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  soundDropdownList: {
    maxHeight: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  soundListContent: {
    paddingHorizontal: 8,
  },
  soundItem: {
    padding: 12,
    borderBottomWidth: 1,
    width: '100%',
  },
  soundItemText: {
    fontSize: 16,
  },
  buttonColumn: {
    gap: 8,
    marginTop: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  deviceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  deviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  deviceType: {
    fontSize: 14,
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 12,
  },
  deviceStatus: {
    alignItems: 'flex-end',
  },
  connectedText: {
    fontWeight: '500',
  },
  connectText: {},
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },

  selectedSoundItem: {
    backgroundColor: '#e0e0e0',
  },
});

export default BluetoothComponent;
