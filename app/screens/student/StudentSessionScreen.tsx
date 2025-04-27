
import React, { useState, useEffect, useRef } from 'react';
import {
  useTheme,
  Text,
  ActivityIndicator,
  Surface,
  Button,
  Icon,
  Divider,
  MD3Colors,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { sessionService, Session } from '@/services/SessionService';
import EkgDisplay from '@/components/ekg/EkgDisplay';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { socketService } from '@/services/SocketService';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const soundFiles: Record<string, any> = {
  kaszel: require('../../../assets/sounds/kaszel.mp3'),
};


interface VitalWithFluctuation {
  baseValue: number | null;
  currentValue: number | null;
  unit: string;
  fluctuationRange: number; 
}


interface BloodPressure {
  systolic: number | null;
  diastolic: number | null;
  currentSystolic: number | null;
  currentDiastolic: number | null;
}

const StudentSessionScreen = () => {
  const theme = useTheme();
  const { firstName, lastName, albumNumber, accessCode } = useLocalSearchParams<{ firstName: string; lastName: string; albumNumber: string; accessCode: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<Session | null>(null);

  
  const [temperature, setTemperature] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: '°C',
    fluctuationRange: 0.2, 
  });
  
  const [heartRate, setHeartRate] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: 'BPM',
    fluctuationRange: 3, 
  });
  
  const [bloodPressure, setBloodPressure] = useState<BloodPressure>({
    systolic: null,
    diastolic: null,
    currentSystolic: null,
    currentDiastolic: null,
  });
  
  const [spo2, setSpo2] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: '%',
    fluctuationRange: 1, 
  });
  
  const [etco2, setEtco2] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: 'mmHg',
    fluctuationRange: 2, 
  });
  
  const [respiratoryRate, setRespiratoryRate] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: 'breaths/min',
    fluctuationRange: 5, 
  });
  
  const soundObjects = useRef<Record<string, Audio.Sound>>({});
  
  
  const generateFluctuation = (value: number | null, fluctuationRange: number): number | null => {
    if (value === null) return null;
    
    const fluctPercent = (Math.random() - 0.5) * 2 * fluctuationRange;
    const fluctAmount = value * (fluctPercent / 100);
    return Math.round((value + fluctAmount) * 10) / 10; 
  };
  
  
  const parseBloodPressure = (bpString: string | null | undefined): { systolic: number | null; diastolic: number | null } => {
    if (!bpString) return { systolic: null, diastolic: null };
    
    const parts = bpString.split('/');
    if (parts.length !== 2) return { systolic: null, diastolic: null };
    
    const systolic = parseInt(parts[0], 10) || null;
    const diastolic = parseInt(parts[1], 10) || null;
    
    return { systolic, diastolic };
  };
  
  const handleRetry = () => {
    fetchSession();
  };

  const fetchSession = async () => {
    if (!accessCode) {
      setError('No access code provided');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const resp = await sessionService.getSessionByCode(accessCode.toString());
      if (!resp) throw new Error('No session found');
      setSessionData(resp);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  
  useEffect(() => {
    fetchSession();
  }, [accessCode]);

  
  useEffect(() => {
    let unsub: (() => void) | undefined;
    if (accessCode) {
      sessionService
        .subscribeToSessionUpdates(accessCode.toString(), updated => {
          setSessionData(updated);
        })
        .then(fn => { unsub = fn; })
        .catch(console.error);
    }
    return () => {
      unsub?.();
    };
  }, [accessCode]);

  
  useEffect(() => {
    if (Platform.OS === 'web') return;

    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    });

    let isMounted = true;
    (async () => {
      for (const [name, module] of Object.entries(soundFiles)) {
        const { sound } = await Audio.Sound.createAsync(module);
        if (!isMounted) {
          await sound.unloadAsync();
        } else {
          soundObjects.current[name] = sound;
        }
      }
      console.log('🔉 Sounds loaded');
    })();

    return () => {
      isMounted = false;
      Object.values(soundObjects.current).forEach(s => s.unloadAsync());
    };
  }, []);

  
  useEffect(() => {
    if (Platform.OS === 'web' || !accessCode) return;

    socketService.connect();
    socketService.joinSessionCode(accessCode.toString()).catch(console.error);

    const unsubscribe = socketService.on<{ command: string; soundName: string }>(
      'audio-command',
      async ({ command, soundName }) => {
        console.log('🔊 Received audio-command:', command, soundName);
        if (command === 'PLAY' && soundName) {
          const snd = soundObjects.current[soundName];
          if (snd) {
            try {
              await snd.replayAsync();
              console.log(`✅ Played: ${soundName}`);
            } catch (err) {
              console.error('❌ Play error:', err);
            }
          } else {
            console.warn(`❌ Sound not loaded: ${soundName}`);
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [accessCode]);

  
  useEffect(() => {
    if (!sessionData) return;
    
    
    const tempValue = sessionData.temperature !== undefined && sessionData.temperature !== null
      ? (typeof sessionData.temperature === 'string' 
          ? parseFloat(sessionData.temperature) 
          : sessionData.temperature)
      : null;
      
    const hrValue = sessionData.hr !== undefined && sessionData.hr !== null
      ? (typeof sessionData.hr === 'string'
          ? parseInt(sessionData.hr, 10)
          : sessionData.hr)
      : null;
      
    const { systolic, diastolic } = parseBloodPressure(sessionData.bp);
    
    const spo2Value = sessionData.spo2 !== undefined && sessionData.spo2 !== null
      ? (typeof sessionData.spo2 === 'string'
          ? parseInt(sessionData.spo2, 10)
          : sessionData.spo2)
      : null;
      
    const etco2Value = sessionData.etco2 !== undefined && sessionData.etco2 !== null
      ? (typeof sessionData.etco2 === 'string'
          ? parseInt(sessionData.etco2, 10)
          : sessionData.etco2)
      : null;
      
    const rrValue = sessionData.rr !== undefined && sessionData.rr !== null
      ? (typeof sessionData.rr === 'string'
          ? parseInt(sessionData.rr, 10)
          : sessionData.rr)
      : null;
    
    setTemperature(prev => ({ ...prev, baseValue: tempValue, currentValue: tempValue }));
    setHeartRate(prev => ({ ...prev, baseValue: hrValue, currentValue: hrValue }));
    setBloodPressure({ 
      systolic, 
      diastolic, 
      currentSystolic: systolic, 
      currentDiastolic: diastolic 
    });
    setSpo2(prev => ({ ...prev, baseValue: spo2Value, currentValue: spo2Value }));
    setEtco2(prev => ({ ...prev, baseValue: etco2Value, currentValue: etco2Value }));
    setRespiratoryRate(prev => ({ ...prev, baseValue: rrValue, currentValue: rrValue }));
    
    
    const fluctuationTimer = setInterval(() => {
      setTemperature(prev => ({
        ...prev,
        currentValue: generateFluctuation(prev.baseValue, prev.fluctuationRange),
      }));
      
      setHeartRate(prev => ({
        ...prev,
        currentValue: generateFluctuation(prev.baseValue, prev.fluctuationRange),
      }));
      
      setBloodPressure(prev => ({
        ...prev,
        currentSystolic: generateFluctuation(prev.systolic, 2), 
        currentDiastolic: generateFluctuation(prev.diastolic, 2), 
      }));
      
      setSpo2(prev => ({
        ...prev,
        currentValue: generateFluctuation(prev.baseValue, prev.fluctuationRange),
      }));
      
      setEtco2(prev => ({
        ...prev,
        currentValue: generateFluctuation(prev.baseValue, prev.fluctuationRange),
      }));
      
      setRespiratoryRate(prev => ({
        ...prev,
        currentValue: generateFluctuation(prev.baseValue, prev.fluctuationRange),
      }));
    }, 2000); 
    
    return () => clearInterval(fluctuationTimer);
  }, [sessionData]);
  
  
  const formatBloodPressure = (): string => {
    if (bloodPressure.currentSystolic === null || bloodPressure.currentDiastolic === null) {
      return 'N/A';
    }
    return `${Math.round(bloodPressure.currentSystolic)}/${Math.round(bloodPressure.currentDiastolic)}`;
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text>Ładowanie danych sesji...</Text>
        </View>
      ) : error ? (
        <Surface style={styles.center} elevation={2}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text style={{ color: theme.colors.error, marginVertical: 12 }}>Błąd: {error}</Text>
          <Button 
            mode="contained" 
            onPress={handleRetry}
            icon="refresh">
            Spróbuj ponownie
          </Button>
        </Surface>
      ) : sessionData ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Surface style={styles.sessionInfo} elevation={3}>
            <View style={styles.sessionHeader}>
              <MaterialCommunityIcons name="medical-bag" size={24} color={theme.colors.primary} style={styles.headerIcon} />
              <Text style={styles.title}>Sesja #{accessCode}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.patientInfoRow}>
              <MaterialCommunityIcons name="account" size={20} color={theme.colors.secondary} />
              <Text style={styles.patientInfoText}>
                {firstName} {lastName} ({albumNumber})
              </Text>
            </View>
            {sessionData?.name && (
              <View style={styles.patientInfoRow}>
                <MaterialCommunityIcons name="tag" size={20} color={theme.colors.secondary} />
                <Text style={styles.sessionName}>{sessionData.name}</Text>
              </View>
            )}
            <Divider style={[styles.divider, {marginVertical: 10}]} />
            <View style={styles.sessionMetaInfo}>
              <View style={styles.metaItemRow}>
                <MaterialCommunityIcons 
                  name={sessionData?.isActive ? "check-circle" : "close-circle"} 
                  size={18} 
                  color={sessionData?.isActive ? theme.colors.primary : theme.colors.error} 
                />
                <Text style={styles.metaItemLabel}>
                  Status: <Text style={{fontWeight: '500'}}>{sessionData?.isActive ? 'Aktywna' : 'Nieaktywna'}</Text>
                </Text>
              </View>
              {sessionData?.createdAt && (
                <View style={styles.metaItemRow}>
                  <MaterialCommunityIcons name="calendar-plus" size={18} color={theme.colors.secondary} />
                  <Text style={styles.metaItemLabel}>
                    Utworzono: <Text style={{fontWeight: '500'}}>{new Date(sessionData.createdAt).toLocaleString('pl-PL')}</Text>
                  </Text>
                </View>
              )}
              {sessionData?.updatedAt && (
                <View style={styles.metaItemRow}>
                  <MaterialCommunityIcons name="calendar-sync" size={18} color={theme.colors.secondary} />
                  <Text style={styles.metaItemLabel}>
                    Zaktualizowano: <Text style={{fontWeight: '500'}}>{new Date(sessionData.updatedAt).toLocaleString('pl-PL')}</Text>
                  </Text>
                </View>
              )}
            </View>
          </Surface>

          <Surface style={styles.ekgCard} elevation={3}>
            <View style={styles.cardHeaderRow}>
              <MaterialCommunityIcons name="heart-pulse" size={24} color={theme.colors.error} />
              <Text style={styles.cardHeaderTitle}>Kardiomonitor</Text>
            </View>
            <EkgDisplay
              ekgType={Number(sessionData.rhythmType)}
              bpm={Number(sessionData.beatsPerMinute)}
              noiseType={sessionData.noiseLevel}
              isRunning
            />
          </Surface>

          <Surface style={styles.vitalsCard} elevation={3}>
            <View style={styles.cardHeaderRow}>
              <MaterialCommunityIcons name="clipboard-pulse" size={24} color={theme.colors.primary} />
              <Text style={styles.cardHeaderTitle}>Parametry pacjenta</Text>
            </View>

            <View style={styles.vitalsRow}>
              <Surface style={styles.vitalItemCard} elevation={1}>
                <MaterialCommunityIcons name="thermometer" size={22} color={theme.colors.tertiary} />
                <Text style={styles.vitalLabel}>Temperatura</Text>
                <Text style={styles.vitalValue}>
                  {temperature.currentValue !== null
                    ? `${temperature.currentValue}${temperature.unit}`
                    : 'N/A'}
                </Text>
              </Surface>
              <Surface style={styles.vitalItemCard} elevation={1}>
                <MaterialCommunityIcons name="heart" size={22} color={theme.colors.error} />
                <Text style={styles.vitalLabel}>Tętno</Text>
                <Text style={styles.vitalValue}>
                  {heartRate.currentValue !== null 
                    ? `${heartRate.currentValue} ${heartRate.unit}` 
                    : 'N/A'}
                </Text>
              </Surface>
            </View>

            <View style={styles.vitalsRow}>
              <Surface style={styles.vitalItemCard} elevation={1}>
                <MaterialCommunityIcons name="blood-bag" size={22} color={theme.colors.error} />
                <Text style={styles.vitalLabel}>Ciśnienie krwi</Text>
                <Text style={styles.vitalValue}>{formatBloodPressure()}</Text>
              </Surface>
              <Surface style={styles.vitalItemCard} elevation={1}>
                <MaterialCommunityIcons name="percent" size={22} color={theme.colors.primary} />
                <Text style={styles.vitalLabel}>SpO₂</Text>
                <Text style={styles.vitalValue}>
                  {spo2.currentValue !== null 
                    ? `${spo2.currentValue}${spo2.unit}` 
                    : 'N/A'}
                </Text>
              </Surface>
            </View>

            <View style={styles.vitalsRow}>
              <Surface style={styles.vitalItemCard} elevation={1}>
                <MaterialCommunityIcons name="molecule-co2" size={22} color={theme.colors.secondary} />
                <Text style={styles.vitalLabel}>EtCO₂</Text>
                <Text style={styles.vitalValue}>
                  {etco2.currentValue !== null
                    ? `${etco2.currentValue} ${etco2.unit}`
                    : 'N/A'}
                </Text>
              </Surface>
              <Surface style={styles.vitalItemCard} elevation={1}>
                <MaterialCommunityIcons name="lungs" size={22} color={theme.colors.tertiary} />
                <Text style={styles.vitalLabel}>Częstość oddechów</Text>
                <Text style={styles.vitalValue}>
                  {respiratoryRate.currentValue !== null
                    ? `${respiratoryRate.currentValue} ${respiratoryRate.unit}`
                    : 'N/A'}
                </Text>
              </Surface>
            </View>
          </Surface>
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <MaterialCommunityIcons name="database-off" size={64} color={theme.colors.secondary} />
          <Text style={styles.noDataText}>Brak dostępnych danych sesji</Text>
          <Button 
            mode="contained" 
            onPress={handleRetry}
            icon="refresh" 
            style={{marginTop: 16}}>
            Odśwież
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: { flex: 1, padding: 8 },
  sessionInfo: { padding: 16, marginBottom: 16, borderRadius: 8 },
  title: { fontSize: 20, fontWeight: 'bold' },
  sessionName: { fontSize: 16, marginTop: 8, fontStyle: 'italic' },
  sessionMetaInfo: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0, 0, 0, 0.1)' },
  metaItem: { fontSize: 14, marginVertical: 2, opacity: 0.8 },
  vitalsCard: { padding: 16, margin: 8, borderRadius: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  vitalItem: { flex: 1, padding: 8 },
  vitalLabel: { fontSize: 14, opacity: 0.7, marginBottom: 4 },
  vitalValue: { fontSize: 18, fontWeight: '500' },
  contentContainer: { paddingBottom: 16 },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerIcon: { marginRight: 8 },
  patientInfoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  patientInfoText: { marginLeft: 8, fontSize: 16 },
  divider: { marginVertical: 8 },
  metaItemRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  metaItemLabel: { marginLeft: 8, fontSize: 14, opacity: 0.8 },
  ekgCard: { padding: 16, margin: 8, borderRadius: 8 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardHeaderTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  vitalItemCard: { flex: 1, padding: 8, margin: 4, borderRadius: 8, alignItems: 'center' },
  noDataText: { fontSize: 18, fontWeight: '500', marginTop: 16 },
});

export default StudentSessionScreen;