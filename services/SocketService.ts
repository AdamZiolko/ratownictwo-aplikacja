import { io, Socket } from 'socket.io-client';
import { Session } from './SessionService';
import { API_URL } from '@/constants/Config';

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
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
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
    joinSessionCode(code: string, studentInfo?: { name?: string, surname?: string, albumNumber?: string }): Promise<{ success: boolean, code: string }> {
    if (!this.socket || !this.socket.connected) {
      this.connect();
    }

    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, code });
        return;
      }

      if (studentInfo && studentInfo.name && studentInfo.surname && studentInfo.albumNumber) {
        
        this.socket.emit('join-code', {
          code,
          name: studentInfo.name,
          surname: studentInfo.surname,
          albumNumber: studentInfo.albumNumber
        });
        console.log('Joining code room with student info:', code, studentInfo);
      } else {
        
        this.socket.emit('join-code', code);
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
      this.connect();
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
    this.socket?.emit('audio-command', payload);
  }
  
  leaveSession(code: string): void {
    if (!this.socket || !this.socket.connected) return;
    
    console.log(`Leaving session room for code: ${code}`);
    this.socket.emit('leave-code', code);
    
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
      }

      console.log(`Subscribing examiner to session: ${sessionCode}`);
      
      this.socket.emit('examiner-subscribe', { 
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
    this.socket.emit('examiner-unsubscribe');
    
    // Clean up listeners
    this.socket.off('student-list-update');
    this.socket.off('student-session-update');
    
    // Clean up any event listeners related to examiner subscription
    this.socket.off('examiner-subscribe-success');
    this.socket.off('examiner-subscribe-error');
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