import { useState, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  BleManager,
  Device,
  Subscription,
  BleError,
} from 'react-native-ble-plx';
import { decode as atob } from 'base-64';
import { BLE_CONFIG, COLOR_RATIO_THRESHOLDS } from './constants';
import { ColorValue } from './colorUtils';

let GLOBAL_AUTO_RECONNECT_ENABLED = true;

interface BleManagerState {
  bleState: string;
  device: Device | null;
  status: 'idle' | 'scanning' | 'connected' | 'monitoring' | 'error';
  error: string | null;
  isReconnecting: boolean;
  autoReconnect: boolean;
  color: ColorValue;
  lastColorUpdate: number;
}

export const useBleManager = (
  onColorUpdate: (color: ColorValue) => Promise<void>
) => {
  const [manager] = useState(() => {
    if (Platform.OS === 'web') {
      return null;
    }
    return new BleManager();
  });

  const [bleState, setBleState] = useState<string>('Unknown');
  const [device, setDevice] = useState<Device | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [color, setColor] = useState<ColorValue>({ r: 0, g: 0, b: 0 });
  const [status, setStatus] = useState<BleManagerState['status']>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [autoReconnect, setAutoReconnect] = useState<boolean>(true);
  const [lastColorUpdate, setLastColorUpdate] = useState<number>(0);

  const colorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!manager || Platform.OS === 'web') {
      return;
    }
    const stateSub = manager.onStateChange(state => {
      setBleState(state);
    }, true);
    return () => stateSub.remove();
  }, [manager]);

  useEffect(() => {
    if (!manager || Platform.OS === 'web') {
      return;
    }

    if (!autoReconnect) {
      GLOBAL_AUTO_RECONNECT_ENABLED = false;
      try {
        manager.stopDeviceScan();
      } catch (e) {
        console.warn('[BLE] Error stopping device scan:', e);
      }

      setIsReconnecting(true);
    } else {
      GLOBAL_AUTO_RECONNECT_ENABLED = true;
    }
  }, [autoReconnect, manager]);

  useEffect(() => {
    return () => {
      if (colorTimeoutRef.current) {
        clearTimeout(colorTimeoutRef.current);
        colorTimeoutRef.current = null;
      }

      cleanupBleConnection();
    };
  }, []);

  const cleanupBleConnection = async () => {
    if (!manager || Platform.OS === 'web') {
      return;
    }

    try {
      if (colorTimeoutRef.current) {
        clearTimeout(colorTimeoutRef.current);
        colorTimeoutRef.current = null;
      }

      try {
        manager.stopDeviceScan();
      } catch (e) {
        console.warn('[BLE] Error stopping device scan:', e);
      }

      if (sub) {
        try {
          sub.remove();
        } catch (e) {
          console.warn('[BLE] Error removing subscription:', e);
        }
        setSub(null);
      }

      if (device) {
        try {
          const isConnected = await manager
            .isDeviceConnected(device.id)
            .catch(e => {
              console.warn('[BLE] Error checking device connection:', e);
              return false;
            });

          if (isConnected) {
            await manager.cancelDeviceConnection(device.id).catch(e => {
              if (
                !e.message ||
                !e.message.includes('Operation was cancelled')
              ) {
                console.warn('[BLE] Error cancelling device connection:', e);
              }
            });
          } else {
          }
        } catch (e) {
          if (
            e instanceof Error &&
            (!e.message || !e.message.includes('Operation was cancelled'))
          ) {
            console.warn('[BLE] Issue during device disconnection:', e);
          }
        }
        setDevice(null);
      }

      setColor({ r: 0, g: 0, b: 0 });
    } catch (error) {
      console.error('[BLE] Error during cleanup:', error);
    }
  };

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
      const allGranted = perms.every(
        p => granted[p] === PermissionsAndroid.RESULTS.GRANTED
      );
      if (!allGranted) throw new Error('Brak wymaganych uprawnień BLE');
    }
  };

  const scanAndMonitor = async () => {
    if (!manager || Platform.OS === 'web') {
      setStatus('error');
      setError('BLE not available on this platform');
      return;
    }

    if (isReconnecting) {
      return;
    }

    GLOBAL_AUTO_RECONNECT_ENABLED = true;
    if (!autoReconnect) setAutoReconnect(true);

    setIsReconnecting(true);

    try {
      await cleanupBleConnection();

      setError(null);
      setStatus('scanning');

      await requestPermissions();

      manager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, dev) => {
          if (error) {
            console.error('[BLE] Scan error:', error);
            setError(error.message);
            setStatus('error');

            try {
              manager.stopDeviceScan();
            } catch (e) {
              console.warn('[BLE] Error stopping device scan:', e);
            }

            setTimeout(() => {
              if (autoReconnect) {
                setStatus('idle');
                setIsReconnecting(false);
                scanAndMonitor();
              }
            }, 5000);

            return;
          }

          if (!dev) {
            return;
          }

          const nameMatches =
            dev.name === BLE_CONFIG.DEVICE_NAME ||
            dev.localName === BLE_CONFIG.DEVICE_NAME;
          const hasService = dev.serviceUUIDs?.includes(
            BLE_CONFIG.SERVICE_UUID
          );

          if (nameMatches || hasService) {
            try {
              manager.stopDeviceScan();
            } catch (e) {
              console.warn('[BLE] Error stopping device scan:', e);
            }

            const connectWithRetry = async (device: Device, maxRetries = 3) => {
              for (let retries = 0; retries < maxRetries; retries++) {
                try {
                  const isConnected = await manager
                    .isDeviceConnected(device.id)
                    .catch(() => false);

                  if (isConnected) {
                    return device;
                  } else {
                    const connectedDevice = await manager.connectToDevice(
                      device.id
                    );
                    return connectedDevice;
                  }
                } catch (e) {
                  console.error(`[BLE] Connection error`, e);

                  if (retries < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                }
              }

              throw new Error(`Failed to connect after ${maxRetries} attempts`);
            };

            connectWithRetry(dev)
              .then(d => {
                setDevice(d);
                setStatus('connected');

                const disconnectHandler = (
                  error: BleError | null,
                  disconnectedDevice: Device
                ) => {
                  if (
                    !error ||
                    !error.message ||
                    !error.message.includes('Operation was cancelled')
                  ) {
                  }

                  if (disconnectedDevice.id === d.id) {
                    setStatus('idle');
                    setDevice(null);

                    if (sub) {
                      try {
                        sub.remove();
                      } catch (e) {}
                      setSub(null);
                    }

                    if (GLOBAL_AUTO_RECONNECT_ENABLED) {
                      setTimeout(() => {
                        if (GLOBAL_AUTO_RECONNECT_ENABLED && !isReconnecting) {
                          setIsReconnecting(false);
                          scanAndMonitor();
                        }
                      }, 2000);
                    }
                  }
                };

                d.onDisconnected(disconnectHandler);

                return d.discoverAllServicesAndCharacteristics();
              })
              .then(d => {
                if (!d) return;
                const subscription = d.monitorCharacteristicForService(
                  BLE_CONFIG.SERVICE_UUID,
                  BLE_CONFIG.CHARACTERISTIC_UUID,
                  async (error, characteristic) => {
                    if (error) {
                      if (
                        error.message &&
                        error.message.includes('Operation was cancelled')
                      ) {
                        return;
                      } else {
                        console.warn(
                          '[BLE] Monitor issue:',
                          error.message || 'Unknown error'
                        );
                      }
                      return;
                    }
                    if (!characteristic?.value) return;
                    try {
                      const rawData = atob(characteristic.value);

                      const bytes = [];
                      for (let i = 0; i < rawData.length; i++) {
                        bytes.push(rawData.charCodeAt(i));
                      }
                      if (rawData.length >= 6) {
                        const r =
                          (rawData.charCodeAt(0) << 8) + rawData.charCodeAt(1);
                        const g =
                          (rawData.charCodeAt(2) << 8) + rawData.charCodeAt(3);
                        const b =
                          (rawData.charCodeAt(4) << 8) + rawData.charCodeAt(5);

                        if (r === 1000 && g === 1000 && b === 1000) {
                          return;
                        }

                        const isAllSimilar =
                          Math.abs(r - g) < 10 &&
                          Math.abs(r - b) < 10 &&
                          Math.abs(g - b) < 10;
                        if (isAllSimilar && r > 400 && r < 600) {
                          return;
                        }

                        const filteredR = r < 2 ? 0 : r;
                        const filteredG = g < 2 ? 0 : g;
                        const filteredB = b < 2 ? 0 : b;

                        const newColor = {
                          r: filteredR,
                          g: filteredG,
                          b: filteredB,
                        };
                        const maxValidValue = 65535;
                        if (
                          filteredR > maxValidValue ||
                          filteredG > maxValidValue ||
                          filteredB > maxValidValue
                        ) {
                          return;
                        }

                        const sumRGB = filteredR + filteredG + filteredB;
                        if (sumRGB < COLOR_RATIO_THRESHOLDS.MIN_BRIGHTNESS) {
                          return;
                        }

                        setColor(newColor);
                        setLastColorUpdate(Date.now());

                        if (colorTimeoutRef.current) {
                          clearTimeout(colorTimeoutRef.current);
                        }

                        colorTimeoutRef.current = setTimeout(async () => {
                          if (Date.now() - lastColorUpdate > 1000) {
                            setColor({ r: 0, g: 0, b: 0 });
                          }
                        }, 1000);
                        await onColorUpdate(newColor);
                      } else {
                      }
                    } catch (error) {
                      console.error(
                        '[BLE] Error processing characteristic data:',
                        error
                      );
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

                if (autoReconnect) {
                  setTimeout(() => {
                    if (autoReconnect && !isReconnecting) {
                      setStatus('idle');
                      setIsReconnecting(false);
                      scanAndMonitor();
                    }
                  }, 3000);
                }
              });
          }
        }
      );
    } catch (e) {
      console.error('[BLE] Fatal error', e);
      setError((e as Error).message);
      setStatus('error');
    } finally {
      setTimeout(() => {
        if (GLOBAL_AUTO_RECONNECT_ENABLED) {
          setIsReconnecting(false);
        }
      }, 2000);
    }
  };

  const disconnectDevice = async () => {
    if (!manager || Platform.OS === 'web') {
      return;
    }

    try {
      GLOBAL_AUTO_RECONNECT_ENABLED = false;
      setAutoReconnect(false);
      setIsReconnecting(true);

      try {
        manager.stopDeviceScan();
      } catch (e) {
        console.warn('[BLE] Error stopping device scan:', e);
      }

      if (sub) {
        try {
          sub.remove();
        } catch (e) {
          console.warn('[BLE] Error removing subscription:', e);
        }
        setSub(null);
      }

      if (device) {
        try {
          const isConnected = await manager
            .isDeviceConnected(device.id)
            .catch(() => false);
          if (isConnected) {
            await manager.cancelDeviceConnection(device.id).catch(e => {
              if (
                !e.message ||
                !e.message.includes('Operation was cancelled')
              ) {
                console.warn('[BLE] Error cancelling device connection:', e);
              }
            });
          }
        } catch (e) {
          if (
            e instanceof Error &&
            (!e.message || !e.message.includes('Operation was cancelled'))
          ) {
            console.warn('[BLE] Issue during device disconnection:', e);
          }
        }
        setDevice(null);
      }

      setStatus('idle');
      setError(null);

      setTimeout(() => {
        setIsReconnecting(false);
      }, 2000);
    } catch (error) {
      if (
        error instanceof Error &&
        (!error.message || !error.message.includes('Operation was cancelled'))
      ) {
        console.warn('[BLE] Issue during manual disconnect:', error);
      }
      setStatus('idle');
      setError(null);
      GLOBAL_AUTO_RECONNECT_ENABLED = false;
      setAutoReconnect(false);
      setIsReconnecting(false);
    }
  };

  const startConnection = () => {
    if (!manager || Platform.OS === 'web') {
      setStatus('error');
      setError('BLE not available on this platform');
      return;
    }

    GLOBAL_AUTO_RECONNECT_ENABLED = true;
    setAutoReconnect(true);
    setIsReconnecting(false);
    setError(null);
    scanAndMonitor();
  };

  return {
    bleState,
    device,
    status,
    error,
    isReconnecting,
    autoReconnect,
    color,
    lastColorUpdate,
    startConnection,
    disconnectDevice,
  };
};
