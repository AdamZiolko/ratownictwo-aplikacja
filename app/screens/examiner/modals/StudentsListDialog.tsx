import React, { useState } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Dialog, Button, Text, List, Avatar, Chip, Divider, IconButton, Menu } from "react-native-paper";
import { Session, StudentInSession } from "../types/types";
import { socketService } from "@/services/SocketService";

type SoundCategory = 'Adult' | 'Child' | 'Geriatric' | 'Infant' | 'Speech';

const soundStructure: Record<SoundCategory, any> = {
  'Adult': {
    'Female': ['Breathing through contractions', 'Coughing', 'Distressed', 'Hawk', 'Moaning', 'No', 'Ok', 'Pain', 'Pushing - long double', 'Pushing - long', 'Pushing - single', 'Screaming', 'Sob breathing (type 2)', 'Sob breathing', 'Vomiting', 'Yes'],
    'Male': ['Coughing (long)', 'Coughing', 'Difficult breathing', 'Hawk', 'Moaning (long)', 'Moaning', 'No', 'Ok', 'Screaming (type 2)', 'Screaming', 'Sob breathing', 'Vomiting (type 2)', 'Vomiting (type 3)', 'Vomiting', 'Yes']
  },
  'Child': ['Coughing', 'Hawk', 'Moaning', 'No', 'Ok', 'Screaming', 'Sob breathing', 'Vomiting (type 2)', 'Vomiting', 'Yes'],
  'Geriatric': {
    'Female': ['Coughing', 'Moaning', 'No', 'Screaming', 'Vomiting', 'Yes'],
    'Male': ['Coughing', 'Moaning', 'No', 'Screaming', 'Vomiting', 'Yes']
  },
  'Infant': ['Content', 'Cough', 'Grunt', 'Hawk', 'Hiccup', 'Screaming', 'Strongcry (type 2)', 'Strongcry', 'Weakcry'],
  'Speech': ['Chest hurts', 'Doc I feel I could die', 'Go away', 'I don\'t feel dizzy', 'I don\'t feel well', 'I feel better now', 'I feel really bad', 'I\'m feeling very dizzy', 'I\'m fine', 'I\'m quite nauseous', 'I\'m really hungry', 'I\'m really thirsty', 'I\'m so sick', 'Never had pain like this before', 'No allergies', 'No diabetes', 'No lung or cardiac problems', 'No', 'Pain for 2 hours', 'Something for this pain', 'Thank you', 'That helped', 'Yes']
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
  students = []
}) => {
  const [selectedSounds, setSelectedSounds] = useState<{[key: number]: string}>({});
  const [menuVisible, setMenuVisible] = useState<{[key: number]: {category: boolean, subcategory: boolean, sound: boolean}}>({});
  const [selectedCategories, setSelectedCategories] = useState<{[key: number]: string}>({});
  const [selectedSubcategories, setSelectedSubcategories] = useState<{[key: number]: string}>({});

  if (!session) return null;

  const studentsList = students.length > 0 ? students : (session.students || []);
  const hasStudents = studentsList && studentsList.length > 0;

  const handleSendToStudent = (studentId: number, command: 'PLAY' | 'STOP') => {
    const sound = selectedSounds[studentId];
    if (command === 'PLAY' && sound) {
      socketService.emitStudentAudioCommand(studentId, 'PLAY', sound);
    } else {
      socketService.emitStudentAudioCommand(studentId, 'STOP', '');
    }
  };

const getAvailableSubcategories = (studentId: number) => {
  const category = selectedCategories[studentId] as SoundCategory;
  if (!category) return [];
  const categoryData = soundStructure[category];
  return (typeof categoryData === 'object' && !Array.isArray(categoryData)) 
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

  const handleCategorySelect = (studentId: number, category: string) => {
    setSelectedCategories(prev => ({...prev, [studentId]: category}));
    setSelectedSubcategories(prev => ({...prev, [studentId]: ''}));
    setSelectedSounds(prev => ({...prev, [studentId]: ''}));
    setMenuVisible(prev => ({
      ...prev,
      [studentId]: {
        category: false,
        subcategory: true,
        sound: false
      }
    }));
  };

  const handleSubcategorySelect = (studentId: number, subcategory: string) => {
    setSelectedSubcategories(prev => ({...prev, [studentId]: subcategory}));
    setSelectedSounds(prev => ({...prev, [studentId]: ''}));
    setMenuVisible(prev => ({
      ...prev,
      [studentId]: {
        category: false,
        subcategory: false,
        sound: true
      }
    }));
  };

  const handleSoundSelect = (studentId: number, sound: string) => {
    const category = selectedCategories[studentId];
    const subcategory = selectedSubcategories[studentId];
    const soundPath = subcategory 
      ? `${category}/${subcategory}/${sound}.wav`
      : `${category}/${sound}.wav`;
      
    setSelectedSounds(prev => ({...prev, [studentId]: soundPath}));
    setMenuVisible(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        sound: false
      }
    }));
  };

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
      <Dialog.Title>Studenci w sesji</Dialog.Title>
      <Dialog.Content>
        <View style={styles.sessionHeader}>
          <Text variant="titleMedium" style={styles.sessionHeaderText}>
            {session.name || `Sesja ${session.sessionCode}`}
          </Text>
          <Chip 
            icon={session.isActive ? "check-circle" : "cancel"}
            style={styles.sessionStatus}
          >
            {session.isActive ? "Aktywna" : "Nieaktywna"}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        {!hasStudents ? (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge">Brak studentów</Text>
            <Text variant="bodyMedium" style={styles.emptyStateText}>
              Żaden student nie dołączył jeszcze do tej sesji
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.studentsList}>
            {studentsList.map((student, index) => (
              <View key={student.id || index}>
                <List.Item
                  title={`${student.name || ""} ${student.surname || ""}`}
                  description={`Album: ${student.albumNumber || "brak numeru"}`}
                  left={() => (
                    <Avatar.Icon 
                      size={40} 
                      icon="account" 
                      style={styles.avatar} 
                    />
                  )}
                  right={() => (
                    <View style={styles.controlsContainer}>
                      <View style={styles.statusContainer}>
                        <Chip 
                          icon={student.student_sessions?.active ? "checkbox-marked-circle" : "close-circle"}
                          style={styles.statusChip}
                        >
                          {student.student_sessions?.active ? "Aktywny" : "Nieaktywny"}
                        </Chip>
                        <Text style={styles.joinTime}>
                          Dołączył: {new Date(student.student_sessions?.joinedAt).toLocaleString('pl-PL')}
                        </Text>
                      </View>
                      
                      <View style={styles.soundControls}>
                        <View style={styles.selectionRow}>
                          <Menu
                            visible={menuVisible[student.id]?.category || false}
                            onDismiss={() => setMenuVisible(prev => ({
                              ...prev,
                              [student.id]: {...prev[student.id], category: false}
                            }))}
                            anchor={
                              <Button 
                                mode="outlined" 
                                onPress={() => setMenuVisible(prev => ({
                                  ...prev,
                                  [student.id]: {...prev[student.id], category: true}
                                }))}
                                style={styles.categoryButton}
                              >
                                {selectedCategories[student.id] || 'Kategoria'}
                              </Button>
                            }
                            style={styles.menuWrapper}
                          >
                            {Object.keys(soundStructure).map(category => (
                              <Menu.Item
                                key={category}
                                title={category}
                                onPress={() => handleCategorySelect(student.id, category)}
                              />
                            ))}
                          </Menu>

                            {getAvailableSubcategories(student.id).length > 0 && (
                            <Menu
                              visible={menuVisible[student.id]?.subcategory || false}
                              onDismiss={() => setMenuVisible(prev => ({
                                ...prev,
                                [student.id]: {...prev[student.id], subcategory: false}
                              }))}
                              anchor={
                                <Button 
                                  mode="outlined" 
                                  onPress={() => setMenuVisible(prev => ({
                                    ...prev,
                                    [student.id]: {...prev[student.id], subcategory: true}
                                  }))}
                                  style={styles.subcategoryButton}
                                  disabled={!selectedCategories[student.id]}
                                >
                                  {selectedSubcategories[student.id] || 'Podkategoria'}
                                </Button>
                              }
                              style={styles.menuWrapper}
                            >
                              {getAvailableSubcategories(student.id).map(subcategory => (
                                <Menu.Item
                                  key={subcategory}
                                  title={subcategory}
                                  onPress={() => handleSubcategorySelect(student.id, subcategory)}
                                />
                              ))}
                            </Menu>
                          )}

                          <Menu
                            visible={menuVisible[student.id]?.sound || false}
                            onDismiss={() => setMenuVisible(prev => ({
                              ...prev,
                              [student.id]: {...prev[student.id], sound: false}
                            }))}
                            anchor={
                              <Button 
                                mode="outlined" 
                                onPress={() => setMenuVisible(prev => ({
                                  ...prev,
                                  [student.id]: {...prev[student.id], sound: true}
                                }))}
                                style={styles.soundButton}
                                disabled={!selectedCategories[student.id] || (getAvailableSubcategories(student.id).length > 0 && !selectedSubcategories[student.id])}
                              >
                                {selectedSounds[student.id]?.split('/').pop()?.replace('.wav', '') || 'Dźwięk'}
                              </Button>
                            }
                            style={styles.menuWrapper}
                          >
                            {getAvailableSounds(student.id).map((sound: string) => (
                              <Menu.Item
                                key={`${selectedCategories[student.id]}-${selectedSubcategories[student.id]}-${sound}`}
                                title={sound}
                                onPress={() => handleSoundSelect(student.id, sound)}
                              />
                            ))}
                          </Menu>
                        </View>

                        {/* Przyciski kontrolne */}
                        <View style={styles.controlButtons}>
                          <IconButton
                            icon="play"
                            size={24}
                            mode="contained"
                            disabled={!selectedSounds[student.id]}
                            onPress={() => handleSendToStudent(student.id, 'PLAY')}
                          />
                          <IconButton
                            icon="stop"
                            size={24}
                            mode="contained"
                            onPress={() => handleSendToStudent(student.id, 'STOP')}
                          />
                        </View>
                      </View>
                    </View>
                  )}
                />
                {index < studentsList.length - 1 && <Divider style={styles.itemDivider} />}
              </View>
            ))}
          </ScrollView>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Zamknij</Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 800,
    width: "100%",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    gap: 16,
  },
  sessionStatus: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  sessionHeaderText: {
    flexShrink: 1,
  },
  divider: {
    marginVertical: 12,
  },
  studentsList: {
    maxHeight: 500,
  },
  avatar: {
    backgroundColor: "#3498db",
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minWidth: 280,
  },
  statusContainer: {
    alignItems: 'flex-end',
    marginRight: 16,
  },
  statusChip: {
    backgroundColor: "transparent",
  },
  joinTime: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  itemDivider: {
    marginVertical: 8,
    backgroundColor: '#eee',
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    textAlign: "center",
    marginTop: 8,
    opacity: 0.7,
    color: '#666',
  },
  soundControls: {
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  selectionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryButton: {
    minWidth: 120,
    zIndex: 2,
  },
  subcategoryButton: {
    minWidth: 140,
    zIndex: 2,
  },
  soundButton: {
    minWidth: 160,
    zIndex: 2,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  menuWrapper: {
    elevation: 3,
    zIndex: 3,
  },
});

export default StudentsListDialog;