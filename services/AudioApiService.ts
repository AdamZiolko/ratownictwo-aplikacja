import ApiService from './ApiService';
import AuthService from './AuthService';
import { API_URL } from '@/constants/Config';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

interface AudioFile {
  id: string;
  name: string;
  length: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  filepath: string;
}

interface UploadAudioData {
  name: string;
  audioData: string;
  mimeType: string;
}

interface UpdateAudioData {
  name?: string;
  audioData?: string;
  mimeType?: string;
}

class AudioApiService {
  private api: typeof ApiService;
  constructor() {
    this.api = ApiService;
  }
  async getAudioList(): Promise<AudioFile[]> {
    try {
      const response = await this.api.get('audio/list');
      return response;
    } catch (error) {
      console.error('Error fetching audio list:', error);
      throw error;
    }
  }
  async streamAudio(id: string): Promise<Response> {
    try {
      const response = await fetch(`${API_URL}/api/audio/${id}/stream`, {
        method: 'GET',
        headers: {
          Accept: 'audio*',
        },
      });

      if (!response.ok) {
        console.error(
          `❌ Audio stream failed: ${response.status} ${response.statusText}`
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error('❌ Error streaming audio:', error);
      throw error;
    }
  }
  async downloadAudio(id: string): Promise<Response> {
    try {
      const response = await fetch(`${API_URL}/api/audio/${id}/download`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      console.error('Error downloading audio:', error);
      throw error;
    }
  }
  async uploadAudio(data: UploadAudioData): Promise<AudioFile> {
    try {
      const response = await this.api.post('audio/upload', data);
      return response.audio;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  }
  async updateAudio(id: string, data: UpdateAudioData): Promise<AudioFile> {
    try {
      const response = await this.api.put(`audio/${id}/update`, data);
      return response.audio;
    } catch (error) {
      console.error('Error updating audio:', error);
      throw error;
    }
  }

  async deleteAudio(id: string): Promise<void> {
    try {
      await this.api.delete(`audio/${id}/delete`);
    } catch (error) {
      console.error('Error deleting audio:', error);
      throw error;
    }
  }

  async fileToBase64(uri: string): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        return await this.fileToBase64Web(uri);
      } else {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
      }
    } catch (error) {
      console.error('Error converting file to base64:', error);
      throw error;
    }
  }

  private async fileToBase64Web(uri: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        if (uri.startsWith('data:')) {
          const base64 = uri.split(',')[1];
          resolve(base64);
          return;
        }

        fetch(uri)
          .then(response => response.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;

              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = () => {
              reject(new Error('Failed to read file as base64'));
            };
            reader.readAsDataURL(blob);
          })
          .catch(error => {
            reject(new Error(`Failed to fetch file: ${error.message}`));
          });
      } catch (error) {
        reject(
          new Error(
            `Error in web file conversion: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          )
        );
      }
    });
  }
}

export const audioApiService = new AudioApiService();
export default audioApiService;
