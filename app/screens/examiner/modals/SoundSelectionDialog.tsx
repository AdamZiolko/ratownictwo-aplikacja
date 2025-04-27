import React from 'react';
import { StyleSheet } from 'react-native';
import { Dialog, Button, RadioButton, Text, List } from 'react-native-paper';
import { Session } from '../types/types';

interface SoundSelectionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  session: Session | null;
  selectedSound: string | null;
  setSelectedSound: React.Dispatch<React.SetStateAction<string | null>>;
  onSendAudioCommand: () => void;
}

const SoundSelectionDialog: React.FC<SoundSelectionDialogProps> = ({
  visible,
  onDismiss,
  session,
  selectedSound,
  setSelectedSound,
  onSendAudioCommand,
}) => {
  if (!session) return null;

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
    >
      <Dialog.Title>Odtwórz dźwięk</Dialog.Title>
      <Dialog.Content>
        <Text>
          Wybierz dźwięk do odtworzenia w sesji
          <Text style={{ fontWeight: "bold" }}>{session.name || session.sessionCode}</Text>
        </Text>
        <RadioButton.Group
          onValueChange={value => setSelectedSound(value)}
          value={selectedSound || ""}
        >
          {[
            { label: "Kaszel", value: "kaszel" },
            { label: "Szum serca", value: "szum-serca" },
            { label: "Normalne bicie", value: "normalne-bicie" },
          ].map(option => (
            <List.Item
              key={option.value}
              title={option.label}
              onPress={() => setSelectedSound(option.value)}
              right={props => (
                <RadioButton
                  {...props}
                  value={option.value}
                />
              )}
            />
          ))}
        </RadioButton.Group>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Anuluj</Button>
        <Button
          onPress={onSendAudioCommand}
          disabled={!selectedSound}
        >
          Odtwórz
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

export default SoundSelectionDialog;