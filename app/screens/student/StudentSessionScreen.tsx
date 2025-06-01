// app/student-session.tsx
import React, { useState } from "react";
import {
  View,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
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
import ColorSensor from "@/components/ColorSensor";
import { useLocalSearchParams, useRouter } from "expo-router";
import EkgCardDisplay from "@/components/ekg/EkgCardDisplay";
import SocketConnectionStatus from "@/components/SocketConnectionStatus";
import SessionInfo from "./components/SessionInfo";
import VitalSignsDisplay from "./components/VitalSignsDisplay";
import { useSessionManager } from "./hooks/useSessionManager";
import { useVitalSigns } from "./hooks/useVitalSigns";
import { useAudioManager } from "./hooks/useAudioManager";
import { useNetworkMonitoring } from "./hooks/useNetworkMonitoring";
import { useColorConfigs } from "./hooks/useColorConfigs";
import { useColorSounds } from "./hooks/useColorSounds";
import { useSessionDeletion } from "./hooks/useSessionDeletion";
import ColorConfigDisplay from "./components/ColorConfigDisplay";

const StudentSessionScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { firstName, lastName, albumNumber, accessCode } =
    useLocalSearchParams<{
      firstName: string;
      lastName: string;
      albumNumber: string;
      accessCode: string;
    }>();

  // Czy to Web, czy urządzenie mobilne
  const isWeb = Platform.OS === "web";
  const [isSessionPanelExpanded, setIsSessionPanelExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Podpinamy się pod manager sesji, podając te same dane co przy dołączaniu
  const { sessionData, isLoading, error, sessionJoined, handleRetry } =
    useSessionManager({
      accessCode: accessCode?.toString(),
      firstName: firstName || "",
      lastName: lastName || "",
      albumNumber: albumNumber || "",
    });

  // Główne wartości, które wyświetlamy w panelu „Normalnym”
  const {
    temperature,
    bloodPressure,
    spo2,
    etco2,
    respiratoryRate,
    formatBloodPressure,
  } = useVitalSigns(sessionData);

  // Audio dolekcji
  const { audioReady, isPlayingServerAudio } = useAudioManager(
    accessCode?.toString(),
    sessionJoined
  );

  // Kolorowe konfiguracje
  const {
    colorConfigs,
    isLoading: colorConfigsLoading,
    error: colorConfigsError,
  } = useColorConfigs({
    sessionId: accessCode?.toString(),
    sessionJoined,
  });

  const {
    playColorSound,
    stopAllColorSounds,
    isLoadingAudio: isLoadingColorAudio,
  } = useColorSounds();
  // Monitorowanie stanu sieciowego
  useNetworkMonitoring();
  // Handle session deletion
  useSessionDeletion({
    accessCode: accessCode?.toString(),
    firstName: firstName || "",
    lastName: lastName || "",
    albumNumber: albumNumber || "",
    sessionJoined,
  });

  // Funkcje do ColorSensor
  const handleColorDetected = async (detectedColor: string, config: any) => {
    console.log(`Color detected: ${detectedColor}`);
    await playColorSound(config);
  };

  const handleColorLost = async () => {
    console.log(`Color lost - stopping all color sounds`);
    await stopAllColorSounds();
  };

  // Powrót do ekranu wyboru studenta
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

  // Jeśli ciągle ładuje sesję
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

  // Jeśli wystąpił błąd
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

  // Jeśli brak danych sesji
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

  // Gdy wszystko jest OK – wyświetlamy główny UI
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
          {sessionData.rhythmType !== undefined && !sessionData.isEkdDisplayHidden && (
            <Pressable
              style={styles.cardContainer}
              onPress={() => {
                router.push({
                  pathname: "/screens/student/ekg-fullscreen",
                  params: {
                    accessCode: accessCode?.toString() || "",
                    firstName: firstName || "",
                    lastName: lastName || "",
                    albumNumber: albumNumber || "",
                  },
                });
              }}
            >
              <EkgCardDisplay
                ekgType={sessionData.rhythmType}
                bpm={sessionData.beatsPerMinute}
                isRunning={true}
              />
            </Pressable>
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
          <ColorConfigDisplay
            colorConfigs={colorConfigs}
            isLoading={colorConfigsLoading}
            error={colorConfigsError}
          />
          {!isWeb && (
            <ColorSensor
              colorConfigs={colorConfigs}
              onColorDetected={handleColorDetected}
              onColorLost={handleColorLost}
            />
          )}
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
                  ? " Odtwarzanie..."
                  : audioReady
                  ? " Gotowe"
                  : " Niedostępne"}
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
    overflow: "hidden",
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
