

import { io, Socket } from 'socket.io-client';
import { Session } from './SessionService';
import { API_URL } from '@/constants/Config';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  
  connect(): Socket {
    if (!this.socket || this.socket.disconnected) {
      console.log('Connecting to socket server at:', API_URL);
      this.socket = io(API_URL, {
        path: '/socket.io',        
        transports: ['websocket'],
        withCredentials: true,
        autoConnect: true,
        reconnection: true,
      });

      this.setupEventListeners();
    }
    return this.socket;
  }

  
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to socket server with ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server. Reason:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to socket server after', attemptNumber, 'attempts');
    });

    this.socket.onAny((event, ...args) => {
      console.log(`DEBUG: Socket event received: ${event}`, args);
    });
  }
  
  joinSessionCode(code: string): Promise<{ success: boolean, code: string }> {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }


    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, code });
        return;
      }

      this.socket.emit('join-code', code);
      
      this.socket.once('joined-code', (response) => {
        console.log('Joined code room:', response);
        resolve(response);
      });
    });
  }

  
  on<T = any>(eventName: string, callback: (data: T) => void): () => void {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }

    console.log(`Listening for event: ${eventName}`);

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const listeners = this.listeners.get(eventName);
    listeners?.add(callback);

    
    this.socket?.on(eventName, callback);

    
    return () => {
      this.socket?.off(eventName, callback);
      listeners?.delete(callback);
    };
  }
  
  async onSessionUpdate(code: string, callback: (session: Session) => void): Promise<() => void> {
    
    if (!this.socket || !this.socket.connected) {
      console.log(`Socket not connected, reconnecting before subscribing to session ${code}...`);
      this.connect();
    }

    
    console.log(`Joining session room for code: ${code}...`);
    const { success } = await this.joinSessionCode(code);
    if (!success) {
      console.error(`⚠️  Could not join session-${code}, updates won't arrive.`);
    }

    // Register specific event handler for this session code only
    const specificEvent = `session-update-${code}`;
    console.log(`✔️  Registering handler for ${specificEvent}`);
    const unsubscribe = this.on<any>(specificEvent, data => {
      console.log(`📨 session update for ${specificEvent} →`, data);
      callback(data);
    });

    // Return unsubscribe function
    return () => {
      console.log(`Unsubscribing from session ${code}`);
      unsubscribe();
    };
  }
  


  emitAudioCommand(
    sessionCode: string, 
    command: string, 
    soundName: string | SoundQueueItem[] | null = null
  ): void {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }
  
    const payload = {
      code: sessionCode,
      command,
      soundName // Teraz może być stringiem lub tablicą SoundQueueItem
    };
  
    console.log(`Emitting audio-command to session-${sessionCode}`, payload);
    this.socket?.emit('audio-command', payload);
  }

  
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }
}

// Export a singleton instance
export const socketService = new SocketService();