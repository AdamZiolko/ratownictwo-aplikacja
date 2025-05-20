import { Platform } from "react-native";


// Configuration for server connections
const SERVER_PORT = '8080';

// Special handling for Android emulator
// 10.0.2.2 is the special IP to access the host machine from Android emulator
// For physical devices, use your actual IP address (e.g., 192.168.100.7)
const getServerIP = () => {
  if (Platform.OS === 'android') {
    // Use the special 10.0.2.2 IP for Android emulators
    return '192.168.1.111'; // Replace with your actual IP address
  } else if (Platform.OS === 'ios') {
    // For iOS simulators, localhost works
    return 'localhost';
  } else if (Platform.OS === 'web') {
    // For web, use the current window location or localhost
    return 'localhost';
  }
  // Default to localhost for any other platform
  return 'localhost';
};

export const API_URL = `http://${getServerIP()}:${SERVER_PORT}`;

export const WS_URL = `ws://${getServerIP()}:${SERVER_PORT}`;


export const SESSION_CODE_LENGTH = 6;


export const ENDPOINTS = {
  AUTH: {
    LOGIN: 'auth/signin',
    REGISTER: 'auth/signup',
    REFRESH: 'auth/refreshtoken',
  },
  SESSIONS: {
    BASE: 'sessions',
    BY_CODE: (code: number) => `sessions/code/${code}`,
    VALIDATE: (code: number) => `sessions/validate/${code}`,
  },
  STUDENT: {
    PROFILE: 'students/profile',
  }
};