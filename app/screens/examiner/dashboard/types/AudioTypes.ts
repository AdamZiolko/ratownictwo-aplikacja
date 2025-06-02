import * as DocumentPicker from 'expo-document-picker';
import { Audio, AVPlaybackStatus } from 'expo-av';

export interface AudioFile {
  id: string;
  name: string;
  length: string;
  createdAt: string;
  updatedBy: string;
  createdBy: string;
  updatedAt: string;
  filepath: string;
}

export interface AudioFileUiStatus {
  isLocallyAvailable: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AudioPlayerState {
  sound: Audio.Sound | null;
  playingId: string | null;
  currentPlayingAudio: AudioFile | null;
  playbackStatus: AVPlaybackStatus | null;
  isPlayingInModal: boolean;
  playerModalVisible: boolean;
}

export interface AudioDialogState {
  uploadDialogVisible: boolean;
  editDialogVisible: boolean;
  deleteDialogVisible: boolean;
  currentAudio: AudioFile | null;
  audioName: string;
  selectedFile: DocumentPicker.DocumentPickerAsset | null;
  uploading: boolean;
}

export interface AudioTabState {
  audioFiles: AudioFile[];
  loading: boolean;
  refreshing: boolean;
  audioFileStatuses: Record<string, AudioFileUiStatus>;
}
