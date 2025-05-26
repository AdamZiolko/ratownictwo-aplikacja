import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { audioApiService } from '@/services/AudioApiService';
import { AudioFile, AudioFileUiStatus, AudioPlayerState } from '../types/AudioTypes';
import { ensureCacheDirExists, getLocalAudioPath } from '../utils/audioUtils';
import { API_URL } from '@/constants/Config';

export const useAudioOperations = () => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [audioFileStatuses, setAudioFileStatuses] = useState<Record<string, AudioFileUiStatus>>({});
  
  const [playerState, setPlayerState] = useState<AudioPlayerState>({
    sound: null,
    playingId: null,
    currentPlayingAudio: null,
    playbackStatus: null,
    isPlayingInModal: false,
    playerModalVisible: false,
  });

  // Pobieranie listy plików audio i sprawdzanie lokalnego statusu
  const fetchAudioFiles = async () => {
    setLoading(true);
    try {
      await ensureCacheDirExists();
      const fetchedFiles = await audioApiService.getAudioList();
      const initialStatuses: Record<string, AudioFileUiStatus> = {};
      fetchedFiles.forEach(file => {
        initialStatuses[file.id] = { isLocallyAvailable: false, isLoading: true, error: null };
      });
      setAudioFileStatuses(initialStatuses);
      setAudioFiles(fetchedFiles);

      // Asynchronously check local availability for each file
      for (const file of fetchedFiles) {
        const localPath = getLocalAudioPath(file.id);
        if (Platform.OS === 'web') {
          setAudioFileStatuses(prevStatuses => ({
            ...prevStatuses,
            [file.id]: { ...prevStatuses[file.id], isLocallyAvailable: false, isLoading: false }
          }));
        } else {
          FileSystem.getInfoAsync(localPath).then(fileInfo => {
            setAudioFileStatuses(prevStatuses => ({
              ...prevStatuses,
              [file.id]: { ...prevStatuses[file.id], isLocallyAvailable: fileInfo.exists, isLoading: false }
            }));
          }).catch(err => {
            console.error(`Error checking local status for ${file.id}:`, err);
            setAudioFileStatuses(prevStatuses => ({
              ...prevStatuses,
              [file.id]: { ...prevStatuses[file.id], isLoading: false, error: 'Failed to check local status' }
            }));
          });
        }
      }
    } catch (error) {
      console.error('Błąd podczas pobierania plików audio:', error);
      Alert.alert('Błąd', 'Nie udało się pobrać listy plików audio');
      setAudioFileStatuses(prev => {
        const updated = {...prev};
        audioFiles.forEach(f => updated[f.id] = {...(updated[f.id] || {}), isLoading: false, error: 'Failed to load list'});
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAudioFiles();
    setRefreshing(false);
  };

  // Odtwarzanie audio przez streaming z cache'owaniem
  const handlePlayAudio = async (audio: AudioFile) => {
    if (playerState.sound) {
      await playerState.sound.unloadAsync();
      setPlayerState(prev => ({ 
        ...prev, 
        sound: null, 
        isPlayingInModal: false 
      }));
    }

    // Jeśli kliknięto ten sam plik, który jest już wybrany do odtwarzania w modalu, zamknij modal
    if (playerState.playerModalVisible && playerState.currentPlayingAudio?.id === audio.id) {
      setPlayerState(prev => ({
        ...prev,
        playerModalVisible: false,
        currentPlayingAudio: null,
        playingId: null,
      }));
      return;
    }

    setPlayerState(prev => ({
      ...prev,
      currentPlayingAudio: audio,
      playerModalVisible: true,
      playingId: audio.id,
    }));
  };

  const handlePlayPauseInModal = async () => {
    if (!playerState.sound || !playerState.currentPlayingAudio) return;

    if (playerState.isPlayingInModal) {
      await playerState.sound.pauseAsync();
      setPlayerState(prev => ({ ...prev, isPlayingInModal: false }));
    } else {
      await playerState.sound.playAsync();
      setPlayerState(prev => ({ ...prev, isPlayingInModal: true }));
    }
  };

  const onModalClose = async () => {
    if (playerState.sound) {
      await playerState.sound.unloadAsync();
    }
    setPlayerState(prev => ({
      ...prev,
      sound: null,
      playerModalVisible: false,
      currentPlayingAudio: null,
      playbackStatus: null,
      isPlayingInModal: false,
      playingId: null,
    }));
  };

  const handleDownloadAudio = async (id: string, name: string) => {
    setAudioFileStatuses(prev => ({ ...prev, [id]: { ...(prev[id] || {}), isLoading: true, error: null } }));
    try {
      await ensureCacheDirExists();
      const downloadResponse = await audioApiService.downloadAudio(id);
      if (!downloadResponse.ok) {
        throw new Error(`Nie udało się pobrać pliku audio (status: ${downloadResponse.status})`);
      }
      const arrayBuffer = await downloadResponse.arrayBuffer();
      const localPath = getLocalAudioPath(id);

      if (Platform.OS === 'web') {
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${id}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Alert.alert('Sukces', `Plik audio ${name} (${id}.mp3) został pobrany.`);
        setAudioFileStatuses(prev => ({ ...prev, [id]: { ...(prev[id] || {}), isLoading: false } }));      } else {
        // For mobile platforms, don't create Blob - use direct base64 encoding
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < uint8Array.byteLength; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64Data = btoa(binary);

        await FileSystem.writeAsStringAsync(localPath, base64Data, {
          encoding: FileSystem.EncodingType.Base64
        });
        Alert.alert('Sukces', `Plik audio ${name} został pobrany i zapisany lokalnie.`);
        setAudioFileStatuses(prev => ({ ...prev, [id]: { ...(prev[id] || {}), isLocallyAvailable: true, isLoading: false } }));
      }
    } catch (error: any) {
      console.error('Błąd podczas pobierania audio:', error);
      Alert.alert('Błąd', `Nie udało się pobrać pliku audio: ${error.message}`);
      setAudioFileStatuses(prev => ({ ...prev, [id]: { ...(prev[id] || {}), isLoading: false, error: error.message } }));
    }
  };
  // Audio player effect for modal
  useEffect(() => {
    if (playerState.playerModalVisible && playerState.currentPlayingAudio && !playerState.sound) {
      (async () => {
        const audio = playerState.currentPlayingAudio!;
        setAudioFileStatuses(prev => ({ ...prev, [audio.id]: { ...(prev[audio.id] || {}), isLoading: true, error: null } }));
        try {
          let soundUri: string;
          const localPath = getLocalAudioPath(audio.id);

          if (Platform.OS === 'web') {
            const streamResponse = await audioApiService.streamAudio(audio.id);
            if (!streamResponse.ok) throw new Error('Failed to stream audio for web');
            const arrayBuffer = await streamResponse.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
            soundUri = URL.createObjectURL(blob);
          } else {
            await ensureCacheDirExists();
            const fileInfo = await FileSystem.getInfoAsync(localPath);
            if (fileInfo.exists) {
              soundUri = localPath;
            } else {
              // Download the file first with authentication, then play
              console.log(`Downloading audio ${audio.id} for playback...`);
              const streamResponse = await audioApiService.streamAudio(audio.id);
              if (!streamResponse.ok) {
                throw new Error(`Failed to download audio: ${streamResponse.status} ${streamResponse.statusText}`);
              }
                const arrayBuffer = await streamResponse.arrayBuffer();
              const uint8Array = new Uint8Array(arrayBuffer);
              let binaryString = '';
              for (let i = 0; i < uint8Array.length; i++) {
                binaryString += String.fromCharCode(uint8Array[i]);
              }
              const base64String = btoa(binaryString);
              
              await FileSystem.writeAsStringAsync(localPath, base64String, {
                encoding: FileSystem.EncodingType.Base64,
              });
              
              soundUri = localPath;
              console.log(`Audio ${audio.id} downloaded and cached locally`);
            }
          }

          const { sound: newSound, status } = await Audio.Sound.createAsync(
            { uri: soundUri },
            { shouldPlay: true }
          );
            setPlayerState(prev => ({
            ...prev,
            sound: newSound,
            isPlayingInModal: true,
            playbackStatus: status as AVPlaybackStatus,
          }));

          newSound.setOnPlaybackStatusUpdate((statusUpdate) => {
            if (statusUpdate.isLoaded) {
              setPlayerState(prev => ({ ...prev, playbackStatus: statusUpdate }));
              if (statusUpdate.didJustFinish) {
                setPlayerState(prev => ({ ...prev, isPlayingInModal: false }));
                if (Platform.OS === 'web' && soundUri.startsWith('blob:')) {
                  URL.revokeObjectURL(soundUri);
                }
              }
            }
          });
          setAudioFileStatuses(prev => ({ ...prev, [audio.id]: { ...(prev[audio.id] || {}), isLoading: false } }));
        } catch (error: any) {
          console.error('Błąd podczas ładowania audio w modalu:', error);
          Alert.alert('Błąd', `Nie udało się załadować pliku audio: ${error.message}`);
          setAudioFileStatuses(prev => ({ ...prev, [audio.id]: { ...(prev[audio.id] || {}), isLoading: false, error: error.message } }));
          onModalClose();
        }
      })();
    }
  }, [playerState.playerModalVisible, playerState.currentPlayingAudio]);

  // Cleanup effect
  useEffect(() => {
    if (Platform.OS !== 'web') {
      ensureCacheDirExists();
    }
    fetchAudioFiles();
    return () => {
      if (playerState.sound) {
        playerState.sound.unloadAsync();
      }
    };
  }, []);

  return {
    audioFiles,
    loading,
    refreshing,
    audioFileStatuses,
    playerState,
    fetchAudioFiles,
    onRefresh,
    handlePlayAudio,
    handlePlayPauseInModal,
    onModalClose,
    handleDownloadAudio,
  };
};
