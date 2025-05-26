import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export const CACHE_DIR_NAME = '.audiocache'; // Hidden directory
export const CACHE_DIR_URI = FileSystem.documentDirectory + CACHE_DIR_NAME + '/';

export const getLocalAudioPath = (id: string) => `${CACHE_DIR_URI}${id}.mp3`;

export const ensureCacheDirExists = async () => {
  if (Platform.OS === 'web') {
    console.log('Cache directory operations skipped on web.');
    return;
  }
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR_URI);
  if (!dirInfo.exists) {
    console.log('Creating cache directory:', CACHE_DIR_URI);
    await FileSystem.makeDirectoryAsync(CACHE_DIR_URI, { intermediates: true });
    if (Platform.OS === 'android') {
      // Create .nomedia file to hide from music players on Android
      try {
        await FileSystem.writeAsStringAsync(CACHE_DIR_URI + '.nomedia', '');
        console.log('.nomedia file created in cache directory');
      } catch (e) {
        console.error('Failed to create .nomedia file', e);
      }
    }
  }
};

// Formatowanie daty
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Formatowanie czasu trwania
export const formatDuration = (seconds: string) => {
  const totalSeconds = parseInt(seconds, 10);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
