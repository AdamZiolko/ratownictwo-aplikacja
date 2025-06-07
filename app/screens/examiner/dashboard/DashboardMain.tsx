import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  LayoutAnimation,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  SegmentedButtons,
  TextInput,
  Checkbox,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { StyleSheet } from 'react-native';

import {
  StatItem,
  getRhythmTypeName,
  getNoiseLevelName,
} from './components/DashboardComponents';
import { useSessionManager } from './SessionManager';

import CreateSessionDialog from '../modals/CreateSessionDialog';
import EditSessionDialog from '../modals/EditSessionDialog';
import ViewSessionDialog from '../modals/ViewSessionDialog';
import DeleteSessionDialog from '../modals/DeleteSessionDialog';
import SoundSelectionDialog from '../modals/SoundSelectionDialog';
import { SavePresetDialog, LoadPresetDialog } from '../modals/PresetDialogs';
import StudentsListDialog from '../modals/StudentsListDialog';
import { Session } from '../types/types';
import { createDashboardStyles } from './DashboardStyles';
import AudioTab from './components/AudioTab';
import ColorConfigTab from './components/ColorConfigTab';
import ChecklistDialog from '../modals/ChecklistDialog';
import apiService from '@/services/ApiService';

interface TestResult {
  id: number;
  student: { name: string; surname: string; albumNumber?: string };
  tasks: Array<{ text: string; completed: boolean }>;
  comments: Array<{ text: string; timestamp: string }>;
  createdAt: string;
}

interface StudentTestState {
  testStarted: boolean;
  loadedTestName: string | null;
  tasks: Array<{ id: number; text: string; completed: boolean }>;
  comments: Array<{ id: number; text: string; timestamp: Date }>;
}

const ExaminerDashboardScreen = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerVisible, setHeaderVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'sessions' | 'audio' | 'color-config'
  >('sessions');

  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [soundDialogVisible, setSoundDialogVisible] = useState(false);
  const [studentsDialogVisible, setStudentsDialogVisible] = useState(false);
  const [savePresetDialogVisible, setSavePresetDialogVisible] = useState(false);
  const [loadPresetDialogVisible, setLoadPresetDialogVisible] = useState(false);

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<
    Record<string, boolean>
  >({});
  const sidebarWidthValue = 250;

  const studentRefs = useRef<{ [id: number]: any }>({});

  const [popupTop, setPopupTop] = useState<number>(0);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: number;
    name: string;
    surname: string;
    albumNumber?: string;
  } | null>(null);

  const [studentTestStates, setStudentTestStates] = useState<
    Record<number, StudentTestState>
  >({});

  const [historyVisible, setHistoryVisible] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);

  const [filterName, setFilterName] = useState('');
  const [filterDate, setFilterDate] = useState('');

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
    handleServerAudioCommand,
    handleServerAudioPauseCommand,
    handleServerAudioResumeCommand,
    handleServerAudioStopCommand,
    lastLoopedSound,
    setLastLoopedSound,
  } = useSessionManager(user);

  const toggleSidebar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSidebarVisible(!sidebarVisible);
  };
  const toggleSession = (sessionCode: string) =>
    setExpandedSessions(prev => ({
      ...prev,
      [sessionCode]: !prev[sessionCode],
    }));

  const activeSessions = sessions.filter(s => s.isActive);

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

  const openColorConfigForSession = (session: Session) => {
    setCurrentSession(session);
    setActiveTab('color-config');
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
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

  const handleStudentPress = (student: {
    id: number;
    name: string;
    surname: string;
    albumNumber?: string;
  }) => {
    const ref = studentRefs.current[student.id];
    if (!ref) return;
    ref.measureInWindow((x: number, y: number, w: number, h: number) => {
      setPopupTop(y);
      setSelectedStudent(student);

      setStudentTestStates(prev => {
        if (prev[student.id]) return prev;
        return {
          ...prev,
          [student.id]: {
            testStarted: false,
            loadedTestName: null,
            tasks: [],
            comments: [],
          },
        };
      });
    });
  };

  const windowHeight = Dimensions.get('window').height;

  useEffect(() => {
    if (historyVisible) {
      loadTestResults();
    }
  }, [historyVisible]);

  const loadTestResults = async () => {
    setLoadingResults(true);
    setResultsError(null);
    try {
      const response: TestResult[] = await apiService.get(
        'checklist/test-results'
      );
      setTestResults(response);
    } catch (err) {
      console.error('Błąd ładowania wyników:', err);
      setResultsError('Nie udało się pobrać historii testów');
    } finally {
      setLoadingResults(false);
    }
  };

  const filteredResults = testResults.filter(r => {
    const fullName = `${r.student.name} ${r.student.surname}`.toLowerCase();
    const localDateStr = new Date(r.createdAt).toLocaleDateString('pl-PL');

    const matchesName = filterName.trim()
      ? fullName.includes(filterName.trim().toLowerCase())
      : true;
    const matchesDate = filterDate.trim()
      ? localDateStr.includes(filterDate.trim())
      : true;

    return matchesName && matchesDate;
  });

  return (
    <View style={{ flexDirection: 'row', flex: 1 }}>
      <Portal>
        {selectedStudent !== null && (
          <ChecklistDialog
            visible={selectedStudent !== null}
            top={popupTop}
            left={sidebarVisible ? sidebarWidthValue + 16 : 16}
            onDismiss={() => setSelectedStudent(null)}
            sessionId={currentSession?.sessionId}
            student={selectedStudent}
            testState={studentTestStates[selectedStudent!.id]!}
            onStartTest={() =>
              setStudentTestStates(prev => ({
                ...prev,
                [selectedStudent!.id]: {
                  ...prev[selectedStudent!.id],
                  testStarted: true,
                },
              }))
            }
            onLoadTemplate={(name, tasks) =>
              setStudentTestStates(prev => ({
                ...prev,
                [selectedStudent!.id]: {
                  ...prev[selectedStudent!.id],
                  loadedTestName: name,
                  tasks: [...tasks],
                },
              }))
            }
            onChangeTasks={newTasks =>
              setStudentTestStates(prev => ({
                ...prev,
                [selectedStudent!.id]: {
                  ...prev[selectedStudent!.id],
                  tasks: [...newTasks],
                },
              }))
            }
            onChangeComments={newComments =>
              setStudentTestStates(prev => ({
                ...prev,
                [selectedStudent!.id]: {
                  ...prev[selectedStudent!.id],
                  comments: [...newComments],
                },
              }))
            }
          />
        )}
      </Portal>

      <Animated.View
        style={[
          dashboardStyles.sidebar,
          {
            width: sidebarVisible ? sidebarWidthValue : 0,
            transform: [
              { translateX: sidebarVisible ? 0 : -sidebarWidthValue },
            ],
          },
        ]}
      >
        <ScrollView contentContainerStyle={dashboardStyles.sidebarContent}>
          <Text style={dashboardStyles.sidebarTitle}>Aktywne Sesje</Text>

          {activeSessions.length === 0 ? (
            <Text style={dashboardStyles.sidebarEmpty}>
              Brak aktywnych sesji
            </Text>
          ) : (
            activeSessions.map(session => (
              <View
                key={session.sessionCode}
                style={dashboardStyles.sessionItem}
              >
                <TouchableOpacity
                  onPress={() => toggleSession(session.sessionCode)}
                  style={dashboardStyles.sessionHeader}
                >
                  <Text style={dashboardStyles.sessionCodeText}>
                    {session.sessionCode}
                  </Text>
                  <IconButton
                    icon={
                      expandedSessions[session.sessionCode]
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={20}
                  />
                </TouchableOpacity>

                {expandedSessions[session.sessionCode] && (
                  <View style={dashboardStyles.studentsList}>
                    {sessionStudents[session.sessionCode]?.map(student => (
                      <View
                        key={student.id}
                        style={dashboardStyles.studentItem}
                        ref={el => {
                          studentRefs.current[student.id] = el;
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            handleStudentPress({
                              id: student.id,
                              name: student.name,
                              surname: student.surname,
                              albumNumber: student.albumNumber,
                            });
                            setCurrentSession(session);
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center' }}
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

                    <View style={dashboardStyles.sessionActions}>
                      <Button
                        mode="outlined"
                        onPress={() => openColorConfigForSession(session)}
                        style={dashboardStyles.colorConfigButton}
                        icon="palette"
                        compact
                        labelStyle={{ fontSize: 12 }}
                      >
                        Konfiguracja kolorów
                      </Button>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
          <Button
            mode="outlined"
            onPress={() => setHistoryVisible(v => !v)}
            style={[dashboardStyles.historyButton, { marginTop: 16 }]}
            contentStyle={{ backgroundColor: theme.colors.surface }}
            icon="history"
          >
            Historia testów
          </Button>
        </ScrollView>
      </Animated.View>

      <SafeAreaView style={[dashboardStyles.container, { flex: 1 }]}>
        <Appbar.Header>
          <Appbar.Action
            icon={sidebarVisible ? 'menu-open' : 'menu'}
            onPress={toggleSidebar}
          />
          <Appbar.Content
            title="Panel Egzaminatora"
            subtitle={user ? `Zalogowany jako: ${user.username}` : ''}
          />
          <Appbar.Action icon="logout" onPress={handleLogout} />
        </Appbar.Header>

        <SegmentedButtons
          value={activeTab}
          onValueChange={value =>
            setActiveTab(value as 'sessions' | 'audio' | 'color-config')
          }
          buttons={[
            {
              value: 'sessions',
              label: 'Sesje',
              icon: 'account-group',
            },
            {
              value: 'audio',
              label: 'Audio',
              icon: 'music',
            },
          ]}
          style={{ margin: 16 }}
        />

        <View style={dashboardStyles.contentContainer}>
          {activeTab === 'sessions' && (
            <>
              {Platform.OS !== 'android' && (
                <Card
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 4,
                  }}
                >
                  <Card.Content>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 10,
                      }}
                    >
                      <StatItem
                        value={sessions?.length}
                        label="Wszystkie sesje"
                      />
                    </View>
                  </Card.Content>
                </Card>
              )}

              {loading && !refreshing ? (
                <View style={dashboardStyles.loadingContainer}>
                  <ActivityIndicator size="large" />
                  <Text style={dashboardStyles.loadingText}>
                    Ładowanie sesji...
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={dashboardStyles.tableContainer}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                    />
                  }
                  onScroll={
                    Platform.OS === 'android' ? handleScroll : undefined
                  }
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
                    <View>
                      {sessions.map(session => (
                        <Card
                          key={session.sessionId}
                          style={dashboardStyles.mobileCard}
                          onPress={() => openViewDialog(session)}
                        >
                          <Card.Title
                            title={`Kod: ${session.sessionCode}`}
                            titleStyle={dashboardStyles.mobileCardTitle}
                            subtitle={
                              `${getRhythmTypeName(session.rhythmType).slice(
                                0,
                                30
                              )}` +
                              `${
                                getRhythmTypeName(session.rhythmType).length >
                                30
                                  ? '...'
                                  : ''
                              }`
                            }
                            subtitleStyle={dashboardStyles.mobileCardSubtitle}
                          />
                          <Card.Content
                            style={dashboardStyles.mobileCardContent}
                          >
                            <View style={dashboardStyles.mobileCardRow}>
                              <Text style={dashboardStyles.mobileCardText}>
                                Temperatura: {session.temperature}°C
                              </Text>
                              <Text style={dashboardStyles.mobileCardText}>
                                BPM: {session.beatsPerMinute}
                              </Text>
                            </View>
                            <View style={dashboardStyles.mobileCardActions}>
                              <IconButton
                                icon="pencil"
                                size={24}
                                onPress={e => {
                                  e.stopPropagation();
                                  openEditDialog(session);
                                }}
                                iconColor={theme.colors.primary}
                              />
                              <IconButton
                                icon="delete"
                                size={24}
                                onPress={e => {
                                  e.stopPropagation();
                                  openDeleteDialog(session);
                                }}
                                iconColor={theme.colors.error}
                              />
                              <IconButton
                                icon="volume-high"
                                size={24}
                                onPress={e => {
                                  e.stopPropagation();
                                  openSoundDialog(session);
                                }}
                                iconColor={theme.colors.secondary}
                              />
                              <View style={dashboardStyles.mobileIconContainer}>
                                <IconButton
                                  icon="account-group"
                                  size={24}
                                  onPress={e => {
                                    e.stopPropagation();
                                    openStudentsDialog(session);
                                  }}
                                  iconColor={theme.colors.tertiary || '#9c27b0'}
                                />
                                {sessionStudents[session.sessionCode] &&
                                  sessionStudents[session.sessionCode].length >
                                    0 && (
                                    <View
                                      style={dashboardStyles.studentCountBadge}
                                    >
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
                              <IconButton
                                icon="palette"
                                size={24}
                                onPress={e => {
                                  e.stopPropagation();
                                  openColorConfigForSession(session);
                                }}
                                iconColor={theme.colors.onSurface}
                              />
                            </View>
                          </Card.Content>
                        </Card>
                      ))}
                    </View>
                  )}
                </ScrollView>
              )}
            </>
          )}

          {activeTab === 'audio' && <AudioTab />}

          {activeTab === 'color-config' && (
            <ColorConfigTab
              sessionId={currentSession?.sessionId || null}
              sessionCode={currentSession?.sessionCode || null}
              onGoBack={() => setActiveTab('sessions')}
            />
          )}
        </View>

        <Modal visible={historyVisible} transparent animationType="slide">
          <View style={styles.historyOverlay}>
            <View
              style={[
                styles.historyContainer,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={styles.historyHeader}>
                <Text variant="titleMedium">Historia testów</Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => setHistoryVisible(false)}
                  iconColor={theme.colors.onSurface}
                />
              </View>
              <View style={styles.filtersRow}>
                <TextInput
                  label="Filtruj po nazwisku"
                  value={filterName}
                  onChangeText={setFilterName}
                  mode="outlined"
                  style={styles.filterInput}
                  theme={{ colors: { primary: theme.colors.primary } }}
                />
                <TextInput
                  label="Filtruj po dacie (DD.MM.YYYY)"
                  value={filterDate}
                  onChangeText={setFilterDate}
                  mode="outlined"
                  style={styles.filterInput}
                  theme={{ colors: { primary: theme.colors.primary } }}
                />
              </View>

              {}
              <View style={styles.historyContent}>
                {loadingResults ? (
                  <View style={dashboardStyles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={dashboardStyles.loadingText}>
                      Ładowanie historii...
                    </Text>
                  </View>
                ) : resultsError ? (
                  <View style={dashboardStyles.emptyState}>
                    <Text variant="bodyLarge">{resultsError}</Text>
                  </View>
                ) : filteredResults.length === 0 ? (
                  <View style={dashboardStyles.emptyState}>
                    <Text variant="bodyLarge">
                      Brak wyników spełniających kryteria
                    </Text>
                  </View>
                ) : (
                  <ScrollView style={styles.historyScroll}>
                    {filteredResults.map(result => (
                      <Card
                        key={result.id}
                        style={[
                          dashboardStyles.mobileCard,
                          { marginBottom: 12 },
                        ]}
                      >
                        <Card.Title
                          title={`${result.student.name} ${result.student.surname}`}
                          titleStyle={dashboardStyles.mobileCardTitle}
                          subtitle={`Data: ${new Date(
                            result.createdAt
                          ).toLocaleString()}`}
                          subtitleStyle={dashboardStyles.mobileCardSubtitle}
                        />
                        <Card.Content>
                          <Text style={{ marginBottom: 4, fontWeight: 'bold' }}>
                            Zadania:
                          </Text>
                          {result.tasks.map((t, idx) => (
                            <View
                              key={idx}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 2,
                              }}
                            >
                              <Checkbox
                                status={t.completed ? 'checked' : 'unchecked'}
                                disabled
                              />
                              <Text style={{ marginLeft: 8 }}>{t.text}</Text>
                            </View>
                          ))}

                          {result.comments.length > 0 && (
                            <>
                              <Text
                                style={{ marginTop: 8, fontWeight: 'bold' }}
                              >
                                Komentarze:
                              </Text>
                              {result.comments.map((c, idx) => (
                                <View
                                  key={idx}
                                  style={{ marginVertical: 2, paddingLeft: 8 }}
                                >
                                  <Text>- {c.text}</Text>
                                  <Text
                                    style={{
                                      fontSize: 12,
                                      color: theme.colors.onSurfaceVariant,
                                    }}
                                  >
                                    {new Date(c.timestamp).toLocaleString()}
                                  </Text>
                                </View>
                              ))}
                            </>
                          )}
                        </Card.Content>
                      </Card>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </View>
        </Modal>

        <Portal>
          <CreateSessionDialog
            visible={createDialogVisible}
            onDismiss={() => setCreateDialogVisible(false)}
            initialData={formData}
            onCreateSession={async data => {
              const success = await handleCreateSession(data);
              if (success) setCreateDialogVisible(false);
            }}
            onOpenSavePresetDialog={d => {
              setFormData(d);
              setSavePresetDialogVisible(true);
            }}
            onOpenLoadPresetDialog={() => setLoadPresetDialogVisible(true)}
          />

          <EditSessionDialog
            visible={editDialogVisible}
            onDismiss={() => setEditDialogVisible(false)}
            session={currentSession}
            onUpdateSession={async d => {
              const success = await handleUpdateSession(d);
              if (success) setEditDialogVisible(false);
            }}
          />
          <DeleteSessionDialog
            visible={deleteDialogVisible}
            onDismiss={() => setDeleteDialogVisible(false)}
            session={currentSession}
            onDeleteSession={async () => {
              setIsDeleting(true);
              const success = await handleDeleteSession();
              setIsDeleting(false);
              if (success) setDeleteDialogVisible(false);
            }}
            errorColor={theme.colors.error}
            isDeleting={isDeleting}
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
            onServerAudioCommand={handleServerAudioCommand}
            onServerAudioPauseCommand={handleServerAudioPauseCommand}
            onServerAudioResumeCommand={handleServerAudioResumeCommand}
            onServerAudioStopCommand={handleServerAudioStopCommand}
            lastLoopedSound={lastLoopedSound}
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
            onLoadPreset={p => {
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

        {activeTab === 'sessions' && (
          <FAB
            icon="plus"
            style={[
              dashboardStyles.fab,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={openCreateDialog}
            color="#fff"
            label="Utwórz sesję"
          />
        )}

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={[
            dashboardStyles.snackbar,
            snackbarType === 'success'
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

const styles = StyleSheet.create({
  historyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContainer: {
    width: '90%',
    height: '85%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  filterInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  historyContent: {
    flex: 1,
    padding: 16,
  },
  historyScroll: {
    flex: 1,
  },
});
