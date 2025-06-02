export const AVAILABLE_COLORS = [
  { key: 'custom', name: 'Dostosowany', color: '#607D8B' },
];

export const getColorInfo = (colorKey: string) => {
  return AVAILABLE_COLORS.find(c => c.key === colorKey) || AVAILABLE_COLORS[0];
};

export const getPlayingSoundKey = (config: {
  serverAudioId?: string;
  soundName?: string;
}) => {
  if (config.serverAudioId) {
    return `server_${config.serverAudioId}`;
  }
  return config.soundName || '';
};
