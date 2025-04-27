import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import CustomSlider from './CustomSlider';
import { EkgType } from '@/services/EkgFactory';


const MIN_BPM = 30;
const MAX_BPM = 220;

interface HeartRateControlsProps {
  ekgType: EkgType;
  bpm: number;
  sliderValue: number;
  onSliderValueChange: (value: number) => void;
  onSliderComplete: (value: number) => void;
  onCustomBpmSelect: (value: number) => void;
}

const HeartRateControls: React.FC<HeartRateControlsProps> = ({
  ekgType,
  bpm,
  sliderValue,
  onSliderValueChange,
  onSliderComplete,
  onCustomBpmSelect
}) => {
  const theme = useTheme();
  
  
  const presetBpmValues = [45, 60, 72, 100, 120, 150];
  
  
  const getBpmIndicatorColor = () => {
    if (sliderValue < 60) return theme.colors.error;
    if (sliderValue > 100) return theme.colors.secondary;
    return theme.colors.primary;
  };
  
  return (
    <View style={styles.container}>
      <Text style={[styles.bpmLabel, { color: getBpmIndicatorColor() }]}>
        Tętno: {sliderValue} BPM
      </Text>
      
      <View style={styles.sliderContainer}>
        <Text 
          style={{
            color: theme.colors.onSurface,
            margin: 6
          }}
        >{MIN_BPM}</Text>
        <CustomSlider
          value={sliderValue}
          minimumValue={MIN_BPM}
          maximumValue={MAX_BPM}
          onValueChange={onSliderValueChange}
          onSlidingComplete={onSliderComplete}
          style={styles.slider}
          trackColor={theme.colors.surfaceVariant}
          thumbColor={theme.colors.primary}
        />
        <Text 
          style={{
            color: theme.colors.onSurface,
            margin: 6
          }}
        >{MAX_BPM}</Text>
      </View>
      
      <Text style={{
         color: theme.colors.onSurface,
         fontWeight: 'bold',
         marginBottom: 12, 
      }}>Ustawienia kliniczne:</Text>
      <View style={styles.presetButtons}>
        {presetBpmValues.map((presetBpm) => (
          <TouchableOpacity
            key={presetBpm}
            onPress={() => onCustomBpmSelect(presetBpm)}
            style={[
              styles.presetButton,
              bpm === presetBpm && styles.selectedPreset,
              { 
                borderColor: theme.colors.outline, 
                backgroundColor: bpm === presetBpm ? 
                  `${theme.colors.primary}20` : 'transparent' 
              }
            ]}
            activeOpacity={0.7}
          >
            <Text 
              style={[
                styles.presetButtonText,
                { color: theme.colors.onSurface },
                bpm === presetBpm && { 
                  color: theme.colors.primary,
                  fontWeight: 'bold'
                }
              ]}
            >
              {presetBpm}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.bpmRanges}>
        <Text style={[styles.bpmRangeText, { color: theme.colors.error }]}>
          Bradykardia: &lt; 60 BPM
        </Text>
        <Text style={[styles.bpmRangeText, { color: theme.colors.primary }]}>
          Normalne: 60-100 BPM
        </Text>
        <Text style={[styles.bpmRangeText, { color: theme.colors.secondary }]}>
          Tachykardia: &gt; 100 BPM
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  bpmLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    width: 30,
    fontSize: 12,
    textAlign: 'center',
  },
  label: {
    marginTop: 8,
    marginBottom: 12,
    fontWeight: '500',
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 20,
  },
  presetButton: {
    margin: 4,
    width: 56,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetButtonText: {
    fontSize: 14,
  },
  selectedPreset: {
    borderWidth: 2,
  },
  bpmRanges: {
    marginTop: 10,
    borderRadius: 8,
  },
  bpmRangeText: {
    fontSize: 14,
    marginVertical: 2,
  },
});

export default HeartRateControls;