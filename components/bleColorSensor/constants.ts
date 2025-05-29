// BLE Constants
export const BLE_CONFIG = {
  SERVICE_UUID: "12345678-1234-1234-1234-1234567890ab",
  CHARACTERISTIC_UUID: "abcd1234-5678-90ab-cdef-1234567890ab",
  DEVICE_NAME: "ESP32_RGB_DIST",
};

// Color detection constants
export const MIN_BRIGHTNESS = 10;

export const COLOR_RATIO_THRESHOLDS = {
  RED: 0.4,
  GREEN: 0.4,
  BLUE: 0.4,
  WHITE_THRESHOLD: 0.1,
  COLOR_DIFF_THRESHOLD: 0.2,
  MIN_BRIGHTNESS: 20,
};

// Color prototypes for detection
export const COLOR_PROTOTYPES = {
  RED: { r: 62, g: 48, b: 69 },
  GREEN: { r: 34, g: 73, b: 75 },
  BLUE: { r: 42, g: 112, b: 205 },
};

// Color calibration values
export const COLOR_CALIBRATION = {
  TYPICAL_RED: { r: 255, g: 0, b: 0 },
  TYPICAL_GREEN: { r: 0, g: 255, b: 0 },
  TYPICAL_BLUE: { r: 0, g: 0, b: 255 },
  TYPICAL_YELLOW: { r: 255, g: 255, b: 0 },
  TYPICAL_ORANGE: { r: 255, g: 165, b: 0 },
  TYPICAL_PURPLE: { r: 128, g: 0, b: 128 },
};

// Default sound mappings
export const DEFAULT_SOUND_FILES = {
  red: require("../../assets/sounds/Adult/Male/Screaming.wav"),
  green: require("../../assets/sounds/Adult/Female/Screaming.wav"),
  blue: require("../../assets/sounds/Child/Screaming.wav"),
};
