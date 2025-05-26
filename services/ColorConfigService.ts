import apiService from './ApiService';

export interface ColorConfig {
  id?: number;
  sessionId?: string;
  colorType: 'red' | 'green' | 'blue';
  soundFileName: string;
  isEnabled?: boolean;
}

export class ColorConfigService {
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

  async createColorConfig(colorConfig: ColorConfig, authToken?: string): Promise<ColorConfig> {
    try {
      const headers = this.createHeaders(authToken);
      const response = await this.api.post('color-configs', colorConfig, headers);
      return response;
    } catch (error) {
      console.error('Error creating color config:', error);
      throw error;
    }
  }

  async deleteColorConfig(id: number, authToken?: string): Promise<any> {
    try {
      const headers = this.createHeaders(authToken);
      const response = await this.api.delete(`color-configs/${id}`, headers);
      return response;
    } catch (error) {
      console.error(`Error deleting color config ${id}:`, error);
      throw error;
    }
  }
}

const colorConfigService = new ColorConfigService();
export default colorConfigService;
