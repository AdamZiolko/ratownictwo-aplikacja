import { Platform } from 'react-native';
import { ColorValue } from './colorUtils';

// Import based on platform
let useBleManagerImpl: (onColorUpdate: (color: ColorValue) => Promise<void>) => any;

if (Platform.OS === 'web') {
  // Dynamic import for web
  const { useBleManagerWeb } = require('./useBleManagerWeb');
  useBleManagerImpl = useBleManagerWeb;
} else {
  // Dynamic import for native
  const { useBleManager: useBleManagerNative } = require('./useBleManagerNative');
  useBleManagerImpl = useBleManagerNative;
}

export const useBleManager = useBleManagerImpl;

// Also export other utilities from this module
export * from './colorUtils';
export * from './constants';
