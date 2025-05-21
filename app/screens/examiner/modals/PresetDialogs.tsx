import React, { useState, useEffect } from "react";
import { StyleSheet, ScrollView, View, Dimensions, ActivityIndicator } from "react-native";
import { Dialog, Button, TextInput, List, IconButton, Text } from "react-native-paper";
import { Preset, FormData } from "../types/types";
import PresetService from "../../../../services/PresetService";

// SavePresetDialog
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
    if (visible) setPresetName("");
  }, [visible]);

  const handleSave = () => {
    if (presetName.trim()) {
      onSavePreset(presetName);
      setPresetName("");
    }
  };

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={styles.dialog}
    >
      <Dialog.Title>Zapisz konfigurację jako preset</Dialog.Title>
      <Dialog.Content>
        <TextInput
          label="Nazwa presetu"
          value={presetName}
          onChangeText={setPresetName}
          mode="outlined"
          placeholder="Wprowadź nazwę presetu"
          style={styles.input}
        />
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Anuluj</Button>
        <Button mode="contained" onPress={handleSave}>Zapisz</Button>
      </Dialog.Actions>
    </Dialog>
  );
};

// LoadPresetDialog
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
  const [defaultPresets, setDefaultPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const data = await PresetService.getDefaultPresets();
        setDefaultPresets(data);
      } catch (error) {
        console.error("Błąd ładowania presetów:", error);
      } finally {
        setLoading(false);
      }
    };

    if (visible) loadPresets();
  }, [visible]);

  const handleLoad = () => {
    const allPresets = [...defaultPresets, ...presets];
    const preset = allPresets.find(p => p.id === selectedPreset);
    if (preset) {
      onLoadPreset(preset);
      onDismiss();
    }
  };

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={styles.dialog}
    >
      <Dialog.Title>Wybierz preset</Dialog.Title>
      <Dialog.ScrollArea style={styles.scrollArea}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Ładowanie presetów...</Text>
          </View>
        ) : (
          <ScrollView>
            <List.Section title="Presety systemowe">
              {defaultPresets.map(preset => (
                <List.Item
                  key={preset.id}
                  title={preset.name}
                  description={`Typ: ${preset.data.rhythmType}`}
                  left={() => <List.Icon icon="lock" />}
                  onPress={() => setSelectedPreset(preset.id)}
                  right={() => (
                    <IconButton
                      icon={selectedPreset === preset.id ? "check-circle" : "circle-outline"}
                      disabled
                    />
                  )}
                  style={[
                    styles.presetItem,
                    selectedPreset === preset.id && styles.selectedPreset
                  ]}
                />
              ))}
            </List.Section>

            <List.Section title="Twoje presety">
              {presets.length === 0 ? (
                <Text style={styles.emptyText}>Brak zapisanych presetów</Text>
              ) : (
                presets.map(preset => (
                  <List.Item
                    key={preset.id}
                    title={preset.name}
                    description={`Typ: ${preset.data.rhythmType}, BPM: ${preset.data.beatsPerMinute}`}
                    onPress={() => setSelectedPreset(preset.id)}
                    right={() => (
                      <View style={styles.actions}>
                        <IconButton
                          icon={selectedPreset === preset.id ? "check-circle" : "circle-outline"}
                          onPress={() => setSelectedPreset(preset.id)}
                        />
                        <IconButton
                          icon="delete"
                          onPress={() => onDeletePreset(preset.id)}
                        />
                      </View>
                    )}
                    style={[
                      styles.presetItem,
                      selectedPreset === preset.id && styles.selectedPreset
                    ]}
                  />
                ))
              )}
            </List.Section>
          </ScrollView>
        )}
      </Dialog.ScrollArea>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Anuluj</Button>
        <Button
          mode="contained"
          onPress={handleLoad}
          disabled={!selectedPreset}
        >
          Wczytaj
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: Dimensions.get('window').height * 0.8,
    width: '90%',
    alignSelf: 'center',
  },
  scrollArea: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  input: {
    marginBottom: 10,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    opacity: 0.6,
  },
  presetItem: {
    paddingVertical: 8,
  },
  selectedPreset: {
    backgroundColor: 'rgba(25, 118, 210, 0.08)',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});