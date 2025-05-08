// components/ColorSensor.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text,
  Button,
  ActivityIndicator,
} from 'react-native';
import { decode as atob } from 'base-64';
// typy dla BLE
import type {
  BleManager as BleManagerType,
  Device,
  Subscription,
  Characteristic,
} from 'react-native-ble-plx';

const SERVICE_UUID        = '12345678-1234-1234-1234-1234567890ab';
const CHARACTERISTIC_UUID = 'abcd1234-5678-90ab-cdef-1234567890ab';
const DEVICE_NAME         = 'ESP32C3_RGB';

export default function ColorSensor() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text>Color sensor is not available on web.</Text>
      </View>
    );
  }

  // dynamiczny import BLE managera
  const { BleManager } = require('react-native-ble-plx') as {
    BleManager: new () => BleManagerType;
  };

  const [manager]    = useState<BleManagerType>(() => new BleManager());
  const [bleState, setBleState] = useState<string>('Unknown');
  const [device, setDevice] = useState<Device | null>(null);
  const [sub, setSub]     = useState<Subscription | null>(null);
  const [color, setColor] = useState<{ r: number; g: number; b: number }>({ r: 0, g: 0, b: 0 });
  const [status, setStatus] = useState<'idle'|'scanning'|'connected'|'monitoring'|'error'>('idle');
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    const stateSub = manager.onStateChange((state: string) => {
      setBleState(state);
    }, true);
    return () => stateSub.remove();
  }, [manager]);

  // --- TUTAJ dynamicznie ładujemy PermissionsAndroid z react-native ---
  const requestPermissions = async (): Promise<void> => {
    if (Platform.OS === 'android') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PermissionsAndroid } = require('react-native');
      type Permission = typeof PermissionsAndroid.PERMISSIONS[keyof typeof PermissionsAndroid.PERMISSIONS];
      const perms: Permission[] = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
      if (Platform.Version >= 31) {
        perms.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN as Permission,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT as Permission
        );
      }
      const granted = await PermissionsAndroid.requestMultiple(perms);
      const allGranted = perms.every(p => granted[p] === PermissionsAndroid.RESULTS.GRANTED);
      if (!allGranted) {
        throw new Error('Brak wymaganych uprawnień BLE');
      }
    }
  };

  const scanAndMonitor = async (): Promise<void> => {
    setError(null);
    setStatus('scanning');
    try {
      await requestPermissions();

      if (bleState !== 'PoweredOn') {
        await new Promise<void>(resolve => {
          const subState = manager.onStateChange((s: string) => {
            if (s === 'PoweredOn') {
              subState.remove();
              resolve();
            }
          }, true);
        });
      }

      manager.startDeviceScan(null, { allowDuplicates: false }, (err: Error | null, dev: Device | null) => {
        if (err) {
          setError(err.message);
          setStatus('error');
          manager.stopDeviceScan();
          return;
        }
        if (!dev) return;

        const nameMatches = dev.name === DEVICE_NAME || dev.localName === DEVICE_NAME;
        const hasService = dev.serviceUUIDs?.includes(SERVICE_UUID) ?? false;
        if (nameMatches || hasService) {
          manager.stopDeviceScan();
          dev.connect()
            .then((d: Device) => {
              setDevice(d);
              setStatus('connected');
              d.onDisconnected((disconnectError: Error | null) => {
                setStatus('idle');
                setDevice(null);
              });
              return d.discoverAllServicesAndCharacteristics();
            })
            .then((d: Device) => {
              setStatus('monitoring');
              const subscription = d.monitorCharacteristicForService(
                SERVICE_UUID,
                CHARACTERISTIC_UUID,
                (monErr: Error | null, char: Characteristic | null) => {
                  if (monErr) {
                    setError(monErr.message);
                    setStatus('error');
                    return;
                  }
                  if (char?.value) {
                    const raw = atob(char.value);
                    const bytes = new Uint8Array(Array.from(raw, (c: string) => c.charCodeAt(0)));
                    const r16 = (bytes[0] << 8) | bytes[1];
                    const g16 = (bytes[2] << 8) | bytes[3];
                    const b16 = (bytes[4] << 8) | bytes[5];
                    setColor({ r: r16, g: g16, b: b16 });
                  }
                }
              );
              setSub(subscription);
            })
            .catch((e: Error) => {
              setError(e.message);
              setStatus('error');
            });
        }
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  };

  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
      sub?.remove();
      if (device) {
        manager.cancelDeviceConnection(device.id).catch(() => {});
      }
    };
  }, [manager, sub, device]);

  return (
    <View style={styles.container}>
      <Text>Status adaptera: {bleState}</Text>
      <Text>Status logiczny: {status}</Text>
      {status === 'idle' && <Button title="Połącz i monitoruj" onPress={scanAndMonitor} />}
      {status === 'scanning' && <ActivityIndicator size="small" />}
      {(status === 'connected' || status === 'monitoring') && (
        <View style={[styles.colorBox, { backgroundColor: `rgb(${color.r},${color.g},${color.b})` }]} />
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