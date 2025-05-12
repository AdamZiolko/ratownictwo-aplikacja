import React from "react";
import { View, Text } from "react-native";
import { EkgType, NoiseType } from "@/services/EkgFactory";
import { dashboardStyles } from "../DashboardStyles";

export const StatItem = ({ value, label }: { value: number, label: string }) => (
  <View style={dashboardStyles.statItem}>
    <Text style={dashboardStyles.statValue}>{value || 0}</Text>
    <Text style={dashboardStyles.statLabel}>{label}</Text>
  </View>
);

export const getRhythmTypeName = (type: number): string => {
  switch (type as EkgType) {
    case EkgType.NORMAL:
      return "Rytm normalny (Zatokowy)";
    case EkgType.TACHYCARDIA:
      return "Tachykardia zatokowa";
    case EkgType.BRADYCARDIA:
      return "Bradykardia zatokowa";
    case EkgType.AFIB:
      return "Migotanie przedsionków";
    case EkgType.VFIB:
      return "Migotanie komór";
    case EkgType.VTACH:
      return "Częstoskurcz komorowy";
    case EkgType.TORSADE:
      return "Torsade de pointes";
    case EkgType.ASYSTOLE:
      return "Asystolia";
    case EkgType.HEART_BLOCK:
      return "Blok serca";
    case EkgType.PVC:
      return "Przedwczesne pobudzenie komorowe";
    case EkgType.CUSTOM:
      return "Niestandardowy";
    default:
      return "Nieznany";
  }
};

export const getNoiseLevelName = (type: number): string => {
  switch (type as NoiseType) {
    case NoiseType.NONE:
      return "Brak";
    case NoiseType.MILD:
      return "Łagodne";
    case NoiseType.MODERATE:
      return "Umiarkowane";
    case NoiseType.SEVERE:
      return "Silne";
    default:
      return "Nieznane";
  }
};
