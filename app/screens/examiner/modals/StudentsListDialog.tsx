import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Dimensions } from 'react-native';
import {
  Dialog,
  Button,
  Text,
  List,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Menu,
  Surface,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { Session, StudentInSession } from '../types/types';
import { socketService } from '@/services/SocketService';

type SoundCategory = 'Adult' | 'Child' | 'Geriatric' | 'Infant' | 'Speech';

const soundStructure: Record<SoundCategory, any> = {
  Adult: {
    Female: [
      'Breathing through contractions',
      'Coughing',
      'Distressed',
      'Hawk',
      'Moaning',
      'No',
      'Ok',
      'Pain',
      'Pushing - long double',
      'Pushing - long',
      'Pushing - single',
      'Screaming',
      'Sob breathing (type 2)',
      'Sob breathing',
      'Vomiting',
      'Yes',
    ],
    Male: [
      'Coughing (long)',
      'Coughing',
      'Difficult breathing',
      'Hawk',
      'Moaning (long)',
      'Moaning',
      'No',
      'Ok',
      'Screaming (type 2)',
      'Screaming',
      'Sob breathing',
      'Vomiting (type 2)',
      'Vomiting (type 3)',
      'Vomiting',
      'Yes',
    ],
  },
  Child: [
    'Coughing',
    'Hawk',
    'Moaning',
    'No',
    'Ok',
    'Screaming',
    'Sob breathing',
    'Vomiting (type 2)',
    'Vomiting',
    'Yes',
  ],
  Geriatric: {
    Female: ['Coughing', 'Moaning', 'No', 'Screaming', 'Vomiting', 'Yes'],
    Male: ['Coughing', 'Moaning', 'No', 'Screaming', 'Vomiting', 'Yes'],
  },
  Infant: [
    'Content',
    'Cough',
    'Grunt',
    'Hawk',
    'Hiccup',
    'Screaming',
    'Strongcry (type 2)',
    'Strongcry',
    'Weakcry',
  ],
  Speech: [
    'Chest hurts',
    'Doc I feel I could die',
    'Go away',
    "I don't feel dizzy",
    "I don't feel well",
    'I feel better now',
    'I feel really bad',
    "I'm feeling very dizzy",
    "I'm fine",
    "I'm quite nauseous",
    "I'm really hungry",
    "I'm really thirsty",
    "I'm so sick",
    'Never had pain like this before',
    'No allergies',
    'No diabetes',
    'No lung or cardiac problems',
    'No',
    'Pain for 2 hours',
    'Something for this pain',
    'Thank you',
    'That helped',
    'Yes',
  ],
};

interface StudentsListDialogProps {
  visible: boolean;
  onDismiss: () => void;
  session: Session | null;
  students?: any[];
}

const StudentsListDialog: React.FC<StudentsListDialogProps> = ({
  visible,
  onDismiss,
  session,
  students = [],
}) => {
  const theme = useTheme();
  const [selectedSounds, setSelectedSounds] = useState<{
    [key: number]: string;
  }>({});
  const [menuVisible, setMenuVisible] = useState<{
    [key: number]: { category: boolean; subcategory: boolean; sound: boolean };
  }>({});
  const [selectedCategories, setSelectedCategories] = useState<{
    [key: number]: string;
  }>({});
  const [selectedSubcategories, setSelectedSubcategories] = useState<{
    [key: number]: string;
  }>({});
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});
  useEffect(() => {
    if (visible) {
      try {
        if (students && students.length > 0) {
          const studentSample = students[0];
        } else if (session?.students && session.students.length > 0) {
          const studentSample = session.students[0];
        } else {
        }
      } catch (error) {
        console.error('Error processing student data:', error);
      }
    }
  }, [visible, students, session]);

  if (!session) return null;
  interface StudentData {
    id?: number;
    userId?: number;
    studentId?: number;
    name?: string;
    surname?: string;
    albumNumber?: string;
    active?: boolean;
    joinedAt?: string;
    student_sessions?: {
      active?: boolean;
      joinedAt?: string;
    };
    user?: {
      name?: string;
      surname?: string;
      albumNumber?: string;
    };
  }
  const normalizeStudent = (
    student: StudentData
  ): StudentInSession & { id: number } => {
    const id = student.id || student.userId || student.studentId || 0;

    const name =
      student.name || (student.user && student.user.name) || 'Nieznany';
    const surname =
      student.surname || (student.user && student.user.surname) || 'Student';
    const albumNumber =
      student.albumNumber ||
      (student.user && student.user.albumNumber) ||
      'brak numeru';

    const student_sessions = {
      active:
        student.active ||
        (student.student_sessions && student.student_sessions.active) ||
        false,
      joinedAt:
        student.joinedAt ||
        (student.student_sessions && student.student_sessions.joinedAt) ||
        new Date().toISOString(),
    };

    return {
      id,
      name,
      surname,
      albumNumber,
      student_sessions,
    };
  };
  let sourceStudents: any[] = [];
  if (students && students.length > 0) {
    sourceStudents = students;
  } else if (session && session.students && session.students.length > 0) {
    sourceStudents = session.students;
  } else {
    sourceStudents = [];
  }

  const studentsList = sourceStudents.map((student, index) => {
    if (!student) {
      console.error(`Invalid student at index ${index}`);
      return {
        id: index,
        name: 'Błąd',
        surname: 'Danych',
        albumNumber: 'brak numeru',
        student_sessions: {
          active: false,
          joinedAt: new Date().toISOString(),
        },
      };
    }

    try {
      return normalizeStudent(student);
    } catch (error) {
      console.error(`Failed to normalize student at index ${index}:`, error);
      return {
        id: student.id || student.userId || index,
        name: student.name || 'Error',
        surname: student.surname || '',
        albumNumber: student.albumNumber || 'brak numeru',
        student_sessions: {
          active: false,
          joinedAt: new Date().toISOString(),
        },
      };
    }
  });

  const hasStudents = studentsList.length > 0;

  const StudentRow = ({
    student,
    index,
  }: {
    student: StudentInSession & { id: number };
    index: number;
  }) => {
    const studentId = student.id;
    const hasSubcategories = getAvailableSubcategories(studentId).length > 0;
    const selectedCategory = selectedCategories[studentId] as
      | SoundCategory
      | undefined;
    const selectedSubcategory = selectedSubcategories[studentId];
    const selectedSound = selectedSounds[studentId];
    const menuVisibleState = menuVisible[studentId] || {
      category: false,
      subcategory: false,
      sound: false,
    };
    const isLoading = loading[studentId] || false;

    return (
      <Surface
        key={`student-row-${studentId}`}
        style={[
          styles.studentCard,
          {
            backgroundColor: theme.dark
              ? theme.colors.elevation.level1
              : theme.colors.background,
          },
        ]}
        elevation={1}
      >
        <View style={styles.studentHeader}>
          <View style={styles.studentInfo}>
            <Avatar.Icon
              size={40}
              icon="account-circle"
              style={[
                styles.avatar,
                {
                  backgroundColor: student.student_sessions?.active
                    ? theme.colors.primary
                    : theme.colors.surfaceDisabled,
                },
              ]}
            />
            <View style={styles.nameContainer}>
              <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                {`${student.name} ${student.surname}`}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {`Album: ${student.albumNumber}`}
              </Text>
            </View>
          </View>
        </View>

        <Text variant="bodySmall" style={styles.joinTime}>
          Dołączył:
          {student.student_sessions?.joinedAt
            ? new Date(student.student_sessions.joinedAt).toLocaleTimeString(
                'pl-PL',
                { hour: '2-digit', minute: '2-digit' }
              )
            : '-'}
        </Text>

        <Divider style={styles.divider} />

        <View style={styles.soundControlsContainer}>
          <View style={styles.selectionRow}>
            <Menu
              visible={menuVisibleState.category}
              onDismiss={() =>
                setMenuVisible(prev => ({
                  ...prev,
                  [studentId]: { ...(prev[studentId] || {}), category: false },
                }))
              }
              anchor={
                <Button
                  mode="outlined"
                  onPress={() =>
                    setMenuVisible(prev => ({
                      ...prev,
                      [studentId]: {
                        ...(prev[studentId] || {}),
                        category: true,
                      },
                    }))
                  }
                  style={styles.categoryButton}
                  icon="folder"
                  contentStyle={styles.buttonContent}
                >
                  {selectedCategory || 'Kategoria'}
                </Button>
              }
            >
              {Object.keys(soundStructure).map(category => (
                <Menu.Item
                  key={category}
                  title={category}
                  leadingIcon="folder"
                  onPress={() => handleCategorySelect(studentId, category)}
                />
              ))}
            </Menu>

            {hasSubcategories && (
              <Menu
                visible={menuVisibleState.subcategory}
                onDismiss={() =>
                  setMenuVisible(prev => ({
                    ...prev,
                    [studentId]: {
                      ...(prev[studentId] || {}),
                      subcategory: false,
                    },
                  }))
                }
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() =>
                      setMenuVisible(prev => ({
                        ...prev,
                        [studentId]: {
                          ...(prev[studentId] || {}),
                          subcategory: true,
                        },
                      }))
                    }
                    style={styles.subcategoryButton}
                    icon="folder-open"
                    disabled={!selectedCategory}
                    contentStyle={styles.buttonContent}
                  >
                    {selectedSubcategory || 'Podkategoria'}
                  </Button>
                }
              >
                {getAvailableSubcategories(studentId).map(subcategory => (
                  <Menu.Item
                    key={subcategory}
                    title={subcategory}
                    leadingIcon="folder-open"
                    onPress={() =>
                      handleSubcategorySelect(studentId, subcategory)
                    }
                  />
                ))}
              </Menu>
            )}

            <Menu
              visible={menuVisibleState.sound}
              onDismiss={() =>
                setMenuVisible(prev => ({
                  ...prev,
                  [studentId]: { ...(prev[studentId] || {}), sound: false },
                }))
              }
              anchor={
                <Button
                  mode="outlined"
                  onPress={() =>
                    setMenuVisible(prev => ({
                      ...prev,
                      [studentId]: { ...(prev[studentId] || {}), sound: true },
                    }))
                  }
                  style={styles.soundButton}
                  icon="volume-high"
                  disabled={
                    !selectedCategory ||
                    (hasSubcategories && !selectedSubcategory)
                  }
                  contentStyle={styles.buttonContent}
                >
                  {selectedSound?.split('/').pop()?.replace('.wav', '') ||
                    'Dźwięk'}
                </Button>
              }
            >
              {getAvailableSounds(studentId).map((sound: string) => (
                <Menu.Item
                  key={`${selectedCategory}-${selectedSubcategory}-${sound}`}
                  title={sound}
                  leadingIcon="music-note"
                  onPress={() => handleSoundSelect(studentId, sound)}
                />
              ))}
            </Menu>
          </View>

          <View style={styles.controlButtonsContainer}>
            <Surface style={styles.controlButtons} elevation={0}>
              <IconButton
                icon="play"
                size={28}
                mode="contained"
                disabled={!selectedSound || isLoading}
                onPress={() => {
                  setLoading(prev => ({ ...prev, [studentId]: true }));
                  handleSendToStudent(studentId, 'PLAY');
                  setTimeout(() => {
                    setLoading(prev => ({ ...prev, [studentId]: false }));
                  }, 800);
                }}
                style={{ backgroundColor: theme.colors.primary }}
                iconColor={theme.colors.onPrimary}
              />
              {isLoading ? (
                <ActivityIndicator
                  size={28}
                  color={theme.colors.primary}
                  style={styles.loadingIndicator}
                />
              ) : (
                <IconButton
                  icon="stop"
                  size={28}
                  mode="contained"
                  onPress={() => handleSendToStudent(studentId, 'STOP')}
                  style={{ backgroundColor: theme.colors.error }}
                  iconColor={theme.colors.onError}
                />
              )}
            </Surface>
          </View>
        </View>

        {selectedSound && (
          <View style={styles.selectedSoundIndicator}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Wybrany dźwięk:
            </Text>
            <Chip icon="music-note" style={styles.soundChip}>
              {selectedSound.split('/').pop()?.replace('.wav', '')}
            </Chip>
          </View>
        )}
      </Surface>
    );
  };

  const getAvailableSubcategories = (studentId: number) => {
    const category = selectedCategories[studentId] as SoundCategory;
    if (!category) return [];
    const categoryData = soundStructure[category];
    return typeof categoryData === 'object' && !Array.isArray(categoryData)
      ? Object.keys(categoryData)
      : [];
  };

  const getAvailableSounds = (studentId: number) => {
    const category = selectedCategories[studentId] as SoundCategory;
    const subcategory = selectedSubcategories[studentId];
    if (!category) return [];

    const categoryData = soundStructure[category];
    if (typeof categoryData === 'object' && subcategory) {
      return categoryData[subcategory] || [];
    }
    return Array.isArray(categoryData) ? categoryData : [];
  };

  const handleSendToStudent = (studentId: number, command: 'PLAY' | 'STOP') => {
    if (!studentId) {
      console.error('Attempted to send command to student with invalid ID');
      return;
    }

    const sound = selectedSounds[studentId];
    if (command === 'PLAY' && sound) {
      socketService.emitStudentAudioCommand(studentId, 'PLAY', sound);
    } else {
      socketService.emitStudentAudioCommand(studentId, 'STOP', '');
    }
  };

  const handleCategorySelect = (studentId: number, category: string) => {
    setSelectedCategories(prev => ({ ...prev, [studentId]: category }));
    setSelectedSubcategories(prev => ({ ...prev, [studentId]: '' }));
    setSelectedSounds(prev => ({ ...prev, [studentId]: '' }));
    setMenuVisible(prev => ({
      ...prev,
      [studentId]: {
        category: false,
        subcategory: true,
        sound: false,
      },
    }));
  };

  const handleSubcategorySelect = (studentId: number, subcategory: string) => {
    setSelectedSubcategories(prev => ({ ...prev, [studentId]: subcategory }));
    setSelectedSounds(prev => ({ ...prev, [studentId]: '' }));
    setMenuVisible(prev => ({
      ...prev,
      [studentId]: {
        category: false,
        subcategory: false,
        sound: true,
      },
    }));
  };

  const handleSoundSelect = (studentId: number, sound: string) => {
    const category = selectedCategories[studentId];
    const subcategory = selectedSubcategories[studentId];
    const soundPath = subcategory
      ? `${category}/${subcategory}/${sound}.wav`
      : `${category}/${sound}.wav`;

    setSelectedSounds(prev => ({ ...prev, [studentId]: soundPath }));
    setMenuVisible(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        sound: false,
      },
    }));
  };
  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={{
        ...styles.dialog,
        maxHeight: Dimensions.get('window').height * 0.9,
        backgroundColor: theme.dark
          ? theme.colors.elevation.level2
          : theme.colors.surface,
      }}
    >
      <Dialog.Title style={styles.dialogTitle}>Studenci w sesji</Dialog.Title>

      <Dialog.Content style={styles.dialogContent}>
        <Surface
          style={[
            styles.sessionHeader,
            {
              backgroundColor: theme.dark
                ? theme.colors.elevation.level1
                : theme.colors.surfaceVariant,
            },
          ]}
          elevation={0}
        >
          <View style={styles.sessionInfo}>
            <Text variant="titleMedium" style={styles.sessionName}>
              {session.name || `Sesja ${session.sessionCode}`}
            </Text>
            <Text variant="bodySmall" style={styles.sessionCode}>
              Kod sesji: {session.sessionCode}
            </Text>
          </View>

          <Chip
            icon={session.isActive ? 'check-circle' : 'cancel'}
            style={[
              styles.sessionStatus,
              {
                backgroundColor: session.isActive
                  ? theme.colors.primaryContainer
                  : theme.colors.errorContainer,
              },
            ]}
          >
            {session.isActive ? 'Aktywna' : 'Nieaktywna'}
          </Chip>
        </Surface>

        <Divider style={styles.divider} />

        {!hasStudents ? (
          <Surface style={styles.emptyState} elevation={0}>
            <Avatar.Icon
              size={64}
              icon="account-group"
              style={{ backgroundColor: theme.colors.surfaceDisabled }}
              color={theme.colors.onSurfaceDisabled}
            />
            <Text variant="titleMedium" style={styles.emptyStateTitle}>
              Brak studentów
            </Text>
            <Text variant="bodyMedium" style={styles.emptyStateText}>
              Żaden student nie dołączył jeszcze do tej sesji
            </Text>
            <Button
              mode="contained"
              onPress={onDismiss}
              style={styles.emptyStateButton}
              icon="refresh"
            >
              Odśwież
            </Button>
          </Surface>
        ) : (
          <ScrollView
            style={styles.studentsList}
            contentContainerStyle={styles.studentsListContent}
            showsVerticalScrollIndicator={false}
          >
            {studentsList.map((student, index) => (
              <StudentRow
                key={student.id || `student-${index}`}
                student={student}
                index={index}
              />
            ))}
          </ScrollView>
        )}
      </Dialog.Content>

      <Dialog.Actions style={styles.dialogActions}>
        <Button onPress={onDismiss} mode="contained">
          Zamknij
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 600,
    width: '95%',
    alignSelf: 'center',
    borderRadius: 16,
  },
  dialogTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 22,
  },
  dialogContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  dialogActions: {
    justifyContent: 'center',
    paddingBottom: 16,
    paddingTop: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 0,
    marginVertical: 0,
    padding: 16,
    borderRadius: 8,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sessionCode: {
    opacity: 0.7,
  },
  sessionStatus: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  sessionHeaderText: {
    flexShrink: 1,
  },
  divider: {
    marginVertical: 16,
    height: 1,
  },
  studentsList: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  studentsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  studentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 0,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  avatar: {
    backgroundColor: '#3498db',
    borderRadius: 20,
  },
  controlsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    minWidth: Dimensions.get('window').width < 400 ? 150 : 280,
    marginLeft: 10,
  },
  statusContainer: {
    alignItems: 'flex-end',
    marginRight: 16,
  },
  statusChip: {
    backgroundColor: 'transparent',
    height: 28,
  },
  joinTime: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
    marginLeft: 52,
  },
  itemDivider: {
    marginVertical: 8,
    backgroundColor: '#eee',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
    color: '#666',
  },
  emptyStateButton: {
    marginTop: 24,
  },
  soundControls: {
    flexDirection: 'column',
    gap: 6,
    width: '100%',
  },
  soundControlsContainer: {
    marginTop: 12,
  },
  selectionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryButton: {
    flex: 1,
    minWidth: 100,
  },
  subcategoryButton: {
    flex: 1,
    minWidth: 120,
  },
  soundButton: {
    flex: 1,
    minWidth: 140,
  },
  buttonContent: {
    height: 36,
    flexDirection: 'row-reverse',
  },
  controlButtonsContainer: {
    alignItems: 'flex-end',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
    borderRadius: 28,
  },
  loadingIndicator: {
    margin: 6,
  },
  selectedSoundIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  soundChip: {
    height: 24,
    borderRadius: 12,
  },
  menuWrapper: {
    maxWidth: 200,
    elevation: 3,
    zIndex: 3,
  },
});

export default StudentsListDialog;
