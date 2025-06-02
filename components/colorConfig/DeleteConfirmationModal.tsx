import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, Button, useTheme } from 'react-native-paper';

interface DeleteConfirmationModalProps {
  visible: boolean;
  loading: boolean;
  isLoadingAudio: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  loading,
  isLoadingAudio,
  onConfirm,
  onCancel,
}) => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    dialog: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    title: {
      color: theme.colors.error,
      fontSize: 20,
      fontWeight: '600',
    },
    content: {
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    contentText: {
      color: theme.colors.onSurface,
      fontSize: 16,
      lineHeight: 24,
    },
    modalActions: {
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    cancelButton: {
      flex: 1,
      marginRight: 8,
    },
    deleteButton: {
      flex: 1,
      marginLeft: 8,
    },
  });

  return (
    <Dialog visible={visible} onDismiss={onCancel} style={styles.dialog}>
      <Dialog.Title style={styles.title}>Usuń konfigurację</Dialog.Title>
      <Dialog.Content style={styles.content}>
        <Dialog.ScrollArea>
          <View>
            <Dialog.Title style={styles.contentText}>
              Czy na pewno chcesz usunąć tę konfigurację? Tej operacji nie można
              cofnąć.
            </Dialog.Title>
          </View>
        </Dialog.ScrollArea>
      </Dialog.Content>
      <Dialog.Actions style={styles.modalActions}>
        <Button
          mode="outlined"
          onPress={onCancel}
          disabled={loading || isLoadingAudio}
          style={styles.cancelButton}
          contentStyle={{ paddingVertical: 8 }}
          labelStyle={{ color: theme.colors.onSurface }}
        >
          Anuluj
        </Button>
        <Button
          mode="outlined"
          onPress={onConfirm}
          loading={loading}
          disabled={loading || isLoadingAudio}
          style={styles.deleteButton}
          contentStyle={{ paddingVertical: 8 }}
          labelStyle={{ color: theme.colors.error }}
          buttonColor="transparent"
        >
          Usuń
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

export default DeleteConfirmationModal;
