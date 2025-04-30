import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, Platform, PermissionsAndroid, Text, Button, ActivityIndicator
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { decode as atob } from 'base-64';

const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const CHARACTERISTIC_UUID = 'abcd1234-5678-90ab-cdef-1234567890ab';
const DEVICE_NAME = 'ESP32C3_RGB';

export default function ColorSensor() {
  const [manager] = useState(() => new BleManager());
  const [device, setDevice] = useState<Device | null>(null);
  const [color, setColor] = useState({ r: 0, g: 0, b: 0 });
  const [status, setStatus] = useState<'idle' | 'scanning' | 'connected' | 'monitoring' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      ];

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      const allGranted = permissions.every(p => granted[p] === PermissionsAndroid.RESULTS.GRANTED);

      if (!allGranted) throw new Error('Brak wymaganych uprawnień BLE');
    }
  };

  const startScan = async () => {
    setError(null);
    setStatus('scanning');
    try {
      await requestPermissions();

      manager.startDeviceScan(
        [SERVICE_UUID],
        { allowDuplicates: false },
        (err, dev) => {
          if (err) {
            setError(err.message);
            setStatus('error');
            manager.stopDeviceScan();
            return;
          }

          if (dev?.name) {
            console.log("Znaleziono urządzenie:", dev.name, dev.id);
          }

          if (dev?.name === DEVICE_NAME) {
            console.log("Łączenie z urządzeniem:", dev.name);
            manager.stopDeviceScan();
            dev.connect()
              .then(d => {
                setDevice(d);
                setStatus('connected');
                return d.discoverAllServicesAndCharacteristics();
              })
              .catch(e => {
                setError(e.message);
                setStatus('error');
              });
          }
        }
      );
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  };

  const startMonitor = () => {
    if (!device) return;
    setStatus('monitoring');
    device.monitorCharacteristicForService(
      SERVICE_UUID, CHARACTERISTIC_UUID,
      (err, characteristic) => {
        if (err) {
          setError(err.message);
          setStatus('error');
          return;
        }
        if (characteristic?.value) {
          try {
            const raw = atob(characteristic.value);
            const bytes = new Uint8Array(raw.split('').map((c: string): number => c.charCodeAt(0)));
            const [r16, g16, b16] = [
              (bytes[0] << 8) | bytes[1],
              (bytes[2] << 8) | bytes[3],
              (bytes[4] << 8) | bytes[5]
            ];
            setColor({ r: r16 >> 8, g: g16 >> 8, b: b16 >> 8 });
          } catch (parseErr) {
            console.error("Błąd parsowania danych:", parseErr);
          }
        }
      }
    );
  };

  useEffect(() => {
    return () => {
      if (device) manager.cancelDeviceConnection(device.id);
      manager.destroy();
    };
  }, [device]);

  return (
    <View style={styles.container}>
      <Button title="Połącz z czujnikiem" onPress={startScan} />
      {status === 'scanning' && <ActivityIndicator />}
      {status === 'connected' && <Button title="Start monitorowania" onPress={startMonitor} />}
      {status === 'monitoring' && (
        <View style={[styles.colorBox, { backgroundColor: `rgb(${color.r},${color.g},${color.b})` }]} />
      )}
      <Text>R: {color.r}  G: {color.g}  B: {color.b}</Text>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 16 },
  colorBox: { width: 100, height: 100, marginVertical: 8, borderWidth: 1, borderColor: '#000' },
  error: { color: 'red', marginTop: 8 },
});