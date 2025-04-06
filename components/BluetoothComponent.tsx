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

export const BluetoothComponent = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sound, setSound] = useState<Sound | null>(null);

  useEffect(() => {
    initBluetooth();
    prepareSound();
    
    return () => {
      try {
        // Dodajemy sprawdzenie czy BluetoothSerial istnieje przed wywołaniem metod
        if (BluetoothSerial && typeof BluetoothSerial.cancelDiscovery === 'function') {
          try {
            BluetoothSerial.cancelDiscovery();
          } catch (error) {
            console.warn('Błąd podczas anulowania wyszukiwania Bluetooth:', error);
          }
        }
        // Bezpieczne zwalnianie zasobów dźwiękowych
        if (sound) {
          sound.release();
        }
      } catch (error) {
        console.warn('Błąd podczas czyszczenia zasobów:', error);
      }
    };
  }, []);

  const prepareSound = async () => {
    // Sprawdzenie czy obiekt Platform istnieje i czy ma właściwość OS
    if (Platform && Platform.OS === 'web') {
      console.log('Odtwarzanie dźwięku na Web może nie być wspierane');
    }
  
    try {
      const { sound: loadedSound } = await Audio.Sound.createAsync(
        require('../assets/kaszel.mp3') // 🟢 Upewnij się, że ścieżka jest poprawna
      );
      setSound(loadedSound);
      console.log('Dźwięk przygotowany');
    } catch (err) {
      console.log('Błąd przygotowania dźwięku:', err);
      setError('Nie można załadować pliku dźwiękowego');
    }
  };
  
  const playSound = async () => {
    if (!sound) {
      setError('Dźwięk nie jest gotowy do odtworzenia');
      return;
    }
  
    try {
      await sound.replayAsync(); // używamy replayAsync dla powtórnego odtworzenia
      console.log('Dźwięk odtworzony');
    } catch (err) {
      console.log('Błąd odtwarzania dźwięku:', err);
      setError('Błąd podczas odtwarzania dźwięku');
    }
  };
  
  const initBluetooth = async () => {
    try {
      // Sprawdzenie czy BluetoothSerial istnieje
      if (!BluetoothSerial) {
        setError('Moduł Bluetooth nie jest dostępny');
        return false;
      }

      const enabled = await BluetoothSerial.isBluetoothEnabled();
      if (!enabled) {
        const result = await BluetoothSerial.requestBluetoothEnabled();
        if (!result) {
          setError('Bluetooth musi być włączony');
          return false;
        }
      }
      return true;
    } catch (err) {
      const error = err as Error;
      setError('Błąd inicjalizacji Bluetooth: ' + error.message);
      return false;
    }
  };

  const scanDevices = async () => {
    try {
      const isReady = await initBluetooth();
      if (!isReady) return;

      // Dodatkowe sprawdzenie czy BluetoothSerial istnieje
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
      setConnectedDevice(null);

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
      // Sprawdzenie czy BluetoothSerial istnieje
      if (!BluetoothSerial) {
        setError('Moduł Bluetooth nie jest dostępny');
        return;
      }

      if (connectedDevice) {
        try {
          await BluetoothSerial.disconnectFromDevice(connectedDevice.address);
        } catch (disconnectError) {
          console.warn('Błąd przy rozłączaniu: ', disconnectError);
        }
      }

      const connection = await BluetoothSerial.connectToDevice(device.address);
      
      if (connection) {
        setConnectedDevice(device);
        setDevices(prevDevices => 
          prevDevices.map(d => ({
            ...d,
            connected: d.address === device.address
          }))
        );
        setError(null);
      } else {
        setError(`Nie udało się połączyć z ${device.name || device.address}`);
      }
    } catch (err) {
      const error = err as Error;
      setError('Błąd połączenia: ' + error.message);
    }
  };

  const renderDeviceItem = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={[
        styles.deviceCard,
        item.connected && styles.connectedCard,
        item.isComputer && styles.computerCard
      ]}
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
          <Text style={styles.connectedText}>Połączono</Text>
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

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {connectedDevice && (
        <View style={styles.connectedBanner}>
          <Text style={styles.connectedBannerText}>
            Połączono z: {connectedDevice.name || connectedDevice.address}
          </Text>
          <Button
            title="Odtwórz dźwięk kaszlu"
            onPress={playSound}
            color="#34C759"
          />
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

// Style pozostają bez zmian
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
    marginBottom: 8,
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
    color: '#34C759',
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
