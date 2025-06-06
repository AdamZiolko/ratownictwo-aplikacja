import { useState } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { audioApiService } from '@/services/AudioApiService';
import { AudioFile, AudioDialogState } from '../types/AudioTypes';

export const useAudioFileOperations = (onFileChange: () => void) => {
  const [dialogState, setDialogState] = useState<AudioDialogState>({
    uploadDialogVisible: false,
    deleteDialogVisible: false,
    currentAudio: null,
    audioName: '',
    selectedFile: null,
    uploading: false,
  });
  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setDialogState(prev => ({
          ...prev,
          selectedFile: {
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType,
            size: asset.size,
          },
          audioName: asset.name.split('.')[0],
        }));
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Błąd', 'Nie udało się wybrać pliku.');
    }
  };
  const handleUploadAudio = async () => {
    if (!dialogState.selectedFile || !dialogState.audioName.trim()) {
      Alert.alert('Błąd', 'Proszę wybrać plik i podać nazwę');
      return;
    }

    setDialogState(prev => ({ ...prev, uploading: true }));
    try {
      const base64Data = await audioApiService.fileToBase64(
        dialogState.selectedFile.uri
      );
      await audioApiService.uploadAudio({
        name: dialogState.audioName.trim(),
        audioData: base64Data,
        mimeType: dialogState.selectedFile.mimeType || 'audio/mp3',
      });

      Alert.alert('Sukces', 'Plik audio został pomyślnie przesłany');
      setDialogState(prev => ({
        ...prev,
        uploadDialogVisible: false,
        audioName: '',
        selectedFile: null,
      }));
      onFileChange();
    } catch (error) {
      console.error('Błąd podczas przesyłania:', error);
      Alert.alert('Błąd', 'Nie udało się przesłać pliku audio');
    } finally {
      setDialogState(prev => ({ ...prev, uploading: false }));
    }
  };

  const handleDeleteAudio = async () => {
    if (!dialogState.currentAudio) return;
    const audioIdToDelete = dialogState.currentAudio.id;
    try {
      await audioApiService.deleteAudio(audioIdToDelete);
      Alert.alert('Sukces', 'Plik audio został usunięty z serwera.');
      setDialogState(prev => ({
        ...prev,
        deleteDialogVisible: false,
        currentAudio: null,
      }));
      onFileChange();
    } catch (error) {
      console.error('Błąd podczas usuwania:', error);
      Alert.alert('Błąd', 'Nie udało się usunąć pliku audio.');
    }
  };

  const openUploadDialog = () => {
    setDialogState(prev => ({
      ...prev,
      uploadDialogVisible: true,
      audioName: '',
      selectedFile: null,
    }));
  };

  const openDeleteDialog = (audio: AudioFile) => {
    setDialogState(prev => ({
      ...prev,
      currentAudio: audio,
      deleteDialogVisible: true,
    }));
  };

  const closeUploadDialog = () => {
    setDialogState(prev => ({ ...prev, uploadDialogVisible: false }));
  };

  const closeDeleteDialog = () => {
    setDialogState(prev => ({ ...prev, deleteDialogVisible: false }));
  };

  const updateAudioName = (name: string) => {
    setDialogState(prev => ({ ...prev, audioName: name }));
  };

  return {
    dialogState,
    handleSelectFile,
    handleUploadAudio,
    handleDeleteAudio,
    openUploadDialog,
    openDeleteDialog,
    closeUploadDialog,
    closeDeleteDialog,
    updateAudioName,
  };
};
