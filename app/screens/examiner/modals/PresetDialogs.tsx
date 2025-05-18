import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Dimensions } from 'react-native';
import { 
  Dialog, 
  Button, 
  TextInput, 
  List, 
  IconButton, 
  Text 
} from 'react-native-paper';
import { Preset, FormData } from '../types/types';

interface SavePresetDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSavePreset: (presetName: string) => void;
  formData?: FormData;
}

export const SavePresetDialog: React.FC<SavePresetDialogProps> = ({
  visible,
  onDismiss,
  onSavePreset,
  formData,
}) => {
  const [presetName, setPresetName] = useState("");

  
  useEffect(() => {
    if (visible) {
      setPresetName("");
    }
  }, [visible]);
  const handleSavePreset = () => {
    if (presetName.trim() !== "") {
      onSavePreset(presetName);
      setPresetName("");
    }
  };

  return (
    <Dialog 
      visible={visible} 
      onDismiss={onDismiss}
      style={{
        maxHeight: Dimensions.get('window').height * 0.8,
        width: '90%',
        alignSelf: 'center'
      }}
    >
      <Dialog.Title>Zapisz konfigurację jako preset</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Nazwa presetu"
          value={presetName}
          onChangeText={setPresetName}
          mode="outlined"
          style={styles.input}
          placeholder="Wprowadź nazwę presetu"
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Anuluj</Button>
        <Button onPress={handleSavePreset}>Zapisz</Button>
      </Dialog.Actions>
    </Dialog>
  );
}

interface LoadPresetDialogProps {
  visible: boolean;
  onDismiss: () => void;
  presets: Preset[];
  onLoadPreset: (preset: Preset) => void;
  onDeletePreset: (presetId: string) => void;
}

export const LoadPresetDialog: React.FC<LoadPresetDialogProps> = ({
  visible,
  onDismiss,
  presets,
  onLoadPreset,
  onDeletePreset,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  
  useEffect(() => {
    if (!visible) {
      setSelectedPreset(null);
    }
  }, [visible]);
  const handleLoadPreset = () => {
    if (selectedPreset) {
      const presetToLoad = presets.find(p => p.id === selectedPreset);
      if (presetToLoad) {
        onLoadPreset(presetToLoad);
        
      }
    }
  };

  return (
    <Dialog 
      visible={visible} 
      onDismiss={onDismiss}
      style={{
        maxHeight: Dimensions.get('window').height * 0.8,
        width: '90%',
        alignSelf: 'center'
      }}
    >
      <Dialog.Title>Wybierz preset do wczytania</Dialog.Title>
      <Dialog.ScrollArea style={styles.dialogScrollArea}>
        <ScrollView>
          {presets.length === 0 ? (
            <Text style={styles.emptyStateText}>Brak zapisanych presetów</Text>
          ) : (
            presets.map((preset) => (
              <List.Item
                key={preset.id}
                title={preset.name}
                description={`Rytm: ${preset.data.rhythmType}, BPM: ${preset.data.beatsPerMinute}`}
                onPress={() => setSelectedPreset(preset.id)}
                right={() => (
                  <View style={styles.presetItemActions}>
                    <IconButton
                      icon={selectedPreset === preset.id ? "check-circle" : "circle-outline"}
                      onPress={() => setSelectedPreset(preset.id)}
                      size={24}
                    />
                    <IconButton
                      icon="delete"
                      onPress={() => onDeletePreset(preset.id)}
                      size={24}
                    />
                  </View>
                )}
                style={
                  selectedPreset === preset.id
                    ? { backgroundColor: 'rgba(98, 0, 238, 0.08)' }
                    : {}
                }
              />
            ))
          )}
        </ScrollView>
      </Dialog.ScrollArea>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Anuluj</Button>
        <Button 
          onPress={handleLoadPreset}
          disabled={!selectedPreset}
        >
          Wczytaj
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  input: {
    marginBottom: 8,
  },  dialogScrollArea: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  emptyStateText: {
    textAlign: "center",
    marginVertical: 16,
    opacity: 0.7,
  },
  presetItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});