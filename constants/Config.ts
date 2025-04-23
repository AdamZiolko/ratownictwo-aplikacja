import { Platform } from "react-native";

// API base URL
export const API_URL =
  Platform.OS === 'android' || Platform.OS === 'ios' // Android / iOS
    ? 'http://192.168.0.139:8080'   // Zamień 10.0.2.2 na lokalny IP
    : 'http://localhost:8080'; // Web

// WebSocket URL (same host as API but with WebSocket protocol)
export const WS_URL = 
  Platform.OS === 'web' 
    ? 'ws://192.168.0.139:8080'  // Zamień localhost na lokalne IP dla web
    : 'ws://localhost:8080'; // Android / iOS

// Session codes
export const SESSION_CODE_LENGTH = 6;

// API endpoints
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
