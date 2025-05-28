import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { ColorValue } from './colorUtils';

interface ColorDisplayProps {
  color: ColorValue;
  currentSound: string | null;
}

export const ColorDisplay: React.FC<ColorDisplayProps> = ({ color, currentSound }) => {
  const theme = useTheme();

  const getColorName = (sound: string | null): string => {
    switch (sound) {
      case "red":
        return "Czerwony";
      case "green":
        return "Zielony";
      case "blue":
        return "Niebieski";
      default:
        return "Nieznany";
    }
  };

  return (
    <View>
      <View
        style={[
          styles.colorBox,
          {
            backgroundColor: `rgb(${Math.min(255, Math.floor(color.r / 100))}, ${Math.min(255, Math.floor(color.g / 100))}, ${Math.min(255, Math.floor(color.b / 100))})`,
            borderColor: theme.colors.outline,
          },
        ]}
      />
      <Text style={[styles.colorValues, { color: theme.colors.onSurface }]}>
        R: {color.r}, G: {color.g}, B: {color.b}
      </Text>

      {currentSound && (
        <Text style={[styles.soundInfo, { color: theme.colors.primary }]}>
          Odtwarzany dźwięk: {getColorName(currentSound)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  colorBox: {
    width: 100,
    height: 100,
    marginVertical: 8,
    borderWidth: 2,
    borderRadius: 8,
    alignSelf: 'center',
    // borderColor will be set dynamically with theme
  },
  colorValues: {
    textAlign: 'center',
    marginVertical: 4,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  soundInfo: { 
    fontSize: 16, 
    marginVertical: 8, 
    fontWeight: "bold",
    textAlign: 'center',
  },
});
