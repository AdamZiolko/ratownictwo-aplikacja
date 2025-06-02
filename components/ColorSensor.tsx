import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Text, useTheme, Button } from 'react-native-paper';
import {
  useBleManager,
  ColorDisplay,
  ConnectionControls,
  ColorValue,
} from './bleColorSensor';

const DEBUG_MODE = __DEV__;

interface ColorSensorProps {
  colorConfigs?: any[];
  onColorDetected?: (color: string, config?: any) => void;
  onColorLost?: () => void;
}

export const ColorSensor: React.FC<ColorSensorProps> = ({
  colorConfigs = [],
  onColorDetected,
  onColorLost,
}) => {
  const theme = useTheme();
  const [lastDetectedColor, setLastDetectedColor] = useState<string | null>(
    null
  );
  const [showDebugControls, setShowDebugControls] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processDetectedColor = useCallback(
    (detectedColor: string) => {
      const config = colorConfigs.find(cfg => {
        if (cfg.color === 'custom') {
          return `custom-${cfg.id}` === detectedColor && cfg.isEnabled;
        } else {
          return (
            cfg.color.toLowerCase() === detectedColor.toLowerCase() &&
            cfg.isEnabled
          );
        }
      });

      if (config && onColorDetected) {
        onColorDetected(detectedColor, config);
      } else if (!config) {
      }
    },
    [colorConfigs, onColorDetected]
  );

  const handleColorUpdate = useCallback(
    async (color: ColorValue) => {
      const enabledConfigs = colorConfigs.filter(cfg => cfg.isEnabled);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      const detectedConfig = detectConfiguredColor(color);
      if (detectedConfig !== lastDetectedColor) {
        debounceTimeoutRef.current = setTimeout(() => {
          if (lastDetectedColor && onColorLost) {
            onColorLost();

            setTimeout(() => {
              setLastDetectedColor(detectedConfig);

              if (detectedConfig) {
                processDetectedColor(detectedConfig);
              }
            }, 20);
          } else {
            setLastDetectedColor(detectedConfig);

            if (detectedConfig) {
              processDetectedColor(detectedConfig);
            }
          }
        }, 50);
      } else if (detectedConfig) {
      } else {
      }
    },
    [
      colorConfigs,
      onColorDetected,
      onColorLost,
      lastDetectedColor,
      processDetectedColor,
    ]
  );

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const {
    status,
    error,
    isReconnecting,
    color,
    startConnection,
    disconnectDevice,
  } = useBleManager(handleColorUpdate);

  useEffect(() => {
    if (status === 'idle' || status === 'error') {
      setLastDetectedColor(null);

      if (lastDetectedColor && onColorLost) {
        onColorLost();
      }
    }
  }, [status, onColorLost, lastDetectedColor]);

  const detectConfiguredColor = (currentColor: ColorValue): string | null => {
    const { r, g, b } = currentColor;
    const totalBrightness = r + g + b;

    if (totalBrightness < 100) {
      return null;
    }

    for (const config of colorConfigs) {
      if (!config.isEnabled) {
        continue;
      }

      if (config.color === 'custom' && config.customColorRgb) {
        const { r: targetR, g: targetG, b: targetB } = config.customColorRgb;
        const tolerance = config.colorTolerance || 0.15;

        const isMatch = isColorMatch(
          currentColor,
          { r: targetR, g: targetG, b: targetB },
          tolerance
        );
        if (isMatch) {
          const result = `custom-${config.id}`;
          return result;
        }
      }
    }

    return null;
  };

  const isColorMatch = (
    color1: ColorValue,
    color2: ColorValue,
    tolerance: number
  ): boolean => {
    const { r: r1, g: g1, b: b1 } = color1;
    const { r: r2, g: g2, b: b2 } = color2;

    const total1 = r1 + g1 + b1;
    const total2 = r2 + g2 + b2;

    if (total1 === 0 || total2 === 0) {
      return false;
    }

    const ratio1 = { r: r1 / total1, g: g1 / total1, b: b1 / total1 };
    const ratio2 = { r: r2 / total2, g: g2 / total2, b: b2 / total2 };

    const distance = Math.sqrt(
      Math.pow(ratio1.r - ratio2.r, 2) +
        Math.pow(ratio1.g - ratio2.g, 2) +
        Math.pow(ratio1.b - ratio2.b, 2)
    );

    const isMatch = distance <= tolerance;
    return isMatch;
  };

  const determineColor = (rgbColor: ColorValue): string | null => {
    const { r, g, b } = rgbColor;

    const normalizedR = Math.min(255, Math.max(0, r));
    const normalizedG = Math.min(255, Math.max(0, g));
    const normalizedB = Math.min(255, Math.max(0, b));

    const totalBrightness = normalizedR + normalizedG + normalizedB;

    if (totalBrightness < 100) {
      return null;
    }

    return null;
  };

  const testColor = useCallback((testColorValue: ColorValue) => {
    handleColorUpdate(testColorValue);
  }, []);

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
    >
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>
        Czujnik Kolorów
      </Text>
      <ConnectionControls
        status={status}
        isReconnecting={isReconnecting}
        error={error}
        onConnect={startConnection}
        onDisconnect={disconnectDevice}
      />
      {status === 'monitoring' && (
        <View style={styles.colorDisplay}>
          <ColorDisplay color={color} currentSound={lastDetectedColor} />
        </View>
      )}
      {colorConfigs.length > 0 && (
        <View
          style={[
            styles.configInfo,
            { backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Text style={[styles.configTitle, { color: theme.colors.onSurface }]}>
            Aktywne konfiguracje kolorów:
          </Text>
          <ScrollView
            style={styles.configScrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {colorConfigs
              .filter(cfg => cfg.isEnabled)
              .map(cfg => (
                <Text
                  key={cfg.id}
                  style={[
                    styles.configItem,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {cfg.color === 'custom'
                    ? `Custom (RGB: ${cfg.customColorRgb?.r}, ${cfg.customColorRgb?.g}, ${cfg.customColorRgb?.b})`
                    : cfg.color}
                  : {cfg.soundName || 'Dźwięk serwera'}
                  {cfg.isLooping ? ' (zapętlony)' : ''}
                  {cfg.colorTolerance
                    ? ` - tolerancja: ${(cfg.colorTolerance * 100).toFixed(0)}%`
                    : ''}
                </Text>
              ))}
          </ScrollView>
        </View>
      )}
      {lastDetectedColor && (
        <View
          style={[
            styles.detectionInfo,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Text
            style={[
              styles.detectionTitle,
              { color: theme.colors.onPrimaryContainer },
            ]}
          >
            Ostatnio wykryty kolor:
          </Text>
          <Text
            style={[
              styles.detectedColor,
              { color: theme.colors.onPrimaryContainer },
            ]}
          >
            {lastDetectedColor}
          </Text>
        </View>
      )}
      {DEBUG_MODE && (
        <View
          style={[
            styles.debugSection,
            { backgroundColor: theme.colors.errorContainer },
          ]}
        >
          <Text
            style={[
              styles.debugTitle,
              { color: theme.colors.onErrorContainer },
            ]}
          >
            🧪 DEBUG CONTROLS
          </Text>
          <Button
            mode="outlined"
            onPress={() => setShowDebugControls(!showDebugControls)}
            style={styles.debugToggle}
          >
            {showDebugControls ? 'Ukryj' : 'Pokaż'} kontrolki testowe
          </Button>

          {showDebugControls && (
            <View style={styles.debugControls}>
              <Text
                style={[
                  styles.debugSubtitle,
                  { color: theme.colors.onErrorContainer },
                ]}
              >
                Testuj wykrywanie kolorów:
              </Text>
              <View style={styles.debugButtonRow}>
                <Button
                  mode="contained-tonal"
                  onPress={() => testColor({ r: 255, g: 0, b: 0 })}
                  style={styles.debugButton}
                >
                  Czerwony
                </Button>
                <Button
                  mode="contained-tonal"
                  onPress={() => testColor({ r: 0, g: 255, b: 0 })}
                  style={styles.debugButton}
                >
                  Zielony
                </Button>
                <Button
                  mode="contained-tonal"
                  onPress={() => testColor({ r: 0, g: 0, b: 255 })}
                  style={styles.debugButton}
                >
                  Niebieski
                </Button>
              </View>
              <View style={styles.debugButtonRow}>
                <Button
                  mode="contained-tonal"
                  onPress={() => testColor({ r: 255, g: 255, b: 0 })}
                  style={styles.debugButton}
                >
                  Żółty
                </Button>
                <Button
                  mode="contained-tonal"
                  onPress={() => testColor({ r: 255, g: 165, b: 0 })}
                  style={styles.debugButton}
                >
                  Pomarańczowy
                </Button>
                <Button
                  mode="contained-tonal"
                  onPress={() => testColor({ r: 128, g: 0, b: 128 })}
                  style={styles.debugButton}
                >
                  Fioletowy
                </Button>
              </View>
              <View style={styles.debugButtonRow}>
                <Button
                  mode="contained-tonal"
                  onPress={() => testColor({ r: 50, g: 50, b: 50 })}
                  style={styles.debugButton}
                >
                  Ciemny (ignorowany)
                </Button>
                <Button
                  mode="contained-tonal"
                  onPress={() => testColor({ r: 255, g: 255, b: 255 })}
                  style={styles.debugButton}
                >
                  Biały
                </Button>
              </View>
              {colorConfigs
                .filter(cfg => cfg.color === 'custom' && cfg.isEnabled)
                .map(config => (
                  <Button
                    key={config.id}
                    mode="contained-tonal"
                    onPress={() => testColor(config.customColorRgb)}
                    style={[styles.debugButton, { marginTop: 8 }]}
                  >
                    Test Custom #{config.id} ({config.customColorRgb?.r},
                    {config.customColorRgb?.g}, {config.customColorRgb?.b})
                  </Button>
                ))}
            </View>
          )}
        </View>
      )}
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  colorDisplay: {
    alignItems: 'center',
    marginVertical: 16,
  },
  configInfo: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  configScrollView: {
    maxHeight: 120,
  },
  configTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  configItem: {
    fontSize: 12,
    marginVertical: 2,
    paddingVertical: 1,
  },
  detectionInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  detectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  detectedColor: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  debugSection: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  debugToggle: {
    marginBottom: 8,
  },
  debugSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  debugButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  debugControls: {
    marginTop: 8,
  },
  debugButton: {
    margin: 2,
    flex: 1,
    maxWidth: 110,
  },
});

export default ColorSensor;
