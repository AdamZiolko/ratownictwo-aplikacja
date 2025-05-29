import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import { Surface, Text, Button, IconButton, useTheme, Card, Divider } from "react-native-paper";
import { useBleManager, ColorDisplay, ConnectionControls, ColorValue } from "./bleColorSensor";
import { ColorConfig } from "@/services/ColorConfigService";

interface ExaminerColorSensorProps {
  onColorAccepted?: (rgbValues: ColorValue, tolerance: number) => void;
  colorConfigs?: ColorConfig[];
  sessionId?: string;
}

export const ExaminerColorSensor: React.FC<ExaminerColorSensorProps> = ({
  onColorAccepted,
  colorConfigs = [],
  sessionId,
}) => {
  const theme = useTheme();
  const [currentColor, setCurrentColor] = useState<ColorValue>({ r: 0, g: 0, b: 0 });
  const [tolerance, setTolerance] = useState<number>(0.15);
  // Handle color updates from BLE manager - simplified version
  const handleColorUpdate = useCallback(
    async (color: ColorValue) => {
      setCurrentColor(color);
    },
    []
  );

  // Use BLE manager hook
  const {
    status,
    error,
    isReconnecting,
    color,
    startConnection,
    disconnectDevice,
  } = useBleManager(handleColorUpdate);
  // Handle color acceptance
  const handleAcceptColor = () => {
    if (status !== "monitoring") {
      Alert.alert("Błąd", "Najpierw połącz się z czujnikiem kolorów");
      return;
    }

    const { r, g, b } = currentColor;
    const totalBrightness = r + g + b;

    if (totalBrightness < 100) {
      Alert.alert("Błąd", "Zbyt niska jasność koloru. Przyłóż czujnik do obiektu o wyraźnym kolorze.");
      return;
    }

    Alert.alert(
      "Akceptacja koloru",
      `Czy chcesz zaakceptować kolor o wartościach RGB(${r}, ${g}, ${b}) z tolerancją ${(tolerance * 100).toFixed(0)}%?`,
      [
        {
          text: "Anuluj",
          style: "cancel",
        },
        {
          text: "Akceptuj",
          onPress: () => {
            if (onColorAccepted) {
              onColorAccepted(currentColor, tolerance);
            }
          },
        },
      ]
    );
  };

  // Handle tolerance change
  const adjustTolerance = (delta: number) => {
    const newTolerance = Math.min(0.5, Math.max(0.05, tolerance + delta));
    setTolerance(newTolerance);
  };

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>
        Czujnik Kolorów - Panel Egzaminatora
      </Text>
      
      <ConnectionControls
        status={status}
        isReconnecting={isReconnecting}
        error={error}
        onConnect={startConnection}
        onDisconnect={disconnectDevice}
      />      {status === "monitoring" && (
        <>          <View style={styles.colorDisplay}>
            <ColorDisplay color={currentColor} currentSound={null} />
          </View>

          <Divider style={styles.divider} />

          <Card style={[styles.calibrationCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content>
              <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                Akceptacja Koloru
              </Text>
              
              <Text style={[styles.instructionText, { color: theme.colors.onSurfaceVariant }]}>
                Przyłóż czujnik do obiektu o kolorze, który chcesz zaakceptować, a następnie naciśnij "Akceptuj kolor".
              </Text>

              <View style={styles.toleranceContainer}>
                <Text style={[styles.toleranceLabel, { color: theme.colors.onSurface }]}>
                  Tolerancja: {(tolerance * 100).toFixed(0)}%
                </Text>
                <View style={styles.toleranceButtons}>
                  <IconButton
                    icon="minus"
                    size={20}
                    onPress={() => adjustTolerance(-0.05)}
                    disabled={tolerance <= 0.05}
                  />
                  <IconButton
                    icon="plus"
                    size={20}
                    onPress={() => adjustTolerance(0.05)}
                    disabled={tolerance >= 0.5}
                  />
                </View>
              </View>

              <Button
                mode="contained"
                onPress={handleAcceptColor}
                style={styles.calibrateButton}
                disabled={status !== "monitoring"}
              >
                Akceptuj kolor
              </Button>
            </Card.Content>
          </Card>          {colorConfigs.length > 0 && (
            <Card style={[styles.configCard, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Card.Content>
                <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
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
                        style={[styles.configItem, { color: theme.colors.onSurfaceVariant }]}
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
              </Card.Content>
            </Card>
          )}
        </>
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
  },
  divider: {
    marginVertical: 16,
  },  calibrationCard: {
    marginVertical: 8,
    borderRadius: 8,
  },  configCard: {
    marginVertical: 8,
    borderRadius: 8,
  },
  configScrollView: {
    maxHeight: 120,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  toleranceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  toleranceLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  toleranceButtons: {
    flexDirection: "row",
    alignItems: "center",
  },  calibrateButton: {
    marginTop: 8,
  },
  configItem: {
    fontSize: 12,
    marginVertical: 2,
    paddingVertical: 1,
  },
});

export default ExaminerColorSensor;
