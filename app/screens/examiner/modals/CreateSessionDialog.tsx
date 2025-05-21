import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Dimensions } from "react-native";
import { Button, Dialog } from "react-native-paper";
import { FormData, FormErrors } from "../types/types";
import SessionFormFields from "../components/SessionFormFields";
import { EkgType, NoiseType } from "@/services/EkgFactory";
import { sessionService } from "@/services/SessionService";

interface CreateSessionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  initialData?: FormData;
  onCreateSession: (formData: FormData) => void;
  onOpenSavePresetDialog: (formData: FormData) => void;
  onOpenLoadPresetDialog: () => void;
}

const CreateSessionDialog = ({
  visible,
  onDismiss,
  initialData,
  onCreateSession,
  onOpenSavePresetDialog,
  onOpenLoadPresetDialog,
}: CreateSessionDialogProps) => {
  useEffect(() => {
    if (visible && initialData) {
      setFormData(initialData);
    }
  }, [visible, initialData]);

  const [formData, setFormData] = useState<FormData>(
    initialData || {
      name: "",
      temperature: "36.6",
      rhythmType: EkgType.NORMAL_SINUS_RHYTHM,
      beatsPerMinute: "72",
      noiseLevel: NoiseType.NONE,
      sessionCode: sessionService.generateSessionCode(),
      isActive: true,
      isEkdDisplayHidden: false,
      bp: "120/80",
      spo2: "98",
      etco2: "35",
      rr: "12",
    },
  );

  const [formErrors, setFormErrors] = useState<FormErrors>({
    temperature: "",
    beatsPerMinute: "",
    sessionCode: "",
    spo2: "",
    etco2: "",
    rr: "",
  });

  const validateForm = () => {
    const errors = {
      temperature: "",
      beatsPerMinute: "",
      sessionCode: "",
      spo2: "",
      etco2: "",
      rr: "",
    };

    let isValid = true;

    const temp = parseFloat(formData.temperature);
    if (!formData.temperature || isNaN(temp)) {
      errors.temperature = "Podaj prawidłową temperaturę";
      isValid = false;
    } else if (temp < 30 || temp > 43) {
      errors.temperature = "Temperatura musi być w zakresie 30-43°C";
      isValid = false;
    }
    const bpm = parseInt(formData.beatsPerMinute);
    if (!formData.beatsPerMinute || isNaN(bpm)) {
      errors.beatsPerMinute = "Podaj prawidłowe tętno";
      isValid = false;
    } else if (!/^\d+$/.test(formData.beatsPerMinute)) {
      errors.beatsPerMinute = "Tętno może zawierać tylko cyfry";
      isValid = false;
    } else if (bpm < 30 || bpm > 220) {
      errors.beatsPerMinute = "Tętno musi być w zakresie 30-220";
      isValid = false;
    }

    if (!formData.sessionCode) {
      errors.sessionCode = "Kod sesji jest wymagany";
      isValid = false;
    } else if (formData.sessionCode.length !== 6) {
      errors.sessionCode = "Kod musi zawierać 6 znaków";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleCreateSession = () => {
    if (validateForm()) {
      onCreateSession(formData);
    }
  };

  const handleOpenSavePreset = () => {
    onOpenSavePresetDialog(formData);
  };
  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={{
        maxHeight: Dimensions.get("window").height * 0.8,
        width: "90%",
        alignSelf: "center",
      }}
    >
      <Dialog.Title>Utwórz nową sesję</Dialog.Title>
      <Dialog.ScrollArea style={styles.dialogScrollArea}>
        <ScrollView>
          <View style={styles.dialogContent}>
            <View style={styles.presetButtonsContainer}>
              <Button
                mode="outlined"
                onPress={onOpenLoadPresetDialog}
                style={styles.presetButton}
              >
                Wczytaj preset
              </Button>
              <Button
                mode="contained-tonal"
                onPress={handleOpenSavePreset}
                style={styles.presetButton}
              >
                Zapisz jako preset
              </Button>
            </View>

            <SessionFormFields
              formData={formData}
              setFormData={setFormData}
              formErrors={formErrors}
              showGenerateCodeButton={true}
            />
          </View>
        </ScrollView>
      </Dialog.ScrollArea>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Anuluj</Button>
        <Button onPress={handleCreateSession}>Utwórz</Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  dialogScrollArea: {
    maxHeight: Dimensions.get("window").height * 0.7,
  },
  dialogContent: {
    paddingVertical: 8,
  },
  presetButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
    gap: 8,
  },
  presetButton: {
    flex: 1,
  },
});

export default CreateSessionDialog;