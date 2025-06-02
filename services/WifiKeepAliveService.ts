import { NativeModules, Platform } from 'react-native';

interface WifiKeepAliveInterface {
  acquireWifiLock(): Promise<boolean>;
  releaseWifiLock(): Promise<boolean>;
  getStatus(): Promise<string>;
}

const NativeWifiKeepAlive: WifiKeepAliveInterface =
  Platform.OS === 'android'
    ? NativeModules.WifiKeepAlive || {
        acquireWifiLock: async () => {
          console.warn('WifiKeepAlive module not found');
          return false;
        },
        releaseWifiLock: async () => {
          console.warn('WifiKeepAlive module not found');
          return false;
        },
        getStatus: async () => 'Module not found',
      }
    : {
        acquireWifiLock: async () => true,
        releaseWifiLock: async () => true,
        getStatus: async () => 'Not available on this platform',
      };

class WifiKeepAliveService {
  private isActive = false;

  async enableWebSocketKeepAlive(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('WebSocket keep-alive is only needed on Android');
      return true;
    }

    try {
      console.log('Enabling WebSocket keep-alive mode');
      await NativeWifiKeepAlive.acquireWifiLock();
      this.isActive = true;
      return true;
    } catch (error) {
      console.error('Failed to enable WebSocket keep-alive:', error);
      return false;
    }
  }

  async disableWebSocketKeepAlive(): Promise<boolean> {
    if (Platform.OS !== 'android' || !this.isActive) {
      return true;
    }

    try {
      console.log('Disabling WebSocket keep-alive mode');
      await NativeWifiKeepAlive.releaseWifiLock();
      this.isActive = false;
      return true;
    } catch (error) {
      console.error('Failed to disable WebSocket keep-alive:', error);
      return false;
    }
  }

  async getStatus(): Promise<string> {
    if (Platform.OS !== 'android') {
      return 'Not available on this platform';
    }

    try {
      return await NativeWifiKeepAlive.getStatus();
    } catch (error) {
      console.error('Failed to get WebSocket keep-alive status:', error);
      return 'Error getting status';
    }
  }
}

export const wifiKeepAliveService = new WifiKeepAliveService();
