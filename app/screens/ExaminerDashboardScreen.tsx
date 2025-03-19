import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Appbar, Card, Button, FAB, useTheme, Portal, Dialog, TextInput, IconButton, Modal, Switch, List, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

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
  };
}

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
    setEditedVitals({ ...student.vitals });
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
        <Appbar.Content title="Examiner Dashboard" />
        <Appbar.Action icon="logout" onPress={handleLogout} />
      </Appbar.Header>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.statsContainer}>
          <Card style={styles.statsCard}>
            <Card.Content>
              <Text variant="titleMedium">Active Sessions</Text>
              <Text variant="displaySmall">{activeSessions}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statsCard}>
            <Card.Content>
              <Text variant="titleMedium">Total Students</Text>
              <Text variant="displaySmall">{totalStudents}</Text>
            </Card.Content>
          </Card>
        </View>

        <Text variant="titleLarge" style={styles.sectionTitle}>Training Sessions</Text>

        {sessions.map((session) => (
          <Card key={session.id} style={styles.sessionCard}>
            <Card.Content>
              <View style={styles.sessionHeader}>
                <View>
                  <Text variant="titleMedium">{session.name}</Text>
                  <Text variant="bodyMedium">Date: {session.date}</Text>
                  <Text variant="bodyMedium">Students: {session.students.length}</Text>
                  <Text variant="bodyMedium">Session Code: {session.accessCode}</Text>
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
                  <Text variant="titleSmall" style={styles.studentsTitle}>Students:</Text>
                  
                  {session.students.length === 0 ? (
                    <Text variant="bodyMedium" style={styles.emptyText}>No students added yet</Text>
                  ) : (
                    session.students.map((student, index) => (
                      <Card key={student.id} style={styles.studentCard} onPress={() => openVitalsModal(student)}>
                        <Card.Content>
                          <Text variant="titleSmall">{student.name}</Text>
                          <Text variant="bodyMedium" style={styles.codeText}>
                            Access Code: <Text style={styles.accessCode}>{student.accessCode}</Text>
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
                    Add Student
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
                  Manage Students
                </Button>
              </Card.Actions>
            )}
          </Card>
        ))}
      </ScrollView>

      {/* FAB to create new session */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setSessionDialogVisible(true)}
      />

      {/* Dialog for adding new session */}
      <Portal>
        <Dialog visible={sessionDialogVisible} onDismiss={() => setSessionDialogVisible(false)}>
          <Dialog.Title>Create New Training Session</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Session Name"
              value={newSessionName}
              onChangeText={setNewSessionName}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSessionDialogVisible(false)}>Cancel</Button>
            <Button onPress={createNewSession}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialog for adding student */}
      <Portal>
        <Dialog visible={studentDialogVisible} onDismiss={() => setStudentDialogVisible(false)}>
          <Dialog.Title>Add New Student</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Student Name"
              value={newStudentName}
              onChangeText={setNewStudentName}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setStudentDialogVisible(false)}>Cancel</Button>
            <Button onPress={addStudentToSession}>Add</Button>
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
              Configure Vitals for {selectedStudent?.name}
            </Text>
            
            <List.Section>
              <List.Item
                title="Temperature"
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
                title="Heart Rate"
                description={`${editedVitals.heartRate} BPM`}
                left={props => <List.Icon {...props} icon="heart-pulse" />}
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
                title="Peristalsis Sounds"
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
                title="Left Lung Murmurs"
                left={props => <List.Icon {...props} icon="lungs" />}
                right={() => (
                  <Switch
                    value={editedVitals.leftLungMurmurs}
                    onValueChange={(value) => setEditedVitals({...editedVitals, leftLungMurmurs: value})}
                  />
                )}
              />
              
              <List.Item
                title="Right Lung Murmurs"
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
                Cancel
              </Button>
              <Button mode="contained" onPress={saveVitals} style={styles.modalButton}>
                Save Changes
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
});

export default ExaminerDashboardScreen;