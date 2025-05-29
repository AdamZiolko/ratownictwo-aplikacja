import { useState, useEffect, useRef } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device, Subscription, BleError } from 'react-native-ble-plx';
import { decode as atob } from 'base-64';
import { BLE_CONFIG, COLOR_RATIO_THRESHOLDS } from './constants';
import { ColorValue } from './colorUtils';

// Global flag for automatic reconnection
let GLOBAL_AUTO_RECONNECT_ENABLED = true;

interface BleManagerState {
  bleState: string;
  device: Device | null;
  status: "idle" | "scanning" | "connected" | "monitoring" | "error";
  error: string | null;
  isReconnecting: boolean;
  autoReconnect: boolean;
  color: ColorValue;
  lastColorUpdate: number;
}

export const useBleManager = (onColorUpdate: (color: ColorValue) => Promise<void>) => {
  // Only create BleManager on native platforms
  const [manager] = useState(() => {
    if (Platform.OS === 'web') {
      return null;
    }
    return new BleManager();
  });
  
  const [bleState, setBleState] = useState<string>("Unknown");
  const [device, setDevice] = useState<Device | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [color, setColor] = useState<ColorValue>({ r: 0, g: 0, b: 0 });
  const [status, setStatus] = useState<BleManagerState['status']>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [autoReconnect, setAutoReconnect] = useState<boolean>(true);
  const [lastColorUpdate, setLastColorUpdate] = useState<number>(0);
  
  const colorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Monitor BLE state
  useEffect(() => {
    if (!manager || Platform.OS === 'web') {
      return;
    }
    const stateSub = manager.onStateChange((state) => {
      console.log("[BLE] State changed:", state);
      setBleState(state);
    }, true);
    return () => stateSub.remove();
  }, [manager]);
  // Monitor auto-reconnect flag
  useEffect(() => {
    if (!manager || Platform.OS === 'web') {
      return;
    }
    
    console.log(`[BLE] React autoReconnect state changed to: ${autoReconnect}`);

    if (!autoReconnect) {
      GLOBAL_AUTO_RECONNECT_ENABLED = false;
      console.log("[BLE] Global auto-reconnect flag disabled due to React state change");

      try {
        manager.stopDeviceScan();
      } catch (e) {
        console.warn("[BLE] Error stopping device scan:", e);
      }

      setIsReconnecting(true);
      console.log("[BLE] Setting reconnection flag to true to prevent auto-reconnect");
    } else {
      GLOBAL_AUTO_RECONNECT_ENABLED = true;
      console.log("[BLE] Global auto-reconnect flag enabled due to React state change");
    }
  }, [autoReconnect, manager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("[BLE] Cleanup on unmount");
      
      // Clear color timer
      if (colorTimeoutRef.current) {
        clearTimeout(colorTimeoutRef.current);
        colorTimeoutRef.current = null;
      }
      
      cleanupBleConnection();
    };
  }, []);
  // Function to clean up BLE connection
  const cleanupBleConnection = async () => {
    if (!manager || Platform.OS === 'web') {
      return;
    }
    
    console.log("[BLE] Cleaning up BLE connection");

    try {
      // Clear color timer
      if (colorTimeoutRef.current) {
        clearTimeout(colorTimeoutRef.current);
        colorTimeoutRef.current = null;
      }
      
      // Stop scanning
      try {
        console.log("[BLE] Stopping device scan...");
        manager.stopDeviceScan();
      } catch (e) {
        console.warn("[BLE] Error stopping device scan:", e);
      }

      // Remove subscription
      if (sub) {
        try {
          console.log("[BLE] Removing subscription...");
          sub.remove();
        } catch (e) {
          console.warn("[BLE] Error removing subscription:", e);
        }
        setSub(null);
      }

      // Disconnect device
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
      
      // Reset state
      setColor({ r: 0, g: 0, b: 0 });
      
      console.log("[BLE] Connection cleanup completed successfully");
    } catch (error) {
      console.error("[BLE] Error during cleanup:", error);
    }
  };

  // Function to request BLE permissions
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
  // Function to scan for and monitor BLE devices
  const scanAndMonitor = async () => {
    if (!manager || Platform.OS === 'web') {
      console.log("[BLE] BLE not available on this platform");
      setStatus("error");
      setError("BLE not available on this platform");
      return;
    }
    
    console.log(
      "[BLE] scanAndMonitor called, global autoReconnect:",
      GLOBAL_AUTO_RECONNECT_ENABLED,
      "React autoReconnect:",
      autoReconnect,
    );

    // Check if reconnection is already in progress
    if (isReconnecting) {
      console.log("[BLE] Reconnection already in progress, skipping");
      return;
    }

    // Set reconnection flags
    GLOBAL_AUTO_RECONNECT_ENABLED = true;
    if (!autoReconnect) setAutoReconnect(true);

    // Set reconnection state
    setIsReconnecting(true);

    try {
      // First clean up previous connection
      console.log("[BLE] Cleaning up previous connection...");
      await cleanupBleConnection();

      // Reset error state and set status to scanning
      setError(null);
      setStatus("scanning");

      // Request permissions
      console.log("[BLE] Requesting permissions...");
      await requestPermissions();

      console.log("[BLE] Starting scan for devices...");

      // Start device scan
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

          // Try again after delay
          setTimeout(() => {
            if (autoReconnect) {
              console.log("[BLE] Attempting to scan again after error...");
              setStatus("idle");
              setIsReconnecting(false); // Reset flag to allow reconnection
              scanAndMonitor();
            }
          }, 5000);

          return;
        }
        
        // Check if device was found
        if (!dev) {
          console.log("[BLE] No device found in scan callback");
          return;
        }

        // Check if this is our device
        const nameMatches =
          dev.name === BLE_CONFIG.DEVICE_NAME || dev.localName === BLE_CONFIG.DEVICE_NAME;
        const hasService = dev.serviceUUIDs?.includes(BLE_CONFIG.SERVICE_UUID);

        if (nameMatches || hasService) {
          console.log(`[BLE] Found matching device: ${dev.name || dev.localName || 'unnamed'} (${dev.id})`);
          
          // Stop scanning after finding device
          try {
            console.log("[BLE] Stopping device scan after finding target device...");
            manager.stopDeviceScan();
          } catch (e) {
            console.warn("[BLE] Error stopping device scan:", e);
          }

          // Function to connect to device with retry
          const connectWithRetry = async (device: Device, maxRetries = 3) => {
            for (let retries = 0; retries < maxRetries; retries++) {
              try {
                console.log(
                  `[BLE] Connecting to device, attempt ${retries + 1}/${maxRetries}...`,
                );

                // Check if device is already connected
                const isConnected = await manager
                  .isDeviceConnected(device.id)
                  .catch(() => false);

                if (isConnected) {
                  console.log(`[BLE] Device ${device.id} is already connected`);
                  return device;
                } else {
                  // Connect to device
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
                  // Wait before next attempt
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                }
              }
            }

            throw new Error(`Failed to connect after ${maxRetries} attempts`);
          };

          // Connect to device
          connectWithRetry(dev)
            .then((d) => {
              console.log("[BLE] Successfully connected to device");
              setDevice(d);
              setStatus("connected");

              // Handle device disconnection
              const disconnectHandler = (
                error: BleError | null,
                disconnectedDevice: Device,
              ) => {
                console.log(
                  `Device ${disconnectedDevice.id} was disconnected`,
                  error,
                );

                // Check if this is our device
                if (disconnectedDevice.id === d.id) {
                  setStatus("idle");
                  setDevice(null);

                  if (sub) {
                    try {
                      sub.remove();
                    } catch (e) {}
                    setSub(null);
                  }

                  // Automatic reconnection if enabled
                  if (GLOBAL_AUTO_RECONNECT_ENABLED) {
                    console.log(
                      "[BLE] Global auto-reconnect flag is enabled, scheduling reconnect",
                    );

                    setTimeout(() => {
                      if (GLOBAL_AUTO_RECONNECT_ENABLED && !isReconnecting) {
                        console.log(
                          "[BLE] Global auto-reconnect flag is still enabled, attempting to reconnect...",
                        );
                        setIsReconnecting(false); // Reset flag to allow reconnection
                        scanAndMonitor();
                      }
                    }, 2000);
                  }
                }
              };

              // Listen for device disconnection
              d.onDisconnected(disconnectHandler);

              // Discover services and characteristics
              return d.discoverAllServicesAndCharacteristics();
            })
            .then((d) => {
              if (!d) return;
              console.log("[BLE] Discovered services, start monitoring");

              // Monitor characteristic
              const subscription = d.monitorCharacteristicForService(
                BLE_CONFIG.SERVICE_UUID,
                BLE_CONFIG.CHARACTERISTIC_UUID,
                async (error, characteristic) => {
                  if (error) {
                    console.error("[BLE] Monitor error", error);
                    return;
                  }
                  if (!characteristic?.value) return;                  try {
                    // Decode data from base64
                    const rawData = atob(characteristic.value);
                    
                    // Print raw data for debugging
                    console.log("[BLE] 📦 Raw data received:");
                    console.log(`[BLE]   - Base64 value: ${characteristic.value}`);
                    console.log(`[BLE]   - Raw data length: ${rawData.length} bytes`);
                    const bytes = [];
                    for (let i = 0; i < rawData.length; i++) {
                      bytes.push(rawData.charCodeAt(i));
                    }
                    console.log(`[BLE]   - Raw bytes: [${bytes.join(', ')}]`);
                    
                    // Parse RGB data (format: 2 bytes per color, big-endian)
                    if (rawData.length >= 6) {
                      const r = (rawData.charCodeAt(0) << 8) + rawData.charCodeAt(1);
                      const g = (rawData.charCodeAt(2) << 8) + rawData.charCodeAt(3);
                      const b = (rawData.charCodeAt(4) << 8) + rawData.charCodeAt(5);
                      
                      console.log("[BLE] 🎨 Raw RGB values parsed:");
                      console.log(`[BLE]   - R: ${r} (bytes: ${rawData.charCodeAt(0)}, ${rawData.charCodeAt(1)})`);
                      console.log(`[BLE]   - G: ${g} (bytes: ${rawData.charCodeAt(2)}, ${rawData.charCodeAt(3)})`);
                      console.log(`[BLE]   - B: ${b} (bytes: ${rawData.charCodeAt(4)}, ${rawData.charCodeAt(5)})`);
                      
                      // Check if all values are exactly equal to 1000
                      // This may indicate a problem with the sensor
                      if (r === 1000 && g === 1000 && b === 1000) {
                        console.log("[BLE] ⚠️ Warning: All RGB values are exactly 1000 - possible sensor issue");
                        // Ignore this data
                        return;
                      }
                      
                      // Check if all values are almost identical (like 501, 501, 501)
                      const isAllSimilar = Math.abs(r - g) < 10 && Math.abs(r - b) < 10 && Math.abs(g - b) < 10;
                      if (isAllSimilar && r > 400 && r < 600) {
                        console.log("[BLE] ⚠️ Warning: All RGB values are similar and in mid-range - possible sensor issue");
                        console.log(`[BLE]   - Values: R:${r}, G:${g}, B:${b}`);
                        // Ignore this data
                        return;
                      }
                      
                      // Noise filtering - ignore very small values
                      const filteredR = r < 2 ? 0 : r;
                      const filteredG = g < 2 ? 0 : g;
                      const filteredB = b < 2 ? 0 : b;
                      
                      console.log("[BLE] 🔧 After noise filtering:");
                      console.log(`[BLE]   - R: ${r} -> ${filteredR} ${r !== filteredR ? '(filtered)' : ''}`);
                      console.log(`[BLE]   - G: ${g} -> ${filteredG} ${g !== filteredG ? '(filtered)' : ''}`);
                      console.log(`[BLE]   - B: ${b} -> ${filteredB} ${b !== filteredB ? '(filtered)' : ''}`);
                      
                      const newColor = { r: filteredR, g: filteredG, b: filteredB };
                      console.log("[BLE] ✅ Final parsed RGB color:", newColor);
                      
                      // Check if values are sensible (not too high)
                      const maxValidValue = 65535; // Maximum value for 16-bit unsigned int
                      if (filteredR > maxValidValue || filteredG > maxValidValue || filteredB > maxValidValue) {
                        console.log("[BLE] ❌ Invalid color values detected, ignoring");
                        console.log(`[BLE]   - Max valid: ${maxValidValue}, Got: R:${filteredR}, G:${filteredG}, B:${filteredB}`);
                        return;
                      }
                      
                      // Check if RGB sum is large enough to consider reading valid
                      const sumRGB = filteredR + filteredG + filteredB;
                      if (sumRGB < COLOR_RATIO_THRESHOLDS.MIN_BRIGHTNESS) {
                        console.log("[BLE] Color brightness too low, ignoring");
                        return;
                      }
                      
                      // Update color state
                      setColor(newColor);
                      setLastColorUpdate(Date.now());
                      
                      // Set timer to reset color if we don't receive new data
                      if (colorTimeoutRef.current) {
                        clearTimeout(colorTimeoutRef.current);
                      }
                      
                      colorTimeoutRef.current = setTimeout(async () => {
                        if (Date.now() - lastColorUpdate > 1000) {
                          console.log("[BLE] No color updates for 1 second, resetting");
                          setColor({ r: 0, g: 0, b: 0 });
                        }
                      }, 1000);                      // Call color update callback
                      console.log("[BLE] 🚀 Calling onColorUpdate callback with color:", newColor);
                      await onColorUpdate(newColor);
                    } else {
                      console.log(`[BLE] ❌ Insufficient data received: ${rawData.length} bytes (expected at least 6)`);
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

              // Try again after delay
              if (autoReconnect) {
                setTimeout(() => {
                  if (autoReconnect && !isReconnecting) {
                    console.log("[BLE] Attempting to reconnect after error...");
                    setStatus("idle");
                    setIsReconnecting(false); // Reset flag to allow reconnection
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
      // Reset reconnection flag after delay
      setTimeout(() => {
        if (GLOBAL_AUTO_RECONNECT_ENABLED) {
          console.log("[BLE] Resetting reconnection flag after timeout");
          setIsReconnecting(false);
        }
      }, 2000);
    }
  };
  // Function to disconnect device
  const disconnectDevice = async () => {
    if (!manager || Platform.OS === 'web') {
      console.log("[BLE] BLE not available on this platform");
      return;
    }
    
    try {
      // Disable automatic reconnection
      GLOBAL_AUTO_RECONNECT_ENABLED = false;
      setAutoReconnect(false);
      setIsReconnecting(true);

      // Stop scanning
      try {
        console.log("[BLE] Stopping device scan...");
        manager.stopDeviceScan();
      } catch (e) {
        console.warn("[BLE] Error stopping device scan:", e);
      }

      // Remove subscription
      if (sub) {
        try {
          console.log("[BLE] Removing subscription...");
          sub.remove();
        } catch (e) {
          console.warn("[BLE] Error removing subscription:", e);
        }
        setSub(null);
      }

      // Disconnect device
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

      // Reset state
      setStatus("idle");
      setError(null);

      console.log("[BLE] Manual disconnect complete");
      
      // Reset reconnection flag after delay
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
  // Function to start connection
  const startConnection = () => {
    if (!manager || Platform.OS === 'web') {
      console.log("[BLE] BLE not available on this platform");
      setStatus("error");
      setError("BLE not available on this platform");
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
