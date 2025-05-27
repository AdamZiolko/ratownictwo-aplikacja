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
import SocketConnectionStatus from "@/components/SocketConnectionStatus";
import SessionInfo from "./components/SessionInfo";
import VitalSignsDisplay from "./components/VitalSignsDisplay";
import { useSessionManager } from "./hooks/useSessionManager";
import { useVitalSigns } from "./hooks/useVitalSigns";
import { useAudioManager } from "./hooks/useAudioManager";
import { useNetworkMonitoring } from "./hooks/useNetworkMonitoring";

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
  const [isFullscreen, setIsFullscreen] = useState(false); // Use our new modular hooks
  const { sessionData, isLoading, error, sessionJoined, handleRetry } =
    useSessionManager({
      accessCode: accessCode?.toString(),
      firstName: firstName || "",
      lastName: lastName || "",
      albumNumber: albumNumber || "",
    });

  const {
    temperature,
    bloodPressure,
    spo2,
    etco2,
    respiratoryRate,
    formatBloodPressure,
  } = useVitalSigns(sessionData);

  const { audioReady, isPlayingServerAudio } = useAudioManager(
    accessCode?.toString(),
    sessionJoined
  );

  useNetworkMonitoring();

  const handleGoBack = () => {
    router.replace({
      pathname: "/routes/student-access",
      params: {
        firstName: firstName || "",
        lastName: lastName || "",
        albumNumber: albumNumber || "",
      },
    });
  };

  const toggleSessionPanel = () => {
    setIsSessionPanelExpanded(!isSessionPanelExpanded);
  };

  if (isLoading) {
    return (
      <BackgroundGradient>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[styles.loadingText, { color: theme.colors.onSurface }]}
            >
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
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={handleGoBack} />
          <Appbar.Content title="Sesja Studenta" />
          <IconButton
            icon={isSessionPanelExpanded ? "chevron-up" : "chevron-down"}
            onPress={toggleSessionPanel}
          />
        </Appbar.Header>

        <ScrollView style={styles.scrollContainer}>
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

          <VitalSignsDisplay
            temperature={temperature}
            bloodPressure={bloodPressure}
            spo2={spo2}
            etco2={etco2}
            respiratoryRate={respiratoryRate}
            formatBloodPressure={formatBloodPressure}
            isFullscreen={isFullscreen}
          />

          <Surface style={styles.cardContainer}>
            <ColorSensor />
          </Surface>
          <Surface style={styles.cardContainer}>
            <View style={styles.audioStatusContainer}>
              <MaterialCommunityIcons
                name={
                  isPlayingServerAudio
                    ? "volume-high"
                    : audioReady
                    ? "volume-medium"
                    : "volume-off"
                }
                size={24}
                color={
                  isPlayingServerAudio
                    ? theme.colors.secondary
                    : audioReady
                    ? theme.colors.primary
                    : theme.colors.error
                }
              />
              <Text
                style={[
                  styles.audioStatusText,
                  { color: theme.colors.onSurface },
                ]}
              >
                Audio:
                {isPlayingServerAudio
                  ? "Odtwarzanie..."
                  : audioReady
                  ? "Gotowe"
                  : "Niedostępne"}
              </Text>
              {isPlayingServerAudio && (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.secondary}
                  style={{ marginLeft: 8 }}
                />
              )}
            </View>
          </Surface>
          <SocketConnectionStatus />
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
  },
  cardContainer: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
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
  debugContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  debugButton: {
    marginVertical: 4,
  },
});

export default StudentSessionScreen;
