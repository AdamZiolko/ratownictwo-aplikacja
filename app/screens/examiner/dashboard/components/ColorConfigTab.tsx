import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  Text,
  Card,
  Button,
  List,
  IconButton,
  ProgressBar,
  Snackbar,
  useTheme,
  Dialog,
  Portal,
  TextInput,
  RadioButton,
  Switch,
  FAB,
  Surface,
} from "react-native-paper";
import { Audio } from "expo-av";
import colorConfigService, {
  ColorConfig,
  ColorConfigRequest,
} from "@/services/ColorConfigService";
import { socketService } from "@/services/SocketService";
import audioApiService from "@/services/AudioApiService";
import SoundSelectionComponent from "@/components/SoundSelectionComponent";
import { soundFiles } from "@/app/screens/student/constants/soundFiles";
import {
  loadAudioFromLocal,
  loadAudioFromServer,
} from "@/app/screens/student/utils/audioUtils";

// Available colors for selection
const AVAILABLE_COLORS = [
  { key: "red", name: "Czerwony", color: "#F44336" },
  { key: "green", name: "Zielony", color: "#4CAF50" },
  { key: "blue", name: "Niebieski", color: "#2196F3" },
  { key: "yellow", name: "Żółty", color: "#FFEB3B" },
  { key: "orange", name: "Pomarańczowy", color: "#FF9800" },
  { key: "purple", name: "Fioletowy", color: "#9C27B0" },
];

interface ColorConfigTabProps {
  sessionId: string | null;
  sessionCode: string | null;
}

interface ColorConfigModalData {
  id?: number;
  name: string;
  color: string;
  soundName: string;
  serverAudioId?: string;
  isLooping: boolean;
}

const ColorConfigTab: React.FC<ColorConfigTabProps> = ({
  sessionId,
  sessionCode,
}) => {
  const theme = useTheme();

  // State management
  const [colorConfigs, setColorConfigs] = useState<ColorConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Modal states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Modal form data
  const [modalData, setModalData] = useState<ColorConfigModalData>({
    name: "",
    color: "red",
    soundName: "",
    isLooping: false,
  });

  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  // Sound selection and preview states
  const [soundSelectionVisible, setSoundSelectionVisible] = useState(false);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [loadingAudioKey, setLoadingAudioKey] = useState<string | null>(null);
  // Initialize audio system
  useEffect(() => {
    async function initAudio() {
      try {
        if (Platform.OS !== "web") {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
          });
        }
        console.log("🎵 Audio system initialized for examiner dashboard");
      } catch (err) {
        console.error("Failed to configure audio:", err);
      }
    }
    initAudio();
  }, []);

  // Load color configurations on mount and sessionId change
  useEffect(() => {
    if (sessionId) {
      loadColorConfigs();
    }
  }, [sessionId]);
  // WebSocket events handling
  useEffect(() => {
    if (!sessionId) return;

    const handleColorConfigUpdate = (data: any) => {
      if (data.sessionId === sessionId) {
        loadColorConfigs();
      }
    };

    const handleColorConfigListUpdate = (data: {
      sessionId: string;
      colorConfigs: ColorConfig[];
    }) => {
      if (data.sessionId === sessionId) {
        console.log(
          "🔄 Color config list updated in examiner dashboard:",
          data
        );
        setColorConfigs(data.colorConfigs);
      }
    };

    const unsubscribeListUpdate = socketService.on(
      "color-config-list-update",
      handleColorConfigListUpdate
    );

    return () => {
      // Clean up event listeners using unsubscribe functions
      unsubscribeListUpdate();
    };
  }, [sessionId]);
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, []);

  const loadColorConfigs = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const configs = await colorConfigService.getColorConfigs(sessionId);
      setColorConfigs(configs);
    } catch (error) {
      console.error("Error loading color configs:", error);
      showSnackbar("Błąd podczas ładowania konfiguracji kolorów");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };
  const resetModalData = () => {
    setModalData({
      name: "",
      color: "red",
      soundName: "",
      serverAudioId: undefined,
      isLooping: false,
    });
  };

  const openAddModal = () => {
    resetModalData();
    setAddModalVisible(true);
  };
  const openEditModal = (config: ColorConfig) => {
    setModalData({
      id: config.id,
      name: config.soundName || "",
      color: config.color,
      soundName: config.soundName || "",
      serverAudioId: config.serverAudioId,
      isLooping: config.isLooping,
    });
    setSelectedConfigId(config.id);
    setEditModalVisible(true);
  };

  const openDeleteModal = (configId: number) => {
    setSelectedConfigId(configId);
    setDeleteModalVisible(true);
  };
  const handleSaveConfig = async () => {
    if (!sessionId) return;

    // Validation
    if (!modalData.name.trim()) {
      showSnackbar("Nazwa dźwięku jest wymagana");
      return;
    }

    // Check if color already exists (only for add mode, not edit mode)
    if (!modalData.id) {
      const existingConfig = colorConfigs.find(
        (config) => config.color === modalData.color
      );
      if (existingConfig) {
        showSnackbar("Konfiguracja dla tego koloru już istnieje");
        return;
      }
    } else {
      // For edit mode, check if color changed and conflicts with another config
      const currentConfig = colorConfigs.find(
        (config) => config.id === modalData.id
      );
      if (currentConfig && currentConfig.color !== modalData.color) {
        const conflictingConfig = colorConfigs.find(
          (config) =>
            config.color === modalData.color && config.id !== modalData.id
        );
        if (conflictingConfig) {
          showSnackbar("Konfiguracja dla tego koloru już istnieje");
          return;
        }
      }
    }
    setModalLoading(true);
    try {
      const configRequest: ColorConfigRequest = {
        color: modalData.color as any,
        soundName: modalData.soundName,
        serverAudioId: modalData.serverAudioId,
        isEnabled: true,
        volume: 1.0,
        isLooping: modalData.isLooping,
        ...(modalData.id && { id: modalData.id }),
      };

      await colorConfigService.saveColorConfig(sessionId, configRequest);

      showSnackbar(
        modalData.id ? "Konfiguracja zaktualizowana" : "Konfiguracja dodana"
      );
      setAddModalVisible(false);
      setEditModalVisible(false);
      resetModalData();
      await loadColorConfigs();
    } catch (error) {
      console.error("Error saving config:", error);
      showSnackbar("Błąd podczas zapisywania konfiguracji");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!sessionId || !selectedConfigId) return;

    const configToDelete = colorConfigs.find((c) => c.id === selectedConfigId);
    if (!configToDelete) return;

    setModalLoading(true);
    try {
      await colorConfigService.deleteColorConfig(
        sessionId,
        configToDelete.color
      );
      showSnackbar("Konfiguracja usunięta");
      setDeleteModalVisible(false);
      setSelectedConfigId(null);
      await loadColorConfigs();
    } catch (error) {
      console.error("Error deleting config:", error);
      showSnackbar("Błąd podczas usuwania konfiguracji");
    } finally {
      setModalLoading(false);
    }
  };

  const getColorInfo = (colorKey: string) => {
    return (
      AVAILABLE_COLORS.find((c) => c.key === colorKey) || AVAILABLE_COLORS[0]
    );
  };

  const getPlayingSoundKey = (config: ColorConfig) => {
    if (config.serverAudioId) {
      return `server_${config.serverAudioId}`;
    }
    return config.soundName || "";
  };
  const handlePlaySound = async (config: ColorConfig) => {
    // Prevent multiple simultaneous operations
    if (isLoadingAudio) {
      return;
    }

    const soundKey = getPlayingSoundKey(config);

    if (playingSound === soundKey) {
      // Stop current sound
      await stopSound();
    } else {
      // Play sound
      if (config.serverAudioId) {
        await playSound(config.soundName || "", true, config.serverAudioId);
      } else if (config.soundName) {
        await playSound(config.soundName);
      }
    }
  };

  const renderColorConfigItem = ({ item }: { item: ColorConfig }) => {
    const colorInfo = getColorInfo(item.color);

    return (
      <Card
        style={[styles.listItem, { backgroundColor: theme.colors.surface }]}
      >
        <List.Item
          title={item.soundName || "Bez nazwy"}
          description={`Kolor: ${colorInfo.name} • ${
            item.isLooping ? "Zapętlony" : "Pojedynczy"
          }`}
          left={(props) => (
            <View style={styles.colorIndicatorContainer}>
              <Surface
                style={[
                  styles.colorIndicator,
                  { backgroundColor: colorInfo.color },
                ]}
              >
                <View />
              </Surface>
            </View>
          )}
          right={(props) => (
            <View style={styles.itemActions}>
              {" "}
              <View style={styles.playButtonContainer}>
                <IconButton
                  icon={
                    playingSound === getPlayingSoundKey(item) ? "stop" : "play"
                  }
                  size={20}
                  disabled={isLoadingAudio}
                  onPress={
                    isLoadingAudio ? undefined : () => handlePlaySound(item)
                  }
                  style={[
                    styles.playButton,
                    isLoadingAudio && { opacity: 0.5 },
                  ]}
                />
                {isLoadingAudio &&
                  loadingAudioKey === getPlayingSoundKey(item) && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.primary}
                      />
                    </View>
                  )}
              </View>
              <IconButton
                icon="pencil"
                size={20}
                disabled={isLoadingAudio}
                onPress={isLoadingAudio ? undefined : () => openEditModal(item)}
              />
              <IconButton
                icon="delete"
                size={20}
                disabled={isLoadingAudio}
                onPress={
                  isLoadingAudio ? undefined : () => openDeleteModal(item.id)
                }
              />
            </View>
          )}
        />
      </Card>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
        Brak konfiguracji kolorów dla tej sesji
      </Text>
      <Text
        style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}
      >
        Dodaj pierwszą konfigurację używając przycisku poniżej
      </Text>
    </View>
  );

  const openSoundSelection = () => {
    setSoundSelectionVisible(true);
  };
  const handleSoundSelection = (
    soundName: string | null,
    serverAudioId: string | null
  ) => {
    if (serverAudioId) {
      // Server audio selected
      setModalData((prev) => ({
        ...prev,
        soundName: "",
        serverAudioId: serverAudioId,
      }));
    } else if (soundName) {
      // Local sound selected
      setModalData((prev) => ({
        ...prev,
        soundName: soundName,
        serverAudioId: undefined,
      }));
    }
    setSoundSelectionVisible(false);
  };

  const stopAllAudio = async () => {
    try {
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        setCurrentSound(null);
        setPlayingSound(null);
      }
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
  };
  const playSound = async (
    soundName: string,
    isServerAudio = false,
    audioId?: string
  ) => {
    try {
      const soundKey =
        isServerAudio && audioId ? `server_${audioId}` : soundName;
      setIsLoadingAudio(true);
      setLoadingAudioKey(soundKey);

      // Stop any currently playing audio first
      await stopAllAudio();

      let sound: Audio.Sound | null = null;

      if (isServerAudio && audioId) {
        console.log(`🔊 Playing server audio: ${audioId}`);
        sound = await loadAudioFromServer(audioId);
      } else {
        console.log(`🔊 Playing local sound: ${soundName}`);
        sound = await loadAudioFromLocal(soundName);
      }

      if (sound) {
        setCurrentSound(sound);
        setPlayingSound(soundKey);

        // Set up playback status listener
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingSound(null);
            setCurrentSound(null);
          }
        });

        await sound.playAsync();
        console.log(`✅ Audio playing: ${soundKey}`);
      } else {
        console.warn(`Failed to load audio: ${soundKey}`);
        showSnackbar("Nie udało się załadować pliku audio");
      }
    } catch (error) {
      console.error("Error playing sound:", error);
      showSnackbar("Błąd podczas odtwarzania dźwięku");
      setPlayingSound(null);
      setCurrentSound(null);
    } finally {
      setIsLoadingAudio(false);
      setLoadingAudioKey(null);
    }
  };

  const stopSound = async () => {
    try {
      setIsLoadingAudio(true);
      await stopAllAudio();
    } catch (error) {
      console.error("Error stopping sound:", error);
    } finally {
      setIsLoadingAudio(false);
      setLoadingAudioKey(null);
    }
  };

  if (!sessionId) {
    return (
      <View style={styles.container}>
        <Text style={[styles.noSessionText, { color: theme.colors.onSurface }]}>
          Brak aktywnej sesji
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Konfiguracje Kolorów
        </Text>
        <Text
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Sesja: {sessionCode}
        </Text>
      </View>
      {/* Loading indicator */}
      {loading && <ProgressBar indeterminate style={styles.progressBar} />}
      {/* List */}
      <FlatList
        data={colorConfigs}
        renderItem={renderColorConfigItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      {/* FAB for adding new config */}{" "}
      <FAB
        icon="plus"
        label="Dodaj konfigurację"
        onPress={isLoadingAudio ? undefined : openAddModal}
        disabled={isLoadingAudio}
        style={[
          styles.fab,
          { backgroundColor: theme.colors.primary },
          isLoadingAudio && { opacity: 0.5 },
        ]}
      />
      {/* Add/Edit Modal */}
      <Portal>
        <Dialog
          visible={addModalVisible || editModalVisible}
          onDismiss={() => {
            setAddModalVisible(false);
            setEditModalVisible(false);
            resetModalData();
          }}
        >
          <Dialog.Title>
            {editModalVisible ? "Edytuj konfigurację" : "Dodaj konfigurację"}
          </Dialog.Title>{" "}
          <Dialog.Content>
            <TextInput
              label="Nazwa dźwięku"
              value={modalData.name}
              onChangeText={(text) =>
                setModalData((prev) => ({
                  ...prev,
                  name: text,
                  soundName: text,
                }))
              }
              style={styles.input}
              disabled={modalLoading}
              right={
                <TextInput.Icon
                  icon="music"
                  onPress={
                    modalLoading || isLoadingAudio
                      ? undefined
                      : openSoundSelection
                  }
                  disabled={modalLoading || isLoadingAudio}
                />
              }
            />{" "}
            <Button
              mode="outlined"
              onPress={
                modalLoading || isLoadingAudio ? undefined : openSoundSelection
              }
              style={styles.soundSelectionButton}
              icon="folder-music"
              disabled={modalLoading || isLoadingAudio}
            >
              Wybierz dźwięk z biblioteki
            </Button>
            <Text
              style={[styles.sectionLabel, { color: theme.colors.onSurface }]}
            >
              Wybierz kolor:
            </Text>
            <RadioButton.Group
              onValueChange={(value) =>
                setModalData((prev) => ({ ...prev, color: value }))
              }
              value={modalData.color}
            >
              {AVAILABLE_COLORS.map((color) => (
                <View key={color.key} style={styles.colorOption}>
                  <View style={styles.colorPreview}>
                    <Surface
                      style={[
                        styles.colorDot,
                        { backgroundColor: color.color },
                      ]}
                    >
                      <View />
                    </Surface>
                  </View>
                  <RadioButton.Item
                    label={color.name}
                    value={color.key}
                    disabled={modalLoading}
                  />
                </View>
              ))}
            </RadioButton.Group>
            <View style={styles.switchContainer}>
              <Text
                style={[styles.switchLabel, { color: theme.colors.onSurface }]}
              >
                Zapętlaj dźwięk
              </Text>
              <Switch
                value={modalData.isLooping}
                onValueChange={(value) =>
                  setModalData((prev) => ({ ...prev, isLooping: value }))
                }
                disabled={modalLoading}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions style={styles.modalActions}>
            {" "}
            <Button
              onPress={() => {
                setAddModalVisible(false);
                setEditModalVisible(false);
                resetModalData();
              }}
              disabled={modalLoading || isLoadingAudio}
            >
              Anuluj
            </Button>
            <Button
              onPress={handleSaveConfig}
              mode="contained"
              loading={modalLoading}
              disabled={modalLoading || isLoadingAudio}
            >
              Zapisz
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      {/* Delete Modal */}
      <Portal>
        <Dialog
          visible={deleteModalVisible}
          onDismiss={() => {
            setDeleteModalVisible(false);
            setSelectedConfigId(null);
          }}
        >
          <Dialog.Title>Usuń konfigurację</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurface }}>
              Czy na pewno chcesz usunąć tę konfigurację? Tej operacji nie można
              cofnąć.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.modalActions}>
            {" "}
            <Button
              onPress={() => {
                setDeleteModalVisible(false);
                setSelectedConfigId(null);
              }}
              disabled={modalLoading || isLoadingAudio}
            >
              Anuluj
            </Button>
            <Button
              onPress={handleDeleteConfig}
              mode="contained"
              buttonColor={theme.colors.error}
              loading={modalLoading}
              disabled={modalLoading || isLoadingAudio}
            >
              Usuń
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      {/* Sound Selection Modal */}
      <Portal>
        <Dialog
          visible={soundSelectionVisible}
          onDismiss={() => setSoundSelectionVisible(false)}
          style={styles.soundSelectionDialog}
        >
          <Dialog.Title>Wybierz dźwięk</Dialog.Title>
          <Dialog.Content style={styles.soundSelectionContent}>
            {" "}
            <SoundSelectionComponent
              selectedSound={modalData.soundName}
              selectedServerAudioId={modalData.serverAudioId || null}
              onSoundSelect={handleSoundSelection}
              onSoundPreview={(
                soundName: string | null,
                serverAudioId: string | null
              ) => {
                if (serverAudioId) {
                  playSound("", true, serverAudioId);
                } else if (soundName) {
                  playSound(soundName);
                }
              }}
            />
          </Dialog.Content>
          <Dialog.Actions style={styles.modalActions}>
            {" "}
            <Button
              onPress={() => setSoundSelectionVisible(false)}
              disabled={isLoadingAudio}
            >
              Zamknij
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  progressBar: {
    marginBottom: 16,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 80, // Space for FAB
  },
  listItem: {
    marginBottom: 8,
    elevation: 2,
  },
  colorIndicatorContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    elevation: 2,
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonContainer: {
    position: "relative",
    width: 48,
    height: 48,
  },
  playButton: {
    margin: 0,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 600,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  noSessionText: {
    fontSize: 16,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
    marginTop: 8,
  },
  colorOption: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  colorPreview: {
    marginRight: 12,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    elevation: 1,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
  modalActions: {
    justifyContent: "flex-end",
  },
  soundSelectionButton: {
    marginBottom: 16,
  },
  soundSelectionDialog: {
    maxHeight: "80%",
  },
  soundSelectionContent: {
    paddingBottom: 0,
  },
});

export default ColorConfigTab;
