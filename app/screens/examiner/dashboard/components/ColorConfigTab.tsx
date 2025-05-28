import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList } from "react-native";
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
import colorConfigService, {
  ColorConfig,
  ColorConfigRequest,
} from "@/services/ColorConfigService";
import { socketService } from "@/services/SocketService";

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
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => openEditModal(item)}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={() => openDeleteModal(item.id)}
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

      {/* FAB for adding new config */}
      <FAB
        icon="plus"
        label="Dodaj konfigurację"
        onPress={openAddModal}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
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
          </Dialog.Title>
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
            />

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
            <Button
              onPress={() => {
                setAddModalVisible(false);
                setEditModalVisible(false);
                resetModalData();
              }}
              disabled={modalLoading}
            >
              Anuluj
            </Button>
            <Button
              onPress={handleSaveConfig}
              mode="contained"
              loading={modalLoading}
              disabled={modalLoading}
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
            <Button
              onPress={() => {
                setDeleteModalVisible(false);
                setSelectedConfigId(null);
              }}
              disabled={modalLoading}
            >
              Anuluj
            </Button>
            <Button
              onPress={handleDeleteConfig}
              mode="contained"
              buttonColor={theme.colors.error}
              loading={modalLoading}
              disabled={modalLoading}
            >
              Usuń
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
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
    fontWeight: "600",
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
});

export default ColorConfigTab;
