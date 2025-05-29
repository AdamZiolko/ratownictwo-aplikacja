import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Surface, Text, useTheme, Button } from "react-native-paper";
import { useBleManager, ColorDisplay, ConnectionControls, ColorValue } from "./bleColorSensor";

// Debug mode flag
const DEBUG_MODE = __DEV__; // Only in development

interface ColorSensorProps {
  colorConfigs?: any[]; // Color configurations from parent
  onColorDetected?: (color: string, config?: any) => void; // Callback when color is detected
  onColorLost?: (color: string) => void; // Callback when color is no longer detected
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
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);  // Handle color updates from BLE manager
  const handleColorUpdate = useCallback(
    async (color: ColorValue) => {      console.log(`🎨 ColorSensor: ===== NEW COLOR UPDATE CYCLE =====`);
      console.log(`🎨 ColorSensor: Raw RGB input - R:${color.r} G:${color.g} B:${color.b}`);
      console.log(`🎨 ColorSensor: Current detected color: ${lastDetectedColor}`);
      console.log(`🎨 ColorSensor: Number of color configs: ${colorConfigs.length}`);
      
      const enabledConfigs = colorConfigs.filter(cfg => cfg.isEnabled);
      console.log(`🎨 ColorSensor: Enabled color configs:`, enabledConfigs.map(cfg => 
        cfg.color === 'custom' ? `custom-${cfg.id}(${cfg.customColorRgb?.r},${cfg.customColorRgb?.g},${cfg.customColorRgb?.b})` : cfg.color
      ));
      
      // Clear any existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      // Check if detected color matches any configured colors (including custom) - no debounce for immediate response
      const detectedConfig = detectConfiguredColor(color);
      console.log(`🎨 ColorSensor: Detection result: ${detectedConfig ? detectedConfig : 'NO_COLOR'}`);

      // Always check if sound should be played or stopped, regardless of debounce
      if (detectedConfig !== lastDetectedColor) {
        console.log(`🎨 ColorSensor: Color changed from '${lastDetectedColor}' to '${detectedConfig}'`);
        
        // Color changed - handle stopping previous sound
        if (lastDetectedColor && onColorLost) {
          console.log(`🎨 ColorSensor: Lost color ${lastDetectedColor}, stopping sound`);
          onColorLost(lastDetectedColor);
        }

        setLastDetectedColor(detectedConfig);

        if (detectedConfig) {
          // Find the configuration for this detected color
          const config = colorConfigs.find((cfg) => {
            if (cfg.color === 'custom') {
              return `custom-${cfg.id}` === detectedConfig && cfg.isEnabled;
            } else {
              return cfg.color.toLowerCase() === detectedConfig.toLowerCase() && cfg.isEnabled;
            }
          });

          console.log(`🎨 ColorSensor: Looking for config for '${detectedConfig}'`);
          console.log(`🎨 ColorSensor: Available configs:`, colorConfigs.map(cfg => `${cfg.color}:${cfg.isEnabled}`));

          if (config && onColorDetected) {            console.log(`🎨 ColorSensor: Found config for ${detectedConfig}:`, {
              soundName: config.soundName,
              serverAudioId: config.serverAudioId,
              volume: config.volume,
              isLooping: config.isLooping
            });
            console.log(`🎨 ColorSensor: Calling onColorDetected for NEW color detection`);
            onColorDetected(detectedConfig, config);
          } else if (!config) {
            console.log(`🎨 ColorSensor: Detected color ${detectedConfig}, but no enabled configuration found`);
          }
        } else {
          console.log(`🎨 ColorSensor: No color detected, no sound to play`);
        }      } else if (detectedConfig) {
        // Same color detected - just log but don't trigger callbacks again
        console.log(`🎨 ColorSensor: Same color '${detectedConfig}' still detected - not triggering callbacks again`);
      } else {
        console.log(`🎨 ColorSensor: Still no color detected`);
      }
      
      console.log(`🎨 ColorSensor: ===== END COLOR UPDATE CYCLE =====`);
    },
    [colorConfigs, onColorDetected, onColorLost, lastDetectedColor]
  );

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Use BLE manager hook
  const {
    status,
    error,
    isReconnecting,
    color,
    startConnection,
    disconnectDevice,  } = useBleManager(handleColorUpdate);
  // Function to detect if current color matches any configured color (including custom)
  const detectConfiguredColor = (currentColor: ColorValue): string | null => {
    const { r, g, b } = currentColor;
    const totalBrightness = r + g + b;

    console.log(`🔍 ColorSensor: Starting color detection for RGB(${r}, ${g}, ${b}), brightness: ${totalBrightness}`);

    // Ignore very dark colors
    if (totalBrightness < 100) {
      console.log(`🔍 ColorSensor: Color too dark (brightness ${totalBrightness} < 100), ignoring`);
      return null;
    }

    console.log(`🔍 ColorSensor: Checking ${colorConfigs.length} color configurations`);

    // Check all configured colors
    for (const config of colorConfigs) {
      console.log(`🔍 ColorSensor: Checking config ${config.id}: ${config.color}, enabled: ${config.isEnabled}`);
      
      if (!config.isEnabled) {
        console.log(`🔍 ColorSensor: Config ${config.id} (${config.color}) is disabled, skipping`);
        continue;
      }
      
      if (config.color === 'custom' && config.customColorRgb) {
        const { r: targetR, g: targetG, b: targetB } = config.customColorRgb;
        const tolerance = config.colorTolerance || 0.15;
        
        console.log(`🔍 ColorSensor: Checking custom color config ${config.id}:`);
        console.log(`  Target RGB: (${targetR}, ${targetG}, ${targetB})`);
        console.log(`  Tolerance: ${tolerance}`);
        
        const isMatch = isColorMatch(currentColor, { r: targetR, g: targetG, b: targetB }, tolerance);
        console.log(`  Match result: ${isMatch}`);
        
        if (isMatch) {
          const result = `custom-${config.id}`;
          console.log(`🎯 ColorSensor: CUSTOM COLOR MATCH! Returning: ${result}`);
          return result;
        }
      } else if (config.color !== 'custom') {
        // Check predefined colors using existing logic
        console.log(`🔍 ColorSensor: Checking predefined color: ${config.color}`);
        const detectedColor = determineColor(currentColor);
        console.log(`  Determined color: ${detectedColor}`);
        
        if (detectedColor === config.color) {
          console.log(`🎯 ColorSensor: PREDEFINED COLOR MATCH! Returning: ${config.color}`);
          return config.color;
        }
      }
    }

    console.log(`🔍 ColorSensor: No matching color configuration found`);
    return null;
  };
  // Function to check if two colors match within tolerance
  const isColorMatch = (color1: ColorValue, color2: ColorValue, tolerance: number): boolean => {
    const { r: r1, g: g1, b: b1 } = color1;
    const { r: r2, g: g2, b: b2 } = color2;

    console.log(`🔍 ColorSensor: Color matching:`);
    console.log(`  Color1 RGB: (${r1}, ${g1}, ${b1})`);
    console.log(`  Color2 RGB: (${r2}, ${g2}, ${b2})`);
    console.log(`  Tolerance: ${tolerance}`);

    // Calculate total brightness for both colors
    const total1 = r1 + g1 + b1;
    const total2 = r2 + g2 + b2;

    console.log(`  Total brightness - Color1: ${total1}, Color2: ${total2}`);

    if (total1 === 0 || total2 === 0) {
      console.log(`  One of the colors has zero brightness, no match`);
      return false;
    }

    // Calculate color ratios
    const ratio1 = { r: r1 / total1, g: g1 / total1, b: b1 / total1 };
    const ratio2 = { r: r2 / total2, g: g2 / total2, b: b2 / total2 };

    console.log(`  Ratio1: (${ratio1.r.toFixed(3)}, ${ratio1.g.toFixed(3)}, ${ratio1.b.toFixed(3)})`);
    console.log(`  Ratio2: (${ratio2.r.toFixed(3)}, ${ratio2.g.toFixed(3)}, ${ratio2.b.toFixed(3)})`);

    // Calculate Euclidean distance between ratios
    const distance = Math.sqrt(
      Math.pow(ratio1.r - ratio2.r, 2) +
      Math.pow(ratio1.g - ratio2.g, 2) +
      Math.pow(ratio1.b - ratio2.b, 2)
    );

    console.log(`  Distance: ${distance.toFixed(4)}, Tolerance: ${tolerance}`);

    // Check if distance is within tolerance
    const isMatch = distance <= tolerance;
    console.log(`  Match result: ${isMatch}`);
    
    return isMatch;
  };
  // Enhanced color detection function with better RGB thresholds
  const determineColor = (rgbColor: ColorValue): string | null => {
    const { r, g, b } = rgbColor;

    console.log(`🎨 ColorSensor: Determining predefined color for RGB(${r}, ${g}, ${b})`);

    // Normalize RGB values to 0-255 range if they're in percentage or other format
    const normalizedR = Math.min(255, Math.max(0, r));
    const normalizedG = Math.min(255, Math.max(0, g));
    const normalizedB = Math.min(255, Math.max(0, b));

    console.log(`🎨 ColorSensor: Normalized RGB(${normalizedR}, ${normalizedG}, ${normalizedB})`);

    // Calculate total brightness to help with color detection
    const totalBrightness = normalizedR + normalizedG + normalizedB;

    console.log(`🎨 ColorSensor: Total brightness: ${totalBrightness}`);

    // Ignore very dark colors (might be no object detected)
    if (totalBrightness < 100) {
      console.log(`🎨 ColorSensor: Too dark (brightness ${totalBrightness} < 100), returning null`);
      return null;
    }

    // More sophisticated color detection based on dominant channels and ratios
    const redRatio = normalizedR / totalBrightness;
    const greenRatio = normalizedG / totalBrightness;
    const blueRatio = normalizedB / totalBrightness;

    console.log(`🎨 ColorSensor: Color ratios - R:${redRatio.toFixed(3)}, G:${greenRatio.toFixed(3)}, B:${blueRatio.toFixed(3)}`);

    // Thresholds for color detection
    const threshold = 0.4; // Dominant color should be at least 40% of total
    const secondaryThreshold = 0.25; // Secondary color threshold

    console.log(`🎨 ColorSensor: Using thresholds - dominant:${threshold}, secondary:${secondaryThreshold}`);

    // Red detection
    if (
      redRatio > threshold &&
      greenRatio < secondaryThreshold &&
      blueRatio < secondaryThreshold
    ) {
      console.log(`🎨 ColorSensor: Detected RED (R:${redRatio.toFixed(3)} > ${threshold}, G:${greenRatio.toFixed(3)} < ${secondaryThreshold}, B:${blueRatio.toFixed(3)} < ${secondaryThreshold})`);
      return "red";
    }

    // Green detection
    if (
      greenRatio > threshold &&
      redRatio < secondaryThreshold &&
      blueRatio < secondaryThreshold
    ) {
      console.log(`🎨 ColorSensor: Detected GREEN (G:${greenRatio.toFixed(3)} > ${threshold}, R:${redRatio.toFixed(3)} < ${secondaryThreshold}, B:${blueRatio.toFixed(3)} < ${secondaryThreshold})`);
      return "green";
    }

    // Blue detection
    if (
      blueRatio > threshold &&
      redRatio < secondaryThreshold &&
      greenRatio < secondaryThreshold
    ) {
      console.log(`🎨 ColorSensor: Detected BLUE (B:${blueRatio.toFixed(3)} > ${threshold}, R:${redRatio.toFixed(3)} < ${secondaryThreshold}, G:${greenRatio.toFixed(3)} < ${secondaryThreshold})`);
      return "blue";
    }

    // Yellow detection (red + green, low blue)
    if (redRatio > 0.3 && greenRatio > 0.3 && blueRatio < 0.25) {
      console.log(`🎨 ColorSensor: Detected YELLOW (R:${redRatio.toFixed(3)} > 0.3, G:${greenRatio.toFixed(3)} > 0.3, B:${blueRatio.toFixed(3)} < 0.25)`);
      return "yellow";
    }

    // Orange detection (red dominant, some green, low blue)
    if (
      redRatio > 0.4 &&
      greenRatio > 0.2 &&
      greenRatio < 0.4 &&
      blueRatio < 0.25
    ) {
      console.log(`🎨 ColorSensor: Detected ORANGE (R:${redRatio.toFixed(3)} > 0.4, G:${greenRatio.toFixed(3)} 0.2-0.4, B:${blueRatio.toFixed(3)} < 0.25)`);
      return "orange";
    }

    // Purple/Magenta detection (red + blue, low green)
    if (redRatio > 0.3 && blueRatio > 0.3 && greenRatio < 0.25) {
      console.log(`🎨 ColorSensor: Detected PURPLE (R:${redRatio.toFixed(3)} > 0.3, B:${blueRatio.toFixed(3)} > 0.3, G:${greenRatio.toFixed(3)} < 0.25)`);
      return "purple";
    }

    // Cyan detection (green + blue, low red)
    if (greenRatio > 0.3 && blueRatio > 0.3 && redRatio < 0.25) {
      console.log(`🎨 ColorSensor: Detected CYAN (G:${greenRatio.toFixed(3)} > 0.3, B:${blueRatio.toFixed(3)} > 0.3, R:${redRatio.toFixed(3)} < 0.25)`);
      return "cyan";
    }

    // White/light colors (all channels high)
    if (
      redRatio > 0.3 &&
      greenRatio > 0.3 &&
      blueRatio > 0.3 &&
      totalBrightness > 400
    ) {
      console.log(`🎨 ColorSensor: Detected WHITE (all ratios > 0.3, brightness ${totalBrightness} > 400)`);
      return "white";
    }

    // If no clear color detected, return null
    console.log(
      `🎨 ColorSensor: NO CLEAR COLOR detected - R:${normalizedR} G:${normalizedG} B:${normalizedB} (ratios: R:${redRatio.toFixed(
        2
      )} G:${greenRatio.toFixed(2)} B:${blueRatio.toFixed(2)})`
    );
    return null;
  };

  // Debug function to test color detection
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
      {status === "monitoring" && (
        <View style={styles.colorDisplay}>
          <ColorDisplay color={color} currentSound={lastDetectedColor} />
        </View>
      )}      {colorConfigs.length > 0 && (
        <View style={[styles.configInfo, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[styles.configTitle, { color: theme.colors.onSurface }]}>
            Aktywne konfiguracje kolorów:
          </Text>
          <ScrollView 
            style={styles.configScrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {colorConfigs
              .filter((cfg) => cfg.isEnabled)
              .map((cfg) => (
                <Text
                  key={cfg.id}
                  style={[
                    styles.configItem,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {cfg.color === 'custom' 
                    ? `Custom (RGB: ${cfg.customColorRgb?.r}, ${cfg.customColorRgb?.g}, ${cfg.customColorRgb?.b})`
                    : cfg.color
                  }: {cfg.soundName || "Dźwięk serwera"}
                  {cfg.isLooping ? " (zapętlony)" : ""}
                  {cfg.colorTolerance ? ` - tolerancja: ${(cfg.colorTolerance * 100).toFixed(0)}%` : ""}
                </Text>
              ))}
          </ScrollView>
        </View>
      )}      {lastDetectedColor && (
        <View style={[styles.detectionInfo, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text
            style={[styles.detectionTitle, { color: theme.colors.onPrimaryContainer }]}
          >
            Ostatnio wykryty kolor:
          </Text>
          <Text style={[styles.detectedColor, { color: theme.colors.onPrimaryContainer }]}>
            {lastDetectedColor}
          </Text>
        </View>
      )}

      {DEBUG_MODE && (
        <View style={[styles.debugSection, { backgroundColor: theme.colors.errorContainer }]}>
          <Text style={[styles.debugTitle, { color: theme.colors.onErrorContainer }]}>
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
              <Text style={[styles.debugSubtitle, { color: theme.colors.onErrorContainer }]}>
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
              {colorConfigs.filter(cfg => cfg.color === 'custom' && cfg.isEnabled).map((config) => (
                <Button 
                  key={config.id}
                  mode="contained-tonal" 
                  onPress={() => testColor(config.customColorRgb)}
                  style={[styles.debugButton, { marginTop: 8 }]}
                >
                  Test Custom #{config.id} ({config.customColorRgb?.r}, {config.customColorRgb?.g}, {config.customColorRgb?.b})
                </Button>
              ))}
            </View>
          )}
        </View>      )}
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
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  colorDisplay: {
    alignItems: "center",
    marginVertical: 16,
  },  configInfo: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    // backgroundColor removed - will be set dynamically with theme
  },
  configScrollView: {
    maxHeight: 120,
  },
  configTitle: {
    fontSize: 14,
    fontWeight: "600",
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
    alignItems: "center",
    // backgroundColor removed - will be set dynamically with theme
  },
  detectionTitle: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 6,
  },  detectedColor: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "capitalize",
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
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  debugToggle: {
    marginBottom: 8,
  },
  debugSubtitle: {
    fontSize: 12,
    fontWeight: "600",
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
