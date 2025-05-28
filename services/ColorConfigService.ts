import ApiService from './ApiService';

export interface ColorConfig {
  id: number;
  sessionId: string;
  color: 'red' | 'green' | 'blue' | 'yellow' | 'orange' | 'purple';
  soundName?: string;
  serverAudioId?: string;
  isEnabled: boolean;
  volume: number;
  isLooping: boolean;
  serverAudio?: {
    id: string;
    name: string;
    createdBy: string;
  };
}

export interface ColorConfigRequest {
  id?: number;
  color: 'red' | 'green' | 'blue' | 'yellow' | 'orange' | 'purple';
  soundName?: string;
  serverAudioId?: string;
  isEnabled?: boolean;
  volume?: number;
  isLooping?: boolean;
}

class ColorConfigService {
  private api: typeof ApiService;

  constructor() {
    this.api = ApiService;
  }

  /**
   * Get color configurations for a session
   */
  async getColorConfigs(sessionId: string): Promise<ColorConfig[]> {
    try {
      const response = await this.api.get(`color-config/${sessionId}`);
      return response.colorConfigs;
    } catch (error) {
      console.error('Error fetching color configurations:', error);
      throw error;
    }
  }

  /**
   * Get color configurations for a session (for students - no auth required)
   */
  async getColorConfigsForStudent(sessionId: string): Promise<ColorConfig[]> {
    try {
      const response = await this.api.get(`color-config/student/${sessionId}`);
      return response.colorConfigs;
    } catch (error) {
      console.error('Error fetching color configurations for student:', error);
      throw error;
    }
  }

  /**
   * Create or update a color configuration
   */
  async saveColorConfig(sessionId: string, config: ColorConfigRequest): Promise<ColorConfig> {
    try {
      const response = await this.api.post(`color-config/${sessionId}`, config);
      return response.colorConfig;
    } catch (error) {
      console.error('Error saving color configuration:', error);
      throw error;
    }
  }

  /**
   * Delete a color configuration
   */
  async deleteColorConfig(sessionId: string, color: string): Promise<void> {
    try {
      await this.api.delete(`color-config/${sessionId}/${color}`);
    } catch (error) {
      console.error('Error deleting color configuration:', error);
      throw error;
    }
  }

  /**
   * Bulk update color configurations
   */
  async bulkUpdateColorConfigs(sessionId: string, configs: ColorConfigRequest[]): Promise<ColorConfig[]> {
    try {
      const response = await this.api.post(`color-config/${sessionId}/bulk`, { colorConfigs: configs });
      return response.colorConfigs;
    } catch (error) {
      console.error('Error bulk updating color configurations:', error);
      throw error;
    }
  }

  /**
   * Toggle color configuration enabled status
   */
  async toggleColorConfig(sessionId: string, color: string, isEnabled: boolean): Promise<ColorConfig> {
    try {
      const response = await this.api.put(`color-config/${sessionId}/${color}/toggle`, { isEnabled });
      return response.colorConfig;
    } catch (error) {
      console.error('Error toggling color configuration:', error);
      throw error;
    }
  }

  /**
   * Get default color configurations for a new session
   */
  getDefaultColorConfigs(): ColorConfigRequest[] {
    return [
      {
        color: 'red',
        soundName: 'Adult/Male/Screaming.wav',
        isEnabled: true,
        volume: 1.0,
        isLooping: false
      },
      {
        color: 'green',
        soundName: 'Adult/Female/Screaming.wav',
        isEnabled: true,
        volume: 1.0,
        isLooping: false
      },
      {
        color: 'blue',
        soundName: 'Child/Screaming.wav',
        isEnabled: true,
        volume: 1.0,
        isLooping: false
      },
      {
        color: 'yellow',
        soundName: 'Infant/Screaming.wav',
        isEnabled: true,
        volume: 1.0,
        isLooping: false
      },
      {
        color: 'orange',
        soundName: 'Speech/Chest hurts.wav',
        isEnabled: true,
        volume: 1.0,
        isLooping: false
      },
      {
        color: 'purple',
        soundName: 'Speech/I\'m feeling very dizzy.wav',
        isEnabled: true,
        volume: 1.0,
        isLooping: false
      }
    ];
  }
}

export const colorConfigService = new ColorConfigService();
export default colorConfigService;
