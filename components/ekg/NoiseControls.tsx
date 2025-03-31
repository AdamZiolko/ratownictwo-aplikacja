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
      <Text style={styles.settingsHeader}>Signal Quality</Text>
      <Text style={styles.settingsDescription}>
        Adjust noise levels to simulate real-world EKG recording conditions.
        Medical professionals must interpret EKGs with various artifacts.
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
            <Text style={[styles.radioLabel, {color: theme.colors.onSurface}]}>None (Perfect Signal)</Text>
          </View>
          
          <View style={styles.radioItem}>
            <RadioButton.Android 
              value={NoiseType.MILD}
              color={theme.colors.primary}
              uncheckedColor={theme.colors.outline}
            />
            <Text style={[styles.radioLabel, {color: theme.colors.onSurface}]}>Mild Noise (Slight Interference)</Text>
          </View>
          
          <View style={styles.radioItem}>
            <RadioButton.Android 
              value={NoiseType.MODERATE}
              color={theme.colors.primary}
              uncheckedColor={theme.colors.outline}
            />
            <Text style={[styles.radioLabel, {color: theme.colors.onSurface}]}>Moderate Noise (Clinical Setting)</Text>
          </View>
          
          <View style={styles.radioItem}>
            <RadioButton.Android 
              value={NoiseType.SEVERE}
              color={theme.colors.primary}
              uncheckedColor={theme.colors.outline}
            />
            <Text style={[styles.radioLabel, {color: theme.colors.onSurface}]}>Severe Noise (Challenging)</Text>
          </View>
        </RadioButton.Group>
      </View>
      
      <View style={[styles.noiseExplanation, {backgroundColor: `${theme.colors.surfaceVariant}`}]}>
        <Text style={[styles.noiseExplanationTitle, {color: theme.colors.onSurface}]}>
          Noise Types Included:
        </Text>
        <View style={styles.noiseTypeItem}>
          <Text style={[styles.noiseTypeName, {color: theme.colors.onSurface}]}>• High-frequency noise:</Text>
          <Text style={[styles.noiseTypeDescription, {color: theme.colors.onSurfaceVariant}]}>
            Electrical interference, equipment issues
          </Text>
        </View>
        <View style={styles.noiseTypeItem}>
          <Text style={[styles.noiseTypeName, {color: theme.colors.onSurface}]}>• Baseline wander:</Text>
          <Text style={[styles.noiseTypeDescription, {color: theme.colors.onSurfaceVariant}]}>
            Patient breathing, movement
          </Text>
        </View>
        <View style={styles.noiseTypeItem}>
          <Text style={[styles.noiseTypeName, {color: theme.colors.onSurface}]}>• Muscle artifacts:</Text>
          <Text style={[styles.noiseTypeDescription, {color: theme.colors.onSurfaceVariant}]}>
            Patient movement, muscle tremors
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