import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Dimensions } from "react-native";
import { Button, Dialog } from "react-native-paper";
import { FormData, FormErrors, Session } from "../types/types";
import SessionFormFields from "../components/SessionFormFields";
import { EkgType, NoiseType } from "@/services/EkgFactory";

interface EditSessionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  session: Session | null;
  onUpdateSession: (formData: FormData) => void;
}

const EditSessionDialog = ({
  visible,
  onDismiss,
  session,
  onUpdateSession,
}: EditSessionDialogProps) => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    temperature: "36.6",
    rhythmType: EkgType.NORMAL_SINUS_RHYTHM,
    beatsPerMinute: "72",
    noiseLevel: NoiseType.NONE,
    sessionCode: "",
    isActive: true,
    isEkdDisplayHidden: false,
    bp: "120/80",
    spo2: "98",
    etco2: "35",
    rr: "12",
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({
    temperature: "",
    beatsPerMinute: "",
    sessionCode: "",
    spo2: "",
    etco2: "",
    rr: "",
  });

  useEffect(() => {
    if (session) {
      setFormData({
        temperature: session.temperature
          ? session.temperature.toString()
          : "36.6",
        rhythmType: session.rhythmType as EkgType,
        beatsPerMinute: session.beatsPerMinute
          ? session.beatsPerMinute.toString()
          : "72",
        noiseLevel: session.noiseLevel as NoiseType,
        sessionCode: session.sessionCode ? session.sessionCode.toString() : "",
        isActive: session.isActive !== undefined ? session.isActive : true,
        isEkdDisplayHidden:
          session.isEkdDisplayHidden !== undefined
            ? session.isEkdDisplayHidden
            : false,
        bp: session.bp || "120/80",
        spo2: session.spo2 ? session.spo2.toString() : "98",
        etco2: session.etco2 ? session.etco2.toString() : "35",
        rr: session.rr ? session.rr.toString() : "12",
        name: session.name || "",
      });
    }
  }, [session]);

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

  const handleUpdateSession = () => {
    if (validateForm()) {
      onUpdateSession(formData);
    }
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
      <Dialog.Title>Edytuj sesję</Dialog.Title>
      <Dialog.ScrollArea style={styles.dialogScrollArea}>
        <ScrollView>
          <View style={styles.dialogContent}>
            <SessionFormFields
              formData={formData}
              setFormData={setFormData}
              formErrors={formErrors}
              showGenerateCodeButton={false}
            />
          </View>
        </ScrollView>
      </Dialog.ScrollArea>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Anuluj</Button>
        <Button onPress={handleUpdateSession}>Zaktualizuj</Button>
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
});

export default EditSessionDialog;