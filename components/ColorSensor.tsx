// components/ColorSensor.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Text,
  Button,
  ActivityIndicator,
} from 'react-native';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { decode as atob } from 'base-64';

const SERVICE_UUID        = '12345678-1234-1234-1234-1234567890ab';
const CHARACTERISTIC_UUID = 'abcd1234-5678-90ab-cdef-1234567890ab';
const DEVICE_NAME         = 'ESP32C3_RGB';

export default function ColorSensor() {
  const [manager]    = useState(() => new BleManager());
  const [bleState, setBleState] = useState<string>('Unknown');
  const [device, setDevice] = useState<Device | null>(null);
  const [sub, setSub]     = useState<Subscription | null>(null);
  const [color, setColor] = useState({ r: 0, g: 0, b: 0 });
  const [status, setStatus] = useState<'idle'|'scanning'|'connected'|'monitoring'|'error'>('idle');
  const [error, setError] = useState<string|null>(null);

  // 1) Śledzimy stan BLE adaptera
  useEffect(() => {
    const stateSub = manager.onStateChange(state => {
      console.log('[BLE] State changed:', state);
      setBleState(state);
    }, true);
    return () => stateSub.remove();
  }, [manager]);

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

  // 2) Skan & łączenie & monitoring
  const scanAndMonitor = async () => {
    setError(null);
    setStatus('scanning');
    console.log('[BLE] Starting scan…');
    try {
      await requestPermissions();

      // Poczekaj na „PoweredOn”
      if (bleState !== 'PoweredOn') {
        await new Promise<void>(resolve => {
          const sub = manager.onStateChange(s => {
            if (s === 'PoweredOn') {
              sub.remove();
              resolve();
            }
          }, true);
        });
      }

      manager.startDeviceScan(null, { allowDuplicates: false }, (err, dev) => {
        if (err) {
          console.warn('[BLE] Scan error', err);
          setError(err.message);
          setStatus('error');
          manager.stopDeviceScan();
          return;
        }
        if (!dev) return;
        // Debug log
        console.log('[BLE] Found device:', {
          name: dev.name,
          localName: dev.localName,
          id: dev.id,
          uuids: dev.serviceUUIDs,
        });

        const nameMatches = dev.name === DEVICE_NAME || dev.localName === DEVICE_NAME;
        const hasService = dev.serviceUUIDs?.includes(SERVICE_UUID);
        if (nameMatches || hasService) {
          console.log('[BLE] Matching device, connecting…');
          manager.stopDeviceScan();
          dev.connect()
          .then(d => {
          setDevice(d);
          setStatus('connected');

         d.onDisconnected((error, device) => {
        console.log(`Device ${device.id} was disconnected`, error);
        setStatus('idle');
        setDevice(null);
        });

        return d.discoverAllServicesAndCharacteristics();
        })
            .then(d => {
              console.log('[BLE] Discovered services, start monitoring');
              setStatus('monitoring');
              const subscription = d.monitorCharacteristicForService(
                SERVICE_UUID,
                CHARACTERISTIC_UUID,
                (err, char) => {
                  if (err) {
                    console.warn('[BLE] Monitor error', err);
                    setError(err.message);
                    setStatus('error');
                    return;
                  }
                  if (char?.value) {
                    const raw = atob(char.value);
                    const bytes = new Uint8Array(
                      Array.from(raw, (c: string) => c.charCodeAt(0))
                    );
                    const r16 = (bytes[0] << 8) | bytes[1];
                    const g16 = (bytes[2] << 8) | bytes[3];
                    const b16 = (bytes[4] << 8) | bytes[5];
                    setColor({ r: r16, g: g16, b: b16 });
                    console.log('[BLE] RGB update:', r16, g16, b16);
                  }
                }
              );
              setSub(subscription);
            })
            .catch(e => {
              console.error('[BLE] Connection error', e);
              setError(e.message);
              setStatus('error');
            });
        }
      });
    } catch (e) {
      console.error('[BLE] Fatal error', e);
      setError((e as Error).message);
      setStatus('error');
    }
  };

  useEffect(() => {
    return () => {
      console.log('[BLE] Cleanup on unmount');
      manager.stopDeviceScan();
      sub?.remove();
      if (device) {
        manager.cancelDeviceConnection(device.id).catch(() => {});
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>Status adaptera: {bleState}</Text>
      <Text>Status logiczny: {status}</Text>
      {status === 'idle' && (
        <Button title="Połącz i monitoruj" onPress={scanAndMonitor} />
      )}
      {status === 'scanning' && <ActivityIndicator size="small" />}
      {(status === 'connected' || status === 'monitoring') && (
        <View
          style={[
            styles.colorBox,
            { backgroundColor: `rgb(${color.r},${color.g},${color.b})` },
          ]}
        />
      )}
      <Text>R: {color.r}  G: {color.g}  B: {color.b}</Text>
      {error && <Text style={styles.error}>Błąd: {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 16 },
  colorBox: { width: 100, height: 100, marginVertical: 8, borderWidth: 1, borderColor: '#000' },
  error: { color: 'red', marginTop: 8 },
});