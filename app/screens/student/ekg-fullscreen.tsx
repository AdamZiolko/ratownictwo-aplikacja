// app/ekg-fullscreen.tsx
import React, { useState } from "react";
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Platform, 
  TouchableOpacity 
} from "react-native";
import {
  Text,
  Appbar,
  Surface,
  useTheme,
  ActivityIndicator,
  Button,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import EkgCardDisplay from "@/components/ekg/EkgCardDisplay";
import EkgDisplay from "@/components/ekg/EkgDisplay";
import Spo2Chart from "@/components/ekg/Spo2Chart";
import Etco2Chart from "@/components/ekg/Etco2Chart";
import { useSessionManager } from "./hooks/useSessionManager";
import { useVitalSigns } from "./hooks/useVitalSigns";

type ParamsType = {
  accessCode: string;
  firstName: string;
  lastName: string;
  albumNumber: string;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Typy wykresów
type ChartType = 'ekg' | 'spo2' | 'etco2';

const EkgFullscreenScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const [activeChart, setActiveChart] = useState<ChartType>('ekg');

  // Parametry z URL
  const { accessCode, firstName, lastName, albumNumber } =
    useLocalSearchParams<ParamsType>();

  // Podłączenie do sesji
  const { sessionData, isLoading, error } = useSessionManager({
    accessCode: accessCode || "",
    firstName: firstName || "",
    lastName: lastName || "",
    albumNumber: albumNumber || "",
  });

  // Vital signs
  const {
    temperature,
    bloodPressure,
    spo2,
    etco2,
    respiratoryRate,
    formatBloodPressure,
  } = useVitalSigns(sessionData);

  const handleGoBack = () => {
    router.back();
  };

  // Przełączanie między wykresami
  const switchChart = () => {
    if (activeChart === 'ekg') setActiveChart('spo2');
    else if (activeChart === 'spo2') setActiveChart('etco2');
    else setActiveChart('ekg');
  };

  // Ekran ładowania
  if (isLoading || !sessionData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <Appbar.BackAction onPress={handleGoBack} />
          <Appbar.Content title="Ekran EKG" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Ładowanie wykresu…
          </Text>
        </View>
      </View>
    );
  }

  // Ekran błędu
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={[styles.header, { backgroundColor: theme.colors.background }]}>
          <Appbar.BackAction onPress={handleGoBack} />
          <Appbar.Content title="Ekran EKG" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Błąd ładowania sesji
          </Text>
          <Button mode="contained" onPress={handleGoBack}>
            Powrót
          </Button>
        </View>
      </View>
    );
  }

  // Wyciągnięcie danych
  const ekgType = sessionData.rhythmType;
  const bpm = sessionData.beatsPerMinute ?? 0;

  const tempNum = temperature?.currentValue ?? 0;
  const tempUnit = temperature?.unit ?? "";
  const bpSysNum = bloodPressure?.systolic ?? 0;
  const bpDiaNum = bloodPressure?.diastolic ?? 0;
  const spo2Num = spo2?.currentValue ?? 0;
  const spo2Unit = spo2?.unit ?? "";
  const etco2Num = etco2?.currentValue ?? 0;
  const etco2Unit = etco2?.unit ?? "";
  const rrNum = respiratoryRate?.currentValue ?? 0;
  const rrUnit = respiratoryRate?.unit ?? "";

  // ** Web: używamy EkgCardDisplay w całości **
  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <Appbar.Header style={[styles.header, { backgroundColor: "#000" }]}>
          <Appbar.BackAction onPress={handleGoBack} color="#fff" />
          <Appbar.Content title="Ekran EKG" titleStyle={{ color: "#fff" }} />
        </Appbar.Header>

        <SafeAreaView style={styles.safeArea}>
          <EkgCardDisplay
            ekgType={ekgType}
            bpm={bpm}
            isRunning={true}
          />

          <Surface style={styles.paramsContainer}>
            <View style={styles.row}>
              <ParamBlock
                label="ECG"
                value={`${bpm} bpm`}
                color={theme.colors.secondary}
              />
              <ParamBlock
                label="Temp"
                value={`${tempNum.toFixed(1)} ${tempUnit}`}
                color="#FFD54F"
              />
              <ParamBlock
                label="BP"
                value={`${bpSysNum}/${bpDiaNum} mmHg`}
                color="#4FC3F7"
              />
            </View>
            <View style={styles.row}>
              <ParamBlock
                label="SpO₂"
                value={`${spo2Num.toFixed(1)} ${spo2Unit}`}
                color="#A5D6A7"
              />
              <ParamBlock
                label="EtCO₂"
                value={`${etco2Num.toFixed(1)} ${etco2Unit}`}
                color="#CE93D8"
              />
              <ParamBlock
                label="RR"
                value={`${rrNum.toFixed(1)} ${rrUnit}`}
                color="#E57373"
              />
            </View>
          </Surface>
        </SafeAreaView>
      </View>
    );
  }

  // ** Mobile: wstawiamy goły EkgDisplay zamiast EkgCardDisplay **
  return (
    <View style={styles.container}>
      <Appbar.Header style={[styles.header, { backgroundColor: "#000" }]}>
        <Appbar.BackAction onPress={handleGoBack} color="#fff" />
        <Appbar.Content title="Ekran EKG" titleStyle={{ color: "#fff" }} />
      </Appbar.Header>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.mobileTopContainer}>
          {/* Obszar wykresu (klikalny) */}
          <TouchableOpacity 
            style={styles.chartContainer}
            onPress={switchChart}
            activeOpacity={0.8}
          >
            {activeChart === 'ekg' && (
              <EkgDisplay
                ekgType={ekgType}
                bpm={bpm}
                isRunning={true}
                svgHeight={580}
                viewBoxHeight={500}
                bpmFontSize={22}
              />
            )}
            {activeChart === 'spo2' && (
              <Spo2Chart
                value={spo2Num}
              />
            )}
            {activeChart === 'etco2' && (
              <Etco2Chart
                value={etco2Num}
                height={580}
              />
            )}
          </TouchableOpacity>

          <View style={styles.rightParams}>
            <ParamBlock
              label="ECG"
              value={`${bpm} bpm`}
              color={theme.colors.secondary}
            />
            <ParamBlock
              label="Temp"
              value={`${tempNum.toFixed(1)} ${tempUnit}`}
              color="#FFD54F"
            />
            <ParamBlock
              label="BP"
              value={`${bpSysNum}/${bpDiaNum} mmHg`}
              color="#4FC3F7"
            />
          </View>
        </View>

        <View style={styles.mobileBottomContainer}>
          <ParamBlock
            label="SpO₂"
            value={`${spo2Num.toFixed(1)} ${spo2Unit}`}
            color="#A5D6A7"
            isMobileSmall={true}
          />
          <ParamBlock
            label="EtCO₂"
            value={`${etco2Num.toFixed(1)} ${etco2Unit}`}
            color="#CE93D8"
            isMobileSmall={true}
          />
          <ParamBlock
            label="RR"
            value={`${rrNum.toFixed(1)} ${rrUnit}`}
            color="#E57373"
            isMobileSmall={true}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

type ParamBlockProps = {
  label: string;
  value: string;
  color: string;
  isMobileSmall?: boolean;
};
const ParamBlock: React.FC<ParamBlockProps> = ({
  label,
  value,
  color,
  isMobileSmall = false,
}) => (
  <Surface
    style={[
      styles.paramBlock,
      isMobileSmall && styles.paramBlockMobileSmall,
    ]}
    elevation={1}
  >
    <Text
      style={[
        styles.paramLabel,
        isMobileSmall && styles.paramLabelMobileSmall,
        { color },
      ]}
    >
      {label}
    </Text>
    <Text
      style={[
        styles.paramValue,
        isMobileSmall && styles.paramValueMobileSmall,
        { color },
      ]}
    >
      {value}
    </Text>
  </Surface>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    backgroundColor: "#000",
    elevation: 0,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },

  // ** WEB **

  paramsContainer: {
    backgroundColor: "#111",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },

  // ** MOBILE **

  mobileTopContainer: {
    flexDirection: "row",
    flex: 6,
  },
  chartContainer: {
    flex: 2,
    marginRight: 4,
    backgroundColor: "transparent",
  },
  rightParams: {
    flex: 1,
    justifyContent: "space-evenly",
    backgroundColor: "#111",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },

  mobileBottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 2,
    backgroundColor: "#111",
    paddingHorizontal: 2,
    paddingVertical: 2,
  },

  paramBlock: {
    flex: 1,
    alignItems: "center",
    margin: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#222",
  },
  paramLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    opacity: 0.8,
  },
  paramValue: {
    fontSize: 20,
    fontWeight: "700",
  },

  paramBlockMobileSmall: {
    margin: 1,
    padding: 4,
  },
  paramLabelMobileSmall: {
    fontSize: 10,
    marginBottom: 2,
  },
  paramValueMobileSmall: {
    fontSize: 14,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorText: {
    fontSize: 16,
    marginBottom: 12,
  },
});

export default EkgFullscreenScreen;