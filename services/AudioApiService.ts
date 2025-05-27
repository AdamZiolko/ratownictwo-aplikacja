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
  audioData: string; // base64
  mimeType: string;
}

interface UpdateAudioData {
  name?: string;
  audioData?: string; // base64
  mimeType?: string;
}

class AudioApiService {
  private api: typeof ApiService;
  constructor() {
    this.api = ApiService;
  }  // Pobieranie listy plików audio
  async getAudioList(): Promise<AudioFile[]> {
    try {
      const response = await this.api.get('audio/list');
      return response;
    } catch (error) {
      console.error('Error fetching audio list:', error);
      throw error;
    }  }  // Streaming pliku audio
  async streamAudio(id: string): Promise<Response> {
    try {
      console.log(`🌐 Streaming audio from server: ${id}`);
      
      const response = await fetch(`${API_URL}/api/audio/${id}/stream`, {
        method: 'GET',
        headers: {
          'Accept': 'audio/*,*/*',
        },
      });
      
      if (!response.ok) {
        console.error(`❌ Audio stream failed: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log(`✅ Audio stream response received: ${id} (${response.headers.get('content-type')})`);
      return response;
    } catch (error) {
      console.error('❌ Error streaming audio:', error);
      throw error;
    }
  }  // Pobieranie pliku audio do download
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
    }  }  // Przesyłanie nowego pliku audio (base64)
  async uploadAudio(data: UploadAudioData): Promise<AudioFile> {
    try {
      const response = await this.api.post('audio/upload', data);
      return response.audio;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }  }  // Aktualizacja pliku audio (base64)
  async updateAudio(id: string, data: UpdateAudioData): Promise<AudioFile> {
    try {
      const response = await this.api.put(`audio/${id}/update`, data);
      return response.audio;
    } catch (error) {
      console.error('Error updating audio:', error);
      throw error;
    }  }
    // Usuwanie pliku audio
  async deleteAudio(id: string): Promise<void> {
    try {
      await this.api.delete(`audio/${id}/delete`);
    } catch (error) {
      console.error('Error deleting audio:', error);
      throw error;
    }  }

  // Konwersja pliku na base64
  async fileToBase64(uri: string): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        // Web platform implementation
        return await this.fileToBase64Web(uri);
      } else {
        // Native platform implementation (Android, iOS)
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

  // Web-specific implementation for file conversion
  private async fileToBase64Web(uri: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // For web, the uri might be a blob URL or data URL
        if (uri.startsWith('data:')) {
          // If it's already a data URL, extract the base64 part
          const base64 = uri.split(',')[1];
          resolve(base64);
          return;
        }

        // If it's a blob URL, fetch and convert
        fetch(uri)
          .then(response => response.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Extract base64 data from data URL
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = () => {
              reject(new Error('Failed to read file as base64'));
            };
            reader.readAsDataURL(blob);
          })          .catch(error => {
            reject(new Error(`Failed to fetch file: ${error.message}`));
          });
      } catch (error) {
        reject(new Error(`Error in web file conversion: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }
}

// Eksport pojedynczej instancji
export const audioApiService = new AudioApiService();
export default audioApiService;
