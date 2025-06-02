import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { ColorValue } from './colorUtils';

interface BleManagerState {
  bleState: string;
  device: any;
  status: 'idle' | 'scanning' | 'connected' | 'monitoring' | 'error';
  error: string | null;
  isReconnecting: boolean;
  autoReconnect: boolean;
  color: ColorValue;
  lastColorUpdate: number;
}

export const useBleManagerWeb = (
  onColorUpdate: (color: ColorValue) => Promise<void>
) => {
  const [bleState] = useState<string>('Unsupported');
  const [device] = useState<any>(null);
  const [status] = useState<BleManagerState['status']>('idle');
  const [error] = useState<string | null>('BLE not supported on web platform');
  const [isReconnecting] = useState<boolean>(false);
  const [autoReconnect] = useState<boolean>(false);
  const [color] = useState<ColorValue>({ r: 0, g: 0, b: 0 });
  const [lastColorUpdate] = useState<number>(0);

  const startConnection = useCallback(() => {}, []);

  const disconnectDevice = useCallback(async () => {}, []);

  return {
    bleState,
    device,
    status,
    error,
    isReconnecting,
    autoReconnect,
    color,
    lastColorUpdate,
    startConnection,
    disconnectDevice,
  };
};
