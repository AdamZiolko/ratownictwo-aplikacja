import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import {
  Button,
  Dialog,
  Text,
  Card,
  Switch,
  Menu,
  List,
  Divider,
  useTheme,
  ActivityIndicator,
  Snackbar,
} from "react-native-paper";
import colorConfigService, { ColorConfig } from "@/services/ColorConfigService";
import sounds from "@/soundList";

interface ColorConfigDialogProps {
  visible: boolean;
  onDismiss: () => void;
  sessionId: number;
}

const COLOR_TYPES = [
  { key: "red", label: "Czerwony", color: "#FF4444" },
  { key: "green", label: "Zielony", color: "#44FF44" },
  { key: "blue", label: "Niebieski", color: "#4444FF" },
];

const ColorConfigDialog = ({
  visible,
  onDismiss,
  sessionId,
}: ColorConfigDialogProps) => {
  const theme = useTheme();
  const [colorConfigs, setColorConfigs] = useState<ColorConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuVisible, setMenuVisible] = useState<{ [key: string]: boolean }>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (visible && sessionId) {
      loadColorConfigs();
    }
  }, [visible, sessionId]);
  const loadColorConfigs = async () => {
    try {
      setLoading(true);
      let configs = await colorConfigService.getSessionColorConfigs(sessionId.toString());
        // If no configs exist, create default ones
      if (!configs || configs.length === 0) {
        const defaultConfigs: ColorConfig[] = COLOR_TYPES.map(colorType => ({
          sessionId: sessionId.toString(),
          colorType: colorType.key as 'red' | 'green' | 'blue',
          soundFileName: `${colorType.key}.mp3`,
          isEnabled: false
        }));
        
        configs = await colorConfigService.setSessionColorConfigs(sessionId.toString(), defaultConfigs);
      }
      
      setColorConfigs(configs);
    } catch (error) {
      console.error("Error loading color configurations:", error);
      Alert.alert("Błąd", "Nie udało się załadować konfiguracji kolorów");
    } finally {
      setLoading(false);
    }
  };
  const updateColorConfig = async (
    colorType: string,
    updates: Partial<ColorConfig>
  ) => {
    try {
      setSaving(true);
      const config = colorConfigs.find((c) => c.colorType === colorType);
      
      if (config && config.id) {
        const updatedConfig = await colorConfigService.updateColorConfig(config.id, {
          ...config,
          ...updates,
        });
          setColorConfigs(prev =>
          prev.map(c => c.colorType === colorType ? { ...c, ...updates } : c)
        );
        
        setSnackbarMessage('Konfiguracja zaktualizowana pomyślnie');
        setSnackbarVisible(true);} else if (config) {
        // If no ID exists, create a new config
        const newConfig = await colorConfigService.createColorConfig({
          sessionId: sessionId.toString(),
          ...config,
          ...updates,
        });
          setColorConfigs(prev =>
          prev.map(c => c.colorType === colorType ? newConfig : c)
        );
        
        setSnackbarMessage('Konfiguracja utworzona pomyślnie');
        setSnackbarVisible(true);
      } else {
        // Create completely new config
        const newConfig = await colorConfigService.createColorConfig({
          sessionId: sessionId.toString(),
          colorType: colorType as 'red' | 'green' | 'blue',
          soundFileName: `${colorType}.mp3`,
          isEnabled: false,
          ...updates,
        });
        
        setColorConfigs(prev => [...prev, newConfig]);
        
        setSnackbarMessage('Nowa konfiguracja utworzona');
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error("Error updating color configuration:", error);
      Alert.alert("Błąd", "Nie udało się zaktualizować konfiguracji");
    } finally {
      setSaving(false);
    }
  };
  const toggleColorEnabled = (colorType: string) => {
    const config = colorConfigs.find((c) => c.colorType === colorType);
    if (config) {
      updateColorConfig(colorType, { isEnabled: !config.isEnabled });
    } else {
      // Create new config when toggling for the first time
      updateColorConfig(colorType, { isEnabled: true });
    }
  };

  const changeSoundFile = (colorType: string, soundFileName: string) => {
    updateColorConfig(colorType, { soundFileName });
    setMenuVisible(prev => ({ ...prev, [colorType]: false }));
  };
  const renderColorConfigCard = (colorType: { key: string; label: string; color: string }) => {
    const config = colorConfigs.find((c) => c.colorType === colorType.key);
    
    if (!config) {
      // If config doesn't exist, create a placeholder
      const placeholderConfig: ColorConfig = {
        sessionId: sessionId.toString(),
        colorType: colorType.key as 'red' | 'green' | 'blue',
        soundFileName: `${colorType.key}.mp3`,
        isEnabled: false
      };
      
      return (
        <Card key={colorType.key} style={styles.colorCard}>
          <Card.Content>
            <View style={styles.colorHeader}>
              <View style={styles.colorIndicator}>
                <View
                  style={[
                    styles.colorCircle,
                    { backgroundColor: colorType.color }
                  ]}
                />
                <Text variant="titleMedium">{colorType.label}</Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => {
                  // Create new config when enabling
                  updateColorConfig(colorType.key, { isEnabled: true });
                }}
                disabled={saving}
              />
            </View>
          </Card.Content>
        </Card>
      );
    }

    const selectedSound = sounds.find(s => 
      s.name.toLowerCase() === config.soundFileName?.replace('.mp3', '').toLowerCase()
    );

    return (
      <Card key={colorType.key} style={styles.colorCard}>
        <Card.Content>
          <View style={styles.colorHeader}>
            <View style={styles.colorIndicator}>
              <View
                style={[
                  styles.colorCircle,
                  { backgroundColor: colorType.color }
                ]}
              />
              <Text variant="titleMedium">{colorType.label}</Text>
            </View>
            <Switch
              value={config.isEnabled}
              onValueChange={() => toggleColorEnabled(colorType.key)}
              disabled={saving}
            />
          </View>
          
          {config.isEnabled && (
            <View style={styles.soundSelection}>
              <Text variant="bodyMedium" style={styles.soundLabel}>
                Dźwięk:
              </Text>
              <Menu
                visible={menuVisible[colorType.key] || false}
                onDismiss={() =>
                  setMenuVisible(prev => ({ ...prev, [colorType.key]: false }))
                }
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() =>
                      setMenuVisible(prev => ({ ...prev, [colorType.key]: true }))
                    }
                    disabled={saving}
                    style={styles.soundButton}
                  >
                    {selectedSound?.name || "Wybierz dźwięk"}
                  </Button>
                }
              >
                {sounds.map((sound) => (
                  <Menu.Item
                    key={sound.name}
                    onPress={() => changeSoundFile(colorType.key, `${sound.name.toLowerCase()}.mp3`)}
                    title={sound.name}
                  />
                ))}
              </Menu>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };
  return (
    <>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Konfiguracja kolorów</Dialog.Title>
        <Dialog.Content>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Ładowanie konfiguracji...</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollView}>              <Text variant="bodyMedium" style={styles.description}>
                Skonfiguruj, które kolory mają być rozpoznawane przez czujnik i jakie dźwięki mają być odtwarzane.
              </Text>
                {/* Active configurations summary */}
              {colorConfigs.filter(c => c.isEnabled).length > 0 ? (
                <Card style={styles.summaryCard}>
                  <Card.Content>
                    <Text variant="titleSmall" style={styles.summaryTitle}>
                      Aktywne konfiguracje:
                    </Text>
                    {colorConfigs.filter(c => c.isEnabled).map(config => {
                      const colorInfo = COLOR_TYPES.find(t => t.key === config.colorType);
                      const soundName = config.soundFileName?.replace('.mp3', '') || 'Brak';
                      return (
                        <Text key={config.colorType} variant="bodySmall" style={styles.summaryItem}>
                          • {colorInfo?.label}: {soundName}
                        </Text>
                      );
                    })}
                  </Card.Content>
                </Card>
              ) : (
                <Card style={styles.warningCard}>
                  <Card.Content>
                    <Text variant="titleSmall" style={styles.warningTitle}>
                      ⚠️ Brak aktywnych konfiguracji
                    </Text>
                    <Text variant="bodySmall" style={styles.warningText}>
                      Włącz co najmniej jeden kolor, aby czujnik mógł wykrywać kolory i odtwarzać dźwięki.
                    </Text>
                  </Card.Content>
                </Card>
              )}
              
              {COLOR_TYPES.map(renderColorConfigCard)}
            </ScrollView>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={saving}>
            {saving ? "Zapisywanie..." : "Zamknij"}
          </Button>
        </Dialog.Actions>
      </Dialog>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: Dimensions.get("window").height * 0.8,
  },
  scrollView: {
    maxHeight: Dimensions.get("window").height * 0.6,
  },  description: {
    marginBottom: 16,
    textAlign: "center",
    opacity: 0.7,
  },
  summaryCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(0, 150, 0, 0.1)',
  },
  summaryTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },  summaryItem: {
    marginLeft: 8,
    opacity: 0.8,
  },
  warningCard: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  warningTitle: {
    marginBottom: 8,
    fontWeight: '600',
    color: '#FF9800',
  },
  warningText: {
    opacity: 0.8,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    opacity: 0.7,
  },
  colorCard: {
    marginBottom: 12,
  },
  colorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  colorIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#000",
  },
  soundSelection: {
    marginTop: 12,
  },
  soundLabel: {
    marginBottom: 8,
    fontWeight: "500",
  },
  soundButton: {
    alignSelf: "flex-start",
  },
});

export default ColorConfigDialog;
