import React from 'react';
import { View, Alert } from 'react-native';
import {
  Text,
  Card,
  IconButton,
  ActivityIndicator,
  Tooltip,
  useTheme,
} from 'react-native-paper';
import { AudioFile, AudioFileUiStatus } from '../types/AudioTypes';
import { formatDate, formatDuration } from '../utils/audioUtils';
import { createDashboardStyles } from '../DashboardStyles';

interface AudioCardProps {
  audio: AudioFile;
  status: AudioFileUiStatus;
  playingId: string | null;
  isPlayingInModal: boolean;
  onPlay: (audio: AudioFile) => void;
  onDownload: (id: string, name: string) => void;
  onEdit: (audio: AudioFile) => void;
  onDelete: (audio: AudioFile) => void;
}

export const AudioCard: React.FC<AudioCardProps> = ({
  audio,
  status,
  playingId,
  isPlayingInModal,
  onPlay,
  onDownload,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  const dashboardStyles = createDashboardStyles(theme);

  return (
    <Card key={audio.id} style={dashboardStyles.audioCard}>
      <Card.Content>
        <View style={dashboardStyles.audioHeader}>
          <View style={dashboardStyles.audioInfo}>
            <Text style={dashboardStyles.audioTitle}>{audio.name}</Text>
            <Text style={dashboardStyles.audioDetails}>
              Czas trwania: {formatDuration(audio.length)}
            </Text>
            <Text style={dashboardStyles.audioDetails}>
              Utworzono: {formatDate(audio.createdAt)}
            </Text>
            <Text style={dashboardStyles.audioDetails}>
              Autor: {audio.createdBy}
            </Text>
          </View>
          <View style={dashboardStyles.audioActions}>
            {}
            {status?.isLoading && playingId !== audio.id && (
              <ActivityIndicator size="small" style={{ marginRight: 8 }} />
            )}
            <IconButton
              icon={
                playingId === audio.id && isPlayingInModal
                  ? 'pause-circle-outline'
                  : 'play-circle-outline'
              }
              size={28}
              onPress={() => onPlay(audio)}
              disabled={status?.isLoading && playingId !== audio.id}
            />
            {status?.isLocallyAvailable ? (
              <IconButton
                icon="check-circle"
                size={24}
                disabled
                onPress={() =>
                  Alert.alert('Informacja', 'Plik jest już dostępny lokalnie.')
                }
              />
            ) : (
              <IconButton
                icon="download-circle-outline"
                size={24}
                onPress={() => onDownload(audio.id, audio.name)}
                disabled={status?.isLoading}
              />
            )}
            {status?.error && (
              <Tooltip title={status?.error || 'Unknown error'}>
                <IconButton
                  icon="alert-circle-outline"
                  size={20}
                  iconColor={theme.colors.error}
                />
              </Tooltip>
            )}
            <IconButton icon="pencil" size={20} onPress={() => onEdit(audio)} />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => onDelete(audio)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};
