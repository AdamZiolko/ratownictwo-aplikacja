import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Surface, Text, useTheme } from "react-native-paper";
import { useBleManager, ColorDisplay, ConnectionControls, ColorValue } from "./bleColorSensor";

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
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Handle color updates from BLE manager
  const handleColorUpdate = useCallback(
    async (color: ColorValue) => {
      // Clear any existing debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }        // Debounce color detection to prevent rapid repeated triggering
        debounceTimeoutRef.current = setTimeout(() => {
          // Check if detected color matches any configured colors (including custom)
          const detectedConfig = detectConfiguredColor(color);

          if (detectedConfig !== lastDetectedColor) {
            // Color changed
            if (lastDetectedColor && onColorLost) {
              console.log(`🎨 ColorSensor: Lost color ${lastDetectedColor}`);
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

              if (config && onColorDetected) {
                console.log(
                  `🎨 ColorSensor: Detected color ${detectedConfig}, triggering callback`
                );
                onColorDetected(detectedConfig, config);
              } else if (!config) {
                console.log(
                  `🎨 ColorSensor: Detected color ${detectedConfig}, but no enabled configuration found`
                );
              }
            }
          }
        }, 300); // 300ms debounce delay
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

    // Ignore very dark colors
    if (totalBrightness < 100) {
      return null;
    }

    // Check all configured colors
    for (const config of colorConfigs) {
      if (!config.isEnabled) continue;
      
      if (config.color === 'custom' && config.customColorRgb) {
        const { r: targetR, g: targetG, b: targetB } = config.customColorRgb;
        const tolerance = config.colorTolerance || 0.15;
        
        if (isColorMatch(currentColor, { r: targetR, g: targetG, b: targetB }, tolerance)) {
          return `custom-${config.id}`;
        }
      } else if (config.color !== 'custom') {
        // Check predefined colors using existing logic
        const detectedColor = determineColor(currentColor);
        if (detectedColor === config.color) {
          return config.color;
        }
      }
    }

    return null;
  };

  // Function to check if two colors match within tolerance
  const isColorMatch = (color1: ColorValue, color2: ColorValue, tolerance: number): boolean => {
    const { r: r1, g: g1, b: b1 } = color1;
    const { r: r2, g: g2, b: b2 } = color2;

    // Calculate total brightness for both colors
    const total1 = r1 + g1 + b1;
    const total2 = r2 + g2 + b2;

    if (total1 === 0 || total2 === 0) return false;

    // Calculate color ratios
    const ratio1 = { r: r1 / total1, g: g1 / total1, b: b1 / total1 };
    const ratio2 = { r: r2 / total2, g: g2 / total2, b: b2 / total2 };

    // Calculate Euclidean distance between ratios
    const distance = Math.sqrt(
      Math.pow(ratio1.r - ratio2.r, 2) +
      Math.pow(ratio1.g - ratio2.g, 2) +
      Math.pow(ratio1.b - ratio2.b, 2)
    );

    // Check if distance is within tolerance
    return distance <= tolerance;
  };

  // Enhanced color detection function with better RGB thresholds
  const determineColor = (rgbColor: ColorValue): string | null => {
    const { r, g, b } = rgbColor;

    // Normalize RGB values to 0-255 range if they're in percentage or other format
    const normalizedR = Math.min(255, Math.max(0, r));
    const normalizedG = Math.min(255, Math.max(0, g));
    const normalizedB = Math.min(255, Math.max(0, b));

    // Calculate total brightness to help with color detection
    const totalBrightness = normalizedR + normalizedG + normalizedB;

    // Ignore very dark colors (might be no object detected)
    if (totalBrightness < 100) {
      return null;
    }

    // More sophisticated color detection based on dominant channels and ratios
    const redRatio = normalizedR / totalBrightness;
    const greenRatio = normalizedG / totalBrightness;
    const blueRatio = normalizedB / totalBrightness;

    // Thresholds for color detection
    const threshold = 0.4; // Dominant color should be at least 40% of total
    const secondaryThreshold = 0.25; // Secondary color threshold

    // Red detection
    if (
      redRatio > threshold &&
      greenRatio < secondaryThreshold &&
      blueRatio < secondaryThreshold
    ) {
      return "red";
    }

    // Green detection
    if (
      greenRatio > threshold &&
      redRatio < secondaryThreshold &&
      blueRatio < secondaryThreshold
    ) {
      return "green";
    }

    // Blue detection
    if (
      blueRatio > threshold &&
      redRatio < secondaryThreshold &&
      greenRatio < secondaryThreshold
    ) {
      return "blue";
    }

    // Yellow detection (red + green, low blue)
    if (redRatio > 0.3 && greenRatio > 0.3 && blueRatio < 0.25) {
      return "yellow";
    }

    // Orange detection (red dominant, some green, low blue)
    if (
      redRatio > 0.4 &&
      greenRatio > 0.2 &&
      greenRatio < 0.4 &&
      blueRatio < 0.25
    ) {
      return "orange";
    }

    // Purple/Magenta detection (red + blue, low green)
    if (redRatio > 0.3 && blueRatio > 0.3 && greenRatio < 0.25) {
      return "purple";
    }

    // Cyan detection (green + blue, low red)
    if (greenRatio > 0.3 && blueRatio > 0.3 && redRatio < 0.25) {
      return "cyan";
    }

    // White/light colors (all channels high)
    if (
      redRatio > 0.3 &&
      greenRatio > 0.3 &&
      blueRatio > 0.3 &&
      totalBrightness > 400
    ) {
      return "white";
    }

    // If no clear color detected, return null
    console.log(
      `🎨 ColorSensor: Unclear color detected - R:${normalizedR} G:${normalizedG} B:${normalizedB} (ratios: R:${redRatio.toFixed(
        2
      )} G:${greenRatio.toFixed(2)} B:${blueRatio.toFixed(2)})`
    );
    return null;
  };

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
      )}

      {lastDetectedColor && (
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
  },
  detectedColor: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
});

export default ColorSensor;
