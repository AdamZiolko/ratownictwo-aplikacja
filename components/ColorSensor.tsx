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
      console.log(
        `🎨 ColorSensor: processDetectedColor STARTED for ${detectedColor}`
      );

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

      console.log(`🎨 ColorSensor: Looking for config for '${detectedColor}'`);
      console.log(
        `🎨 ColorSensor: Available configs:`,
        colorConfigs.map(cfg => `${cfg.color}:${cfg.isEnabled}`)
      );

      if (config && onColorDetected) {
        console.log(`🎨 ColorSensor: Found config for ${detectedColor}:`, {
          soundName: config.soundName,
          serverAudioId: config.serverAudioId,
          volume: config.volume,
          isLooping: config.isLooping,
        });
        console.log(
          `🎨 ColorSensor: Calling onColorDetected for NEW color detection`
        );
        onColorDetected(detectedColor, config);
      } else if (!config) {
        console.log(
          `🎨 ColorSensor: Detected color ${detectedColor}, but no enabled configuration found`
        );
      }
    },
    [colorConfigs, onColorDetected]
  );

  const handleColorUpdate = useCallback(
    async (color: ColorValue) => {
      console.log(`🎨 ColorSensor: ===== NEW COLOR UPDATE CYCLE =====`);
      console.log(
        `🎨 ColorSensor: Raw RGB input - R:${color.r} G:${color.g} B:${color.b}`
      );
      console.log(
        `🎨 ColorSensor: Current detected color: ${lastDetectedColor}`
      );
      console.log(
        `🎨 ColorSensor: Number of color configs: ${colorConfigs.length}`
      );

      const enabledConfigs = colorConfigs.filter(cfg => cfg.isEnabled);
      console.log(
        `🎨 ColorSensor: Enabled color configs:`,
        enabledConfigs.map(cfg =>
          cfg.color === 'custom'
            ? `custom-${cfg.id}(${cfg.customColorRgb?.r},${cfg.customColorRgb?.g},${cfg.customColorRgb?.b})`
            : cfg.color
        )
      );

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      const detectedConfig = detectConfiguredColor(color);
      console.log(
        `🎨 ColorSensor: Detection result: ${
          detectedConfig ? detectedConfig : 'NO_COLOR'
        }`
      );

      if (detectedConfig !== lastDetectedColor) {
        console.log(
          `🎨 ColorSensor: Color changed from '${lastDetectedColor}' to '${detectedConfig}'`
        );

        console.log(
          `🎨 ColorSensor: Setting up debounce timeout for color change`
        );
        debounceTimeoutRef.current = setTimeout(() => {
          console.log(
            `🎨 ColorSensor: Debounce timeout triggered for color change to ${detectedConfig}`
          );

          if (lastDetectedColor && onColorLost) {
            console.log(
              `🎨 ColorSensor: Lost color ${lastDetectedColor}, stopping all sounds`
            );
            onColorLost();

            console.log(
              `🎨 ColorSensor: Setting up delay for new sound after stopping previous`
            );
            setTimeout(() => {
              console.log(
                `🎨 ColorSensor: Delay completed, updating state and playing new sound`
              );

              setLastDetectedColor(detectedConfig);

              if (detectedConfig) {
                console.log(
                  `🎨 ColorSensor: Calling processDetectedColor for ${detectedConfig}`
                );
                processDetectedColor(detectedConfig);
              }
            }, 20);
          } else {
            console.log(
              `🎨 ColorSensor: No previous color to stop, directly playing new sound`
            );

            setLastDetectedColor(detectedConfig);

            if (detectedConfig) {
              console.log(
                `🎨 ColorSensor: Calling processDetectedColor for ${detectedConfig}`
              );
              processDetectedColor(detectedConfig);
            }
          }
        }, 50);
      } else if (detectedConfig) {
        console.log(
          `🎨 ColorSensor: Same color '${detectedConfig}' still detected - not triggering callbacks again`
        );
      } else {
        console.log(`🎨 ColorSensor: Still no color detected`);
      }

      console.log(`🎨 ColorSensor: ===== END COLOR UPDATE CYCLE =====`);
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

    console.log(
      `🔍 ColorSensor: Starting color detection for RGB(${r}, ${g}, ${b}), brightness: ${totalBrightness}`
    );

    if (totalBrightness < 100) {
      console.log(
        `🔍 ColorSensor: Color too dark (brightness ${totalBrightness} < 100), ignoring`
      );
      return null;
    }

    console.log(
      `🔍 ColorSensor: Checking ${colorConfigs.length} color configurations`
    );

    for (const config of colorConfigs) {
      console.log(
        `🔍 ColorSensor: Checking config ${config.id}: ${config.color}, enabled: ${config.isEnabled}`
      );

      if (!config.isEnabled) {
        console.log(
          `🔍 ColorSensor: Config ${config.id} (${config.color}) is disabled, skipping`
        );
        continue;
      }

      if (config.color === 'custom' && config.customColorRgb) {
        const { r: targetR, g: targetG, b: targetB } = config.customColorRgb;
        const tolerance = config.colorTolerance || 0.15;

        console.log(
          `🔍 ColorSensor: Checking custom color config ${config.id}:`
        );
        console.log(`  Target RGB: (${targetR}, ${targetG}, ${targetB})`);
        console.log(`  Tolerance: ${tolerance}`);

        const isMatch = isColorMatch(
          currentColor,
          { r: targetR, g: targetG, b: targetB },
          tolerance
        );
        console.log(`  Match result: ${isMatch}`);

        if (isMatch) {
          const result = `custom-${config.id}`;
          console.log(
            `🎯 ColorSensor: CUSTOM COLOR MATCH! Returning: ${result}`
          );
          return result;
        }
      }
    }

    console.log(`🔍 ColorSensor: No matching color configuration found`);
    return null;
  };

  const isColorMatch = (
    color1: ColorValue,
    color2: ColorValue,
    tolerance: number
  ): boolean => {
    const { r: r1, g: g1, b: b1 } = color1;
    const { r: r2, g: g2, b: b2 } = color2;

    console.log(`🔍 ColorSensor: Color matching:`);
    console.log(`  Color1 RGB: (${r1}, ${g1}, ${b1})`);
    console.log(`  Color2 RGB: (${r2}, ${g2}, ${b2})`);
    console.log(`  Tolerance: ${tolerance}`);

    const total1 = r1 + g1 + b1;
    const total2 = r2 + g2 + b2;

    console.log(`  Total brightness - Color1: ${total1}, Color2: ${total2}`);

    if (total1 === 0 || total2 === 0) {
      console.log(`  One of the colors has zero brightness, no match`);
      return false;
    }

    const ratio1 = { r: r1 / total1, g: g1 / total1, b: b1 / total1 };
    const ratio2 = { r: r2 / total2, g: g2 / total2, b: b2 / total2 };

    console.log(
      `  Ratio1: (${ratio1.r.toFixed(3)}, ${ratio1.g.toFixed(
        3
      )}, ${ratio1.b.toFixed(3)})`
    );
    console.log(
      `  Ratio2: (${ratio2.r.toFixed(3)}, ${ratio2.g.toFixed(
        3
      )}, ${ratio2.b.toFixed(3)})`
    );

    const distance = Math.sqrt(
      Math.pow(ratio1.r - ratio2.r, 2) +
        Math.pow(ratio1.g - ratio2.g, 2) +
        Math.pow(ratio1.b - ratio2.b, 2)
    );

    console.log(`  Distance: ${distance.toFixed(4)}, Tolerance: ${tolerance}`);

    const isMatch = distance <= tolerance;
    console.log(`  Match result: ${isMatch}`);

    return isMatch;
  };

  const determineColor = (rgbColor: ColorValue): string | null => {
    const { r, g, b } = rgbColor;

    console.log(`🎨 ColorSensor: Determining color for RGB(${r}, ${g}, ${b})`);

    const normalizedR = Math.min(255, Math.max(0, r));
    const normalizedG = Math.min(255, Math.max(0, g));
    const normalizedB = Math.min(255, Math.max(0, b));

    console.log(
      `🎨 ColorSensor: Normalized RGB(${normalizedR}, ${normalizedG}, ${normalizedB})`
    );

    const totalBrightness = normalizedR + normalizedG + normalizedB;

    console.log(`🎨 ColorSensor: Total brightness: ${totalBrightness}`);

    if (totalBrightness < 100) {
      console.log(
        `🎨 ColorSensor: Too dark (brightness ${totalBrightness} < 100), returning null`
      );
      return null;
    }

    console.log(
      `🎨 ColorSensor: Predefiniowane kolory zostały usunięte, używaj tylko niestandardowych kolorów`
    );
    return null;
  };

  const testColor = useCallback((testColorValue: ColorValue) => {
    console.log(`🧪 DEBUG: Testing color ${JSON.stringify(testColorValue)}`);
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
