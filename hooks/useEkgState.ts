import { useState, useCallback, useEffect } from 'react';
import { EkgType, EkgFactory } from '../services/EkgFactory';

/**
 * Custom hook to manage EKG state including rhythm type selection, BPM, and playback
 */
export const useEkgState = (initialType: EkgType = EkgType.NORMAL, initialBpm: number = 72) => {
  const [ekgType, setEkgType] = useState<EkgType>(initialType);
  const [bpm, setBpm] = useState<number>(initialBpm);
  const [sliderValue, setSliderValue] = useState<number>(initialBpm);
  const [isRunning, setIsRunning] = useState(true);

  // Ensure initial sync between bpm and sliderValue
  useEffect(() => {
    setSliderValue(initialBpm);
    setBpm(initialBpm);
  }, [initialBpm]);

  // Toggle play/pause of the EKG animation
  const togglePlayPause = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  // Handle live slider value changes
  const handleSliderValueChange = useCallback((value: number) => {
    // Immediately update slider value for smooth UI
    setSliderValue(value);
    
    // Also update BPM in real-time for more responsive feedback
    // This makes the EKG update immediately as you drag the slider
    setBpm(value);
  }, []);

  // Handle slider value changes when user stops sliding
  const handleSliderComplete = useCallback((value: number) => {
    setBpm(value);
    setSliderValue(value); // Ensure values are in sync
  }, []);

  // Handle selection of preset BPM values 
  const selectCustomBpm = useCallback((value: number) => {
    const newBpm = Math.round(value);
    setBpm(newBpm);
    setSliderValue(newBpm);
  }, []);

  // Handle selection of a specific rhythm type
  const selectRhythmType = useCallback((type: EkgType) => {
    setEkgType(type);
    
    // Also update the BPM to the default for this rhythm type
    const typeBpm = EkgFactory.getBpmForType(type);
    setBpm(typeBpm);
    setSliderValue(typeBpm);
  }, []);

  // Get a descriptive label for the current rhythm type
  const getRhythmTypeLabel = useCallback((): string => {
    // If using a preset rhythm type, return its name
    if (ekgType !== EkgType.CUSTOM) {
      return EkgFactory.getNameForType(ekgType);
    }
    
    // Otherwise, categorize based on BPM
    if (bpm < 60) {
      return `Bradykardia: ${bpm} BPM`;
    } else if (bpm > 100) {
      return `Tachykardia: ${bpm} BPM`;
    } else {
      return `Normalne tętno: ${bpm} BPM`;
    }
  }, [ekgType, bpm]);

  // Get the description for the current rhythm type
  const getRhythmDescription = useCallback((): string => {
    return EkgFactory.getDescriptionForType(ekgType);
  }, [ekgType]);

  // Get the current BPM value
  const getCurrentBpm = useCallback((): number => {
    return bpm;
  }, [bpm]);

  // Get appropriate color for the BPM indicator based on rate
  const getBpmIndicatorColor = useCallback(() => {
    if (bpm < 60) return 'error';
    if (bpm > 100) return 'secondary';
    return 'primary';
  }, [bpm]);

  return {
    ekgType,
    bpm,
    sliderValue,
    isRunning,
    togglePlayPause,
    handleSliderValueChange,
    handleSliderComplete,
    selectCustomBpm,
    selectRhythmType,
    getRhythmTypeLabel,
    getRhythmDescription,
    getCurrentBpm,
    getBpmIndicatorColor
  };
};