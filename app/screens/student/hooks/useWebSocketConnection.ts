import { useState, useEffect, useRef } from 'react';
import { socketService } from '@/services/SocketService';

interface WebSocketConnectionState {
  isConnected: boolean;
  connectionId: string | null;
  reconnectAttempts: number;
  lastConnectionTime: Date | null;
  error: string | null;
}

export const useWebSocketConnection = (accessCode?: string) => {
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>({
    isConnected: false,
    connectionId: null,
    reconnectAttempts: 0,
    lastConnectionTime: null,
    error: null,
  });

  const [sessionData, setSessionData] = useState<any>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  useEffect(() => {
    mountedRef.current = true;
    
    const handleConnect = () => {
      if (!mountedRef.current) return;
      
      const status = socketService.getConnectionStatus();
      console.log('🟢 WebSocket connected:', status.id);
      
      setConnectionState(prev => ({
        ...prev,
        isConnected: true,
        connectionId: status.id,
        reconnectAttempts: 0,
        lastConnectionTime: new Date(),
        error: null,
      }));
    };

    const handleDisconnect = (reason: string) => {
      if (!mountedRef.current) return;
      
      console.log('🔴 WebSocket disconnected:', reason);
      
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        connectionId: null,
        error: `Disconnected: ${reason}`,
      }));

      // Attempt to reconnect if not intentionally disconnected
      if (reason !== 'io client disconnect' && accessCode) {
        attemptReconnect();
      }
    };

    const handleConnectError = (error: any) => {
      if (!mountedRef.current) return;
      
      console.error('🔴 WebSocket connection error:', error);
      
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        connectionId: null,
        error: error.message || 'Connection error',
      }));

      if (accessCode) {
        attemptReconnect();
      }
    };

    const attemptReconnect = () => {
      setConnectionState(prev => {
        if (prev.reconnectAttempts >= maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached');
          return {
            ...prev,
            error: 'Max reconnection attempts reached',
          };
        }

        const newAttempts = prev.reconnectAttempts + 1;
        console.log(`🔄 Attempting to reconnect (${newAttempts}/${maxReconnectAttempts})`);

        // Clear any existing timer
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }

        // Schedule reconnection
        reconnectTimerRef.current = setTimeout(async () => {
          if (!mountedRef.current) return;
            try {
            await socketService.connect();
            
            // If we have an access code, rejoin the session
            if (accessCode) {
              console.log(`🔗 Rejoining session room for access code: ${accessCode}`);
              const joinResult = await socketService.joinSessionCode(accessCode);
              if (joinResult.success) {
                console.log(`✅ Successfully rejoined session room for ${accessCode}`);
              } else {
                console.warn(`⚠️ Failed to rejoin session room for ${accessCode}`);
              }
            }
          } catch (error) {
            console.error('Reconnection failed:', error);
          }
        }, reconnectDelay * newAttempts); // Exponential backoff

        return {
          ...prev,
          reconnectAttempts: newAttempts,
          error: `Reconnecting... (${newAttempts}/${maxReconnectAttempts})`,
        };
      });
    };    // Set up WebSocket event listeners
    const unsubscribeConnect = socketService.on('connect', handleConnect);
    const unsubscribeDisconnect = socketService.on('disconnect', handleDisconnect);
    const unsubscribeConnectError = socketService.on('connect_error', handleConnectError);

    // Set up session update listeners if we have an access code
    let unsubscribeSessionUpdate: (() => void) | null = null;
    let unsubscribeSessionSpecificUpdate: (() => void) | null = null;
    
    if (accessCode) {
      // Listen for general session updates
      unsubscribeSessionUpdate = socketService.on('session-updated', (data: any) => {
        if (!mountedRef.current) return;
        console.log('🔄 Received session-updated event:', data);
        setSessionData(data);
      });

      // Listen for session-specific updates (e.g., session-update-erwad1)
      const specificEvent = `session-update-${accessCode}`;
      unsubscribeSessionSpecificUpdate = socketService.on(specificEvent, (data: any) => {
        if (!mountedRef.current) return;
        console.log(`🔄 Received ${specificEvent} event:`, data);
        setSessionData(data);
      });
    }    // Initialize connection if not connected
    const initializeConnection = async () => {
      try {
        const status = socketService.getConnectionStatus();
        if (!status.connected) {
          console.log('🔄 Initializing WebSocket connection...');
          await socketService.connect();
        } else {
          handleConnect();
        }

        // If we have an access code, join the session room
        if (accessCode && status.connected) {
          console.log(`🔗 Joining session room for access code: ${accessCode}`);
          try {
            const joinResult = await socketService.joinSessionCode(accessCode);
            if (joinResult.success) {
              console.log(`✅ Successfully joined session room for ${accessCode}`);
            } else {
              console.warn(`⚠️ Failed to join session room for ${accessCode}`);
            }
          } catch (error) {
            console.error(`❌ Error joining session room for ${accessCode}:`, error);
          }
        }
      } catch (error) {
        console.error('Failed to initialize connection:', error);
        handleConnectError(error);
      }
    };

    initializeConnection();

    return () => {
      mountedRef.current = false;
      
      // Clear reconnection timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }      // Clean up event listeners
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeConnectError();
      
      // Clean up session update listeners
      if (unsubscribeSessionUpdate) {
        unsubscribeSessionUpdate();
      }
      if (unsubscribeSessionSpecificUpdate) {
        unsubscribeSessionSpecificUpdate();
      }
    };
  }, [accessCode]);

  const forceReconnect = async () => {
    console.log('🔄 Force reconnecting WebSocket...');
    
    setConnectionState(prev => ({
      ...prev,
      reconnectAttempts: 0,
      error: 'Reconnecting...',
    }));    try {
      await socketService.disconnect();
      await socketService.connect();
      
      if (accessCode) {
        console.log(`🔗 Rejoining session room for access code: ${accessCode} after force reconnect`);
        const joinResult = await socketService.joinSessionCode(accessCode);
        if (joinResult.success) {
          console.log(`✅ Successfully rejoined session room for ${accessCode} after force reconnect`);
        } else {
          console.warn(`⚠️ Failed to rejoin session room for ${accessCode} after force reconnect`);
        }
      }
    } catch (error) {
      console.error('Force reconnection failed:', error);
      setConnectionState(prev => ({
        ...prev,
        error: 'Reconnection failed',
      }));
    }
  };
  return {
    ...connectionState,
    sessionData,
    forceReconnect,
    canReconnect: connectionState.reconnectAttempts < maxReconnectAttempts,
  };
};
