import React, { useState, useRef } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Dimensions,
  LayoutAnimation,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
  IconButton,
  useTheme,
  ActivityIndicator,
  Snackbar,
  Avatar,
  Checkbox,
} from "react-native-paper";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

import { StatItem, getRhythmTypeName, getNoiseLevelName } from "./components/DashboardComponents";
import { useSessionManager } from "./SessionManager";

import CreateSessionDialog from "../modals/CreateSessionDialog";
import EditSessionDialog from "../modals/EditSessionDialog";
import ViewSessionDialog from "../modals/ViewSessionDialog";
import DeleteSessionDialog from "../modals/DeleteSessionDialog";
import SoundSelectionDialog from "../modals/SoundSelectionDialog";
import { SavePresetDialog, LoadPresetDialog } from "../modals/PresetDialogs";
import StudentsListDialog from "../modals/StudentsListDialog";
import { Session } from "../types/types";
import { createDashboardStyles } from "./DashboardStyles";

const ExaminerDashboardScreen = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerVisible, setHeaderVisible] = useState(true);

  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [soundDialogVisible, setSoundDialogVisible] = useState(false);
  const [studentsDialogVisible, setStudentsDialogVisible] = useState(false);
  const [savePresetDialogVisible, setSavePresetDialogVisible] = useState(false);
  const [loadPresetDialogVisible, setLoadPresetDialogVisible] = useState(false);

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});
  const sidebarWidthValue = 250;

  const studentRefs = useRef<{ [id: number]: any }>({});

  const [popupTop, setPopupTop] = useState<number>(0);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  const dashboardStyles = createDashboardStyles(theme);

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

  const toggleSidebar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSidebarVisible(!sidebarVisible);
  };
  const toggleSession = (sessionCode: string) =>
    setExpandedSessions(prev => ({ ...prev, [sessionCode]: !prev[sessionCode] }));

  const activeSessions = sessions.filter((s) => s.isActive);

  const openCreateDialog = () => setCreateDialogVisible(true);
  const openEditDialog = (s: Session) => {
    setCurrentSession(s);
    setEditDialogVisible(true);
  };
  const openSoundDialog = (s: Session) => {
    setCurrentSession(s);
    setSelectedSound(null);
    setSoundDialogVisible(true);
  };
  const openDeleteDialog = (s: Session) => {
    setCurrentSession(s);
    setDeleteDialogVisible(true);
  };
  const openViewDialog = (s: Session) => {
    setCurrentSession(s);
    setViewDialogVisible(true);
  };
  const openStudentsDialog = (s: Session) => {
    setCurrentSession(s);
    setStudentsDialogVisible(true);
  };

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        setHeaderVisible(e.nativeEvent.contentOffset.y <= 10);
      },
      useNativeDriver: false,
    }
  );

  const handleStudentPress = (studentId: number) => {
    const ref = studentRefs.current[studentId];
    if (!ref) return;
    ref.measureInWindow((x: number, y: number, w: number, h: number) => {
      setPopupTop(y);
      setSelectedStudent(studentId);
    });
  };

  const windowHeight = Dimensions.get("window").height;
  const calculatePopupPosition = (y: number, screenHeight: number) => {
    const popupHeight = 400;
    const margin = 16;
    return y + popupHeight + margin < screenHeight ? y + margin : y - popupHeight - margin;
  };

  return (
    <View style={{ flexDirection: "row", flex: 1 }}>

      {selectedStudent !== null && (
        <Pressable
          style={dashboardStyles.globalOverlay}
          onPress={() => setSelectedStudent(null)}
        >
          <View
            style={[
              dashboardStyles.studentPopup,
              {
                left: sidebarVisible ? sidebarWidthValue + 16 : 16,
                top: calculatePopupPosition(popupTop, windowHeight),
              },
            ]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <View style={dashboardStyles.popupHeader}>
              <Text variant="titleMedium">Checklista wykonanych zadań</Text>
              <IconButton
                icon="close"
                size={20}
                onPress={() => setSelectedStudent(null)}
              />
            </View>

            <ScrollView style={dashboardStyles.checklistContent}>
              <Text>Lista zadań w budowie…</Text>
              <View style={dashboardStyles.checklistItem}>
                <Checkbox status="unchecked" disabled />
                <Text>Zadanie 1</Text>
              </View>
              <View style={dashboardStyles.checklistItem}>
                <Checkbox status="checked" disabled />
                <Text>Zadanie 2</Text>
              </View>
            </ScrollView>
          </View>
        </Pressable>
      )}

      <Animated.View
        style={[
          dashboardStyles.sidebar,
          {
            width: sidebarVisible ? sidebarWidthValue : 0,
            transform: [{ translateX: sidebarVisible ? 0 : -sidebarWidthValue }],
          },
        ]}
      >
        <ScrollView contentContainerStyle={dashboardStyles.sidebarContent}>
          <Text style={dashboardStyles.sidebarTitle}>Aktywne Sesje</Text>

          {activeSessions.length === 0 ? (
            <Text style={dashboardStyles.sidebarEmpty}>Brak aktywnych sesji</Text>
          ) : (
            activeSessions.map((session) => (
              <View key={session.sessionCode} style={dashboardStyles.sessionItem}>
                <TouchableOpacity
                  onPress={() => toggleSession(session.sessionCode)}
                  style={dashboardStyles.sessionHeader}
                >
                  <Text style={dashboardStyles.sessionCodeText}>
                    {session.sessionCode}
                  </Text>
                  <IconButton
                    icon={expandedSessions[session.sessionCode] ? "chevron-up" : "chevron-down"}
                    size={20}
                  />
                </TouchableOpacity>

                {expandedSessions[session.sessionCode] && (
                  <View style={dashboardStyles.studentsList}>
                    {sessionStudents[session.sessionCode]?.map((student) => (
                      <View
                        key={student.id}
                        style={dashboardStyles.studentItem}
                        ref={(el) => {
                          studentRefs.current[student.id] = el;
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => handleStudentPress(student.id)}
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Avatar.Icon
                            size={30}
                            icon="account"
                            style={dashboardStyles.avatar}
                          />
                          <Text style={dashboardStyles.studentName}>
                            {student.name} {student.surname}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>

      <SafeAreaView style={[dashboardStyles.container, { flex: 1 }]}>
        <Appbar.Header>
          <Appbar.Action
            icon={sidebarVisible ? "menu-open" : "menu"}
            onPress={toggleSidebar}
          />
          <Appbar.Content
            title="Panel Egzaminatora"
            subtitle={user ? `Zalogowany jako: ${user.username}` : ""}
          />
          <Appbar.Action icon="logout" onPress={handleLogout} />
        </Appbar.Header>

        <View style={dashboardStyles.contentContainer}>
          {Platform.OS !== "android" && (
            <Card style={{ backgroundColor: theme.colors.surface, borderRadius: 4 }}>
              <Card.Content>
                <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 10 }}>
                  <StatItem value={sessions?.length} label="Wszystkie sesje" />
                </View>
              </Card.Content>
            </Card>
          )}

          {loading && !refreshing ? (
            <View style={dashboardStyles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={dashboardStyles.loadingText}>Ładowanie sesji...</Text>
            </View>
          ) : (
            <ScrollView
              style={dashboardStyles.tableContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              onScroll={Platform.OS === "android" ? handleScroll : undefined}
              scrollEventThrottle={16}
            >
              {sessions?.length === 0 ? (
                <View style={dashboardStyles.emptyState}>
                  <Text variant="bodyLarge">Brak aktywnych sesji</Text>
                  <Text variant="bodyMedium" style={dashboardStyles.emptyStateText}>
                    Kliknij przycisk "+" aby utworzyć nową sesję
                  </Text>
                  <Button mode="contained" onPress={openCreateDialog} style={dashboardStyles.emptyStateButton}>
                    Utwórz pierwszą sesję
                  </Button>
                </View>
              ) : (
                <View>
                  {sessions.map((session) => (
                    <Card key={session.sessionId} style={dashboardStyles.mobileCard} onPress={() => openViewDialog(session)}>
                      <Card.Title
                        title={`Kod: ${session.sessionCode}`}
                        titleStyle={dashboardStyles.mobileCardTitle}
                        subtitle={
                          `${getRhythmTypeName(session.rhythmType).slice(0, 30)}` +
                          `${getRhythmTypeName(session.rhythmType).length > 30 ? "..." : ""}`
                        }
                        subtitleStyle={dashboardStyles.mobileCardSubtitle}
                      />
                      <Card.Content style={dashboardStyles.mobileCardContent}>
                        <View style={dashboardStyles.mobileCardRow}>
                          <Text style={dashboardStyles.mobileCardText}>
                            Temperatura: {session.temperature}°C
                          </Text>
                          <Text style={dashboardStyles.mobileCardText}>BPM: {session.beatsPerMinute}</Text>
                        </View>
                        <View style={dashboardStyles.mobileCardActions}>
                          <IconButton
                            icon="pencil"
                            size={24}
                            onPress={(e) => {
                              e.stopPropagation();
                              openEditDialog(session);
                            }}
                            iconColor={theme.colors.primary}
                          />
                          <IconButton
                            icon="delete"
                            size={24}
                            onPress={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(session);
                            }}
                            iconColor={theme.colors.error}
                          />
                          <IconButton
                            icon="volume-high"
                            size={24}
                            onPress={(e) => {
                              e.stopPropagation();
                              openSoundDialog(session);
                            }}
                            iconColor={theme.colors.secondary}
                          />
                          <View style={dashboardStyles.mobileIconContainer}>
                            <IconButton
                              icon="account-group"
                              size={24}
                              onPress={(e) => {
                                e.stopPropagation();
                                openStudentsDialog(session);
                              }}
                              iconColor={theme.colors.tertiary || "#9c27b0"}
                            />
                            {sessionStudents[session.sessionCode] &&
                              sessionStudents[session.sessionCode].length > 0 && (
                                <View style={dashboardStyles.studentCountBadge}>
                                  <Text style={dashboardStyles.studentCountText}>
                                    {sessionStudents[session.sessionCode].length}
                                  </Text>
                                </View>
                              )}
                          </View>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>

        <Portal>
          <CreateSessionDialog
            visible={createDialogVisible}
            onDismiss={() => setCreateDialogVisible(false)}
            initialData={formData}
            onCreateSession={async (data) => {
              const success = await handleCreateSession(data);
              if (success) setCreateDialogVisible(false);
            }}
            onOpenSavePresetDialog={(d) => {
              setFormData(d);
              setSavePresetDialogVisible(true);
            }}
            onOpenLoadPresetDialog={() => setLoadPresetDialogVisible(true)}
          />

          <EditSessionDialog
            visible={editDialogVisible}
            onDismiss={() => setEditDialogVisible(false)}
            session={currentSession}
            onUpdateSession={async (d) => {
              const success = await handleUpdateSession(d);
              if (success) setEditDialogVisible(false);
            }}
          />

          <DeleteSessionDialog
            visible={deleteDialogVisible}
            onDismiss={() => setDeleteDialogVisible(false)}
            session={currentSession}
            onDeleteSession={async () => {
              const success = await handleDeleteSession();
              if (success) setDeleteDialogVisible(false);
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
            onLoadPreset={(p) => {
              setFormData(p.data);
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
          label="Utwórz sesję"
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
    </View>
  );
};

export default ExaminerDashboardScreen;


