/**
 * SessionService.ts
 * Service for handling session CRUD operations
 */

import apiService from "./ApiService";
import { socketService } from './SocketService';

export interface Session {
  sessionId?: number;
  name?: string;     // New field for session name
  temperature: number;
  rhythmType: number;
  beatsPerMinute: number;
  noiseLevel: number;
  sessionCode: string; // Changed from number to string
  isActive?: boolean;  // New field indicating if session is active
  createdAt?: string;
  updatedAt?: string;
  // Added medical parameters
  examiner_id?: number;
  hr?: number;      // Heart rate in beats per minute
  bp?: string;      // Blood pressure in mmHg, format: systolic/diastolic
  spo2?: number;    // Oxygen saturation percentage
  etco2?: number;   // End-tidal carbon dioxide level in mmHg
  rr?: number;      // Respiratory rate in breaths per minute
}

export class SessionService {
  private api: any;
  
  constructor() {
    this.api = apiService;
  }

  /**
   * Create custom authorization header if provided
   * @param authToken Optional authorization token
   * @returns Headers object
   */
  private createHeaders(authToken?: string): Headers | undefined {
    if (!authToken) return undefined;
    
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${authToken}`);
    return headers;
  }

  /**
   * Create a new session
   * @param sessionData The session data to create
   * @param authToken Optional authorization token
   * @returns Promise with the created session
   */
  async createSession(sessionData: Session, authToken?: string): Promise<Session> {
    try {
      const headers = this.createHeaders(authToken);
      const response = await this.api.post('sessions', sessionData, headers);
      return response.data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get all sessions
   * @param authToken Optional authorization token
   * @returns Promise with an array of sessions
   */
  async getAllSessions(authToken?: string): Promise<Session[]> {
    try {
      const headers = this.createHeaders(authToken);
      const response = await this.api.get('sessions', headers);
      
      console.log(response)

      return response;
    } catch (error) {
      console.error('Error fetching all sessions:', error);
      throw error;
    }
  }

  /**
   * Get a session by ID
   * @param id The session ID
   * @param authToken Optional authorization token
   * @returns Promise with the session data
   */
  async getSessionById(id: number, authToken?: string): Promise<Session> {
    try {
      const headers = this.createHeaders(authToken);
      const response = await this.api.get(`sessions/${id}`, headers);
      return response.data;
    } catch (error) {
      console.error(`Error fetching session with id ${id}:`, error);
      throw error;
    }
  }
  /**
   * Get a session by session code
   * @param code The session code
   * @param authToken Optional authorization token
   * @returns Promise with the session data
   */
  async getSessionByCode(code: string, authToken?: string): Promise<Session> {
    try {
      const headers = this.createHeaders(authToken);
      const response = await this.api.get(`sessions/code/${code}`, headers);
      return response
    } catch (error) {
      console.error(`Error fetching session with code ${code}:`, error);
      throw error;
    }
  }
/**
 * Subscribe to real-time updates for a specific session by code
 * @param code The session code to subscribe to
 * @param onUpdate Callback function for session updates
 * @returns Unsubscribe function
 */
  async subscribeToSessionUpdates(code: string, onUpdate: (session: Session) => void): Promise<() => void> {
  try {
    // Connect to socket first if not already connected
    socketService.connect();
    
    // First join the session code room and handle any errors
    socketService.joinSessionCode(code)
      .then(joinResult => {
        console.log(`Socket joined code ${code}: ${joinResult.success ? 'Success' : 'Failed'}`);
        
        // After joining, try to subscribe to all sessions
        return socketService.subscribeToAllSessions();
      })
      .then(subscribeResult => {
        console.log(`Subscribed to all sessions: ${subscribeResult.success ? 'Success' : 'Failed'}`);
      })
      .catch(error => {
        console.error(`Socket connection error for code ${code}:`, error);
        // Even if there's an error, we still set up the listener as the socket might reconnect
      });
    
    // Set up the listener regardless of connection status
    // This ensures we receive updates even if initial connection fails but reconnects later
    const unsubscribe = await socketService.onSessionUpdate(code, updatedSession => {
      console.log(`Session update received for code ${code}:`, updatedSession);
      onUpdate(updatedSession);
    });
    
    // Return an enhanced unsubscribe function
    return () => {
      console.log(`Unsubscribing from session updates for code ${code}`);
      unsubscribe();
      // Don't unsubscribe from all-sessions as other components may need it
    };
  } catch (error) {
    console.error(`Error subscribing to session updates for code ${code}:`, error);
    // Return a no-op function in case of error
    return () => {};
  }
}

  /**
   * Update a session
   * @param id The session ID to update
   * @param sessionData The updated session data
   * @param authToken Optional authorization token
   * @returns Promise with the updated session
   */
  async updateSession(id: number, sessionData: Partial<Session>, authToken?: string): Promise<Session> {
    try {
      const headers = this.createHeaders(authToken);
      const response = await this.api.put(`sessions/${id}`, sessionData, headers);
      return response;
    } catch (error) {
      console.error(`Error updating session with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Validate a session code
   * @param code The session code to validate
   * @returns Promise with the session data if valid, or an error if invalid
   */
  async validateSessionCode(code: string): Promise<Session> {
    try {
      const response = await this.api.get(`sessions/validate/${code}`);
      return response;
    }
    catch (error) {
      console.error(`Error validating session code ${code}:`, error);
      throw error;
    }
  }


  /**
   * Delete a session
   * @param id The session ID to delete
   * @param authToken Optional authorization token
   * @returns Promise with the delete confirmation
   */
  async deleteSession(id: number, authToken?: string): Promise<any> {
    try {
      const headers = this.createHeaders(authToken);
      const response = await this.api.delete(`sessions/${id}`, headers);
      return response;
    } catch (error) {
      console.error(`Error deleting session with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete all sessions (admin only)
   * @param authToken Optional authorization token
   * @returns Promise with the delete confirmation
   */
  async deleteAllSessions(authToken?: string): Promise<any> {
    try {
      const headers = this.createHeaders(authToken);
      const response = await this.api.delete('sessions', headers);
      return response;
    } catch (error) {
      console.error('Error deleting all sessions:', error);
      throw error;
    }
  }
  /**
   * Generate a random session code
   * @returns A random 6-digit session code as a string
   */
  generateSessionCode(): string {
    // Generate a random 6-digit code and convert to string
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

// Export a singleton instance
export const sessionService = new SessionService();