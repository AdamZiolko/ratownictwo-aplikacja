import React, { useState, useRef } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  Platform,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

// Import refactored components
import {
  StatItem,
  getRhythmTypeName,
  getNoiseLevelName,
} from "./components/DashboardComponents";
import { useSessionManager } from "./SessionManager";
import { dashboardStyles } from "./DashboardStyles";

// Import dialogs
import CreateSessionDialog from "../modals/CreateSessionDialog";
import EditSessionDialog from "../modals/EditSessionDialog";
import ViewSessionDialog from "../modals/ViewSessionDialog";
import DeleteSessionDialog from "../modals/DeleteSessionDialog";
import SoundSelectionDialog from "../modals/SoundSelectionDialog";
import { SavePresetDialog, LoadPresetDialog } from "../modals/PresetDialogs";
import StudentsListDialog from "../modals/StudentsListDialog";
import { Session } from "../types/types";

const ExaminerDashboardScreen = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerVisible, setHeaderVisible] = useState(true);

  // Dialog visibility states
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [soundDialogVisible, setSoundDialogVisible] = useState(false);
  const [studentsDialogVisible, setStudentsDialogVisible] = useState(false);
  const [savePresetDialogVisible, setSavePresetDialogVisible] = useState(false);
  const [loadPresetDialogVisible, setLoadPresetDialogVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Use the session manager hook
  const {
    sessions,
    loading,
    refreshing,
    currentSession,
    setCurrentSession,
    sessionStudents,
    selectedSound,
    setSelectedSound,
    presets,
    formData,
    setFormData,
    snackbarVisible,
    setSnackbarVisible,
    snackbarMessage,
    snackbarType,
    onRefresh,
    handleCreateSession,
    handleUpdateSession,
    handleDeleteSession,
    handleSavePreset,
    handleDeletePreset,
    handleSendAudioCommand,
    handlePauseAudioCommand,
    handleResumeAudioCommand,
    handleStopAudioCommand,
    handleSendQueue,
  } = useSessionManager(user);

  // Dialog management
  const openCreateDialog = () => {
    setCreateDialogVisible(true);
  };

  const openEditDialog = (session: React.SetStateAction<Session | null>) => {
    setCurrentSession(session);
    setEditDialogVisible(true);
  };

  const openSoundDialog = (session: React.SetStateAction<Session | null>) => {
    setCurrentSession(session);
    setSelectedSound(null);
    setSoundDialogVisible(true);
  };

  const openDeleteDialog = (session: React.SetStateAction<Session | null>) => {
    setCurrentSession(session);
    setDeleteDialogVisible(true);
  };

  const openViewDialog = (session: React.SetStateAction<Session | null>) => {
    setCurrentSession(session);
    setViewDialogVisible(true);
  };

  const openStudentsDialog = (
    session: React.SetStateAction<Session | null>
  ) => {
    setCurrentSession(session);
    setStudentsDialogVisible(true);
  };

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const currentOffset = event.nativeEvent.contentOffset.y;
        setHeaderVisible(currentOffset <= 10);
      },
      useNativeDriver: false,
    }
  );

  return (
    <SafeAreaView style={dashboardStyles.container}>
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

      <View style={dashboardStyles.contentContainer}>
        {/* Stats Header for Android */}
        {Platform.OS === "android" && (
          <Animated.View
            style={[
              dashboardStyles.statsHeader,
              {
                height: scrollY.interpolate({
                  inputRange: [0, 50],
                  outputRange: [80, 0],
                  extrapolate: "clamp",
                }),
                opacity: scrollY.interpolate({
                  inputRange: [0, 30],
                  outputRange: [1, 0],
                  extrapolate: "clamp",
                }),
              },
            ]}
          >
            <Card style={dashboardStyles.statsCard}>
              <Card.Content style={dashboardStyles.statsContent}>
                <View style={dashboardStyles.statsRow}>
                  <StatItem value={sessions?.length} label="Sesje" />
                </View>
              </Card.Content>
            </Card>
          </Animated.View>
        )}

        {/* Stats Header for other platforms */}
        {Platform.OS !== "android" && (
          <Card
            style={{
              backgroundColor: theme.colors.surface,
              margin: 10,
              borderRadius: 4,
              elevation: 2,
            }}
          >
            <Card.Content>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: 10,
                }}
              >
                <StatItem value={sessions?.length} label="Wszystkie sesje" />
              </View>
            </Card.Content>
          </Card>
        )}

        <Text variant="titleMedium" style={dashboardStyles.sectionTitle}>
          Aktywne Sesje
        </Text>

        {loading && !refreshing ? (
          <View style={dashboardStyles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={dashboardStyles.loadingText}>Ładowanie sesji...</Text>
          </View>
        ) : (
          <ScrollView
            style={dashboardStyles.tableContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onScroll={Platform.OS === "android" ? handleScroll : undefined}
            scrollEventThrottle={16}
          >
            {sessions?.length === 0 ? (
              <View style={dashboardStyles.emptyState}>
                <Text variant="bodyLarge">Brak aktywnych sesji</Text>
                <Text
                  variant="bodyMedium"
                  style={dashboardStyles.emptyStateText}
                >
                  Kliknij przycisk "+" aby utworzyć nową sesję
                </Text>
                <Button
                  mode="contained"
                  onPress={openCreateDialog}
                  style={dashboardStyles.emptyStateButton}
                >
                  Utwórz pierwszą sesję
                </Button>
              </View>
            ) : (
              <DataTable style={dashboardStyles.table}>
                {" "}
                <DataTable.Header>
                  <DataTable.Title style={dashboardStyles.tableColumn}>
                    Kod
                  </DataTable.Title>
                  <DataTable.Title style={dashboardStyles.tableColumn}>
                    Temp.
                  </DataTable.Title>
                  <DataTable.Title style={dashboardStyles.tableColumn}>
                    Rytm
                  </DataTable.Title>
                  <DataTable.Title style={dashboardStyles.tableColumn} numeric>
                    BPM
                  </DataTable.Title>
                  <DataTable.Title style={dashboardStyles.actionsColumn}>
                    Akcje
                  </DataTable.Title>
                </DataTable.Header>
                {sessions?.map((session) => (
                  <DataTable.Row
                    key={session.sessionId}
                    onPress={() => openViewDialog(session)}
                  >
                    <DataTable.Cell style={dashboardStyles.tableColumn}>
                      {session.sessionCode}
                    </DataTable.Cell>
                    <DataTable.Cell style={dashboardStyles.tableColumn}>
                      {session.temperature}°C
                    </DataTable.Cell>
                    <DataTable.Cell style={dashboardStyles.tableColumn}>
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={dashboardStyles.rhythmCell}
                      >
                        {getRhythmTypeName(session.rhythmType)}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={dashboardStyles.tableColumn} numeric>
                      {session.beatsPerMinute}
                    </DataTable.Cell>
                    <DataTable.Cell style={dashboardStyles.actionsColumn}>
                      <View style={dashboardStyles.rowActions}>
                        <View style={dashboardStyles.actionButtonRow}>
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
                        </View>
                        <View style={dashboardStyles.actionButtonRow}>
                          <IconButton
                            icon="volume-high"
                            size={20}
                            onPress={() => openSoundDialog(session)}
                            iconColor={theme.colors.secondary}
                          />
                          <View style={dashboardStyles.studentButtonContainer}>
                            <IconButton
                              icon="account-group"
                              size={20}
                              onPress={() => openStudentsDialog(session)}
                              iconColor={theme.colors.tertiary || "#9c27b0"}
                            />
                            {sessionStudents[session.sessionCode] &&
                              sessionStudents[session.sessionCode].length >
                                0 && (
                                <View style={dashboardStyles.studentCountBadge}>
                                  <Text
                                    style={dashboardStyles.studentCountText}
                                  >
                                    {
                                      sessionStudents[session.sessionCode]
                                        .length
                                    }
                                  </Text>
                                </View>
                              )}
                          </View>
                        </View>
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
        {/* Dialog components */}
        <CreateSessionDialog
          visible={createDialogVisible}
          onDismiss={() => setCreateDialogVisible(false)}
          initialData={formData}
          onCreateSession={async (data) => {
            const success = await handleCreateSession(data);
            if (success) {
              setCreateDialogVisible(false);
            }
          }}
          onOpenSavePresetDialog={(dialogFormData) => {
            setFormData(dialogFormData);
            setSavePresetDialogVisible(true);
          }}
          onOpenLoadPresetDialog={() => setLoadPresetDialogVisible(true)}
        />

        <EditSessionDialog
          visible={editDialogVisible}
          onDismiss={() => setEditDialogVisible(false)}
          session={currentSession}
          onUpdateSession={async (updatedFormData) => {
            const success = await handleUpdateSession(updatedFormData);
            if (success) {
              setEditDialogVisible(false);
            }
          }}
        />

        <DeleteSessionDialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
          session={currentSession}
          onDeleteSession={async () => {
            const success = await handleDeleteSession();
            if (success) {
              setDeleteDialogVisible(false);
            }
          }}
          errorColor={theme.colors.error}
        />

        <SoundSelectionDialog
          visible={soundDialogVisible}
          onDismiss={() => setSoundDialogVisible(false)}
          session={currentSession}
          selectedSound={selectedSound}
          setSelectedSound={setSelectedSound}
          onSendAudioCommand={handleSendAudioCommand}
          onSendQueue={handleSendQueue}
          onPauseAudioCommand={handlePauseAudioCommand}
          onResumeAudioCommand={handleResumeAudioCommand}
          onStopAudioCommand={handleStopAudioCommand}
        />

        <ViewSessionDialog
          visible={viewDialogVisible}
          onDismiss={() => setViewDialogVisible(false)}
          session={currentSession}
          onEditSession={() => {
            setViewDialogVisible(false);
            if (currentSession) openEditDialog(currentSession);
          }}
          onShowStudents={() => {
            setViewDialogVisible(false);
            if (currentSession) openStudentsDialog(currentSession);
          }}
          getRhythmTypeName={getRhythmTypeName}
          getNoiseLevelName={getNoiseLevelName}
        />

        <SavePresetDialog
          visible={savePresetDialogVisible}
          onDismiss={() => setSavePresetDialogVisible(false)}
          onSavePreset={handleSavePreset}
          formData={formData}
        />

        <LoadPresetDialog
          visible={loadPresetDialogVisible}
          onDismiss={() => setLoadPresetDialogVisible(false)}
          presets={presets}
          onLoadPreset={(preset) => {
            setFormData(preset.data);
            setLoadPresetDialogVisible(false);
          }}
          onDeletePreset={handleDeletePreset}
        />

        <StudentsListDialog
          visible={studentsDialogVisible}
          onDismiss={() => setStudentsDialogVisible(false)}
          session={currentSession}
          students={
            currentSession?.sessionCode
              ? sessionStudents[currentSession.sessionCode]
              : []
          }
        />
      </Portal>
      <FAB
        icon="plus"
        style={[dashboardStyles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={openCreateDialog}
        color="#fff"
      />
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={[
          dashboardStyles.snackbar,
          snackbarType === "success"
            ? dashboardStyles.successSnackbar
            : dashboardStyles.errorSnackbar,
        ]}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

export default ExaminerDashboardScreen;
