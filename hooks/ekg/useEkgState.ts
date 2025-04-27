import { EkgType, EkgFactory } from '@/services/EkgFactory';
import { useState, useCallback, useEffect } from 'react';



export const useEkgState = (initialType: EkgType = EkgType.NORMAL, initialBpm: number = 72) => {
  const [ekgType, setEkgType] = useState<EkgType>(initialType);
  const [bpm, setBpm] = useState<number>(initialBpm);
  const [sliderValue, setSliderValue] = useState<number>(initialBpm);
  const [isRunning, setIsRunning] = useState(true);

  
  useEffect(() => {
    setSliderValue(initialBpm);
    setBpm(initialBpm);
  }, [initialBpm]);

  
  const togglePlayPause = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  
  const handleSliderValueChange = useCallback((value: number) => {
    
    setSliderValue(value);
    
    
    
    setBpm(value);
  }, []);

  
  const handleSliderComplete = useCallback((value: number) => {
    setBpm(value);
    setSliderValue(value); 
  }, []);

  
  const selectCustomBpm = useCallback((value: number) => {
    const newBpm = Math.round(value);
    setBpm(newBpm);
    setSliderValue(newBpm);
  }, []);

  
  const selectRhythmType = useCallback((type: EkgType) => {
    setEkgType(type);
    
    
    const typeBpm = EkgFactory.getBpmForType(type);
    setBpm(typeBpm);
    setSliderValue(typeBpm);
  }, []);

  
  const getRhythmTypeLabel = useCallback((): string => {
    
    if (ekgType !== EkgType.CUSTOM) {
      return EkgFactory.getNameForType(ekgType);
    }
    
    
    if (bpm < 60) {
      return `Bradykardia: ${bpm} BPM`;
    } else if (bpm > 100) {
      return `Tachykardia: ${bpm} BPM`;
    } else {
      return `Normalne tętno: ${bpm} BPM`;
    }
  }, [ekgType, bpm]);

  
  const getRhythmDescription = useCallback((): string => {
    return EkgFactory.getDescriptionForType(ekgType);
  }, [ekgType]);

  
  const getCurrentBpm = useCallback((): number => {
    return bpm;
  }, [bpm]);

  
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