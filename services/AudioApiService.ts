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
  }

  // Pobieranie listy plików audio
  async getAudioList(): Promise<AudioFile[]> {
    console.warn('Audio API endpoints have been removed from the server. Use local audio files instead.');
    // Zwracamy pustą tablicę, ponieważ serwer nie obsługuje już funkcji audio
    return [];
  }

  // Streaming pliku audio
  async streamAudio(id: string): Promise<Response> {
    // Zwracamy błąd, ponieważ serwer nie obsługuje już funkcji audio
    console.warn('Audio streaming is no longer supported by the server. Use local audio files instead.');
    
    // Tworzymy sztuczną odpowiedź z błędem
    const errorResponse = new Response(JSON.stringify({ 
      error: 'Audio API endpoints have been removed from the server' 
    }), {
      status: 404,
      statusText: 'Not Found',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return errorResponse;
  }

  // Pobieranie pliku audio do download
  async downloadAudio(id: string): Promise<Response> {
    // Zwracamy błąd, ponieważ serwer nie obsługuje już funkcji audio
    console.warn('Audio download is no longer supported by the server. Use local audio files instead.');
    
    // Tworzymy sztuczną odpowiedź z błędem
    const errorResponse = new Response(JSON.stringify({ 
      error: 'Audio API endpoints have been removed from the server' 
    }), {
      status: 404,
      statusText: 'Not Found',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return errorResponse;
  }

  // Przesyłanie nowego pliku audio (base64)
  async uploadAudio(data: UploadAudioData): Promise<AudioFile> {
    console.warn('Audio upload is no longer supported by the server. Use local audio files instead.');
    throw new Error('Audio API endpoints have been removed from the server');
  }

  // Aktualizacja pliku audio (base64)
  async updateAudio(id: string, data: UpdateAudioData): Promise<AudioFile> {
    console.warn('Audio update is no longer supported by the server. Use local audio files instead.');
    throw new Error('Audio API endpoints have been removed from the server');
  }
  
  // Usuwanie pliku audio
  async deleteAudio(id: string): Promise<void> {
    console.warn('Audio deletion is no longer supported by the server. Use local audio files instead.');
    throw new Error('Audio API endpoints have been removed from the server');
  }
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
          })
          .catch(error => {
            reject(new Error(`Failed to fetch file: ${error.message}`));
          });      } catch (error) {
        reject(new Error(`Error in web file conversion: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }
}

// Eksport pojedynczej instancji
export const audioApiService = new AudioApiService();
export default audioApiService;
