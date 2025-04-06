import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Button, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity,
  RefreshControl,
  Platform
} from 'react-native';
import BluetoothSerial from 'react-native-bluetooth-classic';
import Sound from 'react-native-sound';
import { Audio } from 'expo-av';

interface Device {
  id: string;
  name: string | null;
  address: string;
  connected: boolean;
  isComputer: boolean;
}

const BluetoothComponent = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);

  useEffect(() => {
    initBluetooth();
    prepareSound();
    
    return () => {
      BluetoothSerial.cancelDiscovery();
      if (sound) {
        sound.unloadAsync().catch((err) => console.error('Error unloading sound:', err));
      }
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

  const prepareSound = async () => {
    if (Platform.OS === 'web') {
      console.log('Odtwarzanie dźwięku na Web może nie być wspierane');
      return;
    }
  
    try {
      const { sound: loadedSound } = await Audio.Sound.createAsync(
        require('../assets/kaszel.mp3') 
      );
      setSound(loadedSound);
      console.log('Dźwięk przygotowany');
    } catch (err) {
      console.log('Błąd przygotowania dźwięku:', err);
      setError('Nie można załadować pliku dźwiękowego');
      setShowConnectionStatus(true);
    }
  };
  
  const playSound = async () => {
    if (!sound) {
      setError('Dźwięk nie jest gotowy do odtworzenia');
      setShowConnectionStatus(true);
      return;
    }
  
    try {
      await sound.replayAsync(); 
      console.log('Dźwięk odtworzony');
    } catch (err) {
      console.log('Błąd odtwarzania dźwięku:', err);
      setError('Błąd podczas odtwarzania dźwięku');
      setShowConnectionStatus(true);
    }
  };

  const disconnectDevice = async (device: Device) => {
    try {
      console.log('Rozpoczynamy rozłączanie z:', device.address);
      
      // Najpierw próbujemy fizycznie rozłączyć urządzenie
      const disconnected = await BluetoothSerial.disconnectFromDevice(device.address);
      
      if (disconnected) {
        console.log(`Fizycznie rozłączono z urządzeniem: ${device.name || device.address}`);
        
        // Dopiero po potwierdzeniu rozłączenia aktualizujemy stan
        setConnectedDevices(prevDevices => prevDevices.filter(d => d.id !== device.id));
        setDevices(prevDevices =>
          prevDevices.map(d => (d.id === device.id ? { ...d, connected: false } : d))
        );
        
        setError(`Rozłączono z urządzeniem: ${device.name || device.address}`);
      } else {
        console.log('Nie udało się fizycznie rozłączyć z urządzeniem');
        setError('Nie udało się rozłączyć - spróbuj ponownie');
      }
      
      setShowConnectionStatus(true);
      
      // Dodatkowe sprawdzenie stanu połączenia po 2 sekundach
      setTimeout(async () => {
        try {
          const isConnected = await BluetoothSerial.isDeviceConnected(device.address);
          if (isConnected) {
            console.log('UWAGA: Urządzenie nadal jest połączone na poziomie systemowym');
            setError('Urządzenie nadal połączone - wymagana ręczna interwencja');
            setShowConnectionStatus(true);
          }
        } catch (checkError) {
          console.log('Błąd podczas sprawdzania stanu połączenia:', checkError);
        }
      }, 2000);
      
    } catch (err) {
      console.log('Błąd rozłączania: ', err);
      setError(`Błąd rozłączania: ${err instanceof Error ? err.message : 'Nieznany błąd'}`);
      setShowConnectionStatus(true);
    }
  };
  
  const disconnectAllDevices = async () => {
    try {
      // Tworzymy kopię połączonych urządzeń
      const devicesToDisconnect = [...connectedDevices];
      
      // Najpierw próbujemy rozłączyć wszystkie urządzenia
      const disconnectPromises = devicesToDisconnect.map(device => 
        BluetoothSerial.disconnectFromDevice(device.address)
      );
      
      const results = await Promise.all(disconnectPromises);
      const allDisconnected = results.every(result => result);
      
      if (allDisconnected) {
        console.log('Wszystkie urządzenia zostały rozłączone');
        setConnectedDevices([]);
        setDevices(prevDevices =>
          prevDevices.map(d => ({ ...d, connected: false }))
        );
        setError('Rozłączono wszystkie urządzenia');
      } else {
        console.log('Nie wszystkie urządzenia zostały rozłączone');
        setError('Nie udało się rozłączyć wszystkich urządzeń');
      }
      
      setShowConnectionStatus(true);
      
      // Sprawdzenie stanu połączeń po 2 sekundach
      setTimeout(async () => {
        try {
          const checkPromises = devicesToDisconnect.map(device =>
            BluetoothSerial.isDeviceConnected(device.address)
          );
          const connectionStatuses = await Promise.all(checkPromises);
          
          connectionStatuses.forEach((isConnected, index) => {
            if (isConnected) {
              console.log(`UWAGA: Urządzenie ${devicesToDisconnect[index].name} nadal połączone`);
            }
          });
        } catch (checkError) {
          console.log('Błąd podczas sprawdzania stanu połączeń:', checkError);
        }
      }, 2000);
      
    } catch (err) {
      console.log('Błąd podczas rozłączania wszystkich urządzeń:', err);
      setError('Błąd podczas rozłączania wszystkich urządzeń');
      setShowConnectionStatus(true);
    }
  };

  const initBluetooth = async () => {
    try {
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
        isComputer: isLikelyComputer(device)
      }));

      setDevices(enhancedBondedDevices);

      const discoverySubscription = BluetoothSerial.onDeviceDiscovered((device) => {
        setDevices(prevDevices => {
          const exists = prevDevices.some(d => d.address === device.address);
          if (exists) return prevDevices;
          
          return [
            ...prevDevices,
            {
              id: device.address,
              name: device.name,
              address: device.address,
              connected: false,
              isComputer: isLikelyComputer(device)
            }
          ];
        });
      });

      await BluetoothSerial.startDiscovery();

      setTimeout(async () => {
        await BluetoothSerial.cancelDiscovery();
        discoverySubscription.remove();
        setIsScanning(false);
        setRefreshing(false);
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
    const computerKeywords = ['pc', 'laptop', 'notebook', 'computer', 'desktop'];
    const name = device.name.toLowerCase();
    return computerKeywords.some(keyword => name.includes(keyword));
  };

  const connectToDevice = async (device: Device) => {
    try {
      if (connectedDevices.some(d => d.id === device.id)) {
        setError(`Już połączono z ${device.name || device.address}`);
        setShowConnectionStatus(true);
        return;
      }

      const connection = await BluetoothSerial.connectToDevice(device.address);
      
      if (connection) {
        setConnectedDevices(prevDevices => [...prevDevices, { ...device, connected: true }]);
        setDevices(prevDevices => 
          prevDevices.map(d => (d.id === device.id ? { ...d, connected: true } : d))
        );
        setError(`Połączono z ${device.name || device.address}`);
        setShowConnectionStatus(true);
      } else {
        setError(`Nie udało się połączyć z ${device.name || device.address}`);
        setShowConnectionStatus(true);
      }
    } catch (err) {
      const error = err as Error;
      setError('Błąd połączenia: ' + error.message);
      setShowConnectionStatus(true);
    }
  };

  const renderDeviceItem = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={[styles.deviceCard, item.connected && styles.connectedCard, item.isComputer && styles.computerCard]}
      onPress={() => connectToDevice(item)}
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName} numberOfLines={1} ellipsizeMode="tail">
          {item.name || 'Nieznane urządzenie'}
        </Text>
        <Text style={styles.deviceType}>
          {item.isComputer ? 'Komputer' : 'Inne urządzenie'}
        </Text>
        <Text style={styles.deviceAddress}>{item.address}</Text>
      </View>
      <View style={styles.deviceStatus}>
        {item.connected ? (
          <TouchableOpacity onPress={() => disconnectDevice(item)}>
            <Text style={styles.connectedText}>Rozłącz</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.connectText}>Dotknij aby połączyć</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Urządzenia Bluetooth</Text>
        <Button
          title={isScanning ? 'Skanowanie...' : 'Skanuj urządzenia'}
          onPress={scanDevices}
          disabled={isScanning}
          color="#007AFF"
        />
      </View>

      {(error && showConnectionStatus) && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {connectedDevices.length > 0 && (
        <View style={styles.connectedBanner}>
          <Text style={styles.connectedBannerText}>
            Połączono z:
          </Text>
          {connectedDevices.map(device => (
            <View key={device.id} style={styles.connectedDeviceItem}>
              <Text style={styles.connectedBannerText}>
                {device.name || device.address}
              </Text>
              <TouchableOpacity 
                style={styles.disconnectButton}
                onPress={() => disconnectDevice(device)}
              >
                <Text style={styles.disconnectButtonText}>Rozłącz</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.buttonRow}>
            <Button
              title="Odtwórz dźwięk kaszlu"
              onPress={playSound}
              color="#34C759"
              style={styles.button}
            />
            <Button
              title="Rozłącz wszystkie"
              onPress={disconnectAllDevices}
              color="#FF3B30"
              style={styles.button}
            />
          </View>
        </View>
      )}

      <FlatList
        data={devices}
        renderItem={renderDeviceItem}
        keyExtractor={(item) => item.address}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={scanDevices}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {isScanning 
                ? 'Wyszukiwanie urządzeń...' 
                : 'Nie znaleziono urządzeń. Pociągnij w dół aby odświeżyć lub naciśnij Skanuj.'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  errorContainer: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
  connectedBanner: {
    backgroundColor: '#34C759',
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
    backgroundColor: '#FF3B30',
    borderRadius: 5,
  },
  disconnectButtonText: {
    color: 'white',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  deviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  connectedCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#34C759',
  },
  computerCard: {
    borderRightWidth: 6,
    borderRightColor: '#AF52DE',
  },
  deviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  deviceType: {
    fontSize: 14,
    color: '#636366',
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 12,
    color: '#8E8E93',
  },
  deviceStatus: {
    alignItems: 'flex-end',
  },
  connectedText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
  connectText: {
    color: '#007AFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default BluetoothComponent;