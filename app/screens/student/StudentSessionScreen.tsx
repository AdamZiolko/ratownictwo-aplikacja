// app/screens/student/StudentSessionScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  useTheme,
  Text,
  ActivityIndicator,
  Surface,
  Button,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { sessionService, Session } from '@/services/SessionService';
import EkgDisplay from '@/components/ekg/EkgDisplay';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { socketService } from '@/services/SocketService';
import { Audio } from 'expo-av';

// mapa soundName → plik mp3
const soundFiles: Record<string, any> = {
  kaszel: require('../../../assets/sounds/kaszel.mp3'),
};

const StudentSessionScreen = () => {
  const theme = useTheme();
  const { firstName, lastName, albumNumber, accessCode } = useLocalSearchParams<{ firstName: string; lastName: string; albumNumber: string; accessCode: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<Session | null>(null);

  // ref do cache'a dźwięków
  const soundObjects = useRef<Record<string, Audio.Sound>>({});

  // retry handler
  const handleRetry = () => {
    fetchSession();
  };

  // 1) fetch session
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

  // zamiast useEffect(fetchSession, [accessCode])
  useEffect(() => {
    fetchSession();
  }, [accessCode]);

  // 2) live updates
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

  // 3) preload audio & ustaw AudioMode (tylko na native)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // ustawienia Audio
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
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
      // cleanup sounds
      Object.values(soundObjects.current).forEach(s => s.unloadAsync());
    };
  }, []);

  // 4) nasłuch audio-command → play (tylko na native)
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

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text>Loading session data...</Text>
        </View>
      ) : error ? (
        <Surface style={styles.center} elevation={2}>
          <Text style={{ color: 'red' }}>Error: {error}</Text>
          <Button onPress={handleRetry}>Retry</Button>
        </Surface>
      ) : sessionData ? (
        <ScrollView style={styles.content}>
          <Surface style={styles.sessionInfo} elevation={1}>
            <Text style={styles.title}>Session #{accessCode}</Text>
            <Text>
              {firstName} {lastName} ({albumNumber})
            </Text>
          </Surface>

          <EkgDisplay
            ekgType={Number(sessionData.rhythmType)}
            bpm={Number(sessionData.beatsPerMinute)}
            noiseType={sessionData.noiseLevel}
            isRunning
          />

          <Surface style={styles.vitalsCard} elevation={1}>
            <Text style={styles.cardTitle}>Patient Vitals</Text>
            <View style={styles.vitalsRow}>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Temperature</Text>
                <Text style={styles.vitalValue}>
                  {sessionData.temperature != null
                    ? `${sessionData.temperature}°C`
                    : 'N/A'}
                </Text>
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Heart Rate</Text>
                <Text style={styles.vitalValue}>
                  {sessionData.hr != null ? `${sessionData.hr} BPM` : 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.vitalsRow}>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Blood Pressure</Text>
                <Text style={styles.vitalValue}>{sessionData.bp || 'N/A'}</Text>
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>SpO₂</Text>
                <Text style={styles.vitalValue}>
                  {sessionData.spo2 != null ? `${sessionData.spo2}%` : 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.vitalsRow}>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>EtCO₂</Text>
                <Text style={styles.vitalValue}>
                  {sessionData.etco2 != null
                    ? `${sessionData.etco2} mmHg`
                    : 'N/A'}
                </Text>
              </View>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Respiratory Rate</Text>
                <Text style={styles.vitalValue}>
                  {sessionData.rr != null
                    ? `${sessionData.rr} breaths/min`
                    : 'N/A'}
                </Text>
              </View>
            </View>
          </Surface>
        </ScrollView>
      ) : (
        <Text style={styles.center}>No session data available</Text>
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
});

export default StudentSessionScreen;
