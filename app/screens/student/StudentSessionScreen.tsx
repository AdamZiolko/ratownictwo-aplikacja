import React, { useEffect, useRef, useState } from 'react';
import { View, Platform, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme, Text, Surface, Button, Appbar, IconButton, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import BackgroundGradient from '../../../components/BackgroundGradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import EkgDisplay from '../../../components/ekg/EkgDisplay';
import ColorSensor from '../../../components/ColorSensor';
import SocketConnectionStatus from '../../../components/SocketConnectionStatus';
import { socketService } from '../../../services/SocketService';
import { sessionService } from '../../../services/SessionService';
import type { Session } from '../../../services/SessionService';
import { SoundQueueItem } from '../examiner/types/types';

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

const soundFiles: Record<string, any> = {
  "Adult/Female/Breathing through contractions.wav": require("../../../assets/sounds/Adult/Female/Breathingthroughcontractions.wav"),
  "Adult/Female/Coughing.wav": require("../../../assets/sounds/Adult/Female/Coughing.wav"),
  "Adult/Female/Distressed.wav": require("../../../assets/sounds/Adult/Female/Distressed.wav"),
  "Adult/Female/Hawk.wav": require("../../../assets/sounds/Adult/Female/Hawk.wav"),
  "Adult/Female/Moaning.wav": require("../../../assets/sounds/Adult/Female/Moaning.wav"),
  "Adult/Female/No.wav": require("../../../assets/sounds/Adult/Female/No.wav"),
  "Adult/Female/Ok.wav": require("../../../assets/sounds/Adult/Female/Ok.wav"),
  "Adult/Female/Pain.wav": require("../../../assets/sounds/Adult/Female/Pain.wav"),
  "Adult/Female/Pushing - long double.wav": require("../../../assets/sounds/Adult/Female/Pushinglongdouble.wav"),
  "Adult/Female/Pushing - long.wav": require("../../../assets/sounds/Adult/Female/Pushinglong.wav"),
  "Adult/Female/Pushing - single.wav": require("../../../assets/sounds/Adult/Female/Pushingsingle.wav"),
  "Adult/Female/Screaming.wav": require("../../../assets/sounds/Adult/Female/Screaming.wav"),
  "Adult/Female/Sob breathing (type 2).wav": require("../../../assets/sounds/Adult/Female/Sobbreathing(type2).wav"),
  "Adult/Female/Sob breathing.wav": require("../../../assets/sounds/Adult/Female/Sobbreathing.wav"),
  "Adult/Female/Vomiting.wav": require("../../../assets/sounds/Adult/Female/Vomiting.wav"),
  "Adult/Female/Yes.wav": require("../../../assets/sounds/Adult/Female/Yes.wav"),
  'Adult/Male/Coughing (long).wav': require('../../../assets/sounds/Adult/Male/Coughing(long).wav'),
  'Adult/Male/Coughing.wav': require('../../../assets/sounds/Adult/Male/Coughing.wav'),
  'Adult/Male/Difficult breathing.wav': require('../../../assets/sounds/Adult/Male/Difficultbreathing.wav'),
  'Adult/Male//Hawk.wav': require('../../../assets/sounds/Adult/Male/Hawk.wav'),
  'Adult/Male/Moaning (long).wav': require('../../../assets/sounds/Adult/Male/Moaning(long).wav'),
  'Adult/Male/oaning.wav': require('../../../assets/sounds/Adult/Male/Moaning.wav'),
  'Adult/Male/No.wav': require('../../../assets/sounds/Adult/Male/No.wav'),
  'Adult/Male/Ok.wav': require('../../../assets/sounds/Adult/Male/Ok.wav'),
  'Adult/Male/Screaming (type 2).wav': require('../../../assets/sounds/Adult/Male/Screaming(type2).wav'),
  'Adult/Male/Screaming.wav': require('../../../assets/sounds/Adult/Male/Screaming.wav'),
  'Adult/Male/Sob breathing.wav': require('../../../assets/sounds/Adult/Male/Sobbreathing.wav'),
  'Adult/Male/Vomiting (type 2).wav': require('../../../assets/sounds/Adult/Male/Vomiting(type2).wav'),
  'Adult/Male/Vomiting (type 3).wav': require('../../../assets/sounds/Adult/Male/Vomiting(type3).wav'),
  'Adult/Male/Vomiting.wav': require('../../../assets/sounds/Adult/Male/Vomiting.wav'),
  'Adult/Male/Yes.wav': require('../../../assets/sounds/Adult/Male/Yes.wav'),
  "Speech/Chest hurts.wav": require("../../../assets/sounds/Speech/Chesthurts.wav"),
  "Speech/Doc I feel I could die.wav": require("../../../assets/sounds/Speech/DocIfeelIcoulddie.wav"),
  "Speech/Go away.wav": require("../../../assets/sounds/Speech/Goaway.wav"),
  "Speech/I don't feel dizzy.wav": require("../../../assets/sounds/Speech/Idontfeeldizzy.wav"),
  "Speech/I don't feel well.wav": require("../../../assets/sounds/Speech/Idontfeelwell.wav"),
  "Speech/I feel better now.wav": require("../../../assets/sounds/Speech/Ifeelbetternow.wav"),
  "Speech/I feel really bad.wav": require("../../../assets/sounds/Speech/Ifeelreallybad.wav"),
  "Speech/I'm feeling very dizzy.wav": require("../../../assets/sounds/Speech/Imfeelingverydizzy.wav"),
  "Speech/I'm fine.wav": require("../../../assets/sounds/Speech/Imfine.wav"),
  "Speech/I'm quite nauseous.wav": require("../../../assets/sounds/Speech/Imquitenauseous.wav"),
  "Speech/I'm really hungry.wav": require("../../../assets/sounds/Speech/Imreallyhungry.wav"),
  "Speech/I'm really thirsty.wav": require("../../../assets/sounds/Speech/Imreallythirsty.wav"),
  "Speech/I'm so sick.wav": require("../../../assets/sounds/Speech/Imsosick.wav"),
  "Speech/Never had pain like this before.wav": require("../../../assets/sounds/Speech/Neverhadpainlikethisbefore.wav"),
  "Speech/No allergies.wav": require("../../../assets/sounds/Speech/Noallergies.wav"),
  "Speech/No diabetes.wav": require("../../../assets/sounds/Speech/Nodiabetes.wav"),
  "Speech/No lung or cardiac problems.wav": require("../../../assets/sounds/Speech/Nolungorcardiacproblems.wav"),
  "Speech/No.wav": require("../../../assets/sounds/Speech/No.wav"),
  "Speech/Pain for 2 hours.wav": require("../../../assets/sounds/Speech/Painfor2hours.wav"),
  "Speech/Something for this pain.wav": require("../../../assets/sounds/Speech/Somethingforthispain.wav"),
  "Speech/Thank you.wav": require("../../../assets/sounds/Speech/Thankyou.wav"),
  "Speech/That helped.wav": require("../../../assets/sounds/Speech/Thathelped.wav"),
  "Speech/Yes.wav": require("../../../assets/sounds/Speech/Yes.wav"),
  "Child/Coughing.wav": require("../../../assets/sounds/Child/Coughing.wav"),
  "Child/Hawk.wav": require("../../../assets/sounds/Child/Hawk.wav"),
  "Child/Moaning.wav": require("../../../assets/sounds/Child/Moaning.wav"),
  "Child/No.wav": require("../../../assets/sounds/Child/No.wav"),
  "Child/Ok.wav": require("../../../assets/sounds/Child/Ok.wav"),
  "Child/Screaming.wav": require("../../../assets/sounds/Child/Screaming.wav"),
  "Child/Sob breathing.wav": require("../../../assets/sounds/Child/Sobbreathing.wav"),
  "Child/Vomiting (type 2).wav": require("../../../assets/sounds/Child/Vomiting(type2).wav"),
  "Child/Vomiting.wav": require("../../../assets/sounds/Child/Vomiting.wav"),
  "Child/Yes.wav": require("../../../assets/sounds/Child/Yes.wav"),
  "Geriatric/Female/Coughing.wav": require("../../../assets/sounds/Geriatric/Female/Coughing.wav"),
  "Geriatric/Female/Moaning.wav": require("../../../assets/sounds/Geriatric/Female/Moaning.wav"),
  "Geriatric/Female/No.wav": require("../../../assets/sounds/Geriatric/Female/No.wav"),
  "Geriatric/Female/Screaming.wav": require("../../../assets/sounds/Geriatric/Female/Screaming.wav"),
  "Geriatric/Female/Vomiting.wav": require("../../../assets/sounds/Geriatric/Female/Vomiting.wav"),
  "Geriatric/Female/Yes.wav": require("../../../assets/sounds/Geriatric/Female/Yes.wav"),
  "Geriatric/Male/Coughing.wav": require("../../../assets/sounds/Geriatric/Male/Coughing.wav"),
  "Geriatric/Male/Moaning.wav": require("../../../assets/sounds/Geriatric/Male/Moaning.wav"),
  "Geriatric/Male/No.wav": require("../../../assets/sounds/Geriatric/Male/No.wav"),
  "Geriatric/Male/Screaming.wav": require("../../../assets/sounds/Geriatric/Male/Screaming.wav"),
  "Geriatric/Male/Vomiting.wav": require("../../../assets/sounds/Geriatric/Male/Vomiting.wav"),
  "Geriatric/Male/Yes.wav": require("../../../assets/sounds/Geriatric/Male/Yes.wav"),
  "Infant/Content.wav": require("../../../assets/sounds/Infant/Content.wav"),
  "Infant/Cough.wav": require("../../../assets/sounds/Infant/Cough.wav"),
  "Infant/Grunt.wav": require("../../../assets/sounds/Infant/Grunt.wav"),
  "Infant/Hawk.wav": require("../../../assets/sounds/Infant/Hawk.wav"),
  "Infant/Hiccup.wav": require("../../../assets/sounds/Infant/Hiccup.wav"),
  "Infant/Screaming.wav": require("../../../assets/sounds/Infant/Screaming.wav"),
  "Infant/Strongcry (type 2).wav": require("../../../assets/sounds/Infant/Strongcry(type2).wav"),
  "Infant/Strongcry.wav": require("../../../assets/sounds/Infant/Strongcry.wav"),
  "Infant/Weakcry.wav": require("../../../assets/sounds/Infant/Weakcry.wav"),
};

const StudentSessionScreen = () => {
  const theme = useTheme();
  const { firstName, lastName, albumNumber, accessCode } = useLocalSearchParams<{
    firstName: string;
    lastName: string;
    albumNumber: string;
    accessCode: string;
  }>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  const isWeb = Platform.OS === "web";
  const [isSessionPanelExpanded, setIsSessionPanelExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const soundInstances = useRef<Record<string, Audio.Sound>>({});

  const [temperature, setTemperature] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: "°C",
    fluctuationRange: 0.2,
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
    unit: "%",
    fluctuationRange: 1,
  });

  const [etco2, setEtco2] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: "mmHg",
    fluctuationRange: 2,
  });

  const [respiratoryRate, setRespiratoryRate] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: "breaths/min",
    fluctuationRange: 5,
  });

  const generateFluctuation = (value: number | null, fluctuationRange: number): number | null => {
    if (value === null) return null;
    const fluctPercent = (Math.random() - 0.5) * 2 * fluctuationRange;
    const fluctAmount = value * (fluctPercent / 100);
    return Math.round((value + fluctAmount) * 10) / 10;
  };

  const parseBloodPressure = (bpString: string | null | undefined): { systolic: number | null; diastolic: number | null } => {
    if (!bpString) return { systolic: null, diastolic: null };
    const parts = bpString.split("/");
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
      setError("No access code provided");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const resp = await sessionService.getSessionByCode(accessCode.toString());
      if (!resp) {
        setError("Session not found");
      } else {
        setSessionData(resp);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch session");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [accessCode]);

  useEffect(() => {
    if (!isWeb) return;

    const handleAudioCommand = async (payload: {
      command: string;
      soundName: string | SoundQueueItem[];
      loop?: boolean;
    }) => {
      if (Array.isArray(payload.soundName)) {
        // Handle sound queue here if needed
        return;
      }

      switch (payload.command) {
        case "play":
          await handleSoundPlayback(payload.soundName, payload.loop || false);
          break;
        case "stop":
          await handleSoundStop(payload.soundName);
          break;
        case "pause":
          await handleSoundPause(payload.soundName);
          break;
        case "resume":
          await handleSoundResume(payload.soundName);
          break;
      }
    };

    const unsubscribe = socketService.on("audio-command", handleAudioCommand);
    return () => unsubscribe();
  }, [accessCode]);

  const handleSoundPlayback = async (soundName: string, loop: boolean): Promise<void> => {
    return new Promise(async (resolve) => {
      try {
        if (!soundInstances.current[soundName]) {
          const sound = new Audio.Sound();
          await sound.loadAsync(soundFiles[soundName]);
          soundInstances.current[soundName] = sound;
        }
        await soundInstances.current[soundName].setIsLoopingAsync(loop);
        await soundInstances.current[soundName].playAsync();
        resolve();
      } catch (error) {
        console.error("Error playing sound:", error);
        resolve();
      }
    });
  };

  const handleSoundStop = async (soundName: string) => {
    const sound = soundInstances.current[soundName];
    if (!sound) return;

    try {
      await sound.stopAsync();
      await sound.setPositionAsync(0);
    } catch (error) {
      console.error("Error stopping sound:", error);
    }
  };

  const handleSoundPause = async (soundName: string) => {
    const sound = soundInstances.current[soundName];
    if (sound) await sound.pauseAsync();
  };

  const handleSoundResume = async (soundName: string) => {
    const sound = soundInstances.current[soundName];
    if (sound) await sound.playAsync();
  };

  useEffect(() => {
    return () => {
      Object.values(soundInstances.current).forEach(async (sound) => {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.error("Error unloading sound:", error);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!sessionData) return;

    const tempValue =
      sessionData.temperature !== undefined && sessionData.temperature !== null
        ? typeof sessionData.temperature === "string"
          ? parseFloat(sessionData.temperature)
          : sessionData.temperature
        : null;

    const { systolic, diastolic } = parseBloodPressure(sessionData.bp);

    const spo2Value =
      sessionData.spo2 !== undefined && sessionData.spo2 !== null
        ? typeof sessionData.spo2 === "string"
          ? parseInt(sessionData.spo2, 10)
          : sessionData.spo2
        : null;

    const etco2Value =
      sessionData.etco2 !== undefined && sessionData.etco2 !== null
        ? typeof sessionData.etco2 === "string"
          ? parseInt(sessionData.etco2, 10)
          : sessionData.etco2
        : null;

    const rrValue =
      sessionData.rr !== undefined && sessionData.rr !== null
        ? typeof sessionData.rr === "string"
          ? parseInt(sessionData.rr, 10)
          : sessionData.rr
        : null;

    setTemperature(prev => ({
      ...prev,
      baseValue: tempValue,
      currentValue: tempValue,
    }));
    setBloodPressure({
      systolic,
      diastolic,
      currentSystolic: systolic,
      currentDiastolic: diastolic,
    });
    setSpo2(prev => ({
      ...prev,
      baseValue: spo2Value,
      currentValue: spo2Value,
    }));
    setEtco2(prev => ({
      ...prev,
      baseValue: etco2Value,
      currentValue: etco2Value,
    }));
    setRespiratoryRate(prev => ({
      ...prev,
      baseValue: rrValue,
      currentValue: rrValue,
    }));

    // Update vital signs with small fluctuations
    const fluctuationTimer = setInterval(() => {
      setTemperature(prev => ({
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
      return "N/A";
    }
    return `${Math.round(bloodPressure.currentSystolic)}/${Math.round(bloodPressure.currentDiastolic)}`;
  };

  const renderFullscreenView = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.fullscreenExitButton}>
        <IconButton icon="arrow-collapse" onPress={() => setIsFullscreen(false)} size={24} />
      </View>

      <View style={styles.fullscreenContent}>
        <Surface style={styles.ekgCardFullscreen} elevation={3}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="heart-pulse" size={24} color={theme.colors.error} />
            <Text style={styles.cardHeaderTitle}>Kardiomonitor</Text>
          </View>
          <EkgDisplay
            ekgType={Number(sessionData?.rhythmType)}
            bpm={Number(sessionData?.beatsPerMinute)}
            noiseType={sessionData?.noiseLevel}
            isRunning
          />
        </Surface>

        <Surface style={styles.vitalsCardFullscreen} elevation={3}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="clipboard-pulse" size={24} color={theme.colors.primary} />
            <Text style={styles.cardHeaderTitle}>Parametry pacjenta</Text>
          </View>
          <View style={styles.fullscreenVitalsGrid}>
            <View style={styles.vitalsRow}>
              <Surface style={styles.vitalItemCard} elevation={1}>
                <MaterialCommunityIcons name="thermometer" size={22} color={theme.colors.tertiary} />
                <Text style={styles.vitalLabel}>Temperatura</Text>
                <Text style={styles.vitalValue}>
                  {temperature.currentValue !== null ? `${temperature.currentValue}${temperature.unit}` : "N/A"}
                </Text>
              </Surface>
              <Surface style={styles.vitalItemCard} elevation={1}>
                <MaterialCommunityIcons name="blood-bag" size={22} color={theme.colors.error} />
                <Text style={styles.vitalLabel}>Ciśnienie krwi</Text>
                <Text style={styles.vitalValue}>{formatBloodPressure()}</Text>
              </Surface>
            </View>

            <View style={styles.vitalsRow}>
              <Surface style={styles.vitalItemCard} elevation={1}>
                <MaterialCommunityIcons name="percent" size={22} color={theme.colors.primary} />
                <Text style={styles.vitalLabel}>SpO₂</Text>
                <Text style={styles.vitalValue}>
                  {spo2.currentValue !== null ? `${spo2.currentValue}${spo2.unit}` : "N/A"}
                </Text>
              </Surface>
              <Surface style={styles.vitalItemCard} elevation={1}>
                <MaterialCommunityIcons name="molecule-co2" size={22} color={theme.colors.secondary} />
                <Text style={styles.vitalLabel}>EtCO₂</Text>
                <Text style={styles.vitalValue}>
                  {etco2.currentValue !== null ? `${etco2.currentValue}${etco2.unit}` : "N/A"}
                </Text>
              </Surface>
              <Surface style={styles.vitalItemCard} elevation={1}>
                <MaterialCommunityIcons name="lungs" size={22} color={theme.colors.tertiary} />
                <Text style={styles.vitalLabel}>Częstość oddechów</Text>
                <Text style={styles.vitalValue}>
                  {respiratoryRate.currentValue !== null ? `${respiratoryRate.currentValue}${respiratoryRate.unit}` : "N/A"}
                </Text>
              </Surface>
            </View>
          </View>
        </Surface>
      </View>
    </View>
  );

  return (
    <BackgroundGradient>
      <Appbar.Header style={{ backgroundColor: "#8B0000" }}>
        <Appbar.BackAction onPress={() => router.back()} color="#fff" />
        <Appbar.Content title="Sesja studenta" titleStyle={{ color: "#fff", fontWeight: "bold" }} />
      </Appbar.Header>
      
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text>Ładowanie danych sesji...</Text>
          </View>
        ) : error ? (
          <Surface style={styles.center} elevation={2}>
            <MaterialCommunityIcons name="alert-circle-outline" size={64} color={theme.colors.error} />
            <Text style={{ color: theme.colors.error, marginVertical: 12 }}>Błąd: {error}</Text>
            <Button mode="contained" onPress={handleRetry} icon="refresh">
              Spróbuj ponownie
            </Button>
          </Surface>
        ) : sessionData ? (
          isFullscreen && Platform.OS !== "web" ? (
            renderFullscreenView()
          ) : (
            <ScrollView 
              style={styles.content} 
              contentContainerStyle={[
                styles.contentContainer,
                { flexGrow: 1, justifyContent: 'center', minHeight: '100%' }
              ]}>
              {Platform.OS !== "web" ? (
                <View style={styles.mobileSessionHeader}>
                  <View style={styles.mobileHeaderButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => setIsSessionPanelExpanded(!isSessionPanelExpanded)}
                      icon={isSessionPanelExpanded ? "chevron-up" : "chevron-down"}
                    >
                      Informacje o sesji
                    </Button>
                    <IconButton
                      icon="arrow-expand"
                      onPress={() => setIsFullscreen(true)}
                      size={24}
                    />
                  </View>
                  {isSessionPanelExpanded && (
                    <Surface style={styles.sessionInfo} elevation={3}>
                      <View style={styles.sessionHeader}>
                        <MaterialCommunityIcons
                          name="medical-bag"
                          size={24}
                          color={theme.colors.primary}
                          style={styles.headerIcon}
                        />
                        <Text style={styles.title}>Sesja #{accessCode}</Text>
                      </View>
                      <Divider style={styles.divider} />
                      <View style={styles.patientInfoRow}>
                        <MaterialCommunityIcons
                          name="account"
                          size={20}
                          color={theme.colors.secondary}
                        />
                        <Text style={styles.patientInfoText}>
                          {firstName} {lastName} (Album: {albumNumber})
                        </Text>
                      </View>
                      {sessionData?.name && (
                        <View style={styles.patientInfoRow}>
                          <MaterialCommunityIcons
                            name="tag"
                            size={20}
                            color={theme.colors.secondary}
                          />
                          <Text style={styles.sessionName}>{sessionData.name}</Text>
                        </View>
                      )}
                      <Divider style={[styles.divider, { marginVertical: 10 }]} />
                      <View style={styles.sessionMetaInfo}>
                        <View style={styles.metaItemRow}>
                          <MaterialCommunityIcons
                            name={sessionData?.isActive ? "check-circle" : "close-circle"}
                            size={18}
                            color={sessionData?.isActive ? theme.colors.primary : theme.colors.error}
                          />
                          <Text style={styles.metaItemLabel}>
                            Status: {sessionData?.isActive ? "Aktywna" : "Nieaktywna"}
                          </Text>
                        </View>
                        {sessionData?.createdAt && (
                          <View style={styles.metaItemRow}>
                            <MaterialCommunityIcons
                              name="clock-outline"
                              size={18}
                              color={theme.colors.secondary}
                            />
                            <Text style={styles.metaItemLabel}>
                              Utworzono: {new Date(sessionData.createdAt).toLocaleString()}
                            </Text>
                          </View>
                        )}
                        {sessionData?.updatedAt && (
                          <View style={styles.metaItemRow}>
                            <MaterialCommunityIcons
                              name="update"
                              size={18}
                              color={theme.colors.secondary}
                            />
                            <Text style={styles.metaItemLabel}>
                              Ostatnia aktualizacja: {new Date(sessionData.updatedAt).toLocaleString()}
                            </Text>
                          </View>
                        )}
                      </View>
                    </Surface>
                  )}
                </View>
              ) : (
                <Surface style={styles.sessionInfo} elevation={3}>
                  <View style={styles.sessionHeader}>
                    <MaterialCommunityIcons
                      name="medical-bag"
                      size={24}
                      color={theme.colors.primary}
                      style={styles.headerIcon}
                    />
                    <Text style={styles.title}>Sesja #{accessCode}</Text>
                  </View>
                  <Divider style={styles.divider} />
                  <View style={styles.patientInfoRow}>
                    <MaterialCommunityIcons
                      name="account"
                      size={20}
                      color={theme.colors.secondary}
                    />
                    <Text style={styles.patientInfoText}>
                      {firstName} {lastName} (Album: {albumNumber})
                    </Text>
                  </View>
                  {sessionData?.name && (
                    <View style={styles.patientInfoRow}>
                      <MaterialCommunityIcons
                        name="tag"
                        size={20}
                        color={theme.colors.secondary}
                      />
                      <Text style={styles.sessionName}>{sessionData.name}</Text>
                    </View>
                  )}
                  <Divider style={[styles.divider, { marginVertical: 10 }]} />
                  <View style={styles.sessionMetaInfo}>
                    <View style={styles.metaItemRow}>
                      <MaterialCommunityIcons
                        name={sessionData?.isActive ? "check-circle" : "close-circle"}
                        size={18}
                        color={sessionData?.isActive ? theme.colors.primary : theme.colors.error}
                      />
                      <Text style={styles.metaItemLabel}>
                        Status: {sessionData?.isActive ? "Aktywna" : "Nieaktywna"}
                      </Text>
                    </View>
                    {sessionData?.createdAt && (
                      <View style={styles.metaItemRow}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={18}
                          color={theme.colors.secondary}
                        />
                        <Text style={styles.metaItemLabel}>
                          Utworzono: {new Date(sessionData.createdAt).toLocaleString()}
                        </Text>
                      </View>
                    )}
                    {sessionData?.updatedAt && (
                      <View style={styles.metaItemRow}>
                        <MaterialCommunityIcons
                          name="update"
                          size={18}
                          color={theme.colors.secondary}
                        />
                        <Text style={styles.metaItemLabel}>
                          Ostatnia aktualizacja: {new Date(sessionData.updatedAt).toLocaleString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </Surface>
              )}

              {Platform.OS !== "web" ? (
                <>
                  <Surface style={styles.ekgCard} elevation={3}>
                    <View style={styles.cardHeaderRow}>
                      <MaterialCommunityIcons
                        name="heart-pulse"
                        size={24}
                        color={theme.colors.error}
                      />
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
                      <MaterialCommunityIcons
                        name="clipboard-pulse"
                        size={24}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.cardHeaderTitle}>Parametry pacjenta</Text>
                    </View>

                    <View style={styles.vitalsRow}>
                      <Surface style={styles.vitalItemCard} elevation={1}>
                        <MaterialCommunityIcons
                          name="thermometer"
                          size={22}
                          color={theme.colors.tertiary}
                        />
                        <Text style={styles.vitalLabel}>Temperatura</Text>
                        <Text style={styles.vitalValue}>
                          {temperature.currentValue !== null
                            ? `${temperature.currentValue}${temperature.unit}`
                            : "N/A"}
                        </Text>
                      </Surface>
                      <Surface style={styles.vitalItemCard} elevation={1}>
                        <MaterialCommunityIcons
                          name="blood-bag"
                          size={22}
                          color={theme.colors.error}
                        />
                        <Text style={styles.vitalLabel}>Ciśnienie krwi</Text>
                        <Text style={styles.vitalValue}>{formatBloodPressure()}</Text>
                      </Surface>
                    </View>

                    <View style={styles.vitalsRow}>
                      <Surface style={styles.vitalItemCard} elevation={1}>
                        <MaterialCommunityIcons
                          name="percent"
                          size={22}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.vitalLabel}>SpO₂</Text>
                        <Text style={styles.vitalValue}>
                          {spo2.currentValue !== null
                            ? `${spo2.currentValue}${spo2.unit}`
                            : "N/A"}
                        </Text>
                      </Surface>
                      <Surface style={styles.vitalItemCard} elevation={1}>
                        <MaterialCommunityIcons
                          name="molecule-co2"
                          size={22}
                          color={theme.colors.secondary}
                        />
                        <Text style={styles.vitalLabel}>EtCO₂</Text>
                        <Text style={styles.vitalValue}>
                          {etco2.currentValue !== null
                            ? `${etco2.currentValue} ${etco2.unit}`
                            : "N/A"}
                        </Text>
                      </Surface>
                    </View>

                    <View style={styles.vitalsRow}>
                      <Surface style={styles.vitalItemCard} elevation={1}>
                        <MaterialCommunityIcons
                          name="lungs"
                          size={22}
                          color={theme.colors.tertiary}
                        />
                        <Text style={styles.vitalLabel}>Częstość oddechów</Text>
                        <Text style={styles.vitalValue}>
                          {respiratoryRate.currentValue !== null
                            ? `${respiratoryRate.currentValue} ${respiratoryRate.unit}`
                            : "N/A"}
                        </Text>
                      </Surface>
                    </View>
                  </Surface>

                  <Surface style={styles.vitalsCard} elevation={3}>
                    <View style={styles.cardHeaderRow}>
                      <Icon source="circle-outline" size={24} color={theme.colors.primary} />
                      <Text style={styles.cardHeaderTitle}>Sensor RGB</Text>
                    </View>
                    <ColorSensor />
                  </Surface>
                </>
              ) : (
                <>
                  {!isWeb && (
                    <Surface style={styles.vitalsCard} elevation={3}>
                      <View style={styles.cardHeaderRow}>
                        <Icon source="circle-outline" size={24} color={theme.colors.primary} />
                        <Text style={styles.cardHeaderTitle}>Sensor RGB</Text>
                      </View>
                      <ColorSensor />
                    </Surface>
                  )}

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
                      <MaterialCommunityIcons
                        name="clipboard-pulse"
                        size={24}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.cardHeaderTitle}>Parametry pacjenta</Text>
                    </View>

                    <View style={styles.vitalsRow}>
                      <Surface style={styles.vitalItemCard} elevation={1}>
                        <MaterialCommunityIcons
                          name="thermometer"
                          size={22}
                          color={theme.colors.tertiary}
                        />
                        <Text style={styles.vitalLabel}>Temperatura</Text>
                        <Text style={styles.vitalValue}>
                          {temperature.currentValue !== null
                            ? `${temperature.currentValue}${temperature.unit}`
                            : "N/A"}
                        </Text>
                      </Surface>
                    </View>

                    <View style={styles.vitalsRow}>
                      <Surface style={styles.vitalItemCard} elevation={1}>
                        <MaterialCommunityIcons
                          name="blood-bag"
                          size={22}
                          color={theme.colors.error}
                        />
                        <Text style={styles.vitalLabel}>Ciśnienie krwi</Text>
                        <Text style={styles.vitalValue}>{formatBloodPressure()}</Text>
                      </Surface>
                      <Surface style={styles.vitalItemCard} elevation={1}>
                        <MaterialCommunityIcons
                          name="percent"
                          size={22}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.vitalLabel}>SpO₂</Text>
                        <Text style={styles.vitalValue}>
                          {spo2.currentValue !== null
                            ? `${spo2.currentValue}${spo2.unit}`
                            : "N/A"}
                        </Text>
                      </Surface>
                    </View>

                    <View style={styles.vitalsRow}>
                      <Surface style={styles.vitalItemCard} elevation={1}>
                        <MaterialCommunityIcons
                          name="molecule-co2"
                          size={22}
                          color={theme.colors.secondary}
                        />
                        <Text style={styles.vitalLabel}>EtCO₂</Text>
                        <Text style={styles.vitalValue}>
                          {etco2.currentValue !== null
                            ? `${etco2.currentValue}${etco2.unit}`
                            : "N/A"}
                        </Text>
                      </Surface>
                      <Surface style={styles.vitalItemCard} elevation={1}>
                        <MaterialCommunityIcons
                          name="lungs"
                          size={22}
                          color={theme.colors.tertiary}
                        />
                        <Text style={styles.vitalLabel}>Częstość oddechów</Text>
                        <Text style={styles.vitalValue}>
                          {respiratoryRate.currentValue !== null
                            ? `${respiratoryRate.currentValue}${respiratoryRate.unit}`
                            : "N/A"}
                        </Text>
                      </Surface>
                    </View>
                  </Surface>
                </>
              )}

              <View style={{ marginTop: 16, marginHorizontal: 8, marginBottom: 8 }}>
                <SocketConnectionStatus />
              </View>
            </ScrollView>
          )
        ) : (
          <View style={styles.center}>
            <MaterialCommunityIcons
              name="database-off"
              size={64}
              color={theme.colors.secondary}
            />
            <Text style={styles.noDataText}>Brak dostępnych danych sesji</Text>
            <Button mode="contained" onPress={handleRetry} icon="refresh" style={{ marginTop: 16 }}>
              Odśwież
            </Button>
          </View>
        )}
      </SafeAreaView>
    </BackgroundGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  diagonalStripe: {
    position: 'absolute',
    width: '150%',
    height: 120,
    left: -50,
    top: -50,
    transform: [{ rotate: '-8deg' }],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fullscreenExitButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mobileHeaderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  sessionInfo: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  sessionName: {
    fontSize: 16,
    marginTop: 8,
    fontStyle: 'italic'
  },
  sessionMetaInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  metaItem: {
    fontSize: 14,
    marginVertical: 2,
    opacity: 0.8
  },
  vitalsCard: {
    padding: Platform.select({
      default: 16,
      android: 12,
      ios: 12,
    }),
    margin: Platform.select({
      default: 8,
      android: 4,
      ios: 4,
    }),
    borderRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: Platform.select({
      default: 18,
      android: 16,
      ios: 16,
    }),
    fontWeight: 'bold',
    marginLeft: 8,
  },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  vitalItemCard: {
    flex: 1,
    padding: Platform.select({
      default: 8,
      android: 6,
      ios: 6,
    }),
    margin: Platform.select({
      default: 4,
      android: 2,
      ios: 2,
    }),
    borderRadius: 8,
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: Platform.select({
      default: 14,
      android: 12,
      ios: 12,
    }),
    opacity: 0.7,
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: Platform.select({
      default: 18,
      android: 16,
      ios: 16,
    }),
    fontWeight: '500',
  },
  fullscreenHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.12)',
  },
  fullscreenHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullscreenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  fullscreenContent: {
    flex: 1,
    padding: 16,
  },
  ekgCardFullscreen: {
    flex: 1,
    marginBottom: 16,
    borderRadius: 8,
    padding: 16,
  },
  vitalsCardFullscreen: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
  },
  fullscreenVitalsGrid: {
    flex: 1,
    justifyContent: 'space-between',
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
  },
  mobileSessionHeader: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerIcon: {
    marginRight: 8,
  },
  patientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  patientInfoText: {
    marginLeft: 8,
    fontSize: 16,
  },
  divider: {
    marginVertical: 8,
  },
  metaItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  metaItemLabel: {
    marginLeft: 8,
    fontSize: 14,
    opacity: 0.8,
  },
  vitalUnit: {
    fontSize: 14,
    opacity: 0.7,
    marginLeft: 2,
  },
});

export default StudentSessionScreen;
