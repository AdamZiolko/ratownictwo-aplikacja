

import apiService from "./ApiService";
import { socketService } from './SocketService';

export interface Session {
  sessionId?: number;
  name?: string;     
  temperature: number;
  rhythmType: number;
  beatsPerMinute: number;
  noiseLevel: number;
  sessionCode: string; 
  isActive?: boolean;  
  createdAt?: string;
  updatedAt?: string;
  
  examiner_id?: number;
  hr?: number;      
  bp?: string;      
  spo2?: number;    
  etco2?: number;   
  rr?: number;      
}

export class SessionService {
  private api: any;
  
  constructor() {
    this.api = apiService;
  }

  
  private createHeaders(authToken?: string): Headers | undefined {
    if (!authToken) return undefined;
    
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${authToken}`);
    return headers;
  }

  
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

  async subscribeToSessionUpdates(code: string, onUpdate: (session: Session) => void): Promise<() => void> {
  try {
    
    socketService.connect();
    
    
    const joinResult = await socketService.joinSessionCode(code);
    console.log(`Socket joined code ${code}: ${joinResult.success ? 'Success' : 'Failed'}`);
    
    if (!joinResult.success) {
      console.error(`Failed to join session room for code ${code}`);
      
    }
    
    
    const unsubscribe = await socketService.onSessionUpdate(code, updatedSession => {
      console.log(`Session update received for code ${code}:`, updatedSession);
      onUpdate(updatedSession);
    });
    
    
    return () => {
      console.log(`Unsubscribing from session updates for code ${code}`);
      unsubscribe();
    };
  } catch (error) {
    console.error(`Error subscribing to session updates for code ${code}:`, error);
    
    return () => {};
  }
}

  
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
  
  generateSessionCode(): string {
    
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}


export const sessionService = new SessionService();