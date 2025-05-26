import React, { useState } from "react";
import {
  View,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  useTheme,
  Text,
  Surface,
  Button,
  Appbar,
  IconButton,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import BackgroundGradient from "@/components/BackgroundGradient";
import { router, useLocalSearchParams } from "expo-router";
import EkgCardDisplay from "@/components/ekg/EkgCardDisplay";
import ColorSensor from "@/components/ColorSensor";
import ColorConfigurationDisplay from "@/components/ColorConfigurationDisplay";
import SocketConnectionStatus from "@/components/SocketConnectionStatus";

// Import our new components and hooks
import SessionInfo from "./components/SessionInfo";
import VitalSignsDisplay from "./components/VitalSignsDisplay";
import { useSessionManager } from "./hooks/useSessionManager";
import { useVitalSigns } from "./hooks/useVitalSigns";
import { useAudioManager } from "./hooks/useAudioManager";
import { useNetworkMonitoring } from "./hooks/useNetworkMonitoring";
import { useWebSocketConnection } from "./hooks/useWebSocketConnection";

const StudentSessionScreen = () => {
  const theme = useTheme();
  const { firstName, lastName, albumNumber, accessCode } =
    useLocalSearchParams<{
      firstName: string;
      lastName: string;
      albumNumber: string;
      accessCode: string;
    }>();
  const isWeb = Platform.OS === "web";
  const [isSessionPanelExpanded, setIsSessionPanelExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize WebSocket connection monitoring
  const webSocketConnection = useWebSocketConnection(accessCode?.toString());
  
  // Use our new modular hooks
  const { 
    sessionData, 
    isLoading, 
    error, 
    handleRetry 
  } = useSessionManager({
    accessCode: accessCode?.toString(),
    firstName: firstName || "",
    lastName: lastName || "",
    albumNumber: albumNumber || ""
  });

  const { 
    temperature, 
    bloodPressure, 
    spo2, 
    etco2, 
    respiratoryRate, 
    formatBloodPressure 
  } = useVitalSigns(sessionData);
  
  const { audioReady } = useAudioManager(accessCode?.toString());
  
  // Initialize network monitoring on Android
  useNetworkMonitoring();

  const handleGoBack = () => {
    router.replace({
      pathname: "/routes/student-access",
      params: { 
        firstName: firstName || "", 
        lastName: lastName || "", 
        albumNumber: albumNumber || "" 
      }
    });
  };

  const toggleSessionPanel = () => {
    setIsSessionPanelExpanded(!isSessionPanelExpanded);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Loading state
  if (isLoading) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
              Ładowanie sesji...
            </Text>
          </View>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  // Error state
  if (error) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons 
              name="alert-circle" 
              size={64} 
              color={theme.colors.error} 
            />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
            <Button 
              mode="contained" 
              onPress={handleRetry}
              style={styles.retryButton}
            >
              Spróbuj ponownie
            </Button>
            <Button 
              mode="outlined" 
              onPress={handleGoBack}
              style={styles.backButton}
            >
              Powrót
            </Button>
          </View>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }

  // No session data
  if (!sessionData) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons 
              name="file-document-outline" 
              size={64} 
              color={theme.colors.onSurface} 
            />
            <Text style={[styles.errorText, { color: theme.colors.onSurface }]}>
              Brak danych sesji
            </Text>
            <Button 
              mode="outlined" 
              onPress={handleGoBack}
              style={styles.backButton}
            >
              Powrót
            </Button>
          </View>
        </SafeAreaView>
      </BackgroundGradient>
    );
  }
  // Main content when session data is available
  return (
    <BackgroundGradient>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={handleGoBack} />
          <Appbar.Content title="Sesja Studenta" />
          <IconButton
            icon={isSessionPanelExpanded ? "chevron-up" : "chevron-down"}
            onPress={toggleSessionPanel}
          />
        </Appbar.Header>

        {/* Main Content - All content now inside ScrollView */}
        <ScrollView style={styles.scrollContainer}>
          {/* Session Info Panel */}
          <SessionInfo
            accessCode={accessCode?.toString() || ""}
            firstName={firstName || ""}
            lastName={lastName || ""}
            albumNumber={albumNumber || ""}
            sessionData={sessionData}
            isSessionPanelExpanded={isSessionPanelExpanded}
            setIsSessionPanelExpanded={setIsSessionPanelExpanded}
            isMobile={!isWeb}
          />

          {sessionData.rhythmType !== undefined && (
            <Surface style={styles.cardContainer}>
              <EkgCardDisplay 
                ekgType={sessionData.rhythmType}
                bpm={sessionData.beatsPerMinute}
                isRunning={true}
              />
            </Surface>
          )}

          {/* Connection Status */}
          <VitalSignsDisplay
            temperature={temperature}
            bloodPressure={bloodPressure}
            spo2={spo2}
            etco2={etco2}
            respiratoryRate={respiratoryRate}
            formatBloodPressure={formatBloodPressure}
            isFullscreen={isFullscreen}
          />          {/* EKG Card */}          {/* Color Configuration Display */}
          <ColorConfigurationDisplay 
            sessionId={sessionData.sessionId} 
            sessionCode={sessionData.sessionCode}
          />

          {/* Color Sensor */}
          <Surface style={styles.cardContainer}>
            <ColorSensor sessionData={sessionData} />
          </Surface>          {/* Connection Status & Audio Status */}
          <Surface style={styles.cardContainer}>
            <View style={styles.statusContainer}>
              <View style={styles.statusRow}>
                <MaterialCommunityIcons 
                  name={webSocketConnection.isConnected ? "wifi" : "wifi-off"} 
                  size={24} 
                  color={webSocketConnection.isConnected ? theme.colors.primary : theme.colors.error} 
                />
                <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>
                  Połączenie: {webSocketConnection.isConnected ? "Aktywne" : "Brak"}
                </Text>
                {!webSocketConnection.isConnected && webSocketConnection.canReconnect && (
                  <IconButton
                    icon="refresh"
                    size={20}
                    onPress={webSocketConnection.forceReconnect}
                  />
                )}
              </View>
              
              <View style={styles.statusRow}>
                <MaterialCommunityIcons 
                  name={audioReady ? "volume-high" : "volume-off"} 
                  size={24} 
                  color={audioReady ? theme.colors.primary : theme.colors.error} 
                />
                <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>
                  Audio: {audioReady ? "Gotowe" : "Niedostępne"}
                </Text>
              </View>
              
              {webSocketConnection.error && (
                <Text style={[styles.errorInfo, { color: theme.colors.error }]}>
                  {webSocketConnection.error}
                </Text>
              )}
            </View>
          </Surface>

          <SocketConnectionStatus />{/* Vital Signs Display */}

        </ScrollView>
      </SafeAreaView>
    </BackgroundGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "transparent",
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
  },
  retryButton: {
    marginTop: 20,
    marginBottom: 10,
  },
  backButton: {
    marginTop: 10,
  },  cardContainer: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  statusContainer: {
    padding: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 16,
    flex: 1,
  },
  errorInfo: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  audioStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  audioStatusText: {
    marginLeft: 8,
    fontSize: 16,
  },
});

export default StudentSessionScreen;