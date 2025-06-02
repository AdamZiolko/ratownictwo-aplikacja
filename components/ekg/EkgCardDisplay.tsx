import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import EkgDisplay from './EkgDisplay';
import { EkgType, NoiseType } from '../../services/EkgFactory';

interface EkgCardDisplayProps {
  ekgType?: EkgType;
  bpm?: number;
  noiseType?: NoiseType;
  isRunning?: boolean;
  title?: string;
  showHeader?: boolean;
}

const EkgCardDisplay: React.FC<EkgCardDisplayProps> = ({
  ekgType,
  bpm,
  noiseType,
  isRunning,
  title = 'Kardiomonitor',
  showHeader = true,
}) => {
  const theme = useTheme();

  return (
    <Surface style={styles.cardContainer} elevation={3}>
      {showHeader && (
        <View style={styles.cardHeaderRow}>
          <MaterialCommunityIcons
            name="heart-pulse"
            size={24}
            color={theme.colors.error}
          />
          <Text style={styles.cardHeaderTitle}>{title}</Text>
        </View>
      )}
      <View style={styles.ekgWrapper}>
        <EkgDisplay
          ekgType={ekgType}
          bpm={bpm}
          noiseType={noiseType}
          isRunning={isRunning}
        />
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    padding: Platform.OS === 'web' ? 16 : 12,
    marginVertical: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  ekgWrapper: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default EkgCardDisplay;
