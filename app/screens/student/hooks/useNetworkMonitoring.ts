import { useEffect } from 'react';
import { Platform } from 'react-native';
import { socketService } from '@/services/SocketService';
import { networkMonitorService } from '@/services/NetworkMonitorService';
import { wifiKeepAliveService } from '@/services/WifiKeepAliveService';

export const useNetworkMonitoring = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const setupNetworkMonitoring = async () => {
      try {
        console.log('Setting up network monitoring for Android...');

        await socketService.connect();

        setTimeout(async () => {
          try {
            await wifiKeepAliveService.enableWebSocketKeepAlive();
            console.log('WebSocket keep-alive enabled');
          } catch (error) {
            console.error('Error enabling WebSocket keep-alive:', error);
          }

          try {
            networkMonitorService.startMonitoring();
            console.log('Network monitoring started');
          } catch (error) {
            console.error('Error starting network monitoring:', error);
          }
        }, 1000);
      } catch (error) {
        console.error('Error setting up network monitoring:', error);
      }
    };

    setupNetworkMonitoring();

    return () => {
      if (Platform.OS !== 'android') return;

      try {
        Promise.all([
          wifiKeepAliveService
            .disableWebSocketKeepAlive()
            .then(() => console.log('WebSocket keep-alive disabled'))
            .catch(e =>
              console.error('Error disabling WebSocket keep-alive:', e)
            ),

          new Promise<void>(resolve => {
            networkMonitorService.stopMonitoring();
            console.log('Network monitoring stopped');
            resolve();
          }),
        ]).catch(error => {
          console.error('Error during cleanup:', error);
        });
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, []);
};
