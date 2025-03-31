import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Divider, useTheme } from 'react-native-paper';
import CustomSlider from './CustomSlider';
import { EkgType, EkgFactory } from '../../services/EkgFactory';

interface EkgControlsProps {
  onEkgConfigChange: (type: EkgType, bpm: number) => void;
  initialType?: EkgType;
  initialBpm?: number;
}

const EkgControls: React.FC<EkgControlsProps> = ({
  onEkgConfigChange,
  initialType = EkgType.NORMAL,
  initialBpm = 72
}) => {
  const theme = useTheme();
  
  // State for rhythm type and BPM
  const [rhythmType, setRhythmType] = useState<EkgType>(initialType);
  const [bpm, setBpm] = useState<number>(initialBpm);
  
  // Handle rhythm type change
  const handleRhythmChange = (newType: EkgType) => {
    // Update rhythm type
    setRhythmType(newType);
    
    // Get the default BPM for this rhythm type
    const defaultBpm = EkgFactory.getBpmForType(newType);
    setBpm(defaultBpm);
    
    // Notify parent component
    onEkgConfigChange(newType, defaultBpm);
  };
  
  // Handle BPM change from slider
  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    
    // If BPM changes but we keep the same rhythm type, it becomes "custom"
    // unless it's already custom
    const effectiveType = rhythmType === EkgType.CUSTOM ? EkgType.CUSTOM : rhythmType;
    
    // Notify parent component
    onEkgConfigChange(effectiveType, newBpm);
  };
  
  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          EKG Configuration
        </Text>
        
        {/* Heart Rhythm Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Heart Rhythm Pattern</Text>
        </View>
        
        <Divider style={styles.divider} />
        
        {/* BPM Slider */}
        <View style={styles.section}>
          <View style={styles.bpmHeader}>
            <Text style={styles.sectionLabel}>Heart Rate</Text>
            <Text style={[styles.bpmValue, { color: theme.colors.primary }]}>
              {bpm} BPM
            </Text>
          </View>
          
          <CustomSlider
            value={bpm}
            minimumValue={30}
            maximumValue={220}
            onValueChange={setBpm}
            onSlidingComplete={handleBpmChange}
            trackColor={theme.colors.surfaceVariant}
            thumbColor={theme.colors.primary}
            style={styles.slider}
          />
          
          <View style={styles.bpmLabels}>
            <Text style={styles.bpmLabel}>Slow</Text>
            <Text style={styles.bpmLabel}>Normal</Text>
            <Text style={styles.bpmLabel}>Fast</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginVertical: 8,
  },
  sectionLabel: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  divider: {
    marginVertical: 16,
  },
  bpmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bpmValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  slider: {
    marginVertical: 8,
  },
  bpmLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  bpmLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
});

export default EkgControls;