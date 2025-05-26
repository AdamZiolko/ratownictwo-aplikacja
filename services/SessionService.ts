import apiService from "./ApiService";
import { socketService } from './SocketService';

export interface StudentInSession {
  id?: number;
  name?: string;
  surname?: string;
  albumNumber?: string;
  student_sessions?: {
    active?: boolean;
    joinedAt?: string;
  };
}

export interface ColorConfig {
  id?: number;
  colorType: 'red' | 'green' | 'blue';
  soundFileName: string;
  isEnabled?: boolean;
}

export interface Session {
  sessionId?: string;
  name?: string;     
  temperature: number;
  rhythmType: number;
  beatsPerMinute: number;
  noiseLevel: number;
  sessionCode: string; 
  isActive?: boolean;
  isEkdDisplayHidden?: boolean;  
  createdAt?: string;
  updatedAt?: string;
  
  examiner_id?: number;
  hr?: number;      
  bp?: string;      
  spo2?: number;    
  etco2?: number;   
  rr?: number;      
  
  students?: StudentInSession[];
  colorConfigs?: ColorConfig[];
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
  async subscribeToSessionUpdates(
    code: string, 
    onUpdate: (session: Session) => void,
    studentInfo?: { name?: string, surname?: string, albumNumber?: string }
  ): Promise<() => void> {  try {
    
    await socketService.connect();
    
    
    const joinResult = await socketService.joinSessionCode(code, studentInfo);
    console.log(`Socket joined code ${code}: ${joinResult.success ? 'Success' : 'Failed'}`);
    
    if (!joinResult.success) {
      console.error(`Failed to join session room for code ${code}`);
      
    }
    
    
    const unsubscribe = await socketService.onSessionUpdate(code, updatedSession => {
      console.log(`Session update received for code ${code}:`, updatedSession);
      onUpdate(updatedSession);
    }, studentInfo);
    
    
    return () => {
      console.log(`Unsubscribing from session updates for code ${code}`);
      unsubscribe();
    };
  } catch (error) {
    console.error(`Error subscribing to session updates for code ${code}:`, error);
    
    return () => {};
  }
}

  
  async updateSession(id: string, sessionData: Partial<Session>, authToken?: string): Promise<Session> {
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
      
      
      if (response && response.isActive === false) {
        throw new Error("Session is inactive");
      }
      
      return response;
    }
    catch (error) {
      console.error(`Error validating session code ${code}:`, error);
      throw error;
    }
  }

  
  leaveSession(code: string): void {
    try {
      socketService.leaveSession(code);
      console.log(`Left session with code ${code}`);
    } catch (error) {
      console.error(`Error leaving session with code ${code}:`, error);
    }
  }    async deleteSession(id: string, authToken?: string): Promise<any> {
    try {
      let sessionCode: string | undefined;
      try {
        const session = await this.getSessionById(Number(id), authToken);
        sessionCode = session.sessionCode;
      } catch (e) {
        console.warn(`Could not retrieve session ${id} code before deletion:`, e);
      }
      
      const headers = this.createHeaders(authToken);
      
      const response = await this.api.delete(`sessions/${id}`, headers);
      
      const codeToUse = sessionCode || (response && response.sessionCode);
      
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
  async deleteSessionAndNotify(id: string, authToken?: string): Promise<any> {
    try {
      
      let sessionCode: string | undefined;
      try {
        const session = await this.getSessionById(Number(id), authToken);
        sessionCode = session?.sessionCode;
      } catch (fetchError) {
        console.warn(`Could not fetch session details before deletion: ${fetchError}`);
      }
      
      
      const headers = this.createHeaders(authToken);
      const response = await this.api.delete(`sessions/${id}`, headers);
      
      
      const codeToUse = sessionCode || (response && response.sessionCode);
      
      
      if (codeToUse) {
        console.log(`Notified clients about deletion of session ${codeToUse}`);
      } else {
        console.warn(`Could not notify about session ${id} deletion: session code not available`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error in deleteSessionAndNotify for session ${id}:`, error);
      throw error;
    }
  }
  
  generateSessionCode(): string {
    
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Color configuration methods
  async getSessionColorConfigs(sessionId: string, authToken?: string): Promise<ColorConfig[]> {
    try {
      const headers = this.createHeaders(authToken);
      const response = await this.api.get(`color-configs/session/${sessionId}`, headers);
      return response;
    } catch (error) {
      console.error(`Error fetching color configs for session ${sessionId}:`, error);
      throw error;
    }
  }

  async setSessionColorConfigs(sessionId: string, colorConfigs: ColorConfig[], authToken?: string): Promise<ColorConfig[]> {
    try {
      const headers = this.createHeaders(authToken);
      const response = await this.api.post(`color-configs/session/${sessionId}`, { colorConfigs }, headers);
      return response;
    } catch (error) {
      console.error(`Error setting color configs for session ${sessionId}:`, error);
      throw error;
    }
  }

  async updateColorConfig(id: number, colorConfig: Partial<ColorConfig>, authToken?: string): Promise<any> {
    try {
      const headers = this.createHeaders(authToken);
      const response = await this.api.put(`color-configs/${id}`, colorConfig, headers);
      return response;
    } catch (error) {
      console.error(`Error updating color config ${id}:`, error);
      throw error;
    }
  }
}


export const sessionService = new SessionService();