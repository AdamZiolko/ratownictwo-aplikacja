import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, Button } from 'react-native-paper';
import SoundSelectionComponent from '@/components/SoundSelectionComponent';

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
  return (
    <Dialog
      visible={visible}
      onDismiss={onClose}
      style={styles.soundSelectionDialog}
    >
      <Dialog.Title>Wybierz dźwięk</Dialog.Title>
      <Dialog.Content style={styles.soundSelectionContent}>
        <SoundSelectionComponent
          selectedSound={selectedSound}
          selectedServerAudioId={selectedServerAudioId}
          onSoundSelect={onSoundSelect}
          onSoundPreview={onSoundPreview}
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
  soundSelectionDialog: {
    maxHeight: "85%",
    marginHorizontal: 16,
  },
  soundSelectionContent: {
    paddingBottom: 0,
    maxHeight: 400,
  },
  modalActions: {
    justifyContent: "flex-end",
    paddingTop: 16,
  },
});

export default SoundSelectionModal;
