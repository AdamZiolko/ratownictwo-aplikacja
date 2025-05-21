import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Platform } from "react-native";
import Slider from "@react-native-community/slider";
import {
  TextInput,
  HelperText,
  SegmentedButtons,
  Text,
  Button,
  Divider,
  useTheme,
  Portal,
  Modal,
  Switch,
} from "react-native-paper";
import { FormData, FormErrors } from "../types/types";
import { NoiseType } from "@/services/EkgFactory";
import { sessionService } from "@/services/SessionService";
import RhythmSelectionButton from "./RhythmSelectionButton";

interface SessionFormFieldsProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  formErrors: FormErrors;
  showGenerateCodeButton?: boolean;
}

interface MedicalSliderInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: boolean;
  theme: any;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  ticks: number[];
}

const MedicalSliderInput = ({
  label,
  value,
  onChange,
  error,
  theme,
  min,
  max,
  step,
  suffix,
  ticks,
}: MedicalSliderInputProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempValue, setTempValue] = useState(min);
  const [displayValue, setDisplayValue] = useState(min);
  const isWeb = Platform.OS === "web";
  const timeoutRef = useRef<NodeJS.Timeout>();
  const buttonCooldownRef = useRef(false);

  useEffect(() => {
    const initialValue = parseFloat(value) || min;
    setTempValue(initialValue);
    setDisplayValue(initialValue);
  }, [value, min]);

  useEffect(() => {
    if (modalVisible) {
      const newValue = parseFloat(value) || min;
      setTempValue(newValue);
      setDisplayValue(newValue);
    }
  }, [modalVisible, value, min]);

  const handleSave = () => {
    onChange(tempValue.toFixed(step < 1 ? 1 : 0));
    setModalVisible(false);
  };

  const handleValueChange = (v: number) => {
    const roundedValue = Math.round(v / step) * step;
    setDisplayValue(roundedValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setTempValue(roundedValue);
    }, 100);
  };

  const handleSlidingComplete = (v: number) => {
    const roundedValue = Math.round(v / step) * step;
    setDisplayValue(roundedValue);
    setTempValue(roundedValue);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const adjustValue = (direction: number) => {
    if (buttonCooldownRef.current) return;

    buttonCooldownRef.current = true;
    const newValue = tempValue + direction * step;
    const clampedValue = Math.max(min, Math.min(max, newValue));
    const roundedValue = Number(clampedValue.toFixed(10));
    setTempValue(roundedValue);
    setDisplayValue(roundedValue);

    setTimeout(() => {
      buttonCooldownRef.current = false;
    }, 300);
  };
  const decimalPlaces = step % 1 !== 0 ? 1 : 0;
  if (isWeb) {
    return (
      <View style={styles.webSliderContainer}>
        <Text
          style={{
            color: theme.colors.onSurface,
            marginBottom: 4,
            paddingHorizontal: 5,
          }}
        >
          {`${label}: ${displayValue.toFixed(decimalPlaces)}${
            suffix ? " " + suffix : ""
          }`}
        </Text>
        <View style={[styles.webSliderRow, { paddingHorizontal: 5 }]}>
          <Text style={{ color: theme.colors.onSurface, width: 35 }}>
            {min}
          </Text>
          <Slider
            style={[styles.webSlider, { flex: 1 }]}
            minimumValue={min}
            maximumValue={max}
            step={step}
            value={parseFloat(value) || min}
            onValueChange={(v) => {
              const roundedValue = Math.round(v / step) * step;
              setDisplayValue(roundedValue);
              onChange(roundedValue.toFixed(decimalPlaces));
            }}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.outline}
            thumbTintColor={theme.colors.primary}
          />
          <Text
            style={{
              color: theme.colors.onSurface,
              width: 35,
              textAlign: "right",
            }}
          >
            {max}
          </Text>
        </View>
        <View style={[styles.tickLabelContainer, { paddingHorizontal: 5 }]}>
          {ticks.map((t) => (
            <Text
              key={t}
              style={[styles.webTickLabel, { color: theme.colors.onSurface }]}
            >
              {t}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  return (
    <>
      <Button
        mode="outlined"
        onPress={() => setModalVisible(true)}
        style={[
          styles.sliderButton,
          { backgroundColor: theme.colors.surface, paddingHorizontal: 5 },
        ]}
        labelStyle={{ color: theme.colors.onSurface }}
      >
        {`${label}: ${value}${suffix ? " " + suffix : ""}`}
      </Button>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text
            variant="titleMedium"
            style={[styles.modalTitle, { color: theme.colors.onSurface }]}
          >
            {label}
          </Text>

          <View style={styles.sliderContainer}>
            <Slider
              style={styles.slider}
              minimumValue={min}
              maximumValue={max}
              step={step}
              value={tempValue}
              onValueChange={handleValueChange}
              onSlidingComplete={handleSlidingComplete}
              minimumTrackTintColor={theme.colors.primary}
              thumbTintColor={theme.colors.primary}
            />
          </View>

          <View style={styles.tickContainer}>
            {ticks.map((t) => (
              <View
                key={t}
                style={[
                  styles.tick,
                  { backgroundColor: theme.colors.onSurface },
                ]}
              />
            ))}
          </View>
          <View style={styles.tickLabelContainer}>
            {ticks.map((t) => (
              <Text
                key={t}
                style={[styles.tickLabel, { color: theme.colors.onSurface }]}
              >
                {t}
              </Text>
            ))}
          </View>

          <View style={styles.valueControls}>
            <Button
              mode="outlined"
              onPress={() => adjustValue(-1)}
              style={styles.adjustButton}
              labelStyle={styles.adjustButtonLabel}
            >
              -
            </Button>

            <Text
              style={[styles.displayValue, { color: theme.colors.onSurface }]}
            >
              {displayValue.toFixed(decimalPlaces)}
              {suffix ? " " + suffix : ""}
            </Text>

            <Button
              mode="outlined"
              onPress={() => adjustValue(1)}
              style={styles.adjustButton}
              labelStyle={styles.adjustButtonLabel}
            >
              +
            </Button>
          </View>

          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            labelStyle={{ color: theme.colors.onPrimary }}
          >
            Zapisz
          </Button>
        </Modal>
      </Portal>
    </>
  );
};

const SessionFormFields = ({
  formData,
  setFormData,
  formErrors,
  showGenerateCodeButton = false,
}: SessionFormFieldsProps) => {
  const theme = useTheme();

  
  const handleBpmChange = (text: string) => {
    
    const numericValue = text.replace(/[^0-9]/g, "");
    setFormData({ ...formData, beatsPerMinute: numericValue });
  };
  return (
    <View style={styles.formContainer}>
      <TextInput
        label="Nazwa sesji"
        value={formData.name}
        onChangeText={(t) => setFormData({ ...formData, name: t })}
        mode="outlined"
        style={styles.input}
        placeholder="Wprowadź nazwę sesji"
      />
      <MedicalSliderInput
        label="Temperatura"
        value={formData.temperature}
        onChange={(v) => setFormData({ ...formData, temperature: v })}
        error={!!formErrors.temperature}
        theme={theme}
        min={30}
        max={40}
        step={0.1}
        suffix="°C"
        ticks={Array.from({ length: 11 }, (_, i) => 30 + i)}
      />
      {formErrors.temperature && (
        <HelperText type="error">{formErrors.temperature}</HelperText>
      )}
      <RhythmSelectionButton
        selectedType={formData.rhythmType}
        setSelectedType={(type) =>
          setFormData({ ...formData, rhythmType: type })
        }
      />
      <TextInput
        label="Tętno (BPM)"
        value={formData.beatsPerMinute}
        onChangeText={handleBpmChange}
        keyboardType="number-pad"
        mode="outlined"
        style={styles.input}
        error={!!formErrors.beatsPerMinute}
        placeholder="Wprowadź wartość BPM"
        maxLength={3} 
      />
      {formErrors.beatsPerMinute ? (
        <HelperText type="error">{formErrors.beatsPerMinute}</HelperText>
      ) : (
        <HelperText type="info">Tylko cyfry (30-220)</HelperText>
      )}
      <Text variant="titleSmall">Poziom szumów</Text>
      <SegmentedButtons
        value={formData.noiseLevel.toString()}
        onValueChange={(v) =>
          setFormData({ ...formData, noiseLevel: parseInt(v, 10) })
        }
        buttons={[
          { value: NoiseType.NONE.toString(), label: "Brak" },
          { value: NoiseType.MILD.toString(), label: "Łagodne" },
          { value: NoiseType.MODERATE.toString(), label: "Umiarkowane" },
          { value: NoiseType.SEVERE.toString(), label: "Silne" },
        ]}
        style={styles.segmentedButtons}
      />
      <TextInput
        label="Kod sesji"
        value={formData.sessionCode}
        onChangeText={(t) => setFormData({ ...formData, sessionCode: t })}
        keyboardType="number-pad"
        mode="outlined"
        style={styles.input}
        error={!!formErrors.sessionCode}
        maxLength={6}
      />
      {formErrors.sessionCode ? (
        <HelperText type="error">{formErrors.sessionCode}</HelperText>
      ) : (
        <HelperText type="info">
          6-cyfrowy kod do udostępnienia studentom
        </HelperText>
      )}
      {showGenerateCodeButton && (
        <Button
          mode="text"
          onPress={() =>
            setFormData({
              ...formData,
              sessionCode: sessionService.generateSessionCode().toString(),
            })
          }
          style={styles.generateButton}
        >
          Generuj losowy kod
        </Button>
      )}{" "}
      <View
        style={{
          flexDirection: "column",
          marginVertical: 8,
          paddingHorizontal: 5,
        }}
      >
        <Text variant="titleSmall">Status sesji</Text>
        <View style={styles.switchContainer}>
          <Text
            style={{
              color: formData.isActive
                ? theme.colors.primary
                : theme.colors.outline,
            }}
          >
            {formData.isActive ? "Aktywna" : "Nieaktywna"}
          </Text>
          <Switch
            value={formData.isActive}
            onValueChange={(value) =>
              setFormData({ ...formData, isActive: value })
            }
            color={theme.colors.primary}
          />
        </View>
        <View style={styles.switchContainer}>
          <Text
            style={{
              color: formData.isEkdDisplayHidden
                ? theme.colors.error
                : theme.colors.outline,
            }}
          >
            {formData.isEkdDisplayHidden ? "EKG ukryte" : "EKG widoczne"}
          </Text>
          <Switch
            value={formData.isEkdDisplayHidden}
            onValueChange={(value) =>
              setFormData({ ...formData, isEkdDisplayHidden: value })
            }
            color={theme.colors.primary}
          />
        </View>
      </View>
      <Divider style={styles.divider} />
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Parametry medyczne
      </Text>
      <View style={styles.paramRow}>
        <TextInput
          label="Ciśnienie krwi (BP)"
          value={formData.bp}
          onChangeText={(t) => setFormData({ ...formData, bp: t })}
          mode="outlined"
          style={styles.inputHalf}
          right={<TextInput.Affix text="mmHg" />}
        />
      </View>
      <MedicalSliderInput
        label="SpO₂"
        value={formData.spo2}
        onChange={(v) => setFormData({ ...formData, spo2: v })}
        error={!!formErrors.spo2}
        theme={theme}
        min={70}
        max={100}
        step={1}
        suffix="%"
        ticks={[70, 75, 80, 85, 90, 95, 100]}
      />
      {formErrors.spo2 && (
        <HelperText type="error">{formErrors.spo2}</HelperText>
      )}
      <MedicalSliderInput
        label="EtCO₂"
        value={formData.etco2}
        onChange={(v) => setFormData({ ...formData, etco2: v })}
        error={!!formErrors.etco2}
        theme={theme}
        min={20}
        max={60}
        step={1}
        suffix="mmHg"
        ticks={[20, 30, 40, 50, 60]}
      />
      {formErrors.etco2 && (
        <HelperText type="error">{formErrors.etco2}</HelperText>
      )}{" "}
      <MedicalSliderInput
        label="Częstość oddechów (RR)"
        value={formData.rr}
        onChange={(v) => setFormData({ ...formData, rr: v })}
        error={!!formErrors.rr}
        theme={theme}
        min={10}
        max={30}
        step={1}
        suffix="oddechów/min"
        ticks={[10, 15, 20, 25, 30]}
      />
      {formErrors.rr && <HelperText type="error">{formErrors.rr}</HelperText>}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    marginBottom: 8,
  },
  inputHalf: {
    flex: 1,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  paramRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: -4,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
    paddingHorizontal: 5,
  },
  generateButton: {
    marginTop: 0,
    alignSelf: "flex-start",
    paddingHorizontal: 5,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 12,
    fontWeight: "bold",
    paddingHorizontal: 5,
  },
  divider: {
    marginVertical: 16,
  },
  sliderButton: {
    marginBottom: 8,
    borderRadius: 4,
    paddingHorizontal: 5,
  },
  modalContent: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 15,
    fontWeight: "bold",
  },
  sliderContainer: {
    marginVertical: 10,
    paddingHorizontal: 5,
  },
  slider: {
    width: "100%",
    height: 50,
    marginVertical: 10,
  },
  valueControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  adjustButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginHorizontal: 20,
  },
  adjustButtonLabel: {
    fontSize: 24,
    lineHeight: 30,
  },
  displayValue: {
    textAlign: "center",
    fontSize: 24,
    minWidth: 80,
    marginHorizontal: 10,
  },
  saveButton: {
    marginTop: 10,
  },
  tickContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -10,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  tick: {
    width: 1,
    height: 8,
  },
  tickLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  tickLabel: {
    fontSize: 12,
  },

  webSliderContainer: {
    marginBottom: 16,
    width: "100%",
    paddingHorizontal: 5,
  },
  webSliderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  webSlider: {
    height: 40,
    marginHorizontal: 8,
  },
  webTickLabel: {
    fontSize: 10,
    textAlign: "center",
  },  formContainer: {
    padding: 5,
  },
});

export default SessionFormFields;