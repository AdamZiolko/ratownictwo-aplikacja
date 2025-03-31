import { useState, useCallback } from 'react';
import { NoiseType } from '../services/EkgFactory';

export const useNoiseState = () => {
  const [noiseType, setNoiseType] = useState<NoiseType>(NoiseType.NONE);
  const [customNoiseSettings, setCustomNoiseSettings] = useState({
    noiseAmplitude: 0,
    baselineWanderAmplitude: 0,
    muscleArtifactProbability: 0
  });

  const selectNoiseType = useCallback((type: NoiseType) => {
    setNoiseType(type);
  }, []);

  const getNoiseTypeLabel = useCallback((): string => {
    switch (noiseType) {
      case NoiseType.NONE:
        return 'No Noise';
      case NoiseType.MILD:
        return 'Mild Noise';
      case NoiseType.MODERATE:
        return 'Moderate Noise';
      case NoiseType.SEVERE:
        return 'Severe Noise';
      case NoiseType.CUSTOM:
        return 'Custom Noise';
      default:
        return 'Unknown';
    }
  }, [noiseType]);

  const getNoiseColor = useCallback(() => {
    switch (noiseType) {
      case NoiseType.NONE:
      case NoiseType.MILD:
        return 'primary';
      case NoiseType.MODERATE:
        return 'tertiary';
      case NoiseType.SEVERE:
        return 'error';
      default:
        return 'primary';
    }
  }, [noiseType]);

  return {
    noiseType,
    customNoiseSettings,
    selectNoiseType,
    getNoiseTypeLabel,
    getNoiseColor
  };
};