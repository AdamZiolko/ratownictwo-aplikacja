import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Text,
  Card,
  Button,
  FAB,
  Portal,
  DataTable,
  IconButton,
  useTheme,
  ActivityIndicator,
  Snackbar,
  Menu,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {SoundQueueItem } from './types/types'; 

import CreateSessionDialog from "./modals/CreateSessionDialog";
import EditSessionDialog from "./modals/EditSessionDialog";
import ViewSessionDialog from "./modals/ViewSessionDialog";
import DeleteSessionDialog from "./modals/DeleteSessionDialog";
import SoundSelectionDialog from "./modals/SoundSelectionDialog";
import { SavePresetDialog, LoadPresetDialog } from "./modals/PresetDialogs";


import { Session, FormData, Preset, Storage } from "./types/types";
import { useAuth } from "@/contexts/AuthContext";
import { EkgType, NoiseType } from "@/services/EkgFactory";
import { sessionService } from "@/services/SessionService";
import { socketService } from "@/services/SocketService";

const ExaminerDashboardScreen = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();

  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [soundDialogVisible, setSoundDialogVisible] = useState(false);

  
  const [selectedSound, setSelectedSound] = useState<string | null>(null);

  
  const [savePresetDialogVisible, setSavePresetDialogVisible] = useState(false);
  const [loadPresetDialogVisible, setLoadPresetDialogVisible] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);

  
  const storage: Storage = {
    getItem: async (key: string) => {
      if (Platform.OS === "web") {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
      if (Platform.OS === "web") {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    },
  };

  
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    temperature: "36.6",
    rhythmType: EkgType.NORMAL,
    beatsPerMinute: "72",
    noiseLevel: NoiseType.NONE,
    sessionCode: "",
    isActive: true,
    hr: "80",
    bp: "120/80",
    spo2: "98",
    etco2: "35",
    rr: "12",
  });
  

  
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error">(
    "success"
  );

  
  const [menuVisible, setMenuVisible] = useState(false);

  
  useEffect(() => {
    loadSessions();
  }, []);

  
  
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const savedPresets = await storage.getItem("presets");
        if (savedPresets) {
          setPresets(JSON.parse(savedPresets));
        }
      } catch (error) {
        console.error("Błąd ładowania presetów:", error);
      }
    };
    loadPresets();
  }, []);

  
  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await sessionService.getAllSessions();
      setSessions(data);
    } catch (error) {
      console.error("Error loading sessions:", error);
      showSnackbar("Nie udało się załadować sesji", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  
  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };
  
  const showSnackbar = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };
  
  const openCreateDialog = () => {
    setCreateDialogVisible(true);
  };

  const openEditDialog = (session: Session) => {
    setCurrentSession(session);
    setEditDialogVisible(true);
  };

  const openSoundDialog = (session: Session) => {
    setCurrentSession(session);
    setSelectedSound(null);
    setSoundDialogVisible(true);
  };

  const openDeleteDialog = (session: Session) => {
    setCurrentSession(session);
    setDeleteDialogVisible(true);
  };

  const openViewDialog = (session: Session) => {
    setCurrentSession(session);
    setViewDialogVisible(true);
  };
  
  const handleCreateSession = async (data: FormData) => {
    try {
      const newSession = {
        name: data.name || `Sesja ${data.sessionCode}`,
        temperature: parseFloat(data.temperature),
        rhythmType: data.rhythmType as number,
        beatsPerMinute: parseInt(data.beatsPerMinute),
        noiseLevel: data.noiseLevel as number,
        sessionCode: data.sessionCode,
        isActive: data.isActive,
        hr: parseInt(data.hr) || undefined,
        bp: data.bp,
        spo2: parseInt(data.spo2) || undefined,
        etco2: parseInt(data.etco2) || undefined,
        rr: parseInt(data.rr) || undefined,
      };

      await sessionService.createSession(newSession);
      setCreateDialogVisible(false);
      showSnackbar("Sesja została utworzona", "success");
      loadSessions();
    } catch (error) {
      console.error("Error creating session:", error);
      showSnackbar("Nie udało się utworzyć sesji", "error");
    }
  };

  const handleUpdateSession = async (data: FormData) => {
    if (!currentSession) return;

    try {
      const updatedSession = {
        name: data.name || `Sesja ${data.sessionCode}`,
        temperature: parseFloat(data.temperature),
        rhythmType: data.rhythmType as number,
        beatsPerMinute: parseInt(data.beatsPerMinute),
        noiseLevel: data.noiseLevel as number,
        sessionCode: data.sessionCode,
        isActive: data.isActive,
        hr: parseInt(data.hr) || undefined,
        bp: data.bp,
        spo2: parseInt(data.spo2) || undefined,
        etco2: parseInt(data.etco2) || undefined,
        rr: parseInt(data.rr) || undefined,
      };

      if (!currentSession.sessionId) return;

      await sessionService.updateSession(
        currentSession.sessionId,
        updatedSession
      );
      setEditDialogVisible(false);
      showSnackbar("Sesja została zaktualizowana", "success");
      loadSessions();
    } catch (error) {
      console.error("Error updating session:", error);
      showSnackbar("Nie udało się zaktualizować sesji", "error");
    }
  };

  const handleDeleteSession = async () => {
    if (!currentSession) return;

    try {
      await sessionService.deleteSession(currentSession.sessionId!);
      setDeleteDialogVisible(false);
      showSnackbar("Sesja została usunięta", "success");
      loadSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
      showSnackbar("Nie udało się usunąć sesji", "error");
    }
  };

  
  const handleSavePreset = async (name: string) => {
    if (!name.trim()) {
      showSnackbar("Podaj nazwę presetu", "error");
      return;
    }
    try {
      const newPreset: Preset = {
        id: Date.now().toString(),
        name,              
        data: formData,
      };
      const updatedPresets = [...presets, newPreset];
      await storage.setItem("presets", JSON.stringify(updatedPresets));
      setPresets(updatedPresets);
      setSavePresetDialogVisible(false);
      showSnackbar("Preset został zapisany", "success");
    } catch (error) {
      console.error("Błąd zapisywania presetu:", error);
      showSnackbar("Błąd zapisywania presetu", "error");
    }
  };
  

  const handleDeletePreset = async (presetId: string) => {
    try {
      const updatedPresets = presets.filter((p) => p.id !== presetId);
      await storage.setItem("presets", JSON.stringify(updatedPresets));
      setPresets(updatedPresets);
      showSnackbar("Preset został usunięty", "success");
    } catch (error) {
      console.error("Błąd usuwania presetu:", error);
      showSnackbar("Błąd usuwania presetu", "error");
    }
  };

  
  const handleLogout = () => {
    logout();
    router.replace("/");
  };
  
  const getRhythmTypeName = (type: number): string => {
    switch (type as EkgType) {
      case EkgType.NORMAL:
        return "Rytm normalny (Zatokowy)";
      case EkgType.TACHYCARDIA:
        return "Tachykardia zatokowa";
      case EkgType.BRADYCARDIA:
        return "Bradykardia zatokowa";
      case EkgType.AFIB:
        return "Migotanie przedsionków";
      case EkgType.VFIB:
        return "Migotanie komór";
      case EkgType.VTACH:
        return "Częstoskurcz komorowy";
      case EkgType.TORSADE:
        return "Torsade de pointes";
      case EkgType.ASYSTOLE:
        return "Asystolia";
      case EkgType.HEART_BLOCK:
        return "Blok serca";
      case EkgType.PVC:
        return "Przedwczesne pobudzenie komorowe";
      case EkgType.CUSTOM:
        return "Niestandardowy";
      default:
        return "Nieznany";
    }
  };

  const getNoiseLevelName = (type: number): string => {
    switch (type as NoiseType) {
      case NoiseType.NONE:
        return "Brak";
      case NoiseType.MILD:
        return "Łagodne";
      case NoiseType.MODERATE:
        return "Umiarkowane";
      case NoiseType.SEVERE:
        return "Silne";
      default:
        return "Nieznane";
    }
  };

  const viewEkgProjection = (session: Session) => {
    router.push({
      pathname: "/screens/ekg-projection/EkgProjection",
      params: {
        rhythmType: session.rhythmType,
        bpm: session.beatsPerMinute.toString(),
        readOnly: "true",
      },
    });
  };

  const handleSendAudioCommand = () => {
    if (!currentSession || !selectedSound) return;

    socketService.emitAudioCommand(
      currentSession.sessionCode,
      "PLAY",
      selectedSound
    );
    setSoundDialogVisible(false);
    showSnackbar("Polecenie odtworzenia dźwięku wysłane", "success");
  };


  const handleSendQueue = (queue: SoundQueueItem[]) => {
    if (!currentSession || queue.length === 0) return;
  
    socketService.emitAudioCommand(
      currentSession.sessionCode,
      "PLAY_QUEUE",
      queue 
    );
    setSoundDialogVisible(false);
    showSnackbar(`Wysłano kolejkę (${queue.length} dźwięków)`, "success");
  };
  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.Content
          title="Panel Egzaminatora"
          subtitle={user ? `Zalogowany jako: ${user.username}` : ""}
        />
        <Appbar.Action
          icon="dots-vertical"
          onPress={() => setMenuVisible(true)}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={{ x: 0, y: 0 }}
          anchorPosition="bottom"
          style={{ marginTop: 40, marginRight: 10 }}
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              handleLogout();
            }}
            title="Wyloguj"
            leadingIcon="logout"
          />
        </Menu>
      </Appbar.Header>
      <View style={styles.contentContainer}>
        <Card style={styles.statsCard}>
          <Card.Content>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text variant="titleLarge">{sessions?.length || 0}</Text>
                <Text variant="bodyMedium">Wszystkie sesje</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge">
                  {sessions?.filter((s) => s.beatsPerMinute > 100)?.length || 0}
                </Text>
                <Text variant="bodyMedium">Tachykardia</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge">
                  {sessions?.filter((s) => s.beatsPerMinute < 60)?.length || 0}
                </Text>
                <Text variant="bodyMedium">Bradykardia</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Aktywne Sesje
        </Text>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Ładowanie sesji...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.tableContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {sessions?.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge">Brak aktywnych sesji</Text>
                <Text variant="bodyMedium" style={styles.emptyStateText}>
                  Kliknij przycisk "+" aby utworzyć nową sesję
                </Text>
                <Button
                  mode="contained"
                  onPress={openCreateDialog}
                  style={styles.emptyStateButton}
                >
                  Utwórz pierwszą sesję
                </Button>
              </View>
            ) : (
              <DataTable style={styles.table}>
                <DataTable.Header>
                  <DataTable.Title>Kod</DataTable.Title>
                  <DataTable.Title>Temp.</DataTable.Title>
                  <DataTable.Title>Rytm</DataTable.Title>
                  <DataTable.Title numeric>BPM</DataTable.Title>
                  <DataTable.Title style={styles.actionsColumn}>
                    Akcje
                  </DataTable.Title>
                </DataTable.Header>

                {sessions?.map((session) => (
                  <DataTable.Row
                    key={session.sessionId}
                    onPress={() => openViewDialog(session)}
                  >
                    <DataTable.Cell>{session.sessionCode}</DataTable.Cell>
                    <DataTable.Cell>{session.temperature}°C</DataTable.Cell>
                    <DataTable.Cell>
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={styles.rhythmCell}
                      >
                        {getRhythmTypeName(session.rhythmType)}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                      {session.beatsPerMinute}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.actionsColumn}>
                      <View style={styles.rowActions}>
                        <IconButton
                          icon="pencil"
                          size={20}
                          onPress={() => openEditDialog(session)}
                          iconColor={theme.colors.primary}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => openDeleteDialog(session)}
                          iconColor={theme.colors.error}
                        />
                        <IconButton
                          icon="volume-high"
                          size={20}
                          onPress={() => openSoundDialog(session)}
                          iconColor={theme.colors.secondary}
                        />
                      </View>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            )}
          </ScrollView>
        )}
      </View>
      <Portal>
        {}
        <CreateSessionDialog
          visible={createDialogVisible}
          onDismiss={() => setCreateDialogVisible(false)}
        initialData={formData}           // ← tu
          onCreateSession={handleCreateSession}
          onOpenSavePresetDialog={(dialogFormData) => {
            setFormData(dialogFormData);
            setSavePresetDialogVisible(true);
          }}
          onOpenLoadPresetDialog={() => setLoadPresetDialogVisible(true)}
        />
        
        {}
        <EditSessionDialog
          visible={editDialogVisible}
          onDismiss={() => setEditDialogVisible(false)}
          session={currentSession}
          onUpdateSession={(updatedFormData: FormData) => {
            handleUpdateSession(updatedFormData);
          }}
        />

        {}
        <DeleteSessionDialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
          session={currentSession}
          onDeleteSession={handleDeleteSession}
          errorColor={theme.colors.error}
        />

        {}
        <SoundSelectionDialog
          visible={soundDialogVisible}
          onDismiss={() => setSoundDialogVisible(false)}
          session={currentSession}
          selectedSound={selectedSound}
          setSelectedSound={setSelectedSound}
          onSendAudioCommand={handleSendAudioCommand}
          onSendQueue={handleSendQueue}
        />

        {}
        <ViewSessionDialog
          visible={viewDialogVisible}
          onDismiss={() => setViewDialogVisible(false)}
          session={currentSession}
          onEditSession={() => {
            setViewDialogVisible(false);
            if (currentSession) openEditDialog(currentSession);
          }}
          getRhythmTypeName={getRhythmTypeName}
          getNoiseLevelName={getNoiseLevelName}
          onViewEkgProjection={viewEkgProjection}
        />

        {}
        <SavePresetDialog
          visible={savePresetDialogVisible}
          onDismiss={() => setSavePresetDialogVisible(false)}
          onSavePreset={handleSavePreset}
          formData={formData}
        />

        {}
        <LoadPresetDialog
          visible={loadPresetDialogVisible}
          onDismiss={() => setLoadPresetDialogVisible(false)}
          presets={presets}
          onLoadPreset={(preset) => {
            setFormData(preset.data);
            showSnackbar("Preset został wczytany", "success");
            setLoadPresetDialogVisible(false);
          }}
          onDeletePreset={handleDeletePreset}
        />
      </Portal>
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={openCreateDialog}
        color="#fff"
      />
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={[
          styles.snackbar,
          snackbarType === "success"
            ? styles.successSnackbar
            : styles.errorSnackbar,
        ]}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  statsCard: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 12,
    fontWeight: "bold",
  },
  tableContainer: {
    flex: 1,
  },
  table: {
    marginBottom: 20,
  },
  rhythmCell: {
    maxWidth: 100,
  },
  rowActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionsColumn: {
    flex: 1.5,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    textAlign: "center",
    marginVertical: 16,
    opacity: 0.7,
  },
  emptyStateButton: {
    marginTop: 16,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  snackbar: {
    margin: 16,
  },
  successSnackbar: {
    backgroundColor: "#4CAF50",
  },
  errorSnackbar: {
    backgroundColor: "#F44336",
  },
});

export default ExaminerDashboardScreen;