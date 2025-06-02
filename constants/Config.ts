import Constants from 'expo-constants';

export const API_URL =
  Constants.expoConfig?.extra?.REACT_APP_API_URL ||
  process.env.EXPO_PUBLIC_REACT_APP_API_URL;
export const WS_URL =
  Constants.expoConfig?.extra?.REACT_APP_WS_URL ||
  process.env.EXPO_PUBLIC_REACT_APP_WS_URL;
export const SESSION_CODE_LENGTH = 6;
