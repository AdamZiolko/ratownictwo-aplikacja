import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  useTheme,
  Icon,
} from 'react-native-paper';
import { ColorConfig } from '@/services/ColorConfigService';
import { getColorInfo, getPlayingSoundKey } from './constants';

interface ColorConfigItemProps {
  item: ColorConfig;
  onPlay: (config: ColorConfig) => void;
  onEdit: (config: ColorConfig) => void;
  onDelete: (configId: number) => void;
  isLoadingAudio: boolean;
  playingSound: string | null;
  loadingAudioKey: string | null;
}

const ColorConfigItem: React.FC<ColorConfigItemProps> = ({
  item,
  onPlay,
  onEdit,
  onDelete,
  isLoadingAudio,
  playingSound,
  loadingAudioKey,
}) => {
  const theme = useTheme();

  const colorInfo = getColorInfo(item.color);

  const soundKey = getPlayingSoundKey(item);

  const isCurrentlyPlaying = playingSound === soundKey;

  const isCurrentlyLoading = isLoadingAudio && loadingAudioKey === soundKey;

  const buttonStyle = {
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    ...(Platform.OS === 'web' && {
      transition: 'none',
      animationKeyframes: 'none',
    }),
  };

  const deleteButtonStyle = {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.surface,
    ...(Platform.OS === 'web' && {
      transition: 'none',
      animationKeyframes: 'none',
    }),
  };

  return (
    <Card style={[styles.listItem, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.listItemContent}>
        {/* First row - Information */}
        <View style={styles.infoRow}>
          <View style={styles.colorIndicatorContainer}>
            <View
              style={[
                styles.colorIndicator,
                {
                  backgroundColor:
                    item.color === 'custom' && item.customColorRgb
                      ? `rgb(${item.customColorRgb.r}, ${item.customColorRgb.g}, ${item.customColorRgb.b})`
                      : colorInfo.color,
                },
              ]}
            />
          </View>
          <View style={styles.infoContainer}>
            <Text
              style={[styles.listItemTitle, { color: theme.colors.onSurface }]}
            >
              {item.displayName || item.soundName || 'Bez nazwy'}
            </Text>
            <Text
              style={[
                styles.listItemDescription,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {item.color === 'custom' && item.customColorRgb
                ? `RGB(${item.customColorRgb.r}, ${item.customColorRgb.g}, ${item.customColorRgb.b})`
                : item.color === 'custom'
                ? 'Kolor niestandardowy'
                : `Kolor: ${colorInfo.name}`}
            </Text>
            <View style={styles.loopingIndicator}>
              <Icon
                source={item.isLooping ? 'repeat' : 'play'}
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.listItemDescription,
                  { color: theme.colors.onSurfaceVariant, marginLeft: 4 },
                ]}
              >
                {item.isLooping ? 'Zapętlony' : 'Pojedynczy'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.buttonsRow}>
          <View style={styles.buttonWrapper}>
            <Button
              mode="outlined"
              icon={isCurrentlyPlaying ? 'stop' : 'play'}
              compact
              disabled={isLoadingAudio}
              onPress={() => onPlay(item)}
              style={[styles.actionButtonMobile, buttonStyle]}
              contentStyle={styles.buttonContentMobile}
              rippleColor={theme.colors.primary + '20'}
              buttonColor={theme.colors.surface}
              textColor={theme.colors.primary}
            >
              {isCurrentlyPlaying ? 'Stop' : 'Play'}
            </Button>
            {isCurrentlyLoading && (
              <View style={styles.loadingOverlayMobile}>
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                />
              </View>
            )}
          </View>
          
          <View style={styles.buttonWrapper}>
            <Button
              mode="outlined"
              icon="pencil"
              compact
              disabled={isLoadingAudio}
              onPress={() => onEdit(item)}
              style={[styles.actionButtonMobile, buttonStyle]}
              contentStyle={styles.buttonContentMobile}
              rippleColor={theme.colors.primary + '20'}
              buttonColor={theme.colors.surface}
              textColor={theme.colors.primary}
            >
              Edytuj
            </Button>
          </View>
          
          <View style={styles.buttonWrapper}>
            <Button
              mode="outlined"
              icon="delete"
              compact
              disabled={isLoadingAudio}
              onPress={() => onDelete(item.id)}
              style={[styles.actionButtonMobile, deleteButtonStyle]}
              textColor={theme.colors.error}
              contentStyle={styles.buttonContentMobile}
              rippleColor={theme.colors.error + '20'}
              buttonColor={theme.colors.surface}
            >
              Usuń
            </Button>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  listItem: {
    marginBottom: 8,
    elevation: 2,
    borderRadius: 12,
  },
  listItemContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorIndicatorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    minWidth: 40,
  },
  colorIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  infoContainer: {
    flex: 1,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  buttonWrapper: {
    flex: 1,
    position: 'relative',
  },
  actionButtonMobile: {
    borderRadius: 8,
    width: '100%',
    height: 48,
  },
  buttonContentMobile: {
    paddingHorizontal: 4,
    paddingVertical: 0,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      transition: 'none',
      animationKeyframes: 'none',
    }),
  },
  loadingOverlayMobile: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  // Legacy styles for web/desktop compatibility
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flexWrap: 'nowrap',
    minWidth: 480,
  },
  playButtonContainer: {
    position: 'relative',
    width: 160,
  },
  playButton: {
    borderRadius: 8,
    width: 160,
    height: 44,
  },
  actionButton: {
    borderRadius: 8,
    width: 140,
    height: 44,
  },
  buttonContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '100%',
    ...(Platform.OS === 'web' && {
      transition: 'none',
      animationKeyframes: 'none',
    }),
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  listItemDescription: {
    fontSize: 13,
    opacity: 0.7,
  },
  loopingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
});

export default ColorConfigItem;
