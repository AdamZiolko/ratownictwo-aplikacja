import React from 'react';
import { View } from 'react-native';
import { FAB, useTheme } from 'react-native-paper';
import { createDashboardStyles } from '../DashboardStyles';
import { useAudioOperations } from '../hooks/useAudioOperations';
import { useAudioFileOperations } from '../hooks/useAudioFileOperations';
import { AudioList } from './AudioList';
import { AudioDialogs } from './AudioDialogs';

const AudioTab = () => {
  const theme = useTheme();

  const dashboardStyles = createDashboardStyles(theme);

  const {
    audioFiles,
    loading,
    refreshing,
    audioFileStatuses,
    playerState,
    onRefresh,
    handlePlayAudio,
    handleDownloadAudio,
  } = useAudioOperations();

  const fileOperations = useAudioFileOperations(() => {
    onRefresh();
  });

  return (
    <View style={dashboardStyles.contentContainer}>
      <AudioList
        audioFiles={audioFiles}
        audioFileStatuses={audioFileStatuses}
        loading={loading}
        refreshing={refreshing}
        playingId={playerState.playingId}
        isPlayingInModal={playerState.isPlayingInModal}
        onRefresh={onRefresh}
        onPlay={handlePlayAudio}
        onDownload={handleDownloadAudio}
        onDelete={fileOperations.openDeleteDialog}
      />

      {!fileOperations.dialogState.uploading && (
        <FAB
          icon="plus"
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.primary,
          }}
          onPress={fileOperations.openUploadDialog}
        />
      )}

      <AudioDialogs
        dialogState={fileOperations.dialogState}
        onSelectFile={fileOperations.handleSelectFile}
        onUpload={fileOperations.handleUploadAudio}
        onDelete={fileOperations.handleDeleteAudio}
        onCloseUpload={fileOperations.closeUploadDialog}
        onCloseDelete={fileOperations.closeDeleteDialog}
        onUpdateName={fileOperations.updateAudioName}
      />
    </View>
  );
};

export default AudioTab;
