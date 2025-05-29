import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  useTheme,
  Icon,
} from "react-native-paper";
import { ColorConfig } from "@/services/ColorConfigService";
import { getColorInfo, getPlayingSoundKey } from "./constants";

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
  // Prevent color animation by maintaining consistent theme colors
  const buttonStyle = {
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    ...(Platform.OS === 'web' && {
      transition: 'none',
      animation: 'none',
    }),
  };

  const deleteButtonStyle = {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.surface,
    ...(Platform.OS === 'web' && {
      transition: 'none',
      animation: 'none',
    }),
  };

  return (
    <Card style={[styles.listItem, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.listItemContent}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View style={styles.colorIndicatorContainer}>
            <View
              style={[
                styles.colorIndicator,
                {
                  backgroundColor:
                    item.color === "custom" && item.customColorRgb
                      ? `rgb(${item.customColorRgb.r}, ${item.customColorRgb.g}, ${item.customColorRgb.b})`
                      : colorInfo.color,
                },
              ]}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>            <Text
              style={[styles.listItemTitle, { color: theme.colors.onSurface }]}
            >
              {item.displayName || item.soundName || "Bez nazwy"}
            </Text>
            <Text
              style={[
                styles.listItemDescription,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {item.color === "custom"
                ? "Kolor niestandardowy"
                : `Kolor: ${colorInfo.name}`}
            </Text>
            <View style={styles.loopingIndicator}>
              <Icon
                source={item.isLooping ? "repeat" : "play"}
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text
                style={[
                  styles.listItemDescription,
                  { color: theme.colors.onSurfaceVariant, marginLeft: 4 },
                ]}
              >
                {item.isLooping ? "Zapętlony" : "Pojedynczy"}
              </Text>
            </View>
          </View>          <View style={styles.itemActions}>
            <View style={styles.playButtonContainer}>              <Button
                mode="outlined"
                icon={isCurrentlyPlaying ? "stop" : "play"}
                compact
                disabled={isLoadingAudio}
                onPress={() => onPlay(item)}
                style={[styles.playButton, buttonStyle]}
                contentStyle={styles.buttonContent}
                rippleColor={theme.colors.primary + "20"}
                buttonColor={theme.colors.surface}
                textColor={theme.colors.primary}
              >
                {isCurrentlyPlaying ? "Stop" : "Play"}
              </Button>
              {isCurrentlyLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                </View>
              )}
            </View>            <Button
              mode="outlined"
              icon="pencil"
              compact
              disabled={isLoadingAudio}
              onPress={() => onEdit(item)}
              style={[styles.actionButton, buttonStyle]}
              contentStyle={styles.buttonContent}
              rippleColor={theme.colors.primary + "20"}
              buttonColor={theme.colors.surface}
              textColor={theme.colors.primary}
            >
              Edytuj
            </Button>
            <Button
              mode="outlined"
              icon="delete"
              compact
              disabled={isLoadingAudio}
              onPress={() => onDelete(item.id)}
              style={[styles.actionButton, deleteButtonStyle]}
              textColor={theme.colors.error}
              contentStyle={styles.buttonContent}
              rippleColor={theme.colors.error + "20"}
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
    paddingVertical: 8,
  },
  colorIndicatorContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    minWidth: 40,
  },
  colorIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    elevation: 2,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.1)",
  },  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "nowrap", // Prevent wrapping to maintain button layout
    minWidth: 480, // Increased total width for larger buttons
  },
  playButtonContainer: {
    position: "relative",
    width: 160, // Doubled width
  },
  playButton: {
    borderRadius: 8,
    width: 160, // Doubled width
    height: 36, // Fixed height
  },
  actionButton: {
    borderRadius: 8,
    width: 140, // Doubled width  
    height: 36, // Fixed height
  },buttonContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: 36, // Fixed height
    justifyContent: "center",
    alignItems: "center",
    minWidth: "100%", // Ensure button content takes full width
    ...(Platform.OS === 'web' && {
      transition: 'none',
      animation: 'none',
    }),
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  listItemDescription: {
    fontSize: 13,
    opacity: 0.7,
  },
  loopingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
});

export default ColorConfigItem;
