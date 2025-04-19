/**
 * SocketService.ts
 * Service for handling WebSocket connections and real-time updates
 */

import { io, Socket } from 'socket.io-client';
import { Session } from './SessionService';
import { API_URL } from '@/constants/Config';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Initialize the socket connection
   * @returns The socket instance
   */
  connect(): Socket {
    if (!this.socket || this.socket.disconnected) {
      console.log('Connecting to socket server at:', API_URL);
      this.socket = io(API_URL, {
        path: '/socket.io',        // default endpoint
        transports: ['websocket'],
        withCredentials: true,
        autoConnect: true,
        reconnection: true,
      });

      this.setupEventListeners();
    }
    return this.socket;
  }

  /**
   * Set up default event listeners
   */
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

  /**
   * Join a specific session code room to receive updates for that session
   * @param code The session code to subscribe to
   */
  joinSessionCode(code: number): Promise<{ success: boolean, code: number }> {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }


    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, code });
        return;
      }

      this.socket.emit('join-code', code);
      // Listen for one-time confirmation
      this.socket.once('joined-code', (response) => {
        console.log('Joined code room:', response);
        resolve(response);
      });
    });
  }

  /**
   * Subscribe to all session updates (for admin/examiner)
   */
  subscribeToAllSessions(): Promise<{ success: boolean }> {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }

    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false });
        return;
      }

      this.socket.emit('subscribe-all-sessions');
      
      // Listen for one-time confirmation
      this.socket.once('subscribed-all-sessions', (response) => {
        console.log('Subscribed to all sessions:', response);
        resolve(response);
      });
    });
  }

  /**
   * Unsubscribe from all session updates
   */
  unsubscribeFromAllSessions(): Promise<{ success: boolean }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false });
        return;
      }

      this.socket.emit('unsubscribe-all-sessions');
      
      // Listen for one-time confirmation
      this.socket.once('unsubscribed-all-sessions', (response) => {
        console.log('Unsubscribed from all sessions:', response);
        resolve(response);
      });
    });
  }

  /**
   * Listen for updates to a specific session
   * @param eventName The event name to listen for
   * @param callback The callback function to call when the event is received
   */
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

    // Add the listener to the socket
    this.socket?.on(eventName, callback);

    // Return a function to remove the listener
    return () => {
      this.socket?.off(eventName, callback);
      listeners?.delete(callback);
    };
  }

  /**
   * Listen for session updates by session code
   * @param code The session code to listen for updates on
   * @param callback The callback when an update is received
   */
  async onSessionUpdate(code: number, callback: (session: Session) => void): Promise<() => void> {
    // ensure socket is up
    if (!this.socket || !this.socket.connected) {
      console.log(`Socket not connected, reconnecting before subscribing to session ${code}...`);
      this.connect();
    }

    // 1) join the room and wait for confirmation
    console.log(`Joining session room for code: ${code}...`);
    const { success } = await this.joinSessionCode(code);
    if (!success) {
      console.error(`⚠️  Could not join session-${code}, updates won’t arrive.`);
    }

    // 2) after join, register your specific & general handlers
    const specificEvent = `session-update-${code}`;
    console.log(`✔️  Registering handler for ${specificEvent}`);
    const offSpecific = this.on<any>(specificEvent, data => {
      console.log(`📨 specific ${specificEvent} →`, data);
      callback(data);
    });

    const generalEvent = `session-updated`;
    console.log(`✔️  Registering handler for ${generalEvent}`);
    const offGeneral = this.on<Session>(generalEvent, data => {
      if (data?.sessionCode === code) {
        console.log(`📨 general ${generalEvent} →`, data);
        callback(data);
      }
    });

    // 3) return a combined unsubscribe
    return () => {
      console.log(`Unsubscribing from session ${code}`);
      offSpecific();
      offGeneral();
    };
  }

  /**
   * Emit a session update event to all clients in a session room
   * @param eventName The event name to emit
   * @param data The data to send
   * @param sessionCode The session code room to emit to
   */
  emitSessionUpdate(eventName: string, data: any, sessionCode: number): void {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }
    
    console.log(`Emitting ${eventName} to session-${sessionCode}`, data);
    this.socket?.emit('emit-event', {
      event: eventName,
      data,
      room: `code-${sessionCode}`
    });
  }

  /**
   * Disconnect the socket
   */
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
