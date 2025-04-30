import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
} from "react-native";
import {
  TextInput,
  HelperText,
  SegmentedButtons,
  Text,
  Button,
  Divider,
  useTheme
} from "react-native-paper";
import { FormData, FormErrors } from "../types/types";
import { EkgType, NoiseType } from "@/services/EkgFactory";
import { sessionService } from "@/services/SessionService";
import RhythmSelectionSlider from "./RhythmSelectionSlider";

interface SessionFormFieldsWithSliderProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  formErrors: FormErrors;
  showGenerateCodeButton?: boolean;
}

const SessionFormFieldsWithSlider = ({
  formData,
  setFormData,
  formErrors,
  showGenerateCodeButton = false,
}: SessionFormFieldsWithSliderProps) => {
  const theme = useTheme();



  useEffect(() => {
    console.log(formData)
  }, [formData]);

  return (
    <>
      <TextInput
        label="Nazwa sesji"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        mode="outlined"
        style={styles.input}
        placeholder="Wprowadź nazwę sesji"
      />

      <TextInput
        label="Temperatura (°C)"
        value={formData.temperature}
        onChangeText={(text) => setFormData({ ...formData, temperature: text })}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
        error={!!formErrors.temperature}
      />
      {formErrors.temperature ? (
        <HelperText type="error">{formErrors.temperature}</HelperText>
      ) : null}      
      
      <Text variant="titleSmall">Typ rytmu serca</Text>

      <RhythmSelectionSlider
        selectedType={formData.rhythmType}
        setSelectedType={(type) => setFormData({ ...formData, rhythmType: type })}
      />

      <TextInput
        label="Tętno (BPM)"
        value={formData.beatsPerMinute}
        onChangeText={(text) => setFormData({ ...formData, beatsPerMinute: text })}
        keyboardType="number-pad"
        mode="outlined"
        style={styles.input}
        error={!!formErrors.beatsPerMinute}
      />
      {formErrors.beatsPerMinute ? (
        <HelperText type="error">{formErrors.beatsPerMinute}</HelperText>
      ) : null}

      <Text variant="titleSmall">Poziom szumów</Text>
      <SegmentedButtons
        value={formData.noiseLevel.toString()}
        onValueChange={(value) => setFormData({ ...formData, noiseLevel: parseInt(value) })}
        buttons={[
          { value: NoiseType.NONE.toString(), label: 'Brak' },
          { value: NoiseType.MILD.toString(), label: 'Łagodne' },
          { value: NoiseType.MODERATE.toString(), label: 'Umiarkowane' },
          { value: NoiseType.SEVERE.toString(), label: 'Silne' },
        ]}
        style={styles.segmentedButtons}
      />

      <TextInput
        label="Kod sesji"
        value={formData.sessionCode}
        onChangeText={(text) => setFormData({ ...formData, sessionCode: text })}
        keyboardType="number-pad"
        mode="outlined"
        style={styles.input}
        error={!!formErrors.sessionCode}
        maxLength={6}
      />
      {formErrors.sessionCode ? (
        <HelperText type="error">{formErrors.sessionCode}</HelperText>
      ) : (
        <HelperText type="info">6-cyfrowy kod do udostępnienia studentom</HelperText>
      )}

      {showGenerateCodeButton && (
        <Button
          mode="text"
          onPress={() => setFormData({ ...formData, sessionCode: sessionService.generateSessionCode().toString() })}
          style={styles.generateButton}
        >
          Generuj losowy kod
        </Button>
      )}

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.sectionTitle}>Parametry medyczne</Text>

      <View style={styles.paramRow}>
        <TextInput
          label="Ciśnienie krwi (BP)"
          value={formData.bp}
          onChangeText={(text) => setFormData({ ...formData, bp: text })}
          keyboardType="default"
          mode="outlined"
          style={styles.inputHalf}
          right={<TextInput.Affix text="mmHg" />}
          placeholder="np. 120/80"
        />
      </View>

      <View style={styles.paramRow}>
        <TextInput
          label="SpO₂"
          value={formData.spo2}
          onChangeText={(text) => setFormData({ ...formData, spo2: text })}
          keyboardType="number-pad"
          mode="outlined"
          style={styles.inputHalf}
          right={<TextInput.Affix text="%" />}
        />

        <TextInput
          label="EtCO₂"
          value={formData.etco2}
          onChangeText={(text) => setFormData({ ...formData, etco2: text })}
          keyboardType="number-pad"
          mode="outlined"
          style={styles.inputHalf}
          right={<TextInput.Affix text="mmHg" />}
        />
      </View>

      <TextInput
        label="Częstość oddechów (RR)"
        value={formData.rr}
        onChangeText={(text) => setFormData({ ...formData, rr: text })}
        keyboardType="number-pad"
        mode="outlined"
        style={styles.input}
        right={<TextInput.Affix text="oddechów/min" />}
      />
    </>
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
  selectionCard: {
    marginBottom: 16,
  },
  radioRow: {
    marginVertical: 2,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  generateButton: {
    marginTop: 0,
    alignSelf: "flex-start",
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 12,
    fontWeight: "bold",
  },
  rhythmCard: {
    marginBottom: 16,
  },
  rhythmCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    marginVertical: 16,
  }
});

export default SessionFormFieldsWithSlider;