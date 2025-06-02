import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface Etco2DisplayProps {
  etco2?: number;
  unit?: string;
}

const Etco2Display: React.FC<Etco2DisplayProps> = ({
  etco2 = 0,
  unit = 'mmHg',
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.labelText, { color: theme.colors.secondary }]}>
        EtCO₂
      </Text>
      <Text style={[styles.valueText, { color: theme.colors.secondary }]}>
        {etco2.toFixed(1)} {unit}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: {
    fontSize: Platform.OS === 'web' ? 28 : 24,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  valueText: {
    fontSize: Platform.OS === 'web' ? 48 : 36,
    fontWeight: '700',
  },
});

export default React.memo(Etco2Display);
