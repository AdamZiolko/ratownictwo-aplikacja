/**
 * Application configuration constants
 */

import { Platform } from "react-native";

// API base URL
export const API_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8080'   // Android emulator
    : 'http://localhost:8080'; // iOS simulator or web
    
// WebSocket URL (same host as API but with WebSocket protocol)
export const WS_URL = 'ws://localhost:8080';

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
