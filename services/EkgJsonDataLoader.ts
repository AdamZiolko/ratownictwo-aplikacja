import { EkgType, NoiseType } from "./EkgFactory";
import { ekgTypeToFilename } from "./ekgTypeToFileMap";

// Define the structure of the JSON data
interface EkgJsonData {
  sample_rate: number;
  period_count: number;
  timestamps: number[];
  values: number[];
}

// Create a static map of all EKG data files to satisfy React Native's static analyzer
// This avoids the dynamic require issue
const EkgDataFiles: Record<string, EkgJsonData> = {
  "prawidłowy-rytm-zatokowy": require("../assets/heart_beat_data/prawidłowy-rytm-zatokowy.json"),
  "tachykardia-zatokowa": require("../assets/heart_beat_data/tachykardia-zatokowa.json"),
  "bradykardia-zatokowa": require("../assets/heart_beat_data/bradykardia-zatokowa.json"),
  "migotanie-przedsionkow": require("../assets/heart_beat_data/migotanie-przedsionkow.json"),
  "migotanie-komor": require("../assets/heart_beat_data/migotanie-komor.json"),
  "czestoskurcz-komorowy": require("../assets/heart_beat_data/czestoskurcz-komorowy.json"),
  "torsade-de-pointes": require("../assets/heart_beat_data/torsade-de-pointes.json"),
  "blok-przedsionkowo-komorowy-1-stopnia": require("../assets/heart_beat_data/blok-przedsionkowo-komorowy-1-stopnia.json"),
  "blok-przedsionkowo-komorowy-2-stopnia": require("../assets/heart_beat_data/blok-przedsionkowo-komorowy-2-stopnia.json"),
  "blok-przedsionkowo-komorowy-2-stopnia-typu-mobitza": require("../assets/heart_beat_data/blok-przedsionkowo-komorowy-2-stopnia-typu-mobitza.json"),
  "blok-zatokowo-przedsionkowy": require("../assets/heart_beat_data/blok-zatokowo-przedsionkowy.json"),
  "nadkomorowe-wedrowanie-rozrusznika": require("../assets/heart_beat_data/nadkomorowe-wedrowanie-rozrusznika.json"),
  "nadmiarowość-zatokowa": require("../assets/heart_beat_data/nadmiarowość-zatokowa.json"),
  "przedwczesne-pobudzenie-komorewe": require("../assets/heart_beat_data/przedwczesne-pobudzenie-komorewe.json"),
  "przedwczesne-pobudzenie-przedsionkowe": require("../assets/heart_beat_data/przedwczesne-pobudzenie-przedsionkowe.json"),
  "przedwczesne-pobudzenie-wezlowe": require("../assets/heart_beat_data/przedwczesne-pobudzenie-wezlowe.json"),
  "przyspieszony-rytm-komorowy": require("../assets/heart_beat_data/przyspieszony-rytm-komorowy.json"),
  "przyspieszony-rytm-wezlowy-1": require("../assets/heart_beat_data/przyspieszony-rytm-wezlowy-1.json"),
  "rytm-komorowy-idowentrykularny": require("../assets/heart_beat_data/rytm-komorowy-idowentrykularny.json"),
  "trzepotanie-komor": require("../assets/heart_beat_data/trzepotanie-komor.json"),
  "trzepotanie-przedsionkow-a": require("../assets/heart_beat_data/trzepotanie-przedsionkow-a.json"),
  "trzepotanie-przedsionkow-b": require("../assets/heart_beat_data/trzepotanie-przedsionkow-b.json"),
  "wieloogniskowy-czestoskurcz-przedsionkowy": require("../assets/heart_beat_data/wieloogniskowy-czestoskurcz-przedsionkowy.json"),
  "zahamowanie-zatokowe": require("../assets/heart_beat_data/zahamowanie-zatokowe.json"),
  "zastepcze-pobudzenie-komorowe": require("../assets/heart_beat_data/zastepcze-pobudzenie-komorowe.json"),
  "zastepcze-pobudzenie-wezlowe": require("../assets/heart_beat_data/zastepcze-pobudzenie-wezlowe.json"),
  // Create a proper asystole pattern (flat line) instead of using normal rhythm
  asystolia: {
    sample_rate: 100,
    period_count: 1,
    timestamps: [0, 100],
    values: [150, 150], // Flat line at baseline value
  },
};

export class EkgJsonDataLoader {
  private static ekgDataCache: Record<string, EkgJsonData> = {};
  private static valueCache: Record<string, number> = {};
  private static loadedDataTypes: Set<EkgType> = new Set();
  private static isInitialized = false;
  /**
   * Initialize data loader by preloading commonly used EKG patterns
   */ 
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Preload common EKG types
      await this.preloadEkgData(EkgType.NORMAL_SINUS_RHYTHM);
      await this.preloadEkgData(EkgType.SINUS_TACHYCARDIA);
      await this.preloadEkgData(EkgType.SINUS_BRADYCARDIA);
      await this.preloadEkgData(EkgType.ATRIAL_FIBRILLATION);

      this.isInitialized = true;
      console.log("EKG data loader initialized successfully");
    } catch (error) {
      console.error("Failed to initialize EKG data loader:", error);
      throw error;
    }
  }
  /**
   * Preload EKG data for a specific type
   */
  private static async preloadEkgData(ekgType: EkgType): Promise<void> {
    if (this.loadedDataTypes.has(ekgType)) return;

    try {
      const filename = ekgTypeToFilename[ekgType];

      // Use the static import map instead of dynamic require
      if (filename && EkgDataFiles[filename]) {
        this.ekgDataCache[filename] = EkgDataFiles[filename];
        this.loadedDataTypes.add(ekgType);
      } else {
        throw new Error(`File not found in static map: ${filename}`);
      }
    } catch (error) {
      console.error(`Failed to preload EKG data for type ${ekgType}:`, error);
      throw error;
    }
  }

  /**
   * Load JSON data for a specific EKG type
   */
  private static async loadEkgData(ekgType: EkgType): Promise<EkgJsonData> {
    const filename = ekgTypeToFilename[ekgType];
    const cacheKey = filename;

    if (!this.ekgDataCache[cacheKey]) {
      try {
        // Use the static import map instead of dynamic require
        if (filename && EkgDataFiles[filename]) {
          this.ekgDataCache[cacheKey] = EkgDataFiles[filename];
        } else {
          throw new Error(`File not found in static map: ${filename}`);
        }
      } catch (error) {
        console.error(`Failed to load EKG data for type ${ekgType}:`, error);
        // Use normal sinus rhythm as fallback
        return this.loadEkgData(EkgType.NORMAL_SINUS_RHYTHM);
      }
    }

    return this.ekgDataCache[cacheKey];
  }

  /**
   * Load JSON data for a specific EKG type
   */ private static loadEkgDataSync(ekgType: EkgType): EkgJsonData {
    const filename = ekgTypeToFilename[ekgType];
    const cacheKey = filename;

    // Check for invalid EKG type
    if (!filename) {
      console.warn(
        `Invalid EKG type ${ekgType}, falling back to normal rhythm`
      );
      return this.loadEkgDataSync(EkgType.NORMAL_SINUS_RHYTHM);
    }

    // Debug statement to track which file is being loaded
    console.log(`Loading EKG data for type ${ekgType} (${filename})`);

    if (!this.ekgDataCache[cacheKey]) {
      try {
        // Use the static import map instead of dynamic require
        if (EkgDataFiles[filename]) {
          this.ekgDataCache[cacheKey] = EkgDataFiles[filename];
          this.loadedDataTypes.add(ekgType);
          console.log(`Successfully loaded EKG data for ${filename}`);
        } else {
          console.error(`File not found in static map: ${filename}`);
          throw new Error(`File not found in static map: ${filename}`);
        }
      } catch (error) {
        console.error(`Failed to load EKG data for type ${ekgType}:`, error);

        // Create appropriate fallbacks based on EKG type instead of always using normal rhythm
        if (ekgType === EkgType.ASYSTOLE) {
          console.log("Creating asystole pattern (flat line)");
          return {
            sample_rate: 100,
            period_count: 1,
            timestamps: [0, 100],
            values: [150, 150], // Flat line
          };
        } else if (ekgType === EkgType.VENTRICULAR_FIBRILLATION) {
          console.log("Creating VFib fallback pattern");
          return {
            sample_rate: 100,
            period_count: 10,
            timestamps: Array.from({ length: 100 }, (_, i) => i),
            values: Array.from(
              { length: 100 },
              () => 150 + (Math.random() - 0.5) * 100
            ), // Chaotic pattern
          };
        } else if (ekgType !== EkgType.NORMAL_SINUS_RHYTHM) {
          console.log(`No fallback for ${ekgType}, trying normal rhythm`);
          return this.loadEkgDataSync(EkgType.NORMAL_SINUS_RHYTHM);
        } else {
          // Create a minimal data structure if even normal rhythm fails
          console.warn("Creating minimal normal sinus rhythm data");
          return {
            sample_rate: 100,
            period_count: 1,
            timestamps: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
            values: [150, 150, 200, 100, 150, 150, 150, 150, 150, 150, 150], // Simple PQRST-like pattern
          };
        }
      }
    }

    return this.ekgDataCache[cacheKey];
  }

  /**
   * Get the EKG value at a specific point in time for a given EKG type
   */ static async getEkgValueFromJson(
    x: number,
    ekgType: EkgType,
    bpm: number,
    noiseType: NoiseType
  ): Promise<number> {
    // Load the EKG data for this type
    const ekgData = await this.loadEkgData(ekgType);

    // Adjust x based on BPM
    const defaultBpm = ekgType === EkgType.ASYSTOLE ? 1 : 72;
    const bpmScale = defaultBpm / Math.max(1, bpm);
    const adjustedX = x * bpmScale;

    // Get the normalized x value within the data range
    const maxTime = ekgData.timestamps[ekgData.timestamps.length - 1];
    const normalizedX = adjustedX % maxTime;

    // Check cache first - include BPM in cache key to prevent mixing different BPMs
    const cacheKey = `${normalizedX.toFixed(4)}_${ekgType}_${bpm}_${noiseType}`;
    if (this.valueCache[cacheKey] !== undefined) {
      return this.valueCache[cacheKey];
    }

    // Binary search to find the closest data point
    let low = 0;
    let high = ekgData.timestamps.length - 1;

    while (high - low > 1) {
      const mid = Math.floor((low + high) / 2);
      if (ekgData.timestamps[mid] > normalizedX) {
        high = mid;
      } else {
        low = mid;
      }
    }

    // Exact match
    if (Math.abs(ekgData.timestamps[low] - normalizedX) < 0.0001) {
      const value = ekgData.values[low];
      this.valueCache[cacheKey] = this.applyNoiseToSignal(value, noiseType);
      return this.valueCache[cacheKey];
    }

    // Linear interpolation between the two closest points
    const t1 = ekgData.timestamps[low];
    const t2 = ekgData.timestamps[high];
    const v1 = ekgData.values[low];
    const v2 = ekgData.values[high];

    // Calculate interpolation factor
    const factor = (normalizedX - t1) / (t2 - t1);

    // Interpolate the value
    const interpolatedValue = v1 + factor * (v2 - v1);

    // Apply noise based on noise type
    const finalValue = this.applyNoiseToSignal(interpolatedValue, noiseType);

    // Store in cache and return
    this.valueCache[cacheKey] = finalValue;
    return finalValue;
  }  /**
   * Get the EKG value synchronously from cached JSON data
   */ static getEkgValueSync(
    x: number,
    ekgType: EkgType,
    bpm: number,
    noiseType: NoiseType
  ): number {
    try {
      // Try to ensure data is loaded
      if (!this.isInitialized) {
        // Since we can't await here, we'll try to initialize synchronously
        // but this is not recommended - always call initialize() before using getEkgValueSync
        console.warn('EKG data not initialized, attempting sync initialization');
        this.loadEkgDataSync(EkgType.NORMAL_SINUS_RHYTHM);
      }

      // Debug log to track the type being requested
      console.log(`Getting EKG value for type ${ekgType}, bpm ${bpm}, at x=${x}`);

      // Load the EKG data for this type
      const ekgData = this.loadEkgDataSync(ekgType);

      // Adjust x based on BPM
      const defaultBpm = ekgType === EkgType.ASYSTOLE ? 1 : 72;
      const bpmScale = defaultBpm / Math.max(1, bpm);
      const adjustedX = x * bpmScale;

      // Get the normalized x value within the data range
      const maxTime = ekgData.timestamps[ekgData.timestamps.length - 1];
      const normalizedX = adjustedX % maxTime;

      // Check cache first - include BPM in cache key
      const cacheKey = `${normalizedX.toFixed(4)}_${ekgType}_${bpm}_${noiseType}`;
      if (this.valueCache[cacheKey] !== undefined) {
        return this.valueCache[cacheKey];
      }

      // Binary search to find the closest data point
      let low = 0;
      let high = ekgData.timestamps.length - 1;

      while (high - low > 1) {
        const mid = Math.floor((low + high) / 2);
        if (ekgData.timestamps[mid] > normalizedX) {
          high = mid;
        } else {
          low = mid;
        }
      }

      let value;

      // Exact match
      if (Math.abs(ekgData.timestamps[low] - normalizedX) < 0.0001) {
        value = ekgData.values[low];
      } else {
        // Linear interpolation between the two closest points
        const t1 = ekgData.timestamps[low];
        const t2 = ekgData.timestamps[high];
        const v1 = ekgData.values[low];
        const v2 = ekgData.values[high];

        // Calculate interpolation factor
        const factor = (normalizedX - t1) / (t2 - t1);

        // Interpolate the value
        value = v1 + factor * (v2 - v1);
      }

      // Apply noise based on noise type
      const finalValue = this.applyNoiseToSignal(value, noiseType);

      // Store in cache and return
      this.valueCache[cacheKey] = finalValue;
      return finalValue;
    } catch (error) {
      console.error("Error in getEkgValueSync:", error);
      // Return a safe fallback value
      return 150;
    }
  }

  /**
   * Apply noise to the EKG signal based on noise type
   */
  private static applyNoiseToSignal(
    value: number,
    noiseType: NoiseType
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

    const noise = (Math.random() * 2 - 1) * noiseLevel;
    const wander = Math.sin(Date.now() * 0.001) * baselineWander;

    return value + noise + wander;
  }
  /**
   * Reset all caches
   */
  static resetCache(): void {
    this.valueCache = {};
    this.loadedDataTypes.clear();
    this.ekgDataCache = {};
    this.isInitialized = false;
    console.log("EKG cache has been reset");
  }

  /**
   * Get the list of available EKG types that have corresponding JSON files
   */
  static getAvailableTypes(): EkgType[] {
    const availableTypes: EkgType[] = [];

    // Try to load JSON files for all EKG types and add the ones that succeed
    Object.values(EkgType).forEach((type) => {
      // Skip non-numeric values (enum has both numeric values and string keys)
      if (typeof type === "number") {
        try {
          const filename = ekgTypeToFilename[type];
          if (filename) {
            // Try to require the file to see if it exists
            if (EkgDataFiles[filename]) {
              availableTypes.push(type);
            }
          }
        } catch (e) {
          // Skip if there was an error
        }
      }
    });

    return availableTypes.length > 0
      ? availableTypes
      : [EkgType.NORMAL_SINUS_RHYTHM]; // Fallback to at least one type
  }

  /**
   * Calculate the approximate BPM from the JSON data
   */
  static getBpmForType(ekgType: EkgType): number {
    try {
      const ekgData = this.loadEkgDataSync(ekgType);

      // Use the period_count and timestamps to calculate BPM
      if (ekgData.period_count && ekgData.timestamps) {
        const dataLengthSeconds =
          ekgData.timestamps[ekgData.timestamps.length - 1] /
          ekgData.sample_rate;
        const beatsPerSecond = ekgData.period_count / dataLengthSeconds;
        const bpm = Math.round(beatsPerSecond * 60);

        return Math.max(30, Math.min(220, bpm)); // Keep within physiological limits
      }

      // If we can't calculate, return default values based on EKG type
      switch (ekgType) {
        case EkgType.SINUS_TACHYCARDIA:
          return 120;
        case EkgType.SINUS_BRADYCARDIA:
          return 45;
        case EkgType.VENTRICULAR_TACHYCARDIA:
        case EkgType.VENTRICULAR_FIBRILLATION:
          return 180;
        case EkgType.ASYSTOLE:
          return 0;
        default:
          return 72; // Normal sinus rhythm default
      }
    } catch (e) {
      console.error("Error calculating BPM:", e);
      return 72; // Default fallback
    }
  }

  /**
   * Provides data directly to the EkgDataAdapter
   * This method ensures fresh data for each EKG type
   */
// …existing code…
static loadEkgDataForAdapter(ekgType: EkgType): EkgJsonData | null {
  const filename = ekgTypeToFilename[ekgType];
  if (!filename) {
    console.warn(`Invalid EKG type ${ekgType}`);
    return null;
  }

  const sourceData: any = EkgDataFiles[filename];
  // pick values || amplitudes
  const rawValues: number[] | undefined =
    Array.isArray(sourceData.values)
      ? sourceData.values
      : Array.isArray(sourceData.amplitudes)
        ? sourceData.amplitudes
        : undefined;

  if (
    !sourceData ||
    !Array.isArray(sourceData.timestamps) ||
    !Array.isArray(rawValues)
  ) {
    console.error(`EKG data file not valid for "${filename}"`, sourceData);
    return null;
  }

  return {
    sample_rate: sourceData.sample_rate,
    period_count: sourceData.period_count,
    timestamps: [...sourceData.timestamps],
    values:     [...rawValues],
  };
}
// …existing code…
}
