import React from 'react';
import {
  Text,
  Button,
  TextInput,
  Dialog,
  Portal,
  useTheme,
} from 'react-native-paper';
import { AudioDialogState } from '../types/AudioTypes';

interface AudioDialogsProps {
  dialogState: AudioDialogState;
  onSelectFile: () => void;
  onUpload: () => void;
  onDelete: () => void;
  onCloseUpload: () => void;
  onCloseDelete: () => void;
  onUpdateName: (name: string) => void;
}

export const AudioDialogs: React.FC<AudioDialogsProps> = ({
  dialogState,
  onSelectFile,
  onUpload,
  onDelete,
  onCloseUpload,
  onCloseDelete,
  onUpdateName,
}) => {
  const theme = useTheme();

  return (
    <Portal>
      <Dialog
        visible={dialogState.uploadDialogVisible}
        onDismiss={onCloseUpload}
      >
        <Dialog.Title>Dodaj nowy plik audio</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Nazwa pliku audio"
            value={dialogState.audioName}
            onChangeText={onUpdateName}
            style={{ marginBottom: 16 }}
          />
          <Button
            mode="outlined"
            onPress={onSelectFile}
            style={{ marginBottom: 8 }}
          >
            {dialogState.selectedFile
              ? `Wybrany plik: ${dialogState.selectedFile.name}`
              : 'Wybierz plik audio'}
          </Button>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCloseUpload}>Anuluj</Button>
          <Button onPress={onUpload} disabled={dialogState.uploading}>
            {dialogState.uploading ? 'Przesyłanie...' : 'Prześlij'}
          </Button>
        </Dialog.Actions>
      </Dialog>
      <Dialog
        visible={dialogState.deleteDialogVisible}
        onDismiss={onCloseDelete}
      >
        <Dialog.Title>Usuń plik audio</Dialog.Title>
        <Dialog.Content>
          <Text>
            Czy na pewno chcesz usunąć plik audio "
            {dialogState.currentAudio?.name}"? Ta operacja jest nieodwracalna.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCloseDelete}>Anuluj</Button>
          <Button onPress={onDelete} textColor={theme.colors.error}>
            Usuń
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};
