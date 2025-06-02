import { useState, useEffect } from 'react';
import { ColorConfig, colorConfigService } from '@/services/ColorConfigService';
import { socketService } from '@/services/SocketService';

interface UseColorConfigsProps {
  sessionId?: string;
  sessionJoined: boolean;
}

export const useColorConfigs = ({
  sessionId,
  sessionJoined,
}: UseColorConfigsProps) => {
  const [colorConfigs, setColorConfigs] = useState<ColorConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchColorConfigs = async () => {
    if (!sessionId || !sessionJoined) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const configs = await colorConfigService.getColorConfigsForStudent(
        sessionId
      );
      setColorConfigs(configs);
    } catch (err) {
      console.error('Error fetching color configs:', err);
      setError('Błąd podczas pobierania konfiguracji kolorów');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchColorConfigs();
  }, [sessionId, sessionJoined]);

  useEffect(() => {
    if (!sessionJoined) return;

    const handleColorConfigListUpdate = (data: {
      sessionId: string;
      colorConfigs: ColorConfig[];
    }) => {
      console.log('🔄 Color config list updated via WebSocket:', data);
      setColorConfigs(data.colorConfigs);
    };

    const cleanup = socketService.on(
      'color-config-list-update',
      handleColorConfigListUpdate
    );

    return cleanup;
  }, [sessionJoined]);

  const refreshColorConfigs = () => {
    fetchColorConfigs();
  };

  return {
    colorConfigs,
    isLoading,
    error,
    refreshColorConfigs,
  };
};
