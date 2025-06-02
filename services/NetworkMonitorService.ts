import { NativeModules, Platform, NativeEventEmitter } from 'react-native';
import { socketService } from './SocketService';

interface NetworkUtilsInterface {
  getNetworkInfo(): Promise<{
    isConnected: boolean;
    connectionType: string;
  }>;
  startNetworkMonitoring(): void;
  stopNetworkMonitoring(): void;
}

const NativeNetworkUtils: NetworkUtilsInterface =
  Platform.OS === 'android'
    ? NativeModules.NetworkUtils || {
        getNetworkInfo: async () => {
          console.warn('NetworkUtils module not found');
          return { isConnected: true, connectionType: 'unknown' };
        },
        startNetworkMonitoring: () => {
          console.warn('NetworkUtils module not found');
        },
        stopNetworkMonitoring: () => {
          console.warn('NetworkUtils module not found');
        },
      }
    : {
        getNetworkInfo: async () => ({
          isConnected: true,
          connectionType: 'unknown',
        }),
        startNetworkMonitoring: () => {},
        stopNetworkMonitoring: () => {},
      };

class NetworkMonitorService {
  private eventEmitter: NativeEventEmitter | null = null;
  private listeners: Array<() => void> = [];
  constructor() {
    if (Platform.OS === 'android' && NativeModules.NetworkUtils) {
      try {
        this.eventEmitter = new NativeEventEmitter(NativeModules.NetworkUtils);
      } catch (error) {
        console.warn('Failed to create NetworkUtils event emitter:', error);
        this.eventEmitter = null;
      }
    }
  }

  startMonitoring() {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      NativeNetworkUtils.startNetworkMonitoring();

      const subscription = this.eventEmitter?.addListener(
        'networkChanged',
        async event => {
          if (event.isConnected) {
            try {
              const status = socketService.getConnectionStatus();
              if (!status.connected) {
                await socketService.connect();
              }
            } catch (error) {
              console.error(
                'Error reconnecting socket after network change:',
                error
              );
            }
          } else {
          }
        }
      );

      if (subscription) {
        this.listeners.push(() => subscription.remove());
      }
    } catch (error) {
      console.error('Error starting network monitoring:', error);
    }
  }

  stopMonitoring() {
    if (Platform.OS !== 'android') return;

    try {
      this.listeners.forEach(remove => remove());
      this.listeners = [];

      NativeNetworkUtils.stopNetworkMonitoring();
    } catch (error) {
      console.error('Error stopping network monitoring:', error);
    }
  }

  async getNetworkInfo(): Promise<{
    isConnected: boolean;
    connectionType: string;
  }> {
    try {
      return await NativeNetworkUtils.getNetworkInfo();
    } catch (error) {
      console.error('Error getting network info:', error);
      return { isConnected: false, connectionType: 'unknown' };
    }
  }
}

export const networkMonitorService = new NetworkMonitorService();
