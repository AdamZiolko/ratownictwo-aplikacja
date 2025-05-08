
import { heartbeat_data } from './ekg_data';
import { EkgType, NoiseType } from './EkgFactory';

export class EkgDataAdapter {
  private static dataPoints = {
    timestamps: heartbeat_data.timestamps,
    amplitudes: heartbeat_data.amplitudes
  };

  
  
  private static valueCache: { [key: string]: number } = {};

  
  public static getValue(x: number, ekgType: EkgType, bpm: number, noiseType: NoiseType): number {
    
    const bpmScaleFactor = this.getBpmScaleFactor(ekgType, bpm);
    const scaledX = x * bpmScaleFactor;
    
    
    const dataLength = this.dataPoints.timestamps.length;
    const maxTime = this.dataPoints.timestamps[dataLength - 1];
    const normalizedX = scaledX % maxTime;  
    
    
    const cacheKey = `${normalizedX.toFixed(2)}_${ekgType}_${noiseType}`;
    if (this.valueCache[cacheKey] !== undefined) {
      return this.valueCache[cacheKey];
    }
    
    
    let indexLow = 0;
    let indexHigh = this.dataPoints.timestamps.length - 1;
    
    
    while (indexHigh - indexLow > 1) {
      const mid = Math.floor((indexLow + indexHigh) / 2);
      if (this.dataPoints.timestamps[mid] > normalizedX) {
        indexHigh = mid;
      } else {
        indexLow = mid;
      }
    }
    
    
    if (this.dataPoints.timestamps[indexLow] === normalizedX) {
      const value = this.applyEkgTypeTransformation(
        this.dataPoints.amplitudes[indexLow], 
        ekgType,
        noiseType
      );
      this.valueCache[cacheKey] = value;
      return value;
    }
    
    
    const x0 = this.dataPoints.timestamps[indexLow];
    const x1 = this.dataPoints.timestamps[indexHigh];
    const y0 = this.dataPoints.amplitudes[indexLow];
    const y1 = this.dataPoints.amplitudes[indexHigh];
    
    
    const interpolatedValue = y0 + (normalizedX - x0) * (y1 - y0) / (x1 - x0);
    
    
    const value = this.applyEkgTypeTransformation(interpolatedValue, ekgType, noiseType);
    
    this.valueCache[cacheKey] = value;
    return value;
  }
  
  
  public static resetCache(): void {
    this.valueCache = {};
  }
  
    private static applyEkgTypeTransformation(value: number, ekgType: EkgType, noiseType: NoiseType): number {
    
    const BASELINE_VALUE = 110;
    const AVERAGE_AMPLITUDE = 35; 

    
    let transformedValue = BASELINE_VALUE + (value - AVERAGE_AMPLITUDE);
    
    
    switch (ekgType) {
      case EkgType.NORMAL:
        
        break;
      case EkgType.TACHYCARDIA:
        transformedValue = BASELINE_VALUE + (transformedValue - BASELINE_VALUE) * 1.3;
        break;
      case EkgType.BRADYCARDIA:
        transformedValue = BASELINE_VALUE + (transformedValue - BASELINE_VALUE) * 1.2;
        break;
      case EkgType.AFIB:
        
        transformedValue += (Math.sin(value * 0.3) * 5);
        break;
      case EkgType.VFIB:
        
        transformedValue = BASELINE_VALUE + (value - AVERAGE_AMPLITUDE) * 0.8 + (Math.sin(value * 0.7) * 10);
        break;
      case EkgType.VTACH:
        transformedValue = BASELINE_VALUE + (transformedValue - BASELINE_VALUE) * 1.5;
        break;
      case EkgType.TORSADE:
        
        transformedValue += Math.sin(value * 0.01) * 20;
        break;
      case EkgType.ASYSTOLE:
        
        transformedValue = BASELINE_VALUE + (transformedValue - BASELINE_VALUE) * 0.05;
        break;
      case EkgType.HEART_BLOCK:
        
        if (Math.floor(value / 30) % 3 === 2) {
          transformedValue = BASELINE_VALUE;
        }
        break;
      case EkgType.PVC:
        
        if (Math.floor(value / 40) % 5 === 0) {
          transformedValue += 20;
        }
        break;
    }
    
    
    transformedValue += this.applyNoise(value, noiseType);
    
    return transformedValue;
  }
  
  
  private static applyNoise(value: number, noiseType: NoiseType): number {
    switch (noiseType) {
      case NoiseType.NONE:
        return 0;
      case NoiseType.MILD:
        return (Math.random() - 0.5) * 3;
      case NoiseType.MODERATE:
        return (Math.random() - 0.5) * 8 + Math.sin(value * 0.1) * 3;
      case NoiseType.SEVERE:
        return (Math.random() - 0.5) * 15 + Math.sin(value * 0.2) * 5;
      default:
        return 0;
    }
  }
  
  
  private static getBpmScaleFactor(ekgType: EkgType, userBpm: number): number {
    
    const dataBaseBpm = 72;
    
    
    let typeBpm = dataBaseBpm;
    switch (ekgType) {
      case EkgType.TACHYCARDIA:
        typeBpm = 120;
        break;
      case EkgType.BRADYCARDIA:
        typeBpm = 45;
        break;
      case EkgType.AFIB:
        typeBpm = 110;
        break;
      case EkgType.VFIB:
        typeBpm = 300;
        break;
      case EkgType.VTACH:
        typeBpm = 180;
        break;
      case EkgType.TORSADE:
        typeBpm = 200;
        break;
      case EkgType.ASYSTOLE:
        typeBpm = 0.1;  
        break;
      case EkgType.HEART_BLOCK:
        typeBpm = 40;
        break;
      case EkgType.PVC:
        typeBpm = 70;
        break;
    }
    
    
    const effectiveBpm = userBpm || typeBpm;
    
    
    return effectiveBpm / dataBaseBpm;
  }
}