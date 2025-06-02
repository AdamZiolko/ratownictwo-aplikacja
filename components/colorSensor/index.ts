import { Platform } from 'react-native';
import { ColorValue } from './colorUtils';

let useBleManagerImpl: (
  onColorUpdate: (color: ColorValue) => Promise<void>
) => any;

if (Platform.OS === 'web') {
  const { useBleManagerWeb } = require('./useBleManagerWeb');
  useBleManagerImpl = useBleManagerWeb;
} else {
  const {
    useBleManager: useBleManagerNative,
  } = require('./useBleManagerNative');
  useBleManagerImpl = useBleManagerNative;
}

export const useBleManager = useBleManagerImpl;

export * from './colorUtils';
export * from './constants';
