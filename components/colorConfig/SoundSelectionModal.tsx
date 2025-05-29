import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { Dialog, Button } from 'react-native-paper';
import SoundSelectionComponent from '@/components/SoundSelectionComponent';

// Get screen dimensions for responsive design
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

interface SoundSelectionModalProps {
  visible: boolean;
  selectedSound: string;
  selectedServerAudioId: string | null;
  isLoadingAudio: boolean;
  onSoundSelect: (soundName: string | null, serverAudioId: string | null) => void;
  onSoundPreview: (soundName: string | null, serverAudioId: string | null) => void;
  onClose: () => void;
}

const SoundSelectionModal: React.FC<SoundSelectionModalProps> = ({
  visible,
  selectedSound,
  selectedServerAudioId,
  isLoadingAudio,
  onSoundSelect,
  onSoundPreview,
  onClose,
}) => {

  // Debug logging
  React.useEffect(() => {
    console.log("SoundSelectionModal: Visibility changed to:", visible);
    console.log("SoundSelectionModal: Platform:", Platform.OS);
    console.log("SoundSelectionModal: Screen dimensions:", { height: screenHeight, width: screenWidth });
  }, [visible]);

  return (
    <Dialog
      visible={visible}
      onDismiss={onClose}
      style={Platform.OS === 'web' ? styles.webDialog : styles.mobileDialog}
      dismissable={!isLoadingAudio}
    >
      <Dialog.Title>Wybierz dźwięk</Dialog.Title>
      <Dialog.Content style={Platform.OS === 'web' ? styles.webDialogContent : styles.mobileDialogContent}>
        <SoundSelectionComponent
          selectedSound={selectedSound}
          selectedServerAudioId={selectedServerAudioId}
          onSoundSelect={onSoundSelect}
          onSoundPreview={onSoundPreview}
          style={styles.soundSelection}
        />
      </Dialog.Content>
      <Dialog.Actions style={styles.modalActions}>
        <Button
          onPress={onClose}
          disabled={isLoadingAudio}
        >
          Zamknij
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  // Legacy styles for backwards compatibility
  soundSelectionDialog: {
    maxHeight: Platform.OS === 'web' ? "85%" : "90%",
    marginHorizontal: 16,
  },
  soundSelectionContent: {
    paddingBottom: 0,
    maxHeight: Platform.OS === 'web' ? 400 : 500,
  },
    // New responsive styles
  webDialog: {
    maxHeight: "85%",
    marginHorizontal: 16,
    width: '90%',
    maxWidth: 600,
    alignSelf: 'center',
    elevation: 24,
  },
  mobileDialog: {
    maxHeight: screenHeight * 0.9,
    marginHorizontal: 8,
    width: screenWidth - 16,
    alignSelf: 'center',
    elevation: 24,
    zIndex: 1000,
  },
  webDialogContent: {
    paddingBottom: 0,
    maxHeight: 400,
    minHeight: 300,
  },
  mobileDialogContent: {
    paddingBottom: 0,
    maxHeight: screenHeight * 0.7,
    minHeight: screenHeight * 0.4,
    paddingHorizontal: 8,
  },
  soundSelection: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? 300 : screenHeight * 0.35,
  },
  modalActions: {
    justifyContent: "flex-end",
    paddingTop: 16,
  },
});

export default SoundSelectionModal;
