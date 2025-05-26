import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme, Chip, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colorConfigService, { ColorConfig } from '@/services/ColorConfigService';
import { sessionService } from '@/services/SessionService';

interface ColorConfigurationDisplayProps {
  sessionId?: string;
  sessionCode?: string; // Add sessionCode for real-time updates
}

const COLOR_INFO = {
  red: { label: 'Czerwony', color: '#FF4444', icon: 'circle' as const },
  green: { label: 'Zielony', color: '#44FF44', icon: 'circle' as const },
  blue: { label: 'Niebieski', color: '#4444FF', icon: 'circle' as const },
};

const ColorConfigurationDisplay: React.FC<ColorConfigurationDisplayProps> = ({ 
  sessionId, 
  sessionCode 
}) => {
  const theme = useTheme();
  const [colorConfigs, setColorConfigs] = useState<ColorConfig[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadColorConfigs();
    }
  }, [sessionId]);
  // Subscribe to session updates for real-time config changes
  useEffect(() => {
    if (!sessionCode) return;

    let unsubscribe: (() => void) | null = null;

    const setupSubscription = async () => {
      try {
        unsubscribe = await sessionService.subscribeToSessionUpdates(
          sessionCode,
          (updatedSession) => {
            if (updatedSession.colorConfigs) {
              setColorConfigs(updatedSession.colorConfigs);
            }
          }
        );
      } catch (error) {
        console.error('Error setting up session subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [sessionCode]);

  const loadColorConfigs = async () => {
    try {
      setLoading(true);
      const configs = await colorConfigService.getSessionColorConfigs(sessionId!);
      setColorConfigs(configs || []);
    } catch (error) {
      console.error('Error loading color configurations:', error);
      setColorConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const enabledConfigs = colorConfigs.filter(config => config.isEnabled);

  if (!sessionId) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Content>        <View style={styles.header}>
          <MaterialCommunityIcons 
            name="palette" 
            size={24} 
            color={theme.colors.primary} 
          />
          <Text variant="titleMedium" style={styles.title}>
            Konfiguracja kolorów
          </Text>
          <View style={styles.headerActions}>
            <MaterialCommunityIcons 
              name="refresh" 
              size={20} 
              color={theme.colors.primary}
              onPress={() => sessionId && loadColorConfigs()}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" />
            <Text style={styles.loadingText}>Ładowanie...</Text>
          </View>
        ) : enabledConfigs.length > 0 ? (
          <View>
            <Text variant="bodyMedium" style={styles.description}>
              Aktywne kolory i przypisane dźwięki:
            </Text>
            <View style={styles.configList}>
              {enabledConfigs.map((config) => {
                const colorInfo = COLOR_INFO[config.colorType];
                const soundName = config.soundFileName?.replace('.mp3', '') || 'Brak';
                
                return (
                  <View key={config.colorType} style={styles.configItem}>
                    <View style={styles.colorInfo}>
                      <View 
                        style={[
                          styles.colorDot, 
                          { backgroundColor: colorInfo.color }
                        ]} 
                      />
                      <Text variant="bodyMedium" style={styles.colorLabel}>
                        {colorInfo.label}
                      </Text>
                    </View>
                    <Chip mode="outlined" style={styles.soundChip}>
                      {soundName}
                    </Chip>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.noConfigContainer}>
            <MaterialCommunityIcons 
              name="palette-outline" 
              size={48} 
              color={theme.colors.outline} 
            />
            <Text variant="bodyMedium" style={styles.noConfigText}>
              Brak aktywnych konfiguracji kolorów
            </Text>
            <Text variant="bodySmall" style={styles.noConfigSubtext}>
              Instruktor może skonfigurować kolory dla tej sesji
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginLeft: 8,
    fontWeight: '600',
    flex: 1,
  },
  headerActions: {
    marginLeft: 'auto',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    opacity: 0.7,
  },
  description: {
    marginBottom: 12,
    opacity: 0.8,
  },
  configList: {
    gap: 8,
  },
  configItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  colorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  colorLabel: {
    flex: 1,
  },
  soundChip: {
    marginLeft: 8,
  },
  noConfigContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noConfigText: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  noConfigSubtext: {
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.5,
  },
});

export default ColorConfigurationDisplay;
