import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Button, Divider, useTheme, Portal, Dialog, TextInput, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import EkgProjection from './ekg-projection/EkgProjection';

// Define vital sign types matching the examiner dashboard
interface Vitals {
  temperature: number;
  heartRate: number;
  peristalsis: 'normal' | 'hyperactive' | 'hypoactive' | 'absent';
  leftLungMurmurs: boolean;
  rightLungMurmurs: boolean;
  rhythmType?: string; // Add rhythmType property
}

interface StudentSession {
  id: string;
  name: string;
  accessCode: string;
  examiner: string;
  vitals: Vitals;
}

// Heart rhythm types
interface HeartRhythm {
  id: string;
  name: string;
  rate: number;
  description: string;
  color: string;
}

// Define pre-created heart rhythm options
const HEART_RHYTHMS: HeartRhythm[] = [
  { id: 'normal', name: 'Rytm zatokowy prawidłowy', rate: 72, description: 'Regularny rytm, częstość 60-100 uderzeń/min', color: '#4CAF50' },
  { id: 'tachycardia', name: 'Tachykardia zatokowa', rate: 120, description: 'Regularny rytm, częstość >100 uderzeń/min', color: '#FF9800' },
  { id: 'bradycardia', name: 'Bradykardia zatokowa', rate: 45, description: 'Regularny rytm, częstość <60 uderzeń/min', color: '#2196F3' },
  { id: 'afib', name: 'Migotanie przedsionków', rate: 110, description: 'Nieregularny rytm, zmienna częstość', color: '#F44336' },
  { id: 'vtach', name: 'Częstoskurcz komorowy', rate: 180, description: 'Regularny szeroki zespół QRS', color: '#D32F2F' },
];

// Define pre-created peristalsis options
const PERISTALSIS_TYPES = [
  { id: 'normal', name: 'Prawidłowa', description: 'Normalne dźwięki perystaltyki (5-30 dźwięków/min)' },
  { id: 'hyperactive', name: 'Wzmożona', description: 'Zwiększona częstość i intensywność (>30 dźwięków/min)' },
  { id: 'hypoactive', name: 'Osłabiona', description: 'Zmniejszona częstość i intensywność (<5 dźwięków/min)' },
  { id: 'absent', name: 'Brak', description: 'Brak dźwięków perystaltyki przez >3 minuty' },
];


const StudentSessionScreen = () => {
  const theme = useTheme();
  const params = useLocalSearchParams();
  const [notes, setNotes] = useState('');
  const [noteDialogVisible, setNoteDialogVisible] = useState(false);
  
  // Selected vitals data references (for display purposes only - students cannot modify)
  const [selectedHeartRhythm, setSelectedHeartRhythm] = useState<HeartRhythm | null>(null);
  const [selectedPeristalsis, setSelectedPeristalsis] = useState<string | null>(null);
  const [selectedLungSound, setSelectedLungSound] = useState<string | null>(null);

  // In a real app, this would be fetched from the server based on the access code
  // For now, we're simulating this with mock data that matches what an examiner would set
  const [session, setSession] = useState<StudentSession>({
    id: '1',
    name: 'Basic Life Support Training',
    accessCode: 'BLS2023-101',
    examiner: 'Dr. Smith',
    vitals: {
      temperature: 36.6,
      heartRate: 72,
      peristalsis: 'normal',
      leftLungMurmurs: false,
      rightLungMurmurs: false,
      rhythmType: 'normal', // Normal sinus rhythm
    },
  });

  // Check for access code in URL params and set the appropriate session
  useEffect(() => {
    const code = params.accessCode as string;
    if (code === 'BLS2023-102') {
      setSession({
        ...session,
        accessCode: code,
        vitals: {
          temperature: 38.9,
          heartRate: 110,
          peristalsis: 'hyperactive',
          leftLungMurmurs: true,
          rightLungMurmurs: false,
          rhythmType: 'atrial-fibrillation', // Add atrial fibrillation for this scenario
        }
      });
    } else if (code === 'BLS2023-103') {
      setSession({
        ...session,
        accessCode: code,
        vitals: {
          temperature: 35.2,
          heartRate: 45,
          peristalsis: 'hypoactive',
          leftLungMurmurs: true,
          rightLungMurmurs: true,
          rhythmType: 'torsade-de-pointes', // Add torsade de pointes for this scenario
        }
      });
    } else if (code) {
      // Set the access code if it exists in params
      setSession(prev => ({
        ...prev,
        accessCode: code
      }));
    }
  }, [params]);

  // Set initial selected values when session changes
  useEffect(() => {
    // Find the matching heart rhythm from our presets
    const matchingHeartRhythm = HEART_RHYTHMS.find(hr => hr.rate === session.vitals.heartRate) || HEART_RHYTHMS[0];
    setSelectedHeartRhythm(matchingHeartRhythm);
    
    // Set the selected peristalsis type
    setSelectedPeristalsis(session.vitals.peristalsis);
    
    // Find the matching lung sound type
    const lungSoundKey = session.vitals.leftLungMurmurs && session.vitals.rightLungMurmurs 
      ? 'bilateral' 
      : session.vitals.leftLungMurmurs 
        ? 'left' 
        : session.vitals.rightLungMurmurs 
          ? 'right' 
          : 'normal';
    setSelectedLungSound(lungSoundKey);
  }, [session]);

  const getTemperatureColor = (temp: number) => {
    if (temp > 38.0) return '#FF5252'; // Red for fever
    if (temp < 36.0) return '#2979FF'; // Blue for hypothermia
    return '#4CAF50'; // Green for normal
  };

  const getHeartRateColor = (hr: number) => {
    if (hr > 100) return '#FF5252'; // Red for tachycardia
    if (hr < 60) return '#2979FF'; // Blue for bradycardia
    return '#4CAF50'; // Green for normal
  };

  const getPeristalsisDescription = (peristalsis: string) => {
    const found = PERISTALSIS_TYPES.find(p => p.id === peristalsis);
    return found ? found.description : 'Nieznany';
  };

  const getLungDescription = (leftMurmurs: boolean, rightMurmurs: boolean) => {
    if (leftMurmurs && rightMurmurs) return 'Wykryto szmery w obu płucach';
    if (leftMurmurs) return 'Wykryto szmery w lewym płucu';
    if (rightMurmurs) return 'Wykryto szmery w prawym płucu';
    return 'Prawidłowe szmery oddechowe obustronnie';
  };

  const handleAddNotes = () => {
    // This would save notes to the server in a real app
    setNoteDialogVisible(false);
    alert('Notatki zapisane pomyślnie');
  };

  // Get the current peristalsis type name
  const getPeristalsisName = (id: string) => {
    const found = PERISTALSIS_TYPES.find(p => p.id === id);
    return found ? found.name : 'Nieznany';
  };

  // Get the current lung sound type name
  const getLungSoundName = (leftMurmurs: boolean, rightMurmurs: boolean) => {
    if (leftMurmurs && rightMurmurs) return 'Szmery obustronne';
    if (leftMurmurs) return 'Szmer w lewym płucu';
    if (rightMurmurs) return 'Szmer w prawym płucu';
    return 'Prawidłowe';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.infoCard} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium">Informacje o sesji</Text>
            <Divider style={styles.divider} />
            <View style={styles.infoRow}>
              <Text variant="bodyMedium">Egzaminator:</Text>
              <Text variant="bodyMedium">{session.examiner}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium">Kod dostępu:</Text>
              <Text variant="bodyMedium">{session.accessCode}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.vitalsCard} mode="elevated">
          <Card.Content>
            <Text variant="titleLarge" style={styles.vitalsTitle}>Parametry życiowe pacjenta</Text>
            
            <View style={styles.vitalSection}>
              <View style={styles.vitalIconContainer}>
                <Text style={styles.vitalIcon}>🌡️</Text>
              </View>
              <View style={styles.vitalInfoContainer}>
                <Text variant="titleSmall">Temperatura ciała</Text>
                <Text variant="displaySmall" style={{ color: getTemperatureColor(session.vitals.temperature) }}>
                  {session.vitals.temperature}°C
                </Text>
                <Text variant="bodySmall">
                  {session.vitals.temperature > 38.0 ? 'PODWYŻSZONA' : 
                   session.vitals.temperature < 36.0 ? 'OBNIŻONA' : 'PRAWIDŁOWA'}
                </Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Heart Rate Section - Student can only view */}
            <View style={styles.vitalSection}>
                <EkgProjection 
                    initialBpm={session.vitals.heartRate}
                    readOnly={true}
                />
            </View>
            

            <Divider style={styles.divider} />

            {/* Peristalsis Section - Student can only view */}
            <View style={styles.vitalSection}>
              <View style={styles.vitalIconContainer}>
                <Text style={styles.vitalIcon}>🔊</Text>
              </View>
              <View style={styles.vitalInfoContainer}>
                <Text variant="titleSmall">Perystaltyka</Text>
                <Text variant="headlineSmall">
                  {getPeristalsisName(session.vitals.peristalsis)}
                </Text>
                <Text variant="bodySmall">{getPeristalsisDescription(session.vitals.peristalsis)}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Lung Sounds Section - Student can only view */}
            <View style={styles.vitalSection}>
              <View style={styles.vitalIconContainer}>
                <Text style={styles.vitalIcon}>🫁</Text>
              </View>
              <View style={styles.vitalInfoContainer}>
                <Text variant="titleSmall">Szmery oddechowe</Text>
                <Text variant="headlineSmall">
                  {getLungSoundName(session.vitals.leftLungMurmurs, session.vitals.rightLungMurmurs)}
                </Text>
                <Text variant="bodySmall">{getLungDescription(session.vitals.leftLungMurmurs, session.vitals.rightLungMurmurs)}</Text>
                
                {/* Display lung status chips without interaction */}
                <View style={styles.lungStatusContainer}>
                  <Chip 
                    style={styles.lungChip} 
                    icon={session.vitals.leftLungMurmurs ? "alert-circle" : "check-circle"}
                  >
                    Lewe: {session.vitals.leftLungMurmurs ? "Szmery" : "Czyste"}
                  </Chip>
                  <Chip 
                    style={styles.lungChip}
                    icon={session.vitals.rightLungMurmurs ? "alert-circle" : "check-circle"}
                  >
                    Prawe: {session.vitals.rightLungMurmurs ? "Szmery" : "Czyste"}
                  </Chip>
                </View>
              </View>
            </View>

          </Card.Content>
        </Card>

        <Card style={styles.assessmentCard} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium">Notatki z badania</Text>
            <Divider style={styles.divider} />
            {notes ? (
              <Text variant="bodyMedium">{notes}</Text>
            ) : (
              <Text variant="bodyMedium" style={styles.emptyNotes}>
                Dotknij ikony notatki w górnym pasku, aby dodać notatki z badania
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Notes dialog */}
      <Portal>
        <Dialog visible={noteDialogVisible} onDismiss={() => setNoteDialogVisible(false)}>
          <Dialog.Title>Notatki z badania</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Twoje notatki"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={5}
              style={styles.notesInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNoteDialogVisible(false)}>Anuluj</Button>
            <Button onPress={handleAddNotes}>Zapisz</Button>
          </Dialog.Actions>
        </Dialog>
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
    paddingBottom: 24,
  },
  infoCard: {
    marginBottom: 16,
  },
  vitalsCard: {
    marginBottom: 16,
  },
  assessmentCard: {
    marginBottom: 16,
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vitalsTitle: {
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  vitalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  vitalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  vitalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vitalIcon: {
    fontSize: 28,
  },
  vitalInfoContainer: {
    flex: 1,
  },
  rhythmName: {
    fontWeight: '600',
    marginTop: 4,
  },
  emptyNotes: {
    fontStyle: 'italic',
    color: '#757575',
  },
  notesInput: {
    marginTop: 8,
    height: 120,
  },
  heartRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    height: 80,
  },
  heartIcon: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartIconText: {
    fontSize: 28,
  },
  monitorContainer: {
    flex: 1,
    height: 60,
    backgroundColor: '#000',
    borderRadius: 5,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  heartLine: {
    width: 250,
    height: 60,
    backgroundColor: 'transparent',
    borderColor: '#4CAF50',
    borderWidth: 3,
    borderTopWidth: 0,
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopRightRadius: 20,
  },
  lungStatusContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  lungChip: {
    flex: 1,
  },
});

export default StudentSessionScreen;