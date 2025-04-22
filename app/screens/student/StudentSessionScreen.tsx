import React, { useState, useEffect, useCallback } from 'react';
import { useTheme, Text, ActivityIndicator, Surface, Button, Chip, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { sessionService, Session } from '@/services/SessionService';
import EkgDisplay from '@/components/ekg/EkgDisplay';
import { View, StyleSheet, ScrollView } from 'react-native';
import { socketService } from '@/services/SocketService';

const StudentSessionScreen = () => {
  const theme = useTheme();
  const { firstName, lastName, albumNumber, accessCode } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<Session | null>(null);

  const fetchSessionData = async () => {
    if (!accessCode) {
      setError("No access code provided");
      setIsLoading(false);
      return;
    }    try {
      setIsLoading(true);
      setError(null);

      console.log(`Fetching session with code: ${accessCode}`);
      const sessionCodeStr = accessCode.toString();
      
      if (!sessionCodeStr || sessionCodeStr.length !== 6) {
        throw new Error("Invalid access code format");
      }

      const response = await sessionService.getSessionByCode(sessionCodeStr);
      console.log("Session data received:", response);

      if (!response) {
        throw new Error("No session found with this code");
      }

      setSessionData(response);
    } catch (error) {
      console.error('Error fetching session data:', error);
      setError(error instanceof Error ? error.message : "Failed to fetch session data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, [accessCode]);

  useEffect(() => {
    let unsubscribeFn: (() => void) | undefined;    // Set up subscription to session updates
    const setupSubscription = async () => {
      try {
        if (accessCode) {
            unsubscribeFn = await sessionService.subscribeToSessionUpdates(accessCode.toString(), (updatedSession) => {
              console.log("Session updated:", updatedSession);
              setSessionData(updatedSession);
            });
        }
      } catch (err) {
        console.error("Error setting up session subscription:", err);
      }
    };

    setupSubscription();

    // Clean up subscription when component unmounts
    return () => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [accessCode]);

  // Function to retry fetching session data
  const handleRetry = () => {
    fetchSessionData();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading session data...</Text>
        </View>
      ) : error ? (
        <Surface style={styles.errorContainer} elevation={2}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Button mode="contained" style={styles.retryButton} onPress={handleRetry}>
            Retry
          </Button>
        </Surface>
      ) : sessionData ? (
        <ScrollView style={styles.contentContainer}>
          <Surface style={styles.sessionInfo} elevation={1}>
            <Text style={styles.sessionTitle}>Session #{accessCode}</Text>
            <Text style={styles.sessionSubtitle}>
              {firstName} {lastName} ({albumNumber})
            </Text>
          </Surface>

          <EkgDisplay
            ekgType={Number(sessionData?.rhythmType)}
            bpm={Number(sessionData?.beatsPerMinute)}
            noiseType={sessionData?.noiseLevel}
            isRunning={true}
          />

          <Surface style={styles.vitalsCard} elevation={1}>
            <Text style={styles.cardTitle}>Patient Vitals</Text>
            
            <View style={styles.vitalsRow}>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Temperature</Text>
                <Text style={styles.vitalValue}>
                  {sessionData?.temperature != null ? `${sessionData.temperature}°C` : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Heart Rate</Text>
                <Text style={styles.vitalValue}>
                  {sessionData?.hr != null ? `${sessionData.hr} BPM` : 'N/A'}
                </Text>
              </View>
            </View>
            
            <View style={styles.vitalsRow}>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Blood Pressure</Text>
                <Text style={styles.vitalValue}>
                  {sessionData?.bp || 'N/A'}
                </Text>
              </View>
              
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>SpO₂</Text>
                <Text style={styles.vitalValue}>
                  {sessionData?.spo2 != null ? `${sessionData.spo2}%` : 'N/A'}
                </Text>
              </View>
            </View>
            
            <View style={styles.vitalsRow}>
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>EtCO₂</Text>
                <Text style={styles.vitalValue}>
                  {sessionData?.etco2 != null ? `${sessionData.etco2} mmHg` : 'N/A'}
                </Text>
              </View>
              
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Respiratory Rate</Text>
                <Text style={styles.vitalValue}>
                  {sessionData?.rr != null ? `${sessionData.rr} breaths/min` : 'N/A'}
                </Text>
              </View>
            </View>
          </Surface>
        </ScrollView>
      ) : (
        <Text style={styles.noDataText}>No session data available</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
    padding: 8,
  },
  sessionInfo: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sessionSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  vitalsCard: {
    padding: 16,
    margin: 8,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  vitalItem: {
    flex: 1,
    padding: 8,
  },
  vitalLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: 18,
    fontWeight: '500',
  },
  infoCard: {
    padding: 16,
    margin: 8,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 18,
    marginVertical: 4,
  },
  noDataText: {
    textAlign: 'center',
    margin: 16,
    fontSize: 18,
  }
});

export default StudentSessionScreen;