import React from 'react';
import { Dialog, Portal, Button, Paragraph, Title } from 'react-native-paper';
import { ScrollView, Platform } from 'react-native';

interface DebugModeDialogProps {
  visible: boolean;
  onDismiss: () => void;
}

export const DebugModeDialog: React.FC<DebugModeDialogProps> = ({
  visible,
  onDismiss,
}) => {
  // Don't show on web platform
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} dismissable={false}>        <Dialog.Title>
          <Title>Włącz debugowanie USB</Title>
        </Dialog.Title>
        <Dialog.Content>
          <Paragraph style={{ fontSize: 16, lineHeight: 22, marginBottom: 12 }}>
            Włącz debugowanie USB w ustawieniach:
          </Paragraph>
          
          <Paragraph style={{ fontSize: 14, lineHeight: 18, marginBottom: 6, marginLeft: 12 }}>
            1. Ustawienia → Informacje o telefonie
          </Paragraph>
          
          <Paragraph style={{ fontSize: 14, lineHeight: 18, marginBottom: 6, marginLeft: 12 }}>
            2. Kliknij 7x na "Numer kompilacji"
          </Paragraph>
          
          <Paragraph style={{ fontSize: 14, lineHeight: 18, marginBottom: 6, marginLeft: 12 }}>
            3. Opcje programistyczne → Debugowanie USB
          </Paragraph>
          
          <Paragraph style={{ fontSize: 14, lineHeight: 18, marginBottom: 12, marginLeft: 12 }}>
            4. Włącz "Debugowanie USB"
          </Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button 
            mode="contained" 
            onPress={onDismiss}
            style={{ paddingHorizontal: 20 }}
          >
            Rozumiem
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};