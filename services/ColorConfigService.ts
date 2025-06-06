import ApiService from './ApiService';

export interface ColorConfig {
  id: number;
  sessionId: string;
  color: 'custom';
  colorIdentifier?: string;
  soundName?: string;
  displayName?: string;
  serverAudioId?: string;
  isEnabled: boolean;
  volume: number;
  isLooping: boolean;
  customColorRgb?: { r: number; g: number; b: number };
  colorTolerance?: number;
  serverAudio?: {
    id: string;
    name: string;
    createdBy: string;
  };
}

export interface ColorConfigRequest {
  id?: number;
  color: 'custom';
  colorIdentifier?: string;
  soundName?: string;
  displayName?: string;
  serverAudioId?: string;
  isEnabled?: boolean;
  volume?: number;
  isLooping?: boolean;
  customColorRgb?: { r: number; g: number; b: number };
  colorTolerance?: number;
}

class ColorConfigService {
  private api: typeof ApiService;

  constructor() {
    this.api = ApiService;
  }

  async getColorConfigs(sessionId: string): Promise<ColorConfig[]> {
    try {
      const response = await this.api.get(`color-config/${sessionId}`);
      return response.colorConfigs;
    } catch (error) {
      console.error('Error fetching color configurations:', error);
      throw error;
    }
  }

  async getColorConfigsForStudent(sessionId: string): Promise<ColorConfig[]> {
    try {
      const response = await this.api.get(`color-config/student/${sessionId}`);
      return response.colorConfigs;
    } catch (error) {
      console.error('Error fetching color configurations for student:', error);
      throw error;
    }
  }

  async saveColorConfig(
    sessionId: string,
    config: ColorConfigRequest
  ): Promise<ColorConfig> {
    try {
      const response = await this.api.post(`color-config/${sessionId}`, config);
      return response.colorConfig;
    } catch (error) {
      console.error('Error saving color configuration:', error);
      throw error;
    }
  }

  async deleteColorConfig(sessionId: string, id: number): Promise<void> {
    try {
      await this.api.delete(`color-config/${sessionId}/${id}`);
    } catch (error) {
      console.error('Error deleting color configuration:', error);
      throw error;
    }
  }

  async bulkUpdateColorConfigs(
    sessionId: string,
    configs: ColorConfigRequest[]
  ): Promise<ColorConfig[]> {
    try {
      const response = await this.api.post(`color-config/${sessionId}/bulk`, {
        colorConfigs: configs,
      });
      return response.colorConfigs;
    } catch (error) {
      console.error('Error bulk updating color configurations:', error);
      throw error;
    }
  }

  async toggleColorConfig(
    sessionId: string,
    id: number,
    isEnabled: boolean
  ): Promise<ColorConfig> {
    try {
      const response = await this.api.put(
        `color-config/${sessionId}/${id}/toggle`,
        { isEnabled }
      );
      return response.colorConfig;
    } catch (error) {
      console.error('Error toggling color configuration:', error);
      throw error;
    }
  }

  getDefaultColorConfigs(): ColorConfigRequest[] {
    return [
      {
        color: 'custom',
        customColorRgb: { r: 255, g: 0, b: 0 },
        colorTolerance: 0.15,
        displayName: 'Czerwony',
        soundName: 'Adult/Male/Screaming.wav',
        isEnabled: true,
        volume: 1.0,
        isLooping: false,
      },
      {
        color: 'custom',
        customColorRgb: { r: 0, g: 255, b: 0 },
        colorTolerance: 0.15,
        displayName: 'Zielony',
        soundName: 'Adult/Female/Screaming.wav',
        isEnabled: true,
        volume: 1.0,
        isLooping: false,
      },
      {
        color: 'custom',
        customColorRgb: { r: 0, g: 0, b: 255 },
        colorTolerance: 0.15,
        displayName: 'Niebieski',
        soundName: 'Child/Screaming.wav',
        isEnabled: true,
        volume: 1.0,
        isLooping: false,
      },
      {
        color: 'custom',
        customColorRgb: { r: 255, g: 255, b: 0 },
        colorTolerance: 0.15,
        displayName: 'Żółty',
        soundName: 'Infant/Screaming.wav',
        isEnabled: true,
        volume: 1.0,
        isLooping: false,
      },
      {
        color: 'custom',
        customColorRgb: { r: 255, g: 165, b: 0 },
        colorTolerance: 0.15,
        displayName: 'Pomarańczowy',
        soundName: 'Speech/Chest hurts.wav',
        isEnabled: true,
        volume: 1.0,
        isLooping: false,
      },
      {
        color: 'custom',
        customColorRgb: { r: 128, g: 0, b: 128 },
        colorTolerance: 0.15,
        displayName: 'Fioletowy',
        soundName: "Speech/I'm feeling very dizzy.wav",
        isEnabled: true,
        volume: 1.0,
        isLooping: false,
      },
    ];
  }
}

export const colorConfigService = new ColorConfigService();
export default colorConfigService;
