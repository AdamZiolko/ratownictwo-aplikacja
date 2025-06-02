import React from 'react';
import { StyleSheet, TouchableOpacity, View, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  IconButton,
  Text,
  Surface,
  useTheme as usePaperTheme,
} from 'react-native-paper';

interface FloatingThemeToggleProps {
  size?: number;
  position?: 'bottomRight' | 'bottomLeft' | 'topRight' | 'topLeft';
}

const FloatingThemeToggle: React.FC<FloatingThemeToggleProps> = ({
  size = 24,
  position = 'bottomRight',
}) => {
  const { theme, toggleTheme } = useTheme();
  const paperTheme = usePaperTheme();

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
      <Surface
        style={[
          styles.wrapper,
          { backgroundColor: paperTheme.colors.surfaceVariant },
        ]}
        elevation={2}
      >
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: paperTheme.colors.primary },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <IconButton
            icon={theme === 'dark' ? 'weather-sunny' : 'weather-night'}
            iconColor={paperTheme.colors.onPrimary}
            size={size}
            onPress={toggleTheme}
            style={styles.icon}
            accessibilityLabel={`Przełącz na tryb ${
              theme === 'dark' ? 'jasny' : 'ciemny'
            }`}
          />
        </TouchableOpacity>
        <Text
          style={[styles.label, { color: paperTheme.colors.onSurfaceVariant }]}
        >
          {theme === 'dark' ? 'Tryb ciemny' : 'Tryb jasny'}
        </Text>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
    width: 220,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 35,
    padding: 8,
    paddingRight: 16,
    width: '100%',
  },
  button: {
    borderRadius: 30,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginRight: 8,
  },
  icon: {
    margin: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
    marginRight: 8,
  },
});

export default FloatingThemeToggle;
