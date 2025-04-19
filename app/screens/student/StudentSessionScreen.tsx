import React, { useState, useEffect, useCallback } from 'react';
import { useTheme, Text, ActivityIndicator, Surface, Button, Chip, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { sessionService, Session } from '@/services/SessionService';
import EkgDisplay from '@/components/ekg/EkgDisplay';
import { View, StyleSheet } from 'react-native';
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
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`Fetching session with code: ${accessCode}`);
      const parsedCode = parseInt(accessCode.toString(), 10);

      if (isNaN(parsedCode)) {
        throw new Error("Invalid access code format");
      }

      const response = await sessionService.getSessionByCode(parsedCode);
      console.log("Session data received:", response);

      if (!response) {
        throw new Error("No session found with this code");
      }

      setSessionData(response);

      console.log(response)
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
    sessionService.subscribeToSessionUpdates(Number(accessCode), (updatedSession) => {
      console.log("Session updated:", updatedSession);
      setSessionData(updatedSession);
    });

  }, []);











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
          <Button mode="contained" style={styles.retryButton}>
            Retry
          </Button>
        </Surface>
      ) : sessionData ? (
        <View style={styles.contentContainer}>
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

          <Surface style={styles.infoCard} elevation={1}>
            <Text style={styles.infoText}>
              Temperature: {sessionData?.temperature}°C
            </Text>
          </Surface>
        </View>
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