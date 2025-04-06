import { NoiseType } from '@/services/EkgFactory';
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { RadioButton, useTheme } from 'react-native-paper';

interface NoiseControlsProps {
  noiseType: NoiseType;
  onNoiseTypeChange: (type: NoiseType) => void;
}

const NoiseControls: React.FC<NoiseControlsProps> = ({
  noiseType,
  onNoiseTypeChange
}) => {
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={
          {
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 8,
            color: theme.colors.onSurface
          }
        }
      >
        Jakość Sygnału
      </Text>
      <Text style={{
            fontSize: 13,
            marginBottom: 16,
            lineHeight: 18,
            color: theme.colors.onSurfaceVariant
      }}>
        Dostosuj poziom zakłóceń, aby symulować rzeczywiste warunki rejestracji EKG.
        Personel medyczny musi interpretować EKG z różnymi artefaktami.
      </Text>
      
      <View style={styles.noiseSelector}>
        <RadioButton.Group 
          onValueChange={(value) => onNoiseTypeChange(value as NoiseType)} 
          value={noiseType}
        >
          <View style={styles.radioItem}>
            <RadioButton.Android 
              value={NoiseType.NONE}
              color={theme.colors.primary}
              uncheckedColor={theme.colors.outline}
            />
            <Text style={[styles.radioLabel, {color: theme.colors.onSurface}]}>Brak (Idealny Sygnał)</Text>
          </View>
          
          <View style={styles.radioItem}>
            <RadioButton.Android 
              value={NoiseType.MILD}
              color={theme.colors.primary}
              uncheckedColor={theme.colors.outline}
            />
            <Text style={[styles.radioLabel, {color: theme.colors.onSurface}]}>Łagodne Zakłócenia (Niewielkie Interferencje)</Text>
          </View>
          
          <View style={styles.radioItem}>
            <RadioButton.Android 
              value={NoiseType.MODERATE}
              color={theme.colors.primary}
              uncheckedColor={theme.colors.outline}
            />
            <Text style={[styles.radioLabel, {color: theme.colors.onSurface}]}>Umiarkowane Zakłócenia (Warunki Kliniczne)</Text>
          </View>
          
          <View style={styles.radioItem}>
            <RadioButton.Android 
              value={NoiseType.SEVERE}
              color={theme.colors.primary}
              uncheckedColor={theme.colors.outline}
            />
            <Text style={[styles.radioLabel, {color: theme.colors.onSurface}]}>Silne Zakłócenia (Trudne Warunki)</Text>
          </View>
        </RadioButton.Group>
      </View>
      
      <View style={[styles.noiseExplanation, {backgroundColor: `${theme.colors.surfaceVariant}`}]}>
        <Text style={[styles.noiseExplanationTitle, {color: theme.colors.onSurface}]}>
          Uwzględnione Typy Zakłóceń:
        </Text>
        <View style={styles.noiseTypeItem}>
          <Text style={[styles.noiseTypeName, {color: theme.colors.onSurface}]}>• Zakłócenia wysokiej częstotliwości:</Text>
          <Text style={[styles.noiseTypeDescription, {color: theme.colors.onSurfaceVariant}]}>
            Interferencje elektryczne, problemy ze sprzętem
          </Text>
        </View>
        <View style={styles.noiseTypeItem}>
          <Text style={[styles.noiseTypeName, {color: theme.colors.onSurface}]}>• Dryfowanie linii bazowej:</Text>
          <Text style={[styles.noiseTypeDescription, {color: theme.colors.onSurfaceVariant}]}>
            Oddychanie pacjenta, ruchy
          </Text>
        </View>
        <View style={styles.noiseTypeItem}>
          <Text style={[styles.noiseTypeName, {color: theme.colors.onSurface}]}>• Artefakty mięśniowe:</Text>
          <Text style={[styles.noiseTypeDescription, {color: theme.colors.onSurfaceVariant}]}>
            Ruchy pacjenta, drżenie mięśni
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  settingsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  settingsDescription: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  noiseSelector: {
    marginVertical: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  radioLabel: {
    fontSize: 14,
    paddingLeft: 8,
  },
  noiseExplanation: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  noiseExplanationTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noiseTypeItem: {
    marginBottom: 6,
  },
  noiseTypeName: {
    fontWeight: '500',
  },
  noiseTypeDescription: {
    fontSize: 12,
    marginLeft: 16,
    opacity: 0.8,
  },
});

export default NoiseControls;