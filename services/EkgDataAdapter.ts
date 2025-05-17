/**
 * EkgDataAdapter.ts
 * 
 * A specialized adapter to ensure proper loading of EKG data for different types.
 * This helps isolate EKG data from caching issues by providing a fresh copy of data
 * whenever a new type is requested.
 */

import { EkgType, NoiseType } from './EkgFactory';
import { EkgJsonDataLoader } from './EkgJsonDataLoader';

// Define the structure of the EKG data
interface EkgData {
  timestamps: number[];
  values: number[];
  sampleRate: number;
}

/**
 * Adapter class to handle EKG data in a format suitable for visualization
 * Acts as a buffer between raw data and rendering components
 */
export class EkgDataAdapter {
  private static instance: EkgDataAdapter;
  private dataCache: Map<number, EkgData> = new Map();
  private fallbackData: EkgData;
  
  constructor() {
    // Create fallback data for any missing EKG types
    this.fallbackData = {
      timestamps: Array.from({length: 100}, (_, i) => i),
      values: Array.from({length: 100}, (_, i) => 150 + Math.sin(i * 0.2) * 50),
      sampleRate: 100
    };
  }
  
  /**
   * Get the singleton instance of the adapter
   */
  public static getInstance(): EkgDataAdapter {
    if (!EkgDataAdapter.instance) {
      EkgDataAdapter.instance = new EkgDataAdapter();
    }
    return EkgDataAdapter.instance;
  }
  
  /**
   * Static method to initialize the adapter
   */
  public static initialize(): void {
    EkgDataAdapter.getInstance();
    console.log("EKG data adapter initialized");
  }
  
  /**
   * Static method to get data for a specific EKG type
   */
  public static getDataForType(ekgType: EkgType): EkgData {
    return EkgDataAdapter.getInstance().getDataForType(ekgType);
  }
  
  /**
   * Static method to get value at a specific time
   */
  public static getValueAtTime(ekgType: EkgType, time: number, bpm: number, noiseType: NoiseType): number {
    return EkgDataAdapter.getInstance().getValueAtTime(ekgType, time, bpm, noiseType);
  }
  
  /**
   * Static method to reset the cache
   */
  public static resetCache(): void {
    return EkgDataAdapter.getInstance().resetCache();
  }
  
  /**
   * Reset internal cache
   */
  public resetCache(): void {
    this.dataCache.clear();
  }
  
  /**
   * Get data for a specific EKG type
   */
  public getDataForType(ekgType: EkgType): EkgData {
    try {
      // Check if we already have this data cached
      if (this.dataCache.has(ekgType)) {
        return this.dataCache.get(ekgType)!;
      }
      
      // Try to load data from JSON loader
      const rawData = EkgJsonDataLoader.loadEkgDataForAdapter(ekgType);
      
      if (!rawData) {
        console.error(`EkgDataAdapter error: No data available for EKG type ${ekgType}`);
        throw new Error(`No data available for EKG type ${ekgType}`);
      }
      
      // Convert to adapter format
      const adaptedData: EkgData = {
        timestamps: [...rawData.timestamps],
        values: [...rawData.values],
        sampleRate: rawData.sample_rate
      };
      
      // Cache and return
      this.dataCache.set(ekgType, adaptedData);
      return adaptedData;
      
    } catch (error) {
      console.error(`EkgDataAdapter error:`, error);
      
      // Generate appropriate fallback data for this type
      let fallbackData: EkgData;
      
      switch(ekgType) {
        case EkgType.ASYSTOLE:
          fallbackData = {
            timestamps: [0, 100],
            values: [150, 150],
            sampleRate: 100
          };
          break;
        case EkgType.IDIOVENTRICULAR_RHYTHM:
          fallbackData = {
            timestamps: Array.from({length: 100}, (_, i) => i),
            values: Array.from({length: 100}, (_, i) => {
              const phase = (i % 50) / 50;
              return 150 + (phase < 0.2 ? 80 * Math.sin(phase * Math.PI * 5) : 0);
            }),
            sampleRate: 100
          };
          break;
        default:
          fallbackData = {...this.fallbackData};
      }
      
      // Cache the fallback data
      this.dataCache.set(ekgType, fallbackData);
      return fallbackData;
    }
  }
  
  /**
   * Get an EKG value at a specific point in time
   */
  public getValueAtTime(ekgType: EkgType, time: number, bpm: number, noiseType: NoiseType): number {
    try {
      const ekgData = this.getDataForType(ekgType);
      
      // Adjust time based on BPM
      const defaultBpm = ekgType === EkgType.ASYSTOLE ? 1 : 72;
      const bpmScale = defaultBpm / Math.max(1, bpm);
      const adjustedTime = time * bpmScale;
      
      // Normalize time to fit within data range
      const maxTime = ekgData.timestamps[ekgData.timestamps.length - 1];
      const normalizedTime = adjustedTime % maxTime;
      
      // Find the closest data points
      let lowIndex = 0;
      let highIndex = ekgData.timestamps.length - 1;
      
      // Binary search
      while (highIndex - lowIndex > 1) {
        const midIndex = Math.floor((lowIndex + highIndex) / 2);
        if (ekgData.timestamps[midIndex] > normalizedTime) {
          highIndex = midIndex;
        } else {
          lowIndex = midIndex;
        }
      }
      
      // Exact match
      if (Math.abs(ekgData.timestamps[lowIndex] - normalizedTime) < 0.0001) {
        return this.applyNoise(ekgData.values[lowIndex], noiseType);
      }
      
      // Linear interpolation
      const t1 = ekgData.timestamps[lowIndex];
      const t2 = ekgData.timestamps[highIndex];
      const v1 = ekgData.values[lowIndex];
      const v2 = ekgData.values[highIndex];
      
      const factor = (normalizedTime - t1) / (t2 - t1);
      const interpolatedValue = v1 + factor * (v2 - v1);
      
      // Apply noise
      return this.applyNoise(interpolatedValue, noiseType);
      
    } catch (error) {
      console.error(`Error getting EKG value at time ${time}:`, error);
      return 150; // Return baseline value as fallback
    }
  }
  
  /**
   * Apply noise to the EKG signal
   */
  private applyNoise(value: number, noiseType: NoiseType): number {
    let noiseLevel = 0;
    let baselineWander = 0;
    
    switch (noiseType) {
      case NoiseType.MILD:
        noiseLevel = 1.0;
        baselineWander = 3.0;
        break;
      case NoiseType.MODERATE:
        noiseLevel = 2.5;
        baselineWander = 8.0;
        break;
      case NoiseType.SEVERE:
        noiseLevel = 5.0;
        baselineWander = 15.0;
        break;
      case NoiseType.NONE:
      default:
        return value;
    }
    
    const noise = (Math.random() * 2 - 1) * noiseLevel;
    const wander = Math.sin(Date.now() * 0.001) * baselineWander;
    
    return value + noise + wander;
  }
}
