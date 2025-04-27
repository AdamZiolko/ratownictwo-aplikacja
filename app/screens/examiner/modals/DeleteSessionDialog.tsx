import React from 'react';
import { StyleSheet } from 'react-native';
import { Dialog, Button, Text } from 'react-native-paper';
import { Session } from '../types/types';

interface DeleteSessionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  session: Session | null;
  onDeleteSession: () => void;
  errorColor: string;
}

const DeleteSessionDialog: React.FC<DeleteSessionDialogProps> = ({
  visible,
  onDismiss,
  session,
  onDeleteSession,
  errorColor,
}) => {
  if (!session) return null;

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Usuń sesję</Dialog.Title>
      <Dialog.Content>
        <Text>Czy na pewno chcesz usunąć sesję o kodzie {session.sessionCode}?</Text>
        <Text style={[styles.warningText, { color: errorColor }]}>Tej operacji nie można cofnąć.</Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Anuluj</Button>
        <Button onPress={onDeleteSession} textColor={errorColor}>Usuń</Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  warningText: {
    marginTop: 8,
  },
});

export default DeleteSessionDialog;