/**
 * EkgFactory.ts
 * EKG generator with multiple rhythm types and noise control
 */

// Constants for EKG generation
export const DEFAULT_BASELINE = 150;
const DEFAULT_PHASE_SHIFT = 5;

// Default BPM values
const DEFAULT_BPM = 72;
const MIN_BPM = 30;
const MAX_BPM = 220;

// Default noise settings
const DEFAULT_NOISE_AMPLITUDE = 0;
const DEFAULT_BASELINE_WANDER_AMPLITUDE = 0;
const DEFAULT_MUSCLE_ARTIFACT_PROBABILITY = 0;

// Enhanced EKG Type enum with various cardiac rhythms
export enum EkgType {
  NORMAL = 0,
  TACHYCARDIA = 1,
  BRADYCARDIA = 2,
  AFIB = 3,
  VFIB = 4,
  VTACH = 5,
  TORSADE = 6,
  ASYSTOLE = 7,
  HEART_BLOCK = 8,
  PVC = 9,
  CUSTOM = 10
}

// Noise type enum
export enum NoiseType {
  NONE = 0,
  MILD = 1,
  MODERATE = 2,
  SEVERE = 3,
  CUSTOM = 4,
}

// EKG configuration interface
export interface EkgConfig {
  baseline: number;
  bpm: number;
  period: number;
  phaseShift: number;
  noiseType: NoiseType;
  noiseAmplitude: number;
  baselineWanderAmplitude: number;
  muscleArtifactProbability: number;
  // Add pattern-specific configuration options
  amplitude?: number;
  irregularity?: number;
  oscillationRate?: number;
}

/**
 * Enhanced EKG Factory class that generates various cardiac rhythm waveforms
 */
export class EkgFactory {
  // Cache for random noise values to create consistent patterns
  private static noiseCache: { [key: number]: number } = {};
  private static lastBaselineWander = 0;
  private static irregularityCache: { [key: string]: number } = {};
  private static pvcCounters: { [key: number]: number } = {};
  
  /**
   * Convert BPM to period value
   * Higher BPM = smaller period
   */
  static bpmToPeriod(bpm: number): number {
    // Ensure BPM is within reasonable limits
    const safeBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));
    
    // Convert BPM to period (inversely proportional relationship)
    // Reference: 72 BPM = 100 period
    return (DEFAULT_BPM / safeBpm) * 100;
  }

  /**
   * Get noise configuration based on noise type
   */
  static getNoiseConfig(noiseType: NoiseType): { 
    noiseAmplitude: number;
    baselineWanderAmplitude: number;
    muscleArtifactProbability: number;
  } {
    switch (noiseType) {
      case NoiseType.NONE:
        return {
          noiseAmplitude: 0,
          baselineWanderAmplitude: 0,
          muscleArtifactProbability: 0,
        };
      case NoiseType.MILD:
        return {
          noiseAmplitude: 1.0,
          baselineWanderAmplitude: 3.0,
          muscleArtifactProbability: 0.01,
        };
      case NoiseType.MODERATE:
        return {
          noiseAmplitude: 2.5,
          baselineWanderAmplitude: 8.0,
          muscleArtifactProbability: 0.03,
        };
      case NoiseType.SEVERE:
        return {
          noiseAmplitude: 5.0,
          baselineWanderAmplitude: 15.0,
          muscleArtifactProbability: 0.08,
        };
      case NoiseType.CUSTOM:
      default:
        return {
          noiseAmplitude: DEFAULT_NOISE_AMPLITUDE,
          baselineWanderAmplitude: DEFAULT_BASELINE_WANDER_AMPLITUDE,
          muscleArtifactProbability: DEFAULT_MUSCLE_ARTIFACT_PROBABILITY,
        };
    }
  }

  /**
   * Get the configuration for a specific rhythm type and BPM
   */
  static getConfig(ekgType: EkgType, bpm: number, noiseType: NoiseType = NoiseType.NONE): EkgConfig {
    const noiseConfig = this.getNoiseConfig(noiseType);
    
    // Ensure BPM is within valid range
    const safeBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));
    
    // Base configuration
    const baseConfig = {
      baseline: DEFAULT_BASELINE,
      bpm: safeBpm,
      period: this.bpmToPeriod(safeBpm),
      phaseShift: DEFAULT_PHASE_SHIFT,
      noiseType,
      ...noiseConfig
    };
    
    // Add rhythm-specific configurations
    switch (ekgType) {
      case EkgType.TACHYCARDIA:
        return {
          ...baseConfig,
          // Tachycardia has higher amplitude
          amplitude: 1.3,
        };
      case EkgType.BRADYCARDIA:
        return {
          ...baseConfig,
          // Bradycardia has slightly higher amplitude
          amplitude: 1.2,
        };
      case EkgType.AFIB:
        return {
          ...baseConfig,
          // AFib has irregular rhythm and missing P waves
          irregularity: 1.0,
        };
      case EkgType.VFIB:
        return {
          ...baseConfig,
          // V-Fib has chaotic pattern
          irregularity: 2.0,
          amplitude: 0.8,
        };
      case EkgType.VTACH:
        return {
          ...baseConfig,
          // V-tach has wide QRS complexes
          amplitude: 1.5,
        };
      case EkgType.TORSADE:
        return {
          ...baseConfig,
          // Torsade de Pointes has oscillating axis
          oscillationRate: 0.01,
          amplitude: 1.4,
        };
      case EkgType.ASYSTOLE:
        return {
          ...baseConfig,
          // Asystole is practically a flat line
          amplitude: 0.05,
        };
      case EkgType.HEART_BLOCK:
        return {
          ...baseConfig,
          // Heart block has delayed conduction
          irregularity: 0.5,
        };
      case EkgType.PVC:
        return {
          ...baseConfig,
          // PVCs have premature beats
          irregularity: 0.3,
        };
      case EkgType.NORMAL:
      case EkgType.CUSTOM:
      default:
        return baseConfig;
    }
  }

  /**
   * Generate consistent noise at a given position
   */
  static generateNoise(x: number, amplitude: number): number {
    // Use a cached value if we've calculated this noise point before
    const cacheKey = Math.floor(x * 10);
    if (!this.noiseCache[cacheKey]) {
      // Pseudo-random noise generation (more consistent than pure random)
      const noise = Math.sin(x * 0.3) * Math.cos(x * 0.7) + Math.sin(x * 1.1) * Math.cos(x * 2.3);
      // Normalize and scale
      this.noiseCache[cacheKey] = noise * amplitude;
    }
    return this.noiseCache[cacheKey];
  }

  /**
   * Generate baseline wander (low-frequency noise)
   */
  static generateBaselineWander(x: number, amplitude: number): number {
    // Very slow-changing sine waves of different frequencies
    const wander = Math.sin(x * 0.01) * Math.cos(x * 0.005) * amplitude;
    // Add some randomness to the transition
    const randomFactor = 0.2;
    this.lastBaselineWander = this.lastBaselineWander * (1 - randomFactor) + wander * randomFactor;
    return this.lastBaselineWander;
  }

  /**
   * Generate muscle artifact (sudden spikes)
   */
  static generateMuscleArtifact(probability: number, amplitude: number): number {
    if (Math.random() < probability) {
      // Generate a spike with random amplitude when triggered
      const spikeIntensity = (Math.random() * 2 - 1) * amplitude * 5;
      return spikeIntensity;
    }
    return 0;
  }

  /**
   * Generate consistent irregularity for rhythms
   */
  static generateIrregularity(x: number, cycleCount: number, strength: number): number {
    const cacheKey = `${cycleCount}-${Math.floor(x)}`;
    if (!this.irregularityCache[cacheKey]) {
      // Generate random but consistent irregularity
      const seed = Math.sin(cycleCount * 100) * 10000;
      this.irregularityCache[cacheKey] = (Math.sin(seed) * 0.5 + 0.5) * strength;
    }
    return this.irregularityCache[cacheKey];
  }

  /**
   * Generate an EKG value for a specific position, rhythm type, and BPM
   */
  static generateEkgValue(
    x: number,
    ekgType: EkgType = EkgType.NORMAL, 
    bpm: number = DEFAULT_BPM,
    noiseType: NoiseType = NoiseType.NONE
  ): number {
    // Get the configuration for this rhythm type and BPM
    const config = this.getConfig(ekgType, bpm, noiseType);
    
    // Generate the appropriate waveform based on the EKG type
    switch (ekgType) {
      case EkgType.NORMAL:
        return this.generateNormalSinusEkg(x, config);
      case EkgType.TACHYCARDIA:
        return this.generateTachycardiaEkg(x, config);
      case EkgType.BRADYCARDIA:
        return this.generateBradycardiaEkg(x, config);
      case EkgType.AFIB:
        return this.generateAFibEkg(x, config);
      case EkgType.VFIB:
        return this.generateVFibEkg(x, config);
      case EkgType.VTACH:
        return this.generateVTachEkg(x, config);
      case EkgType.TORSADE:
        return this.generateTorsadeEkg(x, config);
      case EkgType.ASYSTOLE:
        return this.generateAsystoleEkg(x, config);
      case EkgType.HEART_BLOCK:
        return this.generateHeartBlockEkg(x, config);
      case EkgType.PVC:
        return this.generatePVCEkg(x, config);
      case EkgType.CUSTOM:
      default:
        return this.generateNormalSinusEkg(x, config);
    }
  }

  /**
   * Reset noise cache - useful when starting a new EKG simulation
   */
  static resetNoiseCache(): void {
    this.noiseCache = {};
    this.lastBaselineWander = 0;
    this.irregularityCache = {};
    this.pvcCounters = {};
  }

  /**
   * Generate a normal sinus rhythm EKG waveform
   */
  static generateNormalSinusEkg(x: number, config: EkgConfig): number {
    const { 
      baseline, 
      period, 
      phaseShift, 
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability 
    } = config;
    
    const t = (x + phaseShift) % period;
    let y = baseline;
    
    // Adjust wave timing based on heart rate
    const isFast = config.bpm > 100;
    const isSlow = config.bpm < 60;
    
    // Calculate timing adjustments based on heart rate
    const timingFactor = isFast ? 0.8 : isSlow ? 1.3 : 1.0;
    
    // P wave (atrial depolarization)
    if (t < 10 * timingFactor) {
      y += Math.sin((t / (10 * timingFactor)) * Math.PI) * 5;
    }
    // PR segment (conduction delay)
    else if (t < 15 * timingFactor) {
      y += 0;
    }
    // QRS complex (ventricular depolarization)
    else if (t >= 15 * timingFactor && t < 35 * timingFactor) {
      if (t < 20 * timingFactor) {
        // Q wave
        y -= (20 * timingFactor - t) * 1.5;
      } else if (t < 25 * timingFactor) {
        // R wave
        y += (t - 20 * timingFactor) * 18;
      } else {
        // S wave
        y -= (t - 25 * timingFactor) * 10;
      }
    }
    // ST segment (early repolarization)
    else if (t >= 35 * timingFactor && t < 40 * timingFactor) {
      y += 0;
    }
    // T wave (ventricular repolarization)
    else if (t >= 40 * timingFactor && t < 60 * timingFactor) {
      y += Math.sin(((t - 40 * timingFactor) / (20 * timingFactor)) * Math.PI) * 8;
    }
    // TP segment (electrical diastole)
    else {
      y += 0;
    }
    
    // Add noise and artifacts
    return this.addNoiseToSignal(x, y, noiseAmplitude, baselineWanderAmplitude, muscleArtifactProbability);
  }

  /**
   * Generate a tachycardia EKG waveform (similar to normal but faster)
   */
  static generateTachycardiaEkg(x: number, config: EkgConfig): number {
    // Tachycardia is essentially normal rhythm but faster (BPM > 100)
    const amplitude = config.amplitude || 1.3;
    return this.generateNormalSinusEkg(x, config) * amplitude;
  }

  /**
   * Generate a bradycardia EKG waveform (similar to normal but slower)
   */
  static generateBradycardiaEkg(x: number, config: EkgConfig): number {
    // Bradycardia is essentially normal rhythm but slower (BPM < 60)
    const amplitude = config.amplitude || 1.2;
    return this.generateNormalSinusEkg(x, config) * amplitude;
  }

  /**
   * Generate an atrial fibrillation (AFib) EKG waveform
   */
  static generateAFibEkg(x: number, config: EkgConfig): number {
    const { 
      baseline, 
      period, 
      phaseShift, 
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability 
    } = config;
    
    const irregularity = config.irregularity || 1.0;
    const t = (x + phaseShift) % period;
    let y = baseline;
    
    // Calculate cycle number to use for irregularity
    const cycleCount = Math.floor((x + phaseShift) / period);
    
    // Add irregularity to the timing
    const tIrregular = t + this.generateIrregularity(x, cycleCount, irregularity * 20);
    
    // AFib has no distinct P waves, just a chaotic baseline
    // QRS complex still appears regularly but with variable R-R interval
    if (tIrregular < 15) {
      // Chaotic baseline instead of P wave
      y += (Math.sin(tIrregular * 3) * 2 + Math.cos(tIrregular * 5) * 1.5);
    }
    // QRS complex (still present but with irregular spacing)
    else if (tIrregular >= 15 && tIrregular < 35) {
      if (tIrregular < 20) {
        // Q wave
        y -= (20 - tIrregular) * 1.5;
      } else if (tIrregular < 25) {
        // R wave
        y += (tIrregular - 20) * 18;
      } else {
        // S wave
        y -= (tIrregular - 25) * 10;
      }
    }
    // T wave still present
    else if (tIrregular >= 40 && tIrregular < 60) {
      y += Math.sin(((tIrregular - 40) / 20) * Math.PI) * 8;
    }
    
    // Add noise and artifacts
    return this.addNoiseToSignal(x, y, noiseAmplitude, baselineWanderAmplitude, muscleArtifactProbability);
  }

  /**
   * Generate a ventricular fibrillation (VFib) EKG waveform
   */
  static generateVFibEkg(x: number, config: EkgConfig): number {
    const { 
      baseline, 
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability 
    } = config;
    
    // VFib is a chaotic waveform with no distinct PQRST
    const amplitude = (config.amplitude || 0.8) * 40; // VFib has lower amplitude than normal
    
    // Create chaotic oscillations using multiple sine waves of different frequencies
    let y = baseline + 
      Math.sin(x * 0.3) * amplitude * 0.5 +
      Math.sin(x * 0.7) * amplitude * 0.3 +
      Math.sin(x * 1.1) * amplitude * 0.7 +
      Math.sin(x * 2.3) * amplitude * 0.4;
    
    // Add noise and artifacts
    return this.addNoiseToSignal(x, y, noiseAmplitude, baselineWanderAmplitude, muscleArtifactProbability);
  }

  /**
   * Generate a ventricular tachycardia (VTach) EKG waveform
   */
  static generateVTachEkg(x: number, config: EkgConfig): number {
    const { 
      baseline, 
      period, 
      phaseShift, 
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability 
    } = config;
    
    const amplitude = config.amplitude || 1.5;
    const t = (x + phaseShift) % period;
    let y = baseline;
    
    // VTach has wide QRS complexes with abnormal morphology
    // No distinct P waves
    
    // Wide QRS complex
    if (t >= 15 && t < 45) { // Wider than normal
      if (t < 25) {
        // First part of QRS
        y -= (25 - t) * 1.0;
      } else if (t < 35) {
        // Middle of QRS
        y += (t - 25) * 15 * amplitude;
      } else {
        // End of QRS
        y -= (t - 35) * 8;
      }
    }
    // Modified T wave
    else if (t >= 50 && t < 70) {
      y += Math.sin(((t - 50) / 20) * Math.PI) * 5;
    }
    
    // Add noise and artifacts
    return this.addNoiseToSignal(x, y, noiseAmplitude, baselineWanderAmplitude, muscleArtifactProbability);
  }

  /**
   * Generate a Torsade de Pointes EKG waveform
   */
  static generateTorsadeEkg(x: number, config: EkgConfig): number {
    const { 
      baseline, 
      period, 
      phaseShift, 
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability 
    } = config;
    
    const amplitude = config.amplitude || 1.4;
    const oscillationRate = config.oscillationRate || 0.01;
    
    // Torsade is characterized by polymorphic VT with QRS complexes that appear to twist around the baseline
    const t = (x + phaseShift) % period;
    
    // Calculate the oscillation - this creates the characteristic twisting pattern
    const oscillation = Math.sin(x * oscillationRate) * 50;
    
    // Base signal similar to VTach but with oscillating amplitude and baseline
    let y = baseline + oscillation;
    
    // Generate a basic VTach-like pattern
    if (t >= 10 && t < 40) {
      const waveHeight = 20 * amplitude;
      // Oscillating QRS complex
      y += Math.sin(((t - 10) / 30) * Math.PI) * waveHeight;
    }
    
    // Add noise and artifacts
    return this.addNoiseToSignal(x, y, noiseAmplitude, baselineWanderAmplitude, muscleArtifactProbability);
  }

  /**
   * Generate an asystole (flatline) EKG waveform
   */
  static generateAsystoleEkg(x: number, config: EkgConfig): number {
    const { 
      baseline, 
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability 
    } = config;
    
    // Asystole is essentially a flatline with minimal deflection
    const amplitude = config.amplitude || 0.05;
    
    // Nearly flat line with very small random fluctuations
    let y = baseline + (Math.sin(x * 0.2) * 2 * amplitude);
    
    // Add noise and artifacts
    return this.addNoiseToSignal(x, y, noiseAmplitude, baselineWanderAmplitude, muscleArtifactProbability);
  }

  /**
   * Generate a heart block EKG waveform
   */
  static generateHeartBlockEkg(x: number, config: EkgConfig): number {
    const { 
      baseline, 
      period, 
      phaseShift, 
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability 
    } = config;
    
    const irregularity = config.irregularity || 0.5;
    
    // Determine if this beat should be conducted or blocked
    // Use a deterministic pattern for consistency
    const cycleCount = Math.floor((x + phaseShift) / period);
    const isBlockedBeat = cycleCount % 3 === 2; // Every third beat is blocked
    
    // If it's a blocked beat, only show P wave without QRS
    if (isBlockedBeat) {
      const t = (x + phaseShift) % period;
      let y = baseline;
      
      // P wave only
      if (t < 10) {
        y += Math.sin((t / 10) * Math.PI) * 5;
      }
      
      // Add noise and artifacts
      return this.addNoiseToSignal(x, y, noiseAmplitude, baselineWanderAmplitude, muscleArtifactProbability);
    } else {
      // Normal beat but with prolonged PR interval
      const t = (x + phaseShift) % period;
      let y = baseline;
      
      // P wave
      if (t < 10) {
        y += Math.sin((t / 10) * Math.PI) * 5;
      }
      // Extended PR interval (heart block feature)
      else if (t < 25) { // Longer than normal PR interval
        y += 0;
      }
      // QRS complex (delayed)
      else if (t >= 25 && t < 45) {
        if (t < 30) {
          // Q wave
          y -= (30 - t) * 1.5;
        } else if (t < 35) {
          // R wave
          y += (t - 30) * 18;
        } else {
          // S wave
          y -= (t - 35) * 10;
        }
      }
      // T wave
      else if (t >= 50 && t < 70) {
        y += Math.sin(((t - 50) / 20) * Math.PI) * 8;
      }
      
      // Add noise and artifacts
      return this.addNoiseToSignal(x, y, noiseAmplitude, baselineWanderAmplitude, muscleArtifactProbability);
    }
  }

  /**
   * Generate a premature ventricular contraction (PVC) EKG waveform
   */
  static generatePVCEkg(x: number, config: EkgConfig): number {
    const { 
      baseline, 
      period, 
      phaseShift, 
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability 
    } = config;
    
    // PVCs occur as occasional abnormal beats in an otherwise normal rhythm
    const cyclePeriod = 3; // PVC every nth beat
    
    // Calculate current cycle number
    const cycleCount = Math.floor((x + phaseShift) / period);
    const trackKey = Math.floor(x / (period * cyclePeriod));
    
    // Initialize counter for this track segment if needed
    if (this.pvcCounters[trackKey] === undefined) {
      this.pvcCounters[trackKey] = 0;
    }
    
    // Increment counter to track beat position within the cycle
    const beatPosition = cycleCount % cyclePeriod;
    
    // Every nth beat is a PVC
    if (beatPosition === cyclePeriod - 1) {
      const t = (x + phaseShift) % period;
      let y = baseline;
      
      // PVC has no P wave, just a wide, abnormal QRS
      if (t >= 0 && t < 40) { // Wide QRS
        if (t < 15) {
          // Initial deflection
          y -= (15 - t) * 3;
        } else if (t < 25) {
          // Main spike (inverted and much larger)
          y -= (t - 15) * 15;
        } else {
          // Terminal portion
          y += (t - 25) * 12;
        }
      }
      // ST segment and T wave (often inverted after PVC)
      else if (t >= 40 && t < 60) {
        y -= Math.sin(((t - 40) / 20) * Math.PI) * 5;
      }
      
      // Add noise and artifacts
      return this.addNoiseToSignal(x, y, noiseAmplitude, baselineWanderAmplitude, muscleArtifactProbability);
    } else {
      // Normal beat
      return this.generateNormalSinusEkg(x, config);
    }
  }

  /**
   * Helper function to add noise and artifacts to any EKG signal
   */
  private static addNoiseToSignal(
    x: number, 
    y: number, 
    noiseAmplitude: number, 
    baselineWanderAmplitude: number, 
    muscleArtifactProbability: number
  ): number {
    // Add noise and artifacts
    if (noiseAmplitude > 0) {
      y += this.generateNoise(x, noiseAmplitude);
    }
    
    if (baselineWanderAmplitude > 0) {
      y += this.generateBaselineWander(x, baselineWanderAmplitude);
    }
    
    if (muscleArtifactProbability > 0) {
      y += this.generateMuscleArtifact(muscleArtifactProbability, 20);
    }
    
    return y;
  }

  /**
   * Get BPM value for a specific EKG type
   */
  static getBpmForType(type: EkgType): number {
    switch (type) {
      case EkgType.NORMAL:
        return 72; // Normal heart rate
      case EkgType.TACHYCARDIA:
        return 120; // Tachycardia
      case EkgType.BRADYCARDIA:
        return 45; // Bradycardia
      case EkgType.AFIB:
        return 110; // Atrial fibrillation often presents with fast rate
      case EkgType.VFIB:
        return 300; // Ventricular fibrillation is very rapid (chaotic)
      case EkgType.VTACH:
        return 180; // Ventricular tachycardia
      case EkgType.TORSADE:
        return 200; // Torsade de pointes
      case EkgType.ASYSTOLE:
        return 0; // Asystole (no effective heartbeat)
      case EkgType.HEART_BLOCK:
        return 40; // Heart block typically has slow rate
      case EkgType.PVC:
        return 70; // PVCs can happen at any rate, but using near-normal
      case EkgType.CUSTOM:
      default:
        return DEFAULT_BPM;
    }
  }

  /**
   * Get human-readable name for an EKG type
   */
  static getNameForType(type: EkgType): string {
    switch (type) {
      case EkgType.NORMAL:
        return "Rytm zatokowy prawidłowy";
      case EkgType.TACHYCARDIA:
        return "Tachykardia zatokowa";
      case EkgType.BRADYCARDIA:
        return "Bradykardia zatokowa";
      case EkgType.AFIB:
        return "Migotanie przedsionków";
      case EkgType.VFIB:
        return "Migotanie komór";
      case EkgType.VTACH:
        return "Częstoskurcz komorowy";
      case EkgType.TORSADE:
        return "Torsade de Pointes";
      case EkgType.ASYSTOLE:
        return "Asystolia";
      case EkgType.HEART_BLOCK:
        return "Blok serca";
      case EkgType.PVC:
        return "Przedwczesne pobudzenia komorowe";
      case EkgType.CUSTOM:
        return "Rytm niestandardowy";
      default:
        return "Nieznany rytm";
    }
  }

  /**
   * Get clinical description for an EKG type
   */
  static getDescriptionForType(type: EkgType): string {
    switch (type) {
      case EkgType.NORMAL:
        return "Regularny rytm z prawidłową falą P, zespołem QRS i falą T. Częstość 60-100 uderzeń na minutę.";
      case EkgType.TACHYCARDIA:
        return "Regularny rytm o prawidłowej morfologii, ale przyspieszonej częstości powyżej 100 uderzeń na minutę.";
      case EkgType.BRADYCARDIA:
        return "Regularny rytm o prawidłowej morfologii, ale obniżonej częstości poniżej 60 uderzeń na minutę.";
      case EkgType.AFIB:
        return "Nieregularny rytm z brakiem fal P, zastąpionych przez chaotyczną linię podstawową. Zmienne odstępy R-R.";
      case EkgType.VFIB:
        return "Chaotyczny, nieregularny rytm bez wyraźnych załamków. Bezpośrednie zagrożenie życia.";
      case EkgType.VTACH:
        return "Regularny, szeroki zespół QRS o szybkiej częstości z dysocjacją przedsionkowo-komorową. Zagrożenie życia.";
      case EkgType.TORSADE:
        return "Polimorficzny częstoskurcz komorowy z zespołami QRS, które wydają się skręcać wokół linii podstawowej. Zagrożenie życia.";
      case EkgType.ASYSTOLE:
        return "Płaska linia z minimalną aktywnością elektryczną. Zatrzymanie akcji serca wymagające natychmiastowej resuscytacji.";
      case EkgType.HEART_BLOCK:
        return "Opóźnione lub przerwane przewodzenie między przedsionkami a komorami. Fale P mogą nie być następowane przez zespoły QRS.";
      case EkgType.PVC:
        return "Normalny rytm przerywany przez przedwczesne, szerokie zespoły QRS pochodzące z komór.";
      case EkgType.CUSTOM:
        return "Niestandardowy rytm z parametrami zdefiniowanymi przez użytkownika.";
      default:
        return "Nieokreślony rytm serca.";
    }
  }
}