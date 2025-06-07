import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Button, Dialog } from 'react-native-paper';
import { FormData, FormErrors, Session } from '../types/types';
import SessionFormFields from '../components/SessionFormFields';
import { EkgType, NoiseType } from '@/services/EkgFactory';

interface EditSessionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  session: Session | null;
  onUpdateSession: (formData: FormData) => Promise<void>;
}

const EditSessionDialog: React.FC<EditSessionDialogProps> = ({
  visible,
  onDismiss,
  session,
  onUpdateSession,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    temperature: '36.6',
    rhythmType: EkgType.NORMAL_SINUS_RHYTHM,
    beatsPerMinute: '72',
    noiseLevel: NoiseType.NONE,
    sessionCode: '',
    isActive: true,
    isEkdDisplayHidden: false,
    showColorsConfig: true,
    bp: '120/80',
    spo2: '98',
    etco2: '35',
    rr: '12',
  });

  const [formErrors, setFormErrors] = useState<FormErrors & { name: string; bp: string }>({
    name: '',
    temperature: '',
    beatsPerMinute: '',
    sessionCode: '',
    spo2: '',
    etco2: '',
    rr: '',
    bp: '',
  });

  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (visible && session) {
      setFormData({
        name: session.name || '',
        temperature: session.temperature ? session.temperature.toString() : '36.6',
        rhythmType: session.rhythmType as EkgType,
        beatsPerMinute: session.beatsPerMinute ? session.beatsPerMinute.toString() : '72',
        noiseLevel: session.noiseLevel as NoiseType,
        sessionCode: session.sessionCode || '',
        isActive: session.isActive !== undefined ? session.isActive : true,
        isEkdDisplayHidden:
          session.isEkdDisplayHidden !== undefined ? session.isEkdDisplayHidden : false,
        showColorsConfig:
          session.showColorsConfig !== undefined ? session.showColorsConfig : true,
        bp: session.bp || '120/80',
        spo2: session.spo2 ? session.spo2.toString() : '98',
        etco2: session.etco2 ? session.etco2.toString() : '35',
        rr: session.rr ? session.rr.toString() : '12',
      });
      setFormErrors({
        name: '',
        temperature: '',
        beatsPerMinute: '',
        sessionCode: '',
        spo2: '',
        etco2: '',
        rr: '',
        bp: '',
      });
      setIsUpdating(false);
    }
  }, [visible, session]);

  const validateForm = () => {
    const errors: typeof formErrors = {
      name: '',
      temperature: '',
      beatsPerMinute: '',
      sessionCode: '',
      spo2: '',
      etco2: '',
      rr: '',
      bp: '',
    };
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Pole nazwa sesji jest wymagane.';
      isValid = false;
    }
    if (!formData.bp.trim()) {
      errors.bp = 'Pole ciśnienie krwi jest wymagane.';
      isValid = false;
    }
    const temp = parseFloat(formData.temperature);
    if (!formData.temperature || isNaN(temp)) {
      errors.temperature = 'Podaj prawidłową temperaturę';
      isValid = false;
    } else if (temp < 30 || temp > 43) {
      errors.temperature = 'Temperatura musi być w zakresie 30-43°C';
      isValid = false;
    }
    const bpm = parseInt(formData.beatsPerMinute, 10);
    if (!formData.beatsPerMinute || isNaN(bpm)) {
      errors.beatsPerMinute = 'Podaj prawidłowe tętno';
      isValid = false;
    } else if (!/^\d+$/.test(formData.beatsPerMinute)) {
      errors.beatsPerMinute = 'Tętno może zawierać tylko cyfry';
      isValid = false;
    } else if (bpm < 30 || bpm > 220) {
      errors.beatsPerMinute = 'Tętno musi być w zakresie 30-220';
      isValid = false;
    }
    if (!formData.sessionCode) {
      errors.sessionCode = 'Kod sesji jest wymagany';
      isValid = false;
    } else if (formData.sessionCode.length !== 6) {
      errors.sessionCode = 'Kod musi zawierać 6 znaków';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }
    setIsUpdating(true);
    try {
      await onUpdateSession(formData);
    } catch {
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={{
        maxHeight: Dimensions.get('window').height * 0.8,
        width: '90%',
        alignSelf: 'center',
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
        <Button onPress={onDismiss} disabled={isUpdating}>
          Anuluj
        </Button>
        <Button onPress={handleUpdate} loading={isUpdating} disabled={isUpdating}>
          Zaktualizuj
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  dialogScrollArea: {
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  dialogContent: {
    paddingVertical: 8,
  },
});

export default EditSessionDialog;