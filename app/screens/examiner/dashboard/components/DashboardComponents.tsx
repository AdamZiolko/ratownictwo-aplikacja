import React from 'react';
import { View, Text } from 'react-native';
import { EkgType, NoiseType } from '@/services/EkgFactory';
import { useTheme } from 'react-native-paper';
import { createDashboardStyles } from '../DashboardStyles';

export const StatItem = ({
  value,
  label,
}: {
  value: number;
  label: string;
}) => {
  const theme = useTheme();
  const styles = createDashboardStyles(theme);

  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value || 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

export const getRhythmTypeName = (type: number): string => {
  switch (type as EkgType) {
    case EkgType.NORMAL_SINUS_RHYTHM:
      return 'Prawidłowy rytm zatokowy';
    case EkgType.SINUS_TACHYCARDIA:
      return 'Tachykardia zatokowa';
    case EkgType.SINUS_BRADYCARDIA:
      return 'Bradykardia zatokowa';
    case EkgType.ATRIAL_FIBRILLATION:
      return 'Migotanie przedsionków';
    case EkgType.VENTRICULAR_FIBRILLATION:
      return 'Migotanie komór';
    case EkgType.VENTRICULAR_TACHYCARDIA:
      return 'Częstoskurcz komorowy';
    case EkgType.TORSADE_DE_POINTES:
      return 'Torsade de pointes';
    case EkgType.ASYSTOLE:
      return 'Asystolia';
    case EkgType.FIRST_DEGREE_AV_BLOCK:
      return 'Blok przedsionkowo-komorowy 1 stopnia';
    case EkgType.SECOND_DEGREE_AV_BLOCK:
      return 'Blok przedsionkowo-komorowy 2 stopnia';
    case EkgType.MOBITZ_TYPE_AV_BLOCK:
      return 'Blok przedsionkowo-komorowy 2 stopnia typu Mobitza';
    case EkgType.SA_BLOCK:
      return 'Blok zatokowo-przedsionkowy';
    case EkgType.WANDERING_ATRIAL_PACEMAKER:
      return 'Nadkomorowe wędrowanie rozrusznika';
    case EkgType.SINUS_ARRHYTHMIA:
      return 'Nadmiarowość zatokowa';
    case EkgType.PREMATURE_VENTRICULAR_CONTRACTION:
      return 'Przedwczesne pobudzenie komorowe';
    case EkgType.PREMATURE_ATRIAL_CONTRACTION:
      return 'Przedwczesne pobudzenie przedsionkowe';
    case EkgType.PREMATURE_JUNCTIONAL_CONTRACTION:
      return 'Przedwczesne pobudzenie węzłowe';
    case EkgType.ACCELERATED_VENTRICULAR_RHYTHM:
      return 'Przyspieszony rytm komorowy';
    case EkgType.ACCELERATED_JUNCTIONAL_RHYTHM:
      return 'Przyspieszony rytm węzłowy';
    case EkgType.IDIOVENTRICULAR_RHYTHM:
      return 'Rytm komorowy idowentrykularny';
    case EkgType.VENTRICULAR_FLUTTER:
      return 'Trzepotanie komór';
    case EkgType.ATRIAL_FLUTTER_A:
      return 'Trzepotanie przedsionków typu A';
    case EkgType.ATRIAL_FLUTTER_B:
      return 'Trzepotanie przedsionków typu B';
    case EkgType.MULTIFOCAL_ATRIAL_TACHYCARDIA:
      return 'Wieloogniskowy częstoskurcz przedsionkowy';
    case EkgType.SINUS_ARREST:
      return 'Zahamowanie zatokowe';
    case EkgType.VENTRICULAR_ESCAPE_BEAT:
      return 'Zastępcze pobudzenie komorowe';
    case EkgType.JUNCTIONAL_ESCAPE_BEAT:
      return 'Zastępcze pobudzenie węzłowe';
    case EkgType.CUSTOM:
      return 'Niestandardowy';
    default:
      return 'Nieznany';
  }
};

export const getNoiseLevelName = (type: number): string => {
  switch (type as NoiseType) {
    case NoiseType.NONE:
      return 'Brak';
    case NoiseType.MILD:
      return 'Łagodne';
    case NoiseType.MODERATE:
      return 'Umiarkowane';
    case NoiseType.SEVERE:
      return 'Silne';
    default:
      return 'Nieznane';
  }
};
