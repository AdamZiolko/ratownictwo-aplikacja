import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Surface, Text, useTheme, Chip, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ColorConfig } from '@/services/ColorConfigService';
import { Audio } from 'expo-av';
import { loadAudioFromLocal, loadAudioFromServer } from '../utils/audioUtils';

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
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [loadingAudioKey, setLoadingAudioKey] = useState<string | null>(null);

  useEffect(() => {
    async function initAudio() {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log('🎵 Audio system initialized for ColorConfigDisplay');
      } catch (err) {
        console.error('Failed to configure audio in ColorConfigDisplay:', err);
      }
    }
    initAudio();
  }, []);

  useEffect(() => {
    return () => {
      if (currentSound) {
        currentSound.unloadAsync();
      }

      setIsLoadingAudio(false);
      setLoadingAudioKey(null);
      setPlayingSound(null);
    };
  }, []);
  const getColorValue = (config: ColorConfig): string => {
    if (config.color === 'custom' && config.customColorRgb) {
      const { r, g, b } = config.customColorRgb;
      return `rgb(${r}, ${g}, ${b})`;
    }

    const colorMap: Record<string, string> = {
      red: '#F44336',
      green: '#4CAF50',
      blue: '#2196F3',
      yellow: '#FFEB3B',
      orange: '#FF9800',
      purple: '#9C27B0',
    };
    return colorMap[config.color] || '#666666';
  };

  const getColorValueWithAlpha = (
    config: ColorConfig,
    alpha: number = 0.2
  ): string => {
    if (config.color === 'custom' && config.customColorRgb) {
      const { r, g, b } = config.customColorRgb;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    const colorMap: Record<string, string> = {
      red: '#F44336',
      green: '#4CAF50',
      blue: '#2196F3',
      yellow: '#FFEB3B',
      orange: '#FF9800',
      purple: '#9C27B0',
    };
    const hexColor = colorMap[config.color] || '#666666';

    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const getColorIcon = (
    color: string
  ): keyof typeof MaterialCommunityIcons.glyphMap => {
    return 'circle';
  };
  const stopAllAudio = async () => {
    try {
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        setCurrentSound(null);
        setPlayingSound(null);
      }
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const playSound = async (config: ColorConfig) => {
    try {
      const soundKey = config.serverAudioId
        ? `server_${config.serverAudioId}`
        : config.soundName || '';

      setIsLoadingAudio(true);
      setLoadingAudioKey(soundKey);

      await stopAllAudio();

      let sound: Audio.Sound | null = null;

      if (config.serverAudioId) {
        console.log(`🔊 Playing server audio: ${config.serverAudioId}`);
        sound = await loadAudioFromServer(config.serverAudioId);
        if (sound) {
          setCurrentSound(sound);
          setPlayingSound(soundKey);

          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded && status.didJustFinish) {
              setPlayingSound(null);
              setCurrentSound(null);
            }
          });

          await sound.playAsync();
          console.log(`✅ Server audio playing: ${soundKey}`);
        } else {
          console.warn(`Failed to load server audio: ${config.serverAudioId}`);
        }
      } else if (config.soundName) {
        console.log(`🔊 Playing local sound: ${config.soundName}`);
        sound = await loadAudioFromLocal(config.soundName);
        if (sound) {
          setCurrentSound(sound);
          setPlayingSound(soundKey);

          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded && status.didJustFinish) {
              setPlayingSound(null);
              setCurrentSound(null);
            }
          });

          await sound.playAsync();
          console.log(`✅ Local audio playing: ${soundKey}`);
        } else {
          console.warn(`Failed to load local sound: ${config.soundName}`);
        }
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      setPlayingSound(null);
      setCurrentSound(null);
    } finally {
      setIsLoadingAudio(false);
      setLoadingAudioKey(null);
    }
  };

  const stopSound = async () => {
    try {
      setIsLoadingAudio(true);
      await stopAllAudio();
    } catch (error) {
      console.error('Error stopping sound:', error);
    } finally {
      setIsLoadingAudio(false);
      setLoadingAudioKey(null);
    }
  };

  const handlePlaySound = async (config: ColorConfig) => {
    if (isLoadingAudio) {
      return;
    }

    const soundKey = config.serverAudioId
      ? `server_${config.serverAudioId}`
      : config.soundName || '';

    if (playingSound === soundKey) {
      await stopSound();
    } else {
      await playSound(config);
    }
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
      <ScrollView
        style={styles.colorsContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {colorConfigs.map(config => (
          <View key={`color-${config.id}`} style={styles.colorItem}>
            <Chip
              icon={() => (
                <MaterialCommunityIcons
                  name={getColorIcon(config.color)}
                  size={16}
                  color={getColorValue(config)}
                />
              )}
              mode={config.isEnabled ? 'flat' : 'outlined'}
              style={[
                styles.colorChip,
                {
                  backgroundColor: config.isEnabled
                    ? getColorValueWithAlpha(config, 0.2)
                    : 'transparent',
                  borderColor: getColorValue(config),
                },
              ]}
              textStyle={{
                color: config.isEnabled
                  ? theme.colors.onSurface
                  : theme.colors.outline,
              }}
            >
              {config.displayName ||
                `RGB(${config.customColorRgb?.r || 0}, ${
                  config.customColorRgb?.g || 0
                }, ${config.customColorRgb?.b || 0})`}
            </Chip>
            <View style={styles.configDetails}>
              {config.soundName && (
                <Text
                  style={[styles.soundName, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                >
                  Local:
                  {config.soundName.split('/').pop()?.replace('.wav', '')}
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
            <View style={styles.playButtonContainer}>
              <IconButton
                icon={
                  (config.soundName || config.serverAudioId) &&
                  playingSound ===
                    (config.serverAudioId
                      ? `server_${config.serverAudioId}`
                      : config.soundName)
                    ? 'stop'
                    : 'play'
                }
                size={24}
                iconColor={
                  config.soundName || config.serverAudioId
                    ? theme.colors.primary
                    : theme.colors.outline
                }
                disabled={
                  isLoadingAudio || !(config.soundName || config.serverAudioId)
                }
                onPress={
                  isLoadingAudio || !(config.soundName || config.serverAudioId)
                    ? undefined
                    : () => handlePlaySound(config)
                }
                style={[
                  styles.playButton,
                  isLoadingAudio && { opacity: 0.5 },
                  !(config.soundName || config.serverAudioId) && {
                    opacity: 0.3,
                  },
                ]}
              />
              {isLoadingAudio &&
                (config.soundName || config.serverAudioId) &&
                loadingAudioKey ===
                  (config.serverAudioId
                    ? `server_${config.serverAudioId}`
                    : config.soundName) && (
                  <View
                    style={[
                      styles.loadingOverlay,
                      { backgroundColor: `${theme.colors.surface}CC` },
                    ]}
                  >
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primary}
                    />
                  </View>
                )}
            </View>
          </View>
        ))}
      </ScrollView>
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
    maxHeight: 300,
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
  playButtonContainer: {
    marginLeft: 8,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  playButton: {
    margin: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
});

export default ColorConfigDisplay;
