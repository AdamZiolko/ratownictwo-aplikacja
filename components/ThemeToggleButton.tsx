import React from 'react';
import { StyleSheet } from 'react-native';
import { IconButton, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleButtonProps {
  size?: number;
  style?: any;
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ size = 24, style }) => {
  const { theme, toggleTheme } = useTheme();
  const paperTheme = usePaperTheme();

  return (
    <IconButton
      icon={theme === 'dark' ? 'weather-sunny' : 'weather-night'}
      iconColor={paperTheme.colors.onSurface}
      size={size}
      onPress={toggleTheme}
      style={[styles.button, style]}
      accessibilityLabel={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    margin: 0,
  },
});

export default ThemeToggleButton;