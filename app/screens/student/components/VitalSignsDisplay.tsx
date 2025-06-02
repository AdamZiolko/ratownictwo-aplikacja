import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme, Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { VitalWithFluctuation, BloodPressure } from '../types';

interface VitalSignsDisplayProps {
  temperature: VitalWithFluctuation;
  bloodPressure: BloodPressure;
  spo2: VitalWithFluctuation;
  etco2: VitalWithFluctuation;
  respiratoryRate: VitalWithFluctuation;
  formatBloodPressure: () => string;
  isFullscreen?: boolean;
}

const VitalSignsDisplay: React.FC<VitalSignsDisplayProps> = ({
  temperature,
  bloodPressure,
  spo2,
  etco2,
  respiratoryRate,
  formatBloodPressure,
  isFullscreen = false,
}) => {
  const theme = useTheme();

  const VitalItem: React.FC<{
    icon: string;
    label: string;
    value: string;
    color: string;
  }> = ({ icon, label, value, color }) => (
    <Surface style={styles.vitalItemCard} elevation={1}>
      <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      <Text style={styles.vitalLabel}>{label}</Text>
      <Text style={styles.vitalValue}>{value}</Text>
    </Surface>
  );

  if (isFullscreen) {
    return (
      <Surface style={styles.vitalsCardFullscreen} elevation={3}>
        <View style={styles.cardHeaderRow}>
          <MaterialCommunityIcons
            name="clipboard-pulse"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={styles.cardHeaderTitle}>Parametry pacjenta</Text>
        </View>
        <View style={styles.fullscreenVitalsGrid}>
          <View style={styles.vitalsRow}>
            <VitalItem
              icon="thermometer"
              label="Temperatura"
              value={
                temperature.currentValue !== null
                  ? `${temperature.currentValue}${temperature.unit}`
                  : 'N/A'
              }
              color={theme.colors.tertiary}
            />
            <VitalItem
              icon="blood-bag"
              label="Ciśnienie krwi"
              value={formatBloodPressure()}
              color={theme.colors.error}
            />
          </View>

          <View style={styles.vitalsRow}>
            <VitalItem
              icon="percent"
              label="SpO₂"
              value={
                spo2.currentValue !== null
                  ? `${spo2.currentValue}${spo2.unit}`
                  : 'N/A'
              }
              color={theme.colors.primary}
            />
            <VitalItem
              icon="molecule-co2"
              label="EtCO₂"
              value={
                etco2.currentValue !== null
                  ? `${etco2.currentValue}${etco2.unit}`
                  : 'N/A'
              }
              color={theme.colors.secondary}
            />
            <VitalItem
              icon="lungs"
              label="Częstość oddechów"
              value={
                respiratoryRate.currentValue !== null
                  ? `${respiratoryRate.currentValue}${respiratoryRate.unit}`
                  : 'N/A'
              }
              color={theme.colors.tertiary}
            />
          </View>
        </View>
      </Surface>
    );
  }

  return (
    <Surface style={styles.vitalsCard} elevation={3}>
      <View style={styles.cardHeaderRow}>
        <MaterialCommunityIcons
          name="clipboard-pulse"
          size={24}
          color={theme.colors.primary}
        />
        <Text style={styles.cardHeaderTitle}>Parametry pacjenta</Text>
      </View>

      {Platform.OS !== 'web' ? (
        <>
          <View style={styles.vitalsRow}>
            <VitalItem
              icon="thermometer"
              label="Temperatura"
              value={
                temperature.currentValue !== null
                  ? `${temperature.currentValue}${temperature.unit}`
                  : 'N/A'
              }
              color={theme.colors.tertiary}
            />
            <VitalItem
              icon="blood-bag"
              label="Ciśnienie krwi"
              value={formatBloodPressure()}
              color={theme.colors.error}
            />
          </View>

          <View style={styles.vitalsRow}>
            <VitalItem
              icon="percent"
              label="SpO₂"
              value={
                spo2.currentValue !== null
                  ? `${spo2.currentValue}${spo2.unit}`
                  : 'N/A'
              }
              color={theme.colors.primary}
            />
            <VitalItem
              icon="molecule-co2"
              label="EtCO₂"
              value={
                etco2.currentValue !== null
                  ? `${etco2.currentValue} ${etco2.unit}`
                  : 'N/A'
              }
              color={theme.colors.secondary}
            />
          </View>

          <View style={styles.vitalsRow}>
            <VitalItem
              icon="lungs"
              label="Częstość oddechów"
              value={
                respiratoryRate.currentValue !== null
                  ? `${respiratoryRate.currentValue} ${respiratoryRate.unit}`
                  : 'N/A'
              }
              color={theme.colors.tertiary}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.vitalsRow}>
            <VitalItem
              icon="thermometer"
              label="Temperatura"
              value={
                temperature.currentValue !== null
                  ? `${temperature.currentValue}${temperature.unit}`
                  : 'N/A'
              }
              color={theme.colors.tertiary}
            />
          </View>

          <View style={styles.vitalsRow}>
            <VitalItem
              icon="blood-bag"
              label="Ciśnienie krwi"
              value={formatBloodPressure()}
              color={theme.colors.error}
            />
            <VitalItem
              icon="percent"
              label="SpO₂"
              value={
                spo2.currentValue !== null
                  ? `${spo2.currentValue}${spo2.unit}`
                  : 'N/A'
              }
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.vitalsRow}>
            <VitalItem
              icon="molecule-co2"
              label="EtCO₂"
              value={
                etco2.currentValue !== null
                  ? `${etco2.currentValue}${etco2.unit}`
                  : 'N/A'
              }
              color={theme.colors.secondary}
            />
            <VitalItem
              icon="lungs"
              label="Częstość oddechów"
              value={
                respiratoryRate.currentValue !== null
                  ? `${respiratoryRate.currentValue}${respiratoryRate.unit}`
                  : 'N/A'
              }
              color={theme.colors.tertiary}
            />
          </View>
        </>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  vitalsCard: {
    padding: Platform.select({
      default: 16,
      android: 12,
      ios: 12,
    }),
    margin: Platform.select({
      default: 8,
      android: 4,
      ios: 4,
    }),
    borderRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: Platform.select({
      default: 18,
      android: 16,
      ios: 16,
    }),
    fontWeight: 'bold',
    marginLeft: 8,
  },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  vitalItemCard: {
    flex: 1,
    padding: Platform.select({
      default: 8,
      android: 6,
      ios: 6,
    }),
    margin: Platform.select({
      default: 4,
      android: 2,
      ios: 2,
    }),
    borderRadius: 8,
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: Platform.select({
      default: 14,
      android: 12,
      ios: 12,
    }),
    opacity: 0.7,
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: Platform.select({
      default: 18,
      android: 16,
      ios: 16,
    }),
    fontWeight: '500',
  },
  vitalsCardFullscreen: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
  },
  fullscreenVitalsGrid: {
    flex: 1,
    justifyContent: 'space-between',
  },
});

export default VitalSignsDisplay;
