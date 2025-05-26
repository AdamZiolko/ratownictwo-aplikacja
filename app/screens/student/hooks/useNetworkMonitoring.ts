import { useEffect } from "react";
import { Platform } from "react-native";
import { socketService } from "@/services/SocketService";
import { networkMonitorService } from "@/services/NetworkMonitorService";
import { wifiKeepAliveService } from "@/services/WifiKeepAliveService";

export const useNetworkMonitoring = () => {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    
    let mounted = true;
    
    const setupNetworkMonitoring = async () => {
      try {
        console.log('Setting up network monitoring for Android...');
        
        // Connect socket first
        await socketService.connect();
        
        // Wait a bit for socket to stabilize, then enable monitoring
        setTimeout(async () => {
          if (!mounted) return;
          
          try {
            await wifiKeepAliveService.enableWebSocketKeepAlive();
            console.log('WebSocket keep-alive enabled');
          } catch (error) {
            console.warn('Could not enable WebSocket keep-alive:', error);
          }
          
          try {
            networkMonitorService.startMonitoring();
            console.log('Network monitoring started');
          } catch (error) {
            console.warn('Could not start network monitoring:', error);
          }
        }, 1000);
      } catch (error) {
        console.error('Error setting up network monitoring:', error);
      }
    };
    
    setupNetworkMonitoring();
    
    return () => {
      mounted = false;
      
      if (Platform.OS !== 'android') return;
      
      // Clean up network monitoring
      const cleanup = async () => {
        try {
          await Promise.allSettled([
            wifiKeepAliveService.disableWebSocketKeepAlive()
              .then(() => console.log('WebSocket keep-alive disabled'))
              .catch(e => console.warn('Error disabling WebSocket keep-alive:', e)),
            
            Promise.resolve().then(() => {
              networkMonitorService.stopMonitoring();
              console.log('Network monitoring stopped');
            })
          ]);
        } catch (error) {
          console.warn('Error during network monitoring cleanup:', error);
        }
      };
        cleanup();
    };
  }, []);
};
