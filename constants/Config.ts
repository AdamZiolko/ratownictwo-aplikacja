import { Platform } from "react-native";


export const API_URL =
  Platform.OS === 'android' || Platform.OS === 'ios' 
    ? 'http://192.168.100.7:8080'   
    : 'http://localhost:8080'; 


export const WS_URL = 
  Platform.OS === 'web' 
    ? 'ws://192.168.100.7:8080'  
    : 'ws://localhost:8080'; 


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