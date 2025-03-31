import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, Image, Animated, Easing, FlatList } from 'react-native';
import { Text, Appbar, Card, Button, List, Divider, useTheme, Portal, Dialog, TextInput, Chip, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
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
  { id: 'normal', name: 'Normal Sinus Rhythm', rate: 72, description: 'Regular rhythm, rate 60-100 BPM', color: '#4CAF50' },
  { id: 'tachycardia', name: 'Sinus Tachycardia', rate: 120, description: 'Regular rhythm, rate >100 BPM', color: '#FF9800' },
  { id: 'bradycardia', name: 'Sinus Bradycardia', rate: 45, description: 'Regular rhythm, rate <60 BPM', color: '#2196F3' },
  { id: 'afib', name: 'Atrial Fibrillation', rate: 110, description: 'Irregular rhythm, variable rate', color: '#F44336' },
  { id: 'vtach', name: 'Ventricular Tachycardia', rate: 180, description: 'Regular wide complex tachycardia', color: '#D32F2F' },
];

// Define pre-created peristalsis options
const PERISTALSIS_TYPES = [
  { id: 'normal', name: 'Normal', description: 'Normal bowel sounds (5-30 sounds/min)' },
  { id: 'hyperactive', name: 'Hyperactive', description: 'Increased frequency and intensity (>30 sounds/min)' },
  { id: 'hypoactive', name: 'Hypoactive', description: 'Decreased frequency and intensity (<5 sounds/min)' },
  { id: 'absent', name: 'Absent', description: 'No bowel sounds for >3 minutes' },
];

// Define pre-created lung sound options
const LUNG_SOUND_TYPES = [
  { id: 'normal', name: 'Normal', description: 'Clear bilateral breath sounds', leftMurmurs: false, rightMurmurs: false },
  { id: 'left', name: 'Left Murmur', description: 'Murmur detected in left lung', leftMurmurs: true, rightMurmurs: false },
  { id: 'right', name: 'Right Murmur', description: 'Murmur detected in right lung', leftMurmurs: false, rightMurmurs: true },
  { id: 'bilateral', name: 'Bilateral Murmurs', description: 'Murmurs detected in both lungs', leftMurmurs: true, rightMurmurs: true },
];

const HeartRateMonitor = ({ heartRate }: { heartRate: number }) => {
  const animation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const animateHeartbeat = () => {
    // Reset the animation value
    animation.setValue(0);
    
    // Calculate animation duration based on heart rate
    // 60 BPM = 1000ms per beat, so we calculate accordingly
    const beatDuration = 60000 / heartRate;
    
    Animated.sequence([
      // First pulse
      Animated.parallel([

        Animated.timing(animation, {
          toValue: 1,
          duration: beatDuration * 0.2,
          useNativeDriver: true,
          easing: Easing.bezier(0.1, 0.4, 0.4, 1),
        }),
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: beatDuration * 0.15,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: beatDuration * 0.15,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Rest period
      Animated.timing(animation, {
        toValue: 0.1,
        duration: beatDuration * 0.6,
        useNativeDriver: true,
      }),
    ]).start(() => animateHeartbeat());
  };

  useEffect(() => {
    animateHeartbeat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heartRate]);

  // Interpolate the animation value to create the line
  const translateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 150],
  });

  return (
    <View style={styles.heartRateContainer}>
      <Animated.View style={[styles.heartIcon, {transform: [{scale: scale}]}]}>
        <Text style={styles.heartIconText}>❤️</Text>
      </Animated.View>
      <View style={styles.monitorContainer}>
        <Animated.View
          style={[

            styles.heartLine,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </View>
  );
};

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
    return found ? found.description : 'Unknown';
  };

  const getLungDescription = (leftMurmurs: boolean, rightMurmurs: boolean) => {
    if (leftMurmurs && rightMurmurs) return 'Bilateral lung murmurs detected';
    if (leftMurmurs) return 'Left lung murmurs detected';
    if (rightMurmurs) return 'Right lung murmurs detected';
    return 'Normal lung sounds bilaterally';
  };

  const handleAddNotes = () => {
    // This would save notes to the server in a real app
    setNoteDialogVisible(false);
    alert('Notes saved successfully');
  };

  // Get the current peristalsis type name
  const getPeristalsisName = (id: string) => {
    const found = PERISTALSIS_TYPES.find(p => p.id === id);
    return found ? found.name : 'Unknown';
  };

  // Get the current lung sound type name
  const getLungSoundName = (leftMurmurs: boolean, rightMurmurs: boolean) => {
    if (leftMurmurs && rightMurmurs) return 'Bilateral Murmurs';
    if (leftMurmurs) return 'Left Lung Murmur';
    if (rightMurmurs) return 'Right Lung Murmur';
    return 'Normal';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header>
        <Appbar.Content title="Patient Monitoring" subtitle={`Session: ${session.name}`} />
        <Appbar.Action icon="note-text" onPress={() => setNoteDialogVisible(true)} />
        <Appbar.Action icon="exit-to-app" onPress={() => router.replace('/')} />
      </Appbar.Header>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.infoCard} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium">Session Information</Text>
            <Divider style={styles.divider} />
            <View style={styles.infoRow}>
              <Text variant="bodyMedium">Examiner:</Text>
              <Text variant="bodyMedium">{session.examiner}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodyMedium">Access Code:</Text>
              <Text variant="bodyMedium">{session.accessCode}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.vitalsCard} mode="elevated">
          <Card.Content>
            <Text variant="titleLarge" style={styles.vitalsTitle}>Patient Vital Signs</Text>
            
            <View style={styles.vitalSection}>
              <View style={styles.vitalIconContainer}>
                <Text style={styles.vitalIcon}>🌡️</Text>
              </View>
              <View style={styles.vitalInfoContainer}>
                <Text variant="titleSmall">Body Temperature</Text>
                <Text variant="displaySmall" style={{ color: getTemperatureColor(session.vitals.temperature) }}>
                  {session.vitals.temperature}°C
                </Text>
                <Text variant="bodySmall">
                  {session.vitals.temperature > 38.0 ? 'ELEVATED' : 
                   session.vitals.temperature < 36.0 ? 'LOW' : 'NORMAL'}
                </Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Heart Rate Section - Student can only view */}
            <View style={styles.vitalSection}>
                <EkgProjection 
                    initialType={session.vitals.rhythmType as any} 
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
                <Text variant="titleSmall">Peristalsis</Text>
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
                <Text variant="titleSmall">Lung Sounds</Text>
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
                    Left: {session.vitals.leftLungMurmurs ? "Murmurs" : "Clear"}
                  </Chip>
                  <Chip 
                    style={styles.lungChip}
                    icon={session.vitals.rightLungMurmurs ? "alert-circle" : "check-circle"}
                  >
                    Right: {session.vitals.rightLungMurmurs ? "Murmurs" : "Clear"}
                  </Chip>
                </View>
              </View>
            </View>

          </Card.Content>
        </Card>

        <Card style={styles.assessmentCard} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium">Assessment Notes</Text>
            <Divider style={styles.divider} />
            {notes ? (
              <Text variant="bodyMedium">{notes}</Text>
            ) : (
              <Text variant="bodyMedium" style={styles.emptyNotes}>
                Tap the note icon in the app bar to add assessment notes
              </Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Notes dialog */}
      <Portal>
        <Dialog visible={noteDialogVisible} onDismiss={() => setNoteDialogVisible(false)}>
          <Dialog.Title>Assessment Notes</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Your notes"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={5}
              style={styles.notesInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNoteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddNotes}>Save</Button>
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