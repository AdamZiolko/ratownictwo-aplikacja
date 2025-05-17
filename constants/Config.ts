import { Platform } from "react-native";



const SERVER_PORT = '8080';




const getServerIP = () => {
  if (Platform.OS === 'android') {
    
    return '192.168.100.7'; 
  } else if (Platform.OS === 'ios') {
    
    return 'localhost';
  } else if (Platform.OS === 'web') {
    
    return 'localhost';
  }
  
  return 'localhost';
};

export const API_URL = `http:

export const WS_URL = `ws:


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