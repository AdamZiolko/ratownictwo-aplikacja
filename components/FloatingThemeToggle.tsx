import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconButton, useTheme as usePaperTheme } from 'react-native-paper';

interface FloatingThemeToggleProps {
  size?: number;
  position?: 'bottomRight' | 'bottomLeft' | 'topRight' | 'topLeft';
}

const FloatingThemeToggle: React.FC<FloatingThemeToggleProps> = ({
  size = 24,
  position = 'bottomRight'
}) => {
  const { theme, toggleTheme } = useTheme();
  const paperTheme = usePaperTheme();

  // Określ styl pozycji na podstawie przekazanego parametru
  const getPositionStyle = () => {
    switch (position) {
      case 'bottomLeft':
        return { bottom: 20, left: 20 };
      case 'topRight':
        return { top: 20, right: 20 };
      case 'topLeft':
        return { top: 20, left: 20 };
      case 'bottomRight':
      default:
        return { bottom: 20, right: 20 };
    }
  };

  return (
    <View style={[styles.container, getPositionStyle()]}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: paperTheme.colors.primary }]}
        onPress={toggleTheme}
        activeOpacity={0.8}
      >
        <IconButton
          icon={theme === 'dark' ? 'weather-sunny' : 'weather-night'}
          iconColor={paperTheme.colors.onPrimary}
          size={size}
          onPress={toggleTheme}
          style={styles.icon}
          accessibilityLabel={`Przełącz na tryb ${theme === 'dark' ? 'jasny' : 'ciemny'}`}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  button: {
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  icon: {
    margin: 0,
  },
});

export default FloatingThemeToggle;