export const AVAILABLE_COLORS = [
  { key: "red", name: "Czerwony", color: "#F44336" },
  { key: "green", name: "Zielony", color: "#4CAF50" },
  { key: "blue", name: "Niebieski", color: "#2196F3" },
  { key: "yellow", name: "Żółty", color: "#FFEB3B" },
  { key: "orange", name: "Pomarańczowy", color: "#FF9800" },
  { key: "purple", name: "Fioletowy", color: "#9C27B0" },
  { key: "custom", name: "Dostosowany", color: "#607D8B" },
];

export const getColorInfo = (colorKey: string) => {
  return AVAILABLE_COLORS.find((c) => c.key === colorKey) || AVAILABLE_COLORS[0];
};

export const getPlayingSoundKey = (config: { serverAudioId?: string; soundName?: string }) => {
  if (config.serverAudioId) {
    return `server_${config.serverAudioId}`;
  }
  return config.soundName || "";
};
