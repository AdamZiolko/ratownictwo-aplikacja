import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Platform } from 'react-native';
import {
  Text,
  Card,
  Button,
  Snackbar,
  ProgressBar,
  Portal,
  useTheme,
} from 'react-native-paper';
import { ColorConfig, ColorConfigRequest, colorConfigService } from '@/services/ColorConfigService';
import { socketService } from '@/services/SocketService';
import ExaminerColorSensor from '@/components/ExaminerColorSensor';
import {
  ColorConfigItem,
  ColorConfigModal,
  DeleteConfirmationModal,
  SoundSelectionModal,
  ColorConfigModalData,
} from '@/components/colorConfig';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { getPlayingSoundKey } from '@/components/colorConfig/constants';
import { useBleManager } from '@/components/bleColorSensor';
import { ColorValue } from '@/components/bleColorSensor';

interface ColorConfigTabProps {
  sessionId: string | null;
  sessionCode: string | null;
}

const ColorConfigTab: React.FC<ColorConfigTabProps> = ({
  sessionId,
  sessionCode,
}) => {
  const theme = useTheme();
  const {
    playingSound,
    isLoadingAudio,
    loadingAudioKey,
    playSound,
    stopSound,
  } = useAudioPlayer();

  // State management
  const [colorConfigs, setColorConfigs] = useState<ColorConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Modal states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [soundSelectionVisible, setSoundSelectionVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  // Modal form data
  const [modalData, setModalData] = useState<ColorConfigModalData>({
    name: "",
    color: "custom",
    soundName: "",
    displayName: "",
    customColorRgb: { r: 255, g: 0, b: 0 },
    colorTolerance: 0.15,
  });

  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);

  // Color sensor integration
  const [sensorColor, setSensorColor] = useState<ColorValue>({ r: 0, g: 0, b: 0 });
  
  // Handle color updates from BLE manager
  const handleSensorColorUpdate = async (color: ColorValue) => {
    setSensorColor(color);
  };

  // Use BLE manager hook for sensor integration
  const {
    status: sensorStatus,
    error: sensorError,
    isReconnecting: sensorReconnecting,
    startConnection: connectSensor,
    disconnectDevice: disconnectSensor,
  } = useBleManager(handleSensorColorUpdate);

  // Load color configurations on mount and sessionId change
  useEffect(() => {
    if (sessionId) {
      loadColorConfigs();
    }
  }, [sessionId]);

  // WebSocket events handling
  useEffect(() => {
    if (!sessionId) return;

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
      unsubscribeListUpdate();
    };
  }, [sessionId]);

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
      color: "custom",
      soundName: "",
      displayName: "",
      serverAudioId: undefined,
      customColorRgb: { r: 255, g: 0, b: 0 },
      colorTolerance: 0.15,
    });
  };

  const handleColorCalibrated = (color: string, rgbValues: any, tolerance: number) => {
    setModalData(prev => ({
      ...prev,
      color: 'custom',
      customColorRgb: rgbValues,
      colorTolerance: tolerance,
    }));
    setAddModalVisible(true);
    showSnackbar(`Kalibracja koloru zakończona: RGB(${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b})`);
  };

  const openAddModal = () => {
    resetModalData();
    setAddModalVisible(true);
  };
  const openEditModal = (config: ColorConfig) => {
    setModalData({
      id: config.id,
      name: config.displayName || config.soundName || "",
      color: config.color,
      soundName: config.soundName || "",
      displayName: config.displayName,
      serverAudioId: config.serverAudioId,
      customColorRgb: config.customColorRgb || { r: 255, g: 0, b: 0 },
      colorTolerance: config.colorTolerance || 0.15,
    });
    setSelectedConfigId(config.id);
    setEditModalVisible(true);
  };

  const openDeleteModal = (configId: number) => {
    setSelectedConfigId(configId);
    setDeleteModalVisible(true);
  };

  const handleSaveConfig = async () => {
    if (!sessionId) return;    // Validation
    if (!modalData.name.trim()) {
      showSnackbar("Nazwa dźwięku jest wymagana");
      return;
    }

    // Additional validation for custom color on web platform
    if (modalData.color === 'custom' && Platform.OS === 'web') {
      if (!modalData.customColorRgb || 
          modalData.customColorRgb.r < 0 || modalData.customColorRgb.r > 255 ||
          modalData.customColorRgb.g < 0 || modalData.customColorRgb.g > 255 ||
          modalData.customColorRgb.b < 0 || modalData.customColorRgb.b > 255) {
        showSnackbar("Dla koloru niestandardowego wymagane są prawidłowe wartości RGB (0-255)");
        return;
      }
    }    // Check for duplicates
    if (!modalData.id) {
      // Add mode - check for duplicates
      // Tylko dla niestandardowych kolorów, sprawdź wartości RGB
      if (modalData.customColorRgb) {
        const existingCustomConfig = colorConfigs.find(
          (config) => 
            config.color === 'custom' && 
            config.customColorRgb &&
            config.customColorRgb.r === modalData.customColorRgb!.r &&
            config.customColorRgb.g === modalData.customColorRgb!.g &&
            config.customColorRgb.b === modalData.customColorRgb!.b
        );
        if (existingCustomConfig) {
          showSnackbar("Konfiguracja z tymi wartościami RGB już istnieje");
          return;
        }
      }
    } else {
      // Edit mode - check if changes conflict with other configs
      const currentConfig = colorConfigs.find(
        (config) => config.id === modalData.id
      );
      
      if (currentConfig && modalData.customColorRgb) {
        // Dla niestandardowych kolorów, sprawdź czy wartości RGB kolidują
        const conflictingCustomConfig = colorConfigs.find(
          (config) => 
            config.id !== modalData.id &&
            config.color === 'custom' && 
            config.customColorRgb &&
            config.customColorRgb.r === modalData.customColorRgb!.r &&
            config.customColorRgb.g === modalData.customColorRgb!.g &&
            config.customColorRgb.b === modalData.customColorRgb!.b
        );
        if (conflictingCustomConfig) {
          showSnackbar("Konfiguracja z tymi wartościami RGB już istnieje");
          return;
        }
      }
    }

    setModalLoading(true);
    try {      const configRequest: ColorConfigRequest = {
        color: modalData.color as any,
        soundName: modalData.soundName,
        displayName: modalData.displayName || modalData.name,
        serverAudioId: modalData.serverAudioId,
        isEnabled: true,
        volume: 1.0,
        isLooping: false, // Zawsze ustawione na false, ponieważ usunęliśmy przełącznik
        customColorRgb: modalData.customColorRgb,
        colorTolerance: modalData.colorTolerance,
        ...(modalData.id && { id: modalData.id }),
      };

      await colorConfigService.saveColorConfig(sessionId, configRequest);

      showSnackbar(
        modalData.id ? "Konfiguracja zaktualizowana" : "Konfiguracja dodana"
      );
      // Rozłącz czujnik RGB po zapisaniu konfiguracji
      if (sensorStatus === "monitoring") {
        disconnectSensor();
      }
      
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
        configToDelete.id
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

  const handlePlaySound = async (config: ColorConfig) => {
    if (isLoadingAudio) return;

    const soundKey = getPlayingSoundKey(config);

    if (playingSound === soundKey) {
      await stopSound();
    } else {
      try {
        if (config.serverAudioId) {
          await playSound(config.soundName || "", true, config.serverAudioId);
        } else if (config.soundName) {
          await playSound(config.soundName);
        }
      } catch (error) {
        showSnackbar("Błąd podczas odtwarzania dźwięku");
      }
    }
  };
  const handleSoundSelection = (
    soundName: string | null,
    serverAudioId: string | null
  ) => {
    if (serverAudioId) {
      setModalData((prev) => ({
        ...prev,
        soundName: "",
        displayName: "",
        serverAudioId: serverAudioId,
      }));
    } else if (soundName) {
      // Extract display name from file path
      const pathParts = soundName.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const displayName = fileName.replace(/\.[^/.]+$/, ""); // Remove file extension
      
      setModalData((prev) => ({
        ...prev,
        name: displayName,
        soundName: soundName,
        displayName: displayName,
        serverAudioId: undefined,
      }));
    }
    setSoundSelectionVisible(false);
  };
  const handleSoundPreview = async (
    soundName: string | null,
    serverAudioId: string | null
  ) => {
    try {
      if (serverAudioId) {
        await playSound("", true, serverAudioId);
      } else if (soundName) {
        await playSound(soundName);
      }
    } catch (error) {
      showSnackbar("Błąd podczas odtwarzania podglądu dźwięku");
    }
  };

  // Handle accepting color from sensor
  const handleAcceptSensorColor = () => {
    if (sensorStatus !== "monitoring") {
      showSnackbar("Czujnik nie jest połączony");
      return;
    }

    const { r, g, b } = sensorColor;
    const totalBrightness = r + g + b;

    if (totalBrightness < 100) {
      showSnackbar("Zbyt niska jasność koloru. Przyłóż czujnik do obiektu o wyraźnym kolorze.");
      return;
    }

    setModalData(prev => ({
      ...prev,
      customColorRgb: { r, g, b },
    }));

    showSnackbar(`Kolor zaakceptowany: RGB(${r}, ${g}, ${b})`);
  };

  const renderColorConfigItem = ({ item }: { item: ColorConfig }) => (
    <ColorConfigItem
      item={item}
      onPlay={handlePlaySound}
      onEdit={openEditModal}
      onDelete={openDeleteModal}
      isLoadingAudio={isLoadingAudio}
      playingSound={playingSound}
      loadingAudioKey={loadingAudioKey}
    />
  );

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
      {/* Loading indicator */}
      {loading && <ProgressBar indeterminate style={styles.progressBar} />}

      {/* Color Sensor for Calibration - Only on native platforms */}

      
      {/* List */}
      <FlatList
        data={colorConfigs}
        renderItem={renderColorConfigItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />      {/* Add button */}
      <View style={styles.addButtonContainer}>
        <Button
          mode="outlined"
          icon="plus"
          onPress={isLoadingAudio ? undefined : openAddModal}
          disabled={isLoadingAudio}
          style={[
            styles.addButton,
            isLoadingAudio && { opacity: 0.5 },
          ]}
          contentStyle={styles.addButtonContent}
        >
          Dodaj konfigurację
        </Button>
      </View>

      {/* Modals */}
      <Portal>        <ColorConfigModal
          visible={addModalVisible || editModalVisible}
          isEditMode={editModalVisible}
          modalData={modalData}
          modalLoading={modalLoading}
          isLoadingAudio={isLoadingAudio}
          onDismiss={() => {
            // Rozłącz czujnik RGB po zamknięciu modalu
            if (sensorStatus === "monitoring") {
              disconnectSensor();
            }
            
            setAddModalVisible(false);
            setEditModalVisible(false);
            resetModalData();
          }}
          onSave={handleSaveConfig}
          onSoundSelection={() => {
            console.log("ColorConfigTab: Sound selection triggered");
            console.log("Current soundSelectionVisible state:", soundSelectionVisible);
            console.log("Platform:", Platform.OS);
            setSoundSelectionVisible(true);
            console.log("Sound selection modal visibility set to true");
          }}
          onModalDataChange={(data) => setModalData(prev => ({ ...prev, ...data }))}
          // Color sensor integration
          sensorStatus={sensorStatus}
          sensorColor={sensorColor}
          onConnectSensor={connectSensor}
          onDisconnectSensor={disconnectSensor}
          onAcceptSensorColor={handleAcceptSensorColor}
        />

        <DeleteConfirmationModal
          visible={deleteModalVisible}
          loading={modalLoading}
          isLoadingAudio={isLoadingAudio}
          onConfirm={handleDeleteConfig}
          onCancel={() => {
            setDeleteModalVisible(false);
            setSelectedConfigId(null);
          }}
        />

        <SoundSelectionModal
          visible={soundSelectionVisible}
          selectedSound={modalData.soundName}
          selectedServerAudioId={modalData.serverAudioId || null}
          isLoadingAudio={isLoadingAudio}
          onSoundSelect={handleSoundSelection}
          onSoundPreview={handleSoundPreview}
          onClose={() => setSoundSelectionVisible(false)}
        />
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
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    marginBottom: 16,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  progressBar: {
    marginBottom: 16,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.7,
  },
  noSessionText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 20,
    borderRadius: 28,
    elevation: 6,
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  addButton: {
    borderRadius: 8,
    minWidth: 200,
  },
  addButtonContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sensorCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
    opacity: 0.7,
    textAlign: "center",
  },
});

export default ColorConfigTab;
