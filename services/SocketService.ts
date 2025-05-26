import { io, Socket } from 'socket.io-client';
import { Session } from './SessionService';
import { WS_URL } from '@/constants/Config';
import { Platform } from 'react-native';
import { wifiKeepAliveService } from './WifiKeepAliveService';
import { SoundQueueItem } from '@/app/screens/examiner/types/types';

export interface StudentListUpdate {
  sessionId: string;
  sessionCode: string;
  students: {
    id: number;
    name?: string;
    surname?: string;
    albumNumber?: string;
  }[];
}

export interface StudentSessionUpdate {
  type: 'join' | 'leave';
  sessionId: string;
  sessionCode: string;
  student: {
    id: number;
    name?: string;
    surname?: string;
    albumNumber?: string;
  };
  timestamp: Date;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();    async connect(): Promise<Socket> {
    if (!this.socket || this.socket.disconnected) {
      console.log('Connecting to socket server at:', WS_URL);
      
      
      if (Platform.OS === 'android') {
        try {
          console.log('Enabling WebSocket keep-alive for Android');
          await wifiKeepAliveService.enableWebSocketKeepAlive();
        } catch (error) {
          console.warn('Failed to enable WebSocket keep-alive:', error);
        }
      }
      
      
      const socketOptions = {
        path: '/socket.io',
        transports: Platform.OS === 'android' ? ['polling', 'websocket'] : ['websocket', 'polling'],
        withCredentials: false,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: true,
      };
      
      
      if (Platform.OS === 'android') {
        Object.assign(socketOptions, {
          pingTimeout: 30000,
          pingInterval: 25000
        });
      }
      
      try {
        this.socket = io(WS_URL, socketOptions);
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        
        
        console.log('Trying alternative connection method...');
        const altOptions = {
          ...socketOptions,
          transports: ['polling'],
          upgrade: false
        };
        this.socket = io(WS_URL, altOptions);
      }

      this.setupEventListeners();
    }
    return this.socket;
  }

  
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🟢 Connected to socket server with ID:', this.socket?.id);
    });    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message);
      
      
      if (Platform.OS === 'android') {
        console.log('⚠️ WebSocket connection failed on Android, will try polling');
        this.reconnectWithPolling();
      }
    });

    this.socket.on('connect_timeout', () => {
      console.error('🔴 Socket connection timeout');
      
      if (Platform.OS === 'android') {
        this.reconnectWithPolling();
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🟠 Disconnected from socket server. Reason:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('🔴 Socket error:', error);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🟢 Reconnected to socket server after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🟠 Attempting to reconnect:', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('🔴 Socket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('🔴 Failed to reconnect to socket server');
    });

    this.socket.onAny((event, ...args) => {
      console.log(`🔵 DEBUG: Socket event received: ${event}`, args);
    });
  }    async joinSessionCode(code: string, studentInfo?: { name?: string, surname?: string, albumNumber?: string }): Promise<{ success: boolean, code: string }> {
    if (!this.socket || !this.socket.connected) {
      await this.connect();
    }

    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, code });
        return;
      }      if (studentInfo && studentInfo.name && studentInfo.surname && studentInfo.albumNumber) {
        this.safeEmit('join-code', {
          code,
          name: studentInfo.name,
          surname: studentInfo.surname,
          albumNumber: studentInfo.albumNumber
        });
        console.log('Joining code room with student info:', code, studentInfo);
      } else {
        this.safeEmit('join-code', code);
        console.log('Joining code room:', code);
      }
      
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
    async onSessionUpdate(
    code: string, 
    callback: (session: Session) => void,
    studentInfo?: { name?: string, surname?: string, albumNumber?: string }
  ): Promise<() => void> {
      if (!this.socket || !this.socket.connected) {
      console.log(`Socket not connected, reconnecting before subscribing to session ${code}...`);
      await this.connect();
    }

    
    console.log(`Joining session room for code: ${code}...`);
    const { success } = await this.joinSessionCode(code, studentInfo);
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
    command: 'PLAY' | 'PAUSE' | 'RESUME' | 'STOP' | 'PLAY_QUEUE', 
    soundName: string | any,
    loop: boolean = false 
  ): void {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }
  
    const payload = {
      code: sessionCode,
      command,
      soundName,
      loop 
    };
    console.log(`Emitting audio-command: ${command}`, payload);
    this.safeEmit('audio-command', payload);
  }

  // Nowa metoda do odtwarzania audio z serwera dla całej sesji
  emitServerAudioCommand(
    sessionCode: string, 
    command: 'PLAY' | 'PAUSE' | 'RESUME' | 'STOP', 
    audioId: string,
    loop: boolean = false 
  ): void {
    if (this.socket && this.socket.connected) {
      console.log(`🎵 Emitting server audio command:`, { sessionCode, command, audioId, loop });
      this.socket.emit('server-audio-command', { 
        code: sessionCode, 
        command, 
        audioId, 
        loop 
      });
    } else {
      console.warn('Socket not connected, cannot emit server audio command');
    }
  }
    leaveSession(code: string): void {
    if (!this.socket || !this.socket.connected) return;
    
    console.log(`Leaving session room for code: ${code}`);
    this.safeEmit('leave-code', code);
    
    // Also unsubscribe from specific session update events for this code
    const specificEvent = `session-update-${code}`;
    const listeners = this.listeners.get(specificEvent);
    if (listeners) {
      listeners.forEach(listener => {
        this.socket?.off(specificEvent, listener);
      });
      this.listeners.delete(specificEvent);
      console.log(`Removed all listeners for ${specificEvent}`);
    }
  }
  subscribeAsExaminer(
    sessionCode: string, 
    userId: string, 
    token?: string, 
    onStudentListUpdate?: (data: StudentListUpdate) => void,
    onStudentSessionUpdate?: (data: StudentSessionUpdate) => void
  ): Promise<{ success: boolean }> {
    if (!this.socket || !this.socket.connected) {
      console.log('Socket not connected, connecting before subscribing examiner...');
      this.connect();
      
      // Give the socket a moment to establish connection
      return new Promise((resolve) => {
        setTimeout(() => {
          if (this.socket?.connected) {
            // Now try to subscribe with connected socket
            this._doExaminerSubscribe(sessionCode, userId, token, onStudentListUpdate, onStudentSessionUpdate)
              .then(resolve);
          } else {
            console.error('Socket connection failed, subscription will likely fail');
            resolve({ success: false });
          }
        }, 1000);
      });
    }

    return this._doExaminerSubscribe(sessionCode, userId, token, onStudentListUpdate, onStudentSessionUpdate);
  }
  
     emitStudentAudioCommand(
  studentId: number, 
  command: 'PLAY' | 'PAUSE' | 'RESUME' | 'STOP' | 'PLAY_QUEUE', 
  soundName: string | SoundQueueItem[],
  loop: boolean = false
): void {
  if (!this.socket || !this.socket.connected) {
    this.connect();
  }
  
  if (typeof studentId !== 'number') {
    console.error('Invalid student ID type');
    return;
  }

  const payload = {
    studentId,
    command,
    soundName,
    loop
  };
  
  console.log(`Emitting student audio-command: ${command}`, payload);
  this.safeEmit('student-audio-command', payload);
}

  private _doExaminerSubscribe(
    sessionCode: string, 
    userId: string, 
    token?: string, 
    onStudentListUpdate?: (data: StudentListUpdate) => void,
    onStudentSessionUpdate?: (data: StudentSessionUpdate) => void
  ): Promise<{ success: boolean }> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false });
        return;
      }      console.log(`Subscribing examiner to session: ${sessionCode}`);
      
      this.safeEmit('examiner-subscribe', { 
        sessionCode, 
        userId, 
        token 
      });
      
      // Set up listeners for student updates if callbacks are provided
      if (onStudentListUpdate) {
        this.on<StudentListUpdate>('student-list-update', onStudentListUpdate);
      }
      
      if (onStudentSessionUpdate) {
        this.on<StudentSessionUpdate>('student-session-update', onStudentSessionUpdate);
      }
      
      // Listen for subscription confirmation with timeout
      const timeoutId = setTimeout(() => {
        console.warn(`Subscription to ${sessionCode} timed out, assuming failure`);
        this.socket?.off('examiner-subscribe-success');
        this.socket?.off('examiner-subscribe-error');
        resolve({ success: false });
      }, 10000);
      
      this.socket.once('examiner-subscribe-success', () => {
        clearTimeout(timeoutId);
        console.log(`Successfully subscribed examiner to session ${sessionCode}`);
        resolve({ success: true });
      });
      
      this.socket.once('examiner-subscribe-error', (error) => {
        clearTimeout(timeoutId);
        console.error(`Failed to subscribe examiner to session ${sessionCode}:`, error);
        resolve({ success: false });
      });
    });
  }
    unsubscribeAsExaminer(): void {
    if (!this.socket || !this.socket.connected) return;
      console.log('Unsubscribing examiner from session');
    this.safeEmit('examiner-unsubscribe', {});
    
    // Clean up listeners
    this.socket.off('student-list-update');
    this.socket.off('student-session-update');
    
    // Clean up any event listeners related to examiner subscription
    this.socket.off('examiner-subscribe-success');
    this.socket.off('examiner-subscribe-error');
  }

  
  private async reconnectWithPolling(): Promise<void> {
    console.log('🔄 Reconnecting with polling transport...');
    
    try {
      // Disconnect current socket
      if (this.socket) {
        this.socket.disconnect();
      }
      
      // Create new socket with polling transport only
      this.socket = io(WS_URL, {
        transports: ['polling'],
        withCredentials: false,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 30000,
        forceNew: true
      });
      
      // Setup event listeners again
      this.setupEventListeners();
      
      console.log('🔄 Socket recreated with polling transport');
    } catch (error) {
      console.error('Failed to reconnect with polling:', error);
    }
  }

  
  safeEmit(eventName: string, data: any): void {
    if (!this.socket) {
      console.warn(`Cannot emit ${eventName}, socket not initialized`);
      return;
    }
    
    try {
      this.socket.emit(eventName, data);
    } catch (error) {
      console.error(`Error emitting ${eventName}:`, error);
    }
  }

  
  getConnectionStatus(): {connected: boolean; id: string | null; url: string} {
    return {
      connected: this.socket?.connected || false,
      id: this.socket?.id || null,
      url: WS_URL
    };
  }
    async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      
      // Release WiFi lock on Android
      if (Platform.OS === 'android') {
        try {
          await wifiKeepAliveService.disableWebSocketKeepAlive();
        } catch (error) {
          console.warn('Failed to disable WebSocket keep-alive:', error);
        }
      }
    }
  }
}

// Export a singleton instance
export const socketService = new SocketService();