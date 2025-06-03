import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '@/contexts/ThemeContext';

interface BackgroundGradientProps {
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  colors?: string[];
  lightColors?: string[];
  darkColors?: string[];
}

const BackgroundGradient: React.FC<BackgroundGradientProps> = ({
  children,
  containerStyle,
  colors,
  lightColors = ['#8B0000', '#D32F2F'],
  darkColors = ['#4A0000', '#9A1515'],
}) => {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();

  const primaryColor = theme === 'dark' ? darkColors[0] : lightColors[0];
  const secondaryColor = theme === 'dark' ? darkColors[1] : lightColors[1];

  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[styles.diagonalStripe, { backgroundColor: secondaryColor }]}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  diagonalStripe: {
    position: 'absolute',
    width: '300%',
    height: 200,
    top: -100,
    left: '-50%',
    transform: [{ rotate: '-10deg' }],
  },
});

export default BackgroundGradient;
