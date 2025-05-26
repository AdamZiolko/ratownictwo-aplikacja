import React from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import { AudioFile, AudioFileUiStatus } from '../types/AudioTypes';
import { AudioCard } from './AudioCard';
import { createDashboardStyles } from '../DashboardStyles';

interface AudioListProps {
  audioFiles: AudioFile[];
  audioFileStatuses: Record<string, AudioFileUiStatus>;
  loading: boolean;
  refreshing: boolean;
  playingId: string | null;
  isPlayingInModal: boolean;
  onRefresh: () => void;
  onPlay: (audio: AudioFile) => void;
  onDownload: (id: string, name: string) => void;
  onEdit: (audio: AudioFile) => void;
  onDelete: (audio: AudioFile) => void;
}

export const AudioList: React.FC<AudioListProps> = ({
  audioFiles,
  audioFileStatuses,
  loading,
  refreshing,
  playingId,
  isPlayingInModal,
  onRefresh,
  onPlay,
  onDownload,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  const dashboardStyles = createDashboardStyles(theme);

  if (loading && !refreshing) {
    return (
      <View style={dashboardStyles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={dashboardStyles.loadingText}>Ładowanie plików audio...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={dashboardStyles.tableContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {audioFiles.length === 0 ? (
        <View style={dashboardStyles.emptyState}>
          <Text style={dashboardStyles.emptyText}>
            Brak plików audio
          </Text>
          <Text style={dashboardStyles.emptySubtext}>
            Dodaj pierwszy plik audio używając przycisku +
          </Text>
        </View>
      ) : (
        <View>
          {audioFiles.map((audio) => (
            <AudioCard
              key={audio.id}
              audio={audio}
              status={audioFileStatuses[audio.id]}
              playingId={playingId}
              isPlayingInModal={isPlayingInModal}
              onPlay={onPlay}
              onDownload={onDownload}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
};
