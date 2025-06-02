import ApiService from './ApiService';

export interface Preset {
  id: string;
  name: string;
  data: any;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

class PresetService {
  static async getDefaultPresets(): Promise<Preset[]> {
    try {
      const response = await ApiService.get('presets/default');
      return response.map((p: any) => ({
        ...p,
        isDefault: true,
      }));
    } catch (error) {
      console.error('Error fetching default presets:', error);
      return [];
    }
  }
}

export default PresetService;
