import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Appbar, Card, Button, FAB, useTheme, Portal, Dialog, TextInput, IconButton, Modal, Switch, List, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import {BluetoothComponent} from '../../components/BluetoothComponent'; 
import { Platform } from 'react-native';
const RhythmSvg = ({ type }: { type: string }) => {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="10" stroke="black" strokeWidth="2" fill="none" />
      <Path d="M8,12 L12,8 L16,12" stroke="black" strokeWidth="2" fill="none" />
    </Svg>
  );
};

// Student type definition
interface Student {
  id: string;
  name: string;
  accessCode: string;
  vitals: {
    temperature: number;
    heartRate: number;
    peristalsis: 'normal' | 'hyperactive' | 'hypoactive' | 'absent';
    leftLungMurmurs: boolean;
    rightLungMurmurs: boolean;
    rhythmType: RhythmType;
  };
}

// Rhythm type definition
type RhythmType = 'normal' | 'atrial-fibrillation' | 'atrial-flutter' | 'nodal' | 'front-chamber';

// Session type definition
interface TrainingSession {
  id: string;
  name: string;
  date: string;
  students: Student[];
  accessCode: string;
}

// Vitals type definition
type Vitals = {
  temperature: number;
  heartRate: number;
  peristalsis: 'normal' | 'hyperactive' | 'hypoactive' | 'absent';
  leftLungMurmurs: boolean;
  rightLungMurmurs: boolean;
  rhythmType: RhythmType;
};

const getRhythmName = (rhythm: RhythmType): string => {
  switch (rhythm) {
    case 'normal':
      return 'Rytm normalny';
    case 'atrial-fibrillation':
      return 'Migotanie przedsionków';
    case 'atrial-flutter':
      return 'Trzepotanie przedsionków';
    case 'nodal':
      return 'Rytm węzłowy';
    case 'front-chamber':
      return 'Rytm komorowy';
    default:
      return rhythm;
  }
};

const ExaminerDashboardScreen = () => {
  const theme = useTheme();
  const [sessions, setSessions] = useState<TrainingSession[]>([
    { 
      id: '1', 
      name: 'Basic Life Support', 
      date: '2023-05-15', 
      students: [
        {
          id: '101',
          name: 'John Doe',
          accessCode: 'BLS2023-101',
          vitals: {
            temperature: 36.6,
            heartRate: 72,
            peristalsis: 'normal',
            leftLungMurmurs: false,
            rightLungMurmurs: false,
            rhythmType: 'normal',
          }
        }
      ], 
      accessCode: 'BLS2023' 
    }
  ]);

  // State for new session dialog
  const [sessionDialogVisible, setSessionDialogVisible] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  
  // State for adding students
  const [studentDialogVisible, setStudentDialogVisible] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState('');

  // State for student vitals configuration
  const [vitalsModalVisible, setVitalsModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editedVitals, setEditedVitals] = useState<Vitals>({
    temperature: 36.6,
    heartRate: 72,
    peristalsis: 'normal',
    leftLungMurmurs: false,
    rightLungMurmurs: false,
    rhythmType: 'normal',
  });

  // State for expanded session
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const handleLogout = () => {
    // In a real app, implement proper logout logic
    router.replace('/');
  };

  const generateAccessCode = (sessionCode: string): string => {
    // Generate a random 3-digit number and append to session code
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${sessionCode}-${randomNum}`;
  };

  const createNewSession = () => {
    if (!newSessionName.trim()) return;

    // Generate an access code based on session name
    const accessCode = newSessionName.substring(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
    
    const newSession: TrainingSession = {
      id: Date.now().toString(),
      name: newSessionName.trim(),
      date: new Date().toISOString().split('T')[0],
      students: [],
      accessCode,
    };
    
    setSessions([...sessions, newSession]);
    setNewSessionName('');
    setSessionDialogVisible(false);
  };

  const addStudentToSession = () => {
    if (!newStudentName.trim() || !selectedSessionId) return;
    
    const updatedSessions = sessions.map(session => {
      if (session.id === selectedSessionId) {
        const accessCode = generateAccessCode(session.accessCode);
        const newStudent: Student = {
          id: Date.now().toString(),
          name: newStudentName.trim(),
          accessCode,
          vitals: {
            temperature: 36.6, // Normal body temperature
            heartRate: 72, // Normal heart rate
            peristalsis: 'normal',
            leftLungMurmurs: false,
            rightLungMurmurs: false,
            rhythmType: 'normal'
          }
        };
        return {
          ...session,
          students: [...session.students, newStudent],
        };
      }
      return session;
    });
    
    setSessions(updatedSessions);
    setNewStudentName('');
    setStudentDialogVisible(false);
  };

  const openVitalsModal = (student: Student) => {
    setSelectedStudent(student);
    setEditedVitals({ ...student.vitals, rhythmType: 'normal' });
    setVitalsModalVisible(true);
  };

  const saveVitals = () => {
    if (!selectedStudent) return;
    
    const updatedSessions = sessions.map(session => {
      return {
        ...session,
        students: session.students.map(student => {
          if (student.id === selectedStudent.id) {
            return { ...student, vitals: editedVitals };
          }
          return student;
        })
      };
    });
    
    setSessions(updatedSessions);
    setVitalsModalVisible(false);
    setSelectedStudent(null);
  };

  const totalStudents = sessions.reduce((acc, session) => acc + session.students.length, 0);
  const activeSessions = sessions.filter(session => session.students.length > 0).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.Content title="Panel Egzaminatora" />
        <Appbar.Action icon="logout" onPress={handleLogout} />
      </Appbar.Header>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <Card.Content>
              <Text variant="titleMedium">Aktywne Sesje</Text>
              <Text variant="displaySmall">{activeSessions}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statsCard}>
            <Card.Content>
              <Text variant="titleMedium">Liczba Studentów</Text>
              <Text variant="displaySmall">{totalStudents}</Text>
            </Card.Content>
          </Card>
          
        </View>

        <Text variant="titleLarge" style={styles.sectionTitle}>Sesje Treningowe</Text>

        {sessions.map((session) => (
          <Card key={session.id} style={styles.sessionCard}>
            <Card.Content>
              <View style={styles.sessionHeader}>
                <View>
                  <Text variant="titleMedium">{session.name}</Text>
                  <Text variant="bodyMedium">Data: {session.date}</Text>
                  <Text variant="bodyMedium">Studenci: {session.students.length}</Text>
                  <Text variant="bodyMedium">Kod sesji: {session.accessCode}</Text>
                </View>
                <IconButton
                  icon={expandedSessionId === session.id ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  onPress={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                />
              </View>
              
              {expandedSessionId === session.id && (
                <>
                  <Divider style={styles.divider} />
                  <Text variant="titleSmall" style={styles.studentsTitle}>Studenci:</Text>
                  
                  {session.students.length === 0 ? (
                    <Text variant="bodyMedium" style={styles.emptyText}>Brak dodanych studentów</Text>
                  ) : (
                    session.students.map((student, index) => (
                      <Card key={student.id} style={styles.studentCard} onPress={() => openVitalsModal(student)}>
                        <Card.Content>
                          <Text variant="titleSmall">{student.name}</Text>
                          <Text variant="bodyMedium" style={styles.codeText}>
                            Kod dostępu: <Text style={styles.accessCode}>{student.accessCode}</Text>
                          </Text>
                          <View style={styles.vitalsChips}>
                            <Text style={styles.vitalChip}>🌡️ {student.vitals.temperature}°C</Text>
                            <Text style={styles.vitalChip}>❤️ {student.vitals.heartRate} BPM</Text>
                          </View>
                        </Card.Content>
                      </Card>
                    ))
                  )}
                  
                  <Button 
                    mode="contained" 
                    icon="account-plus" 
                    style={styles.addStudentButton}
                    onPress={() => {
                      setSelectedSessionId(session.id);
                      setStudentDialogVisible(true);
                    }}
                  >
                    Dodaj Studenta
                  </Button>
                </>
              )}
            </Card.Content>
            
            {expandedSessionId !== session.id && (
              <Card.Actions>
                <Button 
                  onPress={() => {
                    setExpandedSessionId(session.id);
                  }}
                >
                  Zarządzaj Studentami
                </Button>
              </Card.Actions>
            )}
          </Card>
        ))}
      {Platform.OS === 'android' && <BluetoothComponent />} {/* Bluetooth tylko dla androida */}

        {/* FAB to create new session */}
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => setSessionDialogVisible(true)}
        />
      </ScrollView>

      {/* Dialog for adding new session */}
      <Portal>
        <Dialog visible={sessionDialogVisible} onDismiss={() => setSessionDialogVisible(false)}>
          <Dialog.Title>Utwórz Nową Sesję Treningową</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nazwa Sesji"
              value={newSessionName}
              onChangeText={setNewSessionName}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSessionDialogVisible(false)}>Anuluj</Button>
            <Button onPress={createNewSession}>Utwórz</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialog for adding student */}
      <Portal>
        <Dialog visible={studentDialogVisible} onDismiss={() => setStudentDialogVisible(false)}>
          <Dialog.Title>Dodaj Nowego Studenta</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Imię i Nazwisko Studenta"
              value={newStudentName}
              onChangeText={setNewStudentName}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setStudentDialogVisible(false)}>Anuluj</Button>
            <Button onPress={addStudentToSession}>Dodaj</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Modal for configuring vitals */}
      <Portal>
        <Modal 
          visible={vitalsModalVisible} 
          onDismiss={() => setVitalsModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text variant="headlineSmall" style={styles.modalTitle}>
              Konfiguracja parametrów dla {selectedStudent?.name}
            </Text>
            
            <List.Section>
              <List.Item
                title="Temperatura"
                description={`${editedVitals.temperature}°C`}
                left={props => <List.Icon {...props} icon="thermometer" />}
                right={() => (
                  <View style={styles.sliderContainer}>
                    <IconButton icon="minus" size={20} onPress={() => {
                      const newTemp = Math.max(35, editedVitals.temperature - 0.1);
                      setEditedVitals({...editedVitals, temperature: parseFloat(newTemp.toFixed(1))});
                    }} />
                    <Text>{editedVitals.temperature.toFixed(1)}°C</Text>
                    <IconButton icon="plus" size={20} onPress={() => {
                      const newTemp = Math.min(42, editedVitals.temperature + 0.1);
                      setEditedVitals({...editedVitals, temperature: parseFloat(newTemp.toFixed(1))});
                    }} />
                  </View>
                )}
              />
              
              <List.Item
                title="Tętno"
                description={`${editedVitals.heartRate} BPM`}
                right={() => (
                  <View style={styles.sliderContainer}>
                    <IconButton icon="minus" size={20} onPress={() => {
                      setEditedVitals({...editedVitals, heartRate: Math.max(0, editedVitals.heartRate - 1)});
                    }} />
                    <Text>{editedVitals.heartRate} BPM</Text>
                    <IconButton icon="plus" size={20} onPress={() => {
                      setEditedVitals({...editedVitals, heartRate: Math.min(200, editedVitals.heartRate + 1)});
                    }} />
                  </View>
                )}
              />
              
              <List.Item
                title="Typ Rytmu EKG"
                description={getRhythmName(editedVitals.rhythmType)}
                left={props => <List.Icon {...props} icon="heart-pulse" />}
              />
              
              <View style={styles.rhythmSelectionContainer}>
                {(['normal', 'atrial-fibrillation', 'atrial-flutter', 'nodal', 'front-chamber'] as RhythmType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.rhythmOption,
                      editedVitals.rhythmType === type ? styles.selectedRhythm : null
                    ]}
                    onPress={() => setEditedVitals({...editedVitals, rhythmType: type})}
                  >
                    <RhythmSvg type={type} />
                    <Text style={styles.rhythmText}>{getRhythmName(type)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <List.Item
                title="Dźwięki perystaltyki"
                description={editedVitals.peristalsis}
                left={props => <List.Icon {...props} icon="stomach" />}
                onPress={() => {
                  const options: ('normal' | 'hyperactive' | 'hypoactive' | 'absent')[] = 
                    ['normal', 'hyperactive', 'hypoactive', 'absent'];
                  const currentIndex = options.indexOf(editedVitals.peristalsis);
                  const nextIndex = (currentIndex + 1) % options.length;
                  setEditedVitals({...editedVitals, peristalsis: options[nextIndex]});
                }}
              />
              
              <List.Item
                title="Szmery w lewym płucu"
                left={props => <List.Icon {...props} icon="lungs" />}
                right={() => (
                  <Switch
                    value={editedVitals.leftLungMurmurs}
                    onValueChange={(value) => setEditedVitals({...editedVitals, leftLungMurmurs: value})}
                  />
                )}
              />
              
              <List.Item
                title="Szmery w prawym płucu"
                left={props => <List.Icon {...props} icon="lungs" />}
                right={() => (
                  <Switch
                    value={editedVitals.rightLungMurmurs}
                    onValueChange={(value) => setEditedVitals({...editedVitals, rightLungMurmurs: value})}
                  />
                )}
              />
            </List.Section>
            
            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={() => setVitalsModalVisible(false)} style={styles.modalButton}>
                Anuluj
              </Button>
              <Button mode="contained" onPress={saveVitals} style={styles.modalButton}>
                Zapisz zmiany
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80, // Extra space for FAB
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statsCard: {
    width: '48%',
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  sessionCard: {
    marginBottom: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    marginVertical: 12,
  },
  studentsTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptyText: {
    fontStyle: 'italic',
    marginBottom: 12,
  },
  studentCard: {
    marginVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  codeText: {
    marginTop: 4,
  },
  accessCode: {
    fontWeight: 'bold',
  },
  vitalsChips: {
    flexDirection: 'row',
    marginTop: 8,
  },
  vitalChip: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginRight: 8,
    fontSize: 12,
  },
  addStudentButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalContent: {
    width: '100%',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    marginLeft: 8,
  },
  rhythmSelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  rhythmOption: {
    width: '48%',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedRhythm: {
    borderColor: '#6200ee',
    backgroundColor: 'rgba(98, 0, 238, 0.05)',
  },
  rhythmText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default ExaminerDashboardScreen;