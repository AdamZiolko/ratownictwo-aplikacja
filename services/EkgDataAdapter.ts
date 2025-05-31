import { EkgType, NoiseType } from "./EkgFactory";
import { EkgJsonDataLoader } from "./EkgJsonDataLoader";

interface EkgData {
  timestamps: number[];
  values: number[];
  sampleRate: number;
  midpoint?: number;
}

export class EkgDataAdapter {
  private static instance: EkgDataAdapter;
  private dataCache: Map<number, EkgData> = new Map();
  private fallbackData: EkgData;
  private static DEFAULT_MIDPOINT = 44.98086978240213;

  constructor() {
    this.fallbackData = {
      timestamps: Array.from({ length: 100 }, (_, i) => i),
      values: Array.from(
        { length: 100 },
        (_, i) => 150 + Math.sin(i * 0.2) * 50
      ),
      sampleRate: 100,
      midpoint: EkgDataAdapter.DEFAULT_MIDPOINT,
    };
  }

  public static getInstance(): EkgDataAdapter {
    if (!EkgDataAdapter.instance) {
      EkgDataAdapter.instance = new EkgDataAdapter();
    }
    return EkgDataAdapter.instance;
  }

  public static initialize(): void {
    EkgDataAdapter.getInstance();
    console.log("EKG data adapter initialized");
  }

  public static getDataForType(ekgType: EkgType): EkgData {
    return EkgDataAdapter.getInstance().getDataForType(ekgType);
  }

  public static getValueAtTime(
    ekgType: EkgType,
    time: number,
    bpm: number,
    noiseType: NoiseType
  ): number {
    return EkgDataAdapter.getInstance().getValueAtTime(
      ekgType,
      time,
      bpm,
      noiseType
    );
  }

  public static resetCache(): void {
    return EkgDataAdapter.getInstance().resetCache();
  }

  public resetCache(): void {
    this.dataCache.clear();
  }

  public getDataForType(ekgType: EkgType): EkgData {
    try {
      if (this.dataCache.has(ekgType)) {
        return this.dataCache.get(ekgType)!;
      }

      const rawData = EkgJsonDataLoader.loadEkgDataForAdapter(ekgType);

      if (!rawData) {
        console.error(
          `EkgDataAdapter error: No data available for EKG type ${ekgType}`
        );
        return this.fallbackData;
      }

      const adaptedData: EkgData = {
        timestamps: [...rawData.timestamps],
        values: [...rawData.values],
        sampleRate: rawData.sample_rate,
        midpoint: rawData.midpoint || EkgDataAdapter.DEFAULT_MIDPOINT,
      };

      this.dataCache.set(ekgType, adaptedData);
      return adaptedData;
    } catch (error) {
      console.error(`EkgDataAdapter error:`, error);

      return this.fallbackData;
    }
  }
  public getValueAtTime(
    ekgType: EkgType,
    time: number,
    bpm: number,
    noiseType: NoiseType
  ): number {

    try {
      if (ekgType === EkgType.ASYSTOLE) {
        return this.applyNoise(150, noiseType, time);
      }

      const ekgData = this.getDataForType(ekgType);

      const defaultBpm = 72;

      const bpmScale = Math.max(1, bpm) / defaultBpm;

      const offsetTime = time + 10;
      const adjustedTime = offsetTime * bpmScale;

      const maxTime = ekgData.timestamps[ekgData.timestamps.length - 1];
      const normalizedTime = adjustedTime % maxTime;

      let lowIndex = 0;
      let highIndex = ekgData.timestamps.length - 1;

      while (highIndex - lowIndex > 1) {
        const midIndex = Math.floor((lowIndex + highIndex) / 2);
        if (ekgData.timestamps[midIndex] > normalizedTime) {
          highIndex = midIndex;
        } else {
          lowIndex = midIndex;
        }
      }
      if (Math.abs(ekgData.timestamps[lowIndex] - normalizedTime) < 0.0001) {
        return this.applyNoise(ekgData.values[lowIndex], noiseType, time);
      }
      const t1 = ekgData.timestamps[lowIndex];
      const t2 = ekgData.timestamps[highIndex];
      const v1 = ekgData.values[lowIndex];
      const v2 = ekgData.values[highIndex];

      const factor = (normalizedTime - t1) / (t2 - t1);
      let interpolatedValue = v1 + factor * (v2 - v1);

      if (ekgData.midpoint) {
        const baseline = 150;
        const deviation = interpolatedValue - ekgData.midpoint;
        interpolatedValue = baseline + deviation;
      }
      return this.applyNoise(interpolatedValue, noiseType, time);
    } catch (error) {
      console.error(`Error getting EKG value at time ${time}:`, error);
      return 150;
    }
  }

  private applyNoise(
    value: number,
    noiseType: NoiseType,
    time: number = 0
  ): number {
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
    // Użyj deterministycznego szumu bazującego na czasie sygnału
    const noise = Math.sin(time * 0.1) * Math.cos(time * 0.07) * noiseLevel;
    const wander = Math.sin(time * 0.001) * baselineWander;

    return value + noise + wander;
  }
}
