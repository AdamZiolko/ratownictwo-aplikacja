// constants/Config.ts

import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getDevHost(): string {
  const hostUri = (Constants.expoConfig as any)?.hostUri;
  if (hostUri) return hostUri.split(':')[0];
  const dbg = (Constants.manifest as any)?.debuggerHost;
  if (dbg) return dbg.split(':')[0];
  return 'localhost';
}

export const API_URL: string = __DEV__
  ? `http://${getDevHost()}:8080/api`
  : 'https://localhost/api';

export {};