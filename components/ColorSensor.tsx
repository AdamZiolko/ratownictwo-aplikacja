// components/ColorSensor.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Text,
  Button,
  ActivityIndicator,
} from 'react-native';
import { decode as atob } from 'base-64';
import {
  BleManager,
  LogLevel,
  type BleManager as BleManagerType,
  type Device,
  type Subscription,
  type Characteristic,
} from 'react-native-ble-plx';
import { useAuth } from '../contexts/AuthContext';

const SERVICE_UUID        = '12345678-1234-1234-1234-1234567890ab';
const CHARACTERISTIC_UUID = 'abcd1234-5678-90ab-cdef-1234567890ab';

export default function ColorSensor() {
  if (Platform.OS === 'web') {
    return null;
  }

  const { user } = useAuth();
  const [manager]    = useState<BleManagerType>(() => new BleManager());
  const [bleState, setBleState] = useState<string>('Unknown');
  const [status, setStatus] = useState<'idle'|'scanning'|'connected'|'monitoring'|'error'>('idle');
  const [error, setError] = useState<string|null>(null);
  const [color, setColor] = useState<{ r: number; g: number; b: number }>({ r: 0, g: 0, b: 0 });

  const deviceRef = useRef<Device|null>(null);
  const subRef    = useRef<Subscription|null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout|null>(null);

  // Monitor BLE adapter state
  useEffect(() => {
    manager.setLogLevel(LogLevel.Verbose);
    const stateSub = manager.onStateChange(s => setBleState(s), true);
    return () => stateSub.remove();
  }, [manager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manager.stopDeviceScan();
      subRef.current?.remove();
      if (deviceRef.current) {
        manager.cancelDeviceConnection(deviceRef.current.id).catch(() => {});
      }
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [manager]);

  // Cleanup on logout
  useEffect(() => {
    if (!user) {
      manager.stopDeviceScan();
      subRef.current?.remove();
      if (deviceRef.current) {
        manager.cancelDeviceConnection(deviceRef.current.id).catch(() => {});
        deviceRef.current = null;
      }
      subRef.current = null;
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      setStatus('idle');
      setError(null);
      setColor({ r: 0, g: 0, b: 0 });
    }
  }, [user, manager]);

  // Permissions (Android)
  const requestPermissions = async (): Promise<void> => {
    if (Platform.OS !== 'android') return;
    const { PermissionsAndroid } = require('react-native');
    const perms = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
    if (Platform.Version >= 31) {
      perms.push(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );
    }
    const granted = await PermissionsAndroid.requestMultiple(perms);
    if (!perms.every(p => granted[p] === PermissionsAndroid.RESULTS.GRANTED)) {
      throw new Error('Brak wymaganych uprawnień BLE');
    }
  };

  // Scan, connect & monitor with 10s timeout
  const scanAndMonitor = async (): Promise<void> => {
    setError(null);
    setStatus('scanning');

    // clear previous
    if (deviceRef.current) {
      subRef.current?.remove();
      await manager.cancelDeviceConnection(deviceRef.current.id).catch(() => {});
      deviceRef.current = null;
      subRef.current = null;
    }

    try {
      await requestPermissions();

      if (bleState !== 'PoweredOn') {
        await new Promise<void>(resolve => {
          const stSub = manager.onStateChange(s => {
            if (s === 'PoweredOn') {
              stSub.remove();
              resolve();
            }
          }, true);
        });
      }

      scanTimeoutRef.current = setTimeout(() => {
        manager.stopDeviceScan();
        setStatus('idle');
        setError('Nie znaleziono urządzenia. Spróbuj ponownie.');
      }, 10000);

      manager.startDeviceScan(
        [SERVICE_UUID],
        { allowDuplicates: false },
        async (err, dev) => {
          if (err) {
            clearTimeout(scanTimeoutRef.current!);
            setError(err.message);
            setStatus('error');
            manager.stopDeviceScan();
            return;
          }
          if (!dev) return;

          clearTimeout(scanTimeoutRef.current!);
          manager.stopDeviceScan();
          setStatus('connected');

          try {
            const d = await dev.connect();
            deviceRef.current = d;
            d.onDisconnected(() => setStatus('idle'));

            await d.discoverAllServicesAndCharacteristics();
            setStatus('monitoring');

            const subscription = d.monitorCharacteristicForService(
              SERVICE_UUID,
              CHARACTERISTIC_UUID,
              (mErr, char) => {
                if (mErr) {
                  setError(mErr.message);
                  setStatus('error');
                  return;
                }
                if (!char?.value) return;
                const raw = atob(char.value);
                const bytes = Uint8Array.from(
                  { length: raw.length },
                  (_, i) => raw.charCodeAt(i)
                );
                const r16 = (bytes[0] << 8) | bytes[1];
                const g16 = (bytes[2] << 8) | bytes[3];
                const b16 = (bytes[4] << 8) | bytes[5];
                setColor({ r: r16, g: g16, b: b16 });
              }
            );
            subRef.current = subscription;
          } catch (e: any) {
            setError(e.message);
            setStatus('error');
          }
        }
      );
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  };

  // UI
  return (
    <View style={styles.container}>
      <Text>Status adaptera: {bleState}</Text>
      <Text>Status logiczny: {status}</Text>

      {status === 'idle' && (
        <Button
          title={error ? "Spróbuj ponownie" : "Połącz i monitoruj"}
          onPress={scanAndMonitor}
        />
      )}

      {status === 'scanning' && <ActivityIndicator size="small" />}

      {(status === 'connected' || status === 'monitoring') && (
        <View style={[styles.colorBox, {
          backgroundColor: `rgb(${color.r},${color.g},${color.b})`
        }]} />
      )}

      <Text>R: {color.r}  G: {color.g}  B: {color.b}</Text>
      {error && <Text style={styles.error}>Błąd: {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 16 },
  colorBox:  { width: 100, height: 100, marginVertical: 8, borderWidth: 1, borderColor: '#000' },
  error:     { color: 'red', marginTop: 8 },
});