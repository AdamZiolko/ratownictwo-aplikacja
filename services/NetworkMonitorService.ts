import { NativeModules, Platform, NativeEventEmitter } from 'react-native';
import { socketService } from './SocketService';

// Define interface for the native module
interface NetworkUtilsInterface {
  getNetworkInfo(): Promise<{
    isConnected: boolean;
    connectionType: string;
  }>;
  startNetworkMonitoring(): void;
  stopNetworkMonitoring(): void;
}

// Get the native module or create a mock implementation for non-Android platforms
const NativeNetworkUtils: NetworkUtilsInterface = Platform.OS === 'android'
  ? (NativeModules.NetworkUtils || {
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
    })
  : {
      getNetworkInfo: async () => ({ isConnected: true, connectionType: 'unknown' }),
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

  /**
   * Start monitoring network connectivity changes
   * This is particularly important for WebSockets to reconnect when network changes
   */
  startMonitoring() {
    if (Platform.OS !== 'android') {
      console.log('Network monitoring is only implemented for Android');
      return;
    }

    try {
      // Start the native module monitoring
      NativeNetworkUtils.startNetworkMonitoring();
      
      // Add listener for network changes
      const subscription = this.eventEmitter?.addListener('networkChanged', async (event) => {
        console.log('Network changed:', event);
        
        if (event.isConnected) {
          // Network is available, try to reconnect WebSocket if needed
          try {
            const status = socketService.getConnectionStatus();
            if (!status.connected) {
              console.log('Network is back, reconnecting WebSocket...');
              await socketService.connect();
            }
          } catch (error) {
            console.error('Error reconnecting socket after network change:', error);
          }
        } else {
          console.log('Network connection lost');
        }
      });
      
      if (subscription) {
        this.listeners.push(() => subscription.remove());
      }
      
      console.log('Network monitoring started');
    } catch (error) {
      console.error('Error starting network monitoring:', error);
    }
  }

  /**
   * Stop monitoring network connectivity changes
   */
  stopMonitoring() {
    if (Platform.OS !== 'android') return;
    
    try {
      // Remove all listeners
      this.listeners.forEach(remove => remove());
      this.listeners = [];
      
      // Stop the native module monitoring
      NativeNetworkUtils.stopNetworkMonitoring();
      
      console.log('Network monitoring stopped');
    } catch (error) {
      console.error('Error stopping network monitoring:', error);
    }
  }

  /**
   * Get current network connectivity status
   */
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

// Export a singleton instance
export const networkMonitorService = new NetworkMonitorService();
