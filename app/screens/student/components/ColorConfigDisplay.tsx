import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, useTheme, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ColorConfig } from '@/services/ColorConfigService';

interface ColorConfigDisplayProps {
  colorConfigs: ColorConfig[];
  isLoading: boolean;
  error: string | null;
}

const ColorConfigDisplay: React.FC<ColorConfigDisplayProps> = ({
  colorConfigs,
  isLoading,
  error,
}) => {
  const theme = useTheme();

  const getColorValue = (color: string): string => {
    const colorMap: Record<string, string> = {
      red: '#F44336',
      green: '#4CAF50',
      blue: '#2196F3',
      yellow: '#FFEB3B',
      orange: '#FF9800',
      purple: '#9C27B0',
    };
    return colorMap[color] || '#666666';
  };
  const getColorIcon = (color: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    return 'circle';
  };

  if (isLoading) {
    return (
      <Surface style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="palette"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Konfiguracja Kolorów
          </Text>
        </View>
        <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
          Ładowanie konfiguracji...
        </Text>
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="palette"
            size={24}
            color={theme.colors.error}
          />
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Konfiguracja Kolorów
          </Text>
        </View>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      </Surface>
    );
  }

  if (colorConfigs.length === 0) {
    return (
      <Surface style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="palette"
            size={24}
            color={theme.colors.onSurface}
          />
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Konfiguracja Kolorów
          </Text>
        </View>
        <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
          Brak skonfigurowanych kolorów
        </Text>
      </Surface>
    );
  }

  return (
    <Surface style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="palette"
          size={24}
          color={theme.colors.primary}
        />
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Konfiguracja Kolorów ({colorConfigs.length})
        </Text>
      </View>
      
      <View style={styles.colorsContainer}>
        {colorConfigs.map((config) => (
          <View key={config.color} style={styles.colorItem}>
            <Chip
              icon={() => (
                <MaterialCommunityIcons
                  name={getColorIcon(config.color)}
                  size={16}
                  color={getColorValue(config.color)}
                />
              )}
              mode={config.isEnabled ? 'flat' : 'outlined'}
              style={[
                styles.colorChip,
                {
                  backgroundColor: config.isEnabled
                    ? `${getColorValue(config.color)}20`
                    : 'transparent',
                  borderColor: getColorValue(config.color),
                },
              ]}
              textStyle={{
                color: config.isEnabled
                  ? theme.colors.onSurface
                  : theme.colors.outline,
              }}
            >
              {config.color.toUpperCase()}
            </Chip>
            
            <View style={styles.configDetails}>              {config.soundName && (
                <Text
                  style={[styles.soundName, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                >
                  Local: {config.soundName.split('/').pop()?.replace('.wav', '')}
                </Text>
              )}
                {config.serverAudio && (
                <Text
                  style={[styles.serverAudio, { color: theme.colors.primary }]}
                  numberOfLines={1}
                >
                  Server: {config.serverAudio.name}
                </Text>
              )}
              
              <View style={styles.statusRow}>
                <Text
                  style={[
                    styles.status,
                    {
                      color: config.isEnabled
                        ? theme.colors.primary
                        : theme.colors.outline,
                    },
                  ]}
                >
                  {config.isEnabled ? 'Włączony' : 'Wyłączony'}
                </Text>
                
                {config.isEnabled && (
                  <>
                    <Text
                      style={[styles.volume, { color: theme.colors.onSurface }]}
                    >
                      Vol: {Math.round(config.volume * 100)}%
                    </Text>
                    
                    {config.isLooping && (
                      <MaterialCommunityIcons
                        name="repeat"
                        size={16}
                        color={theme.colors.secondary}
                        style={styles.loopIcon}
                      />
                    )}
                  </>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
  },
  colorsContainer: {
    gap: 12,
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  colorChip: {
    minWidth: 80,
    borderWidth: 1,
  },
  configDetails: {
    flex: 1,
    gap: 4,
  },
  soundName: {
    fontSize: 12,
    fontWeight: '500',
  },
  serverAudio: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
  volume: {
    fontSize: 11,
  },
  loopIcon: {
    marginLeft: 4,
  },
});

export default ColorConfigDisplay;
