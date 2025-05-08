export const DEFAULT_BASELINE = 150;
const DEFAULT_PHASE_SHIFT = 5;

const DEFAULT_BPM = 72;
const MIN_BPM = 30;
const MAX_BPM = 220;

const DEFAULT_NOISE_AMPLITUDE = 0;
const DEFAULT_BASELINE_WANDER_AMPLITUDE = 0;
const DEFAULT_MUSCLE_ARTIFACT_PROBABILITY = 0;

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
  CUSTOM = 10,
}

export enum NoiseType {
  NONE = 0,
  MILD = 1,
  MODERATE = 2,
  SEVERE = 3,
  CUSTOM = 4,
}

export interface EkgConfig {
  baseline: number;
  bpm: number;
  period: number;
  phaseShift: number;
  noiseType: NoiseType;
  noiseAmplitude: number;
  baselineWanderAmplitude: number;
  muscleArtifactProbability: number;

  amplitude?: number;
  irregularity?: number;
  oscillationRate?: number;
}

export class EkgFactory {
  private static noiseCache: { [key: number]: number } = {};
  private static lastBaselineWander = 0;
  private static irregularityCache: { [key: string]: number } = {};
  private static pvcCounters: { [key: number]: number } = {};

  static bpmToPeriod(bpm: number): number {
    const safeBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));

    return (DEFAULT_BPM / safeBpm) * 100;
  }

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

  static getConfig(
    ekgType: EkgType,
    bpm: number,
    noiseType: NoiseType = NoiseType.NONE
  ): EkgConfig {
    const noiseConfig = this.getNoiseConfig(noiseType);

    const safeBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));

    const baseConfig = {
      baseline: DEFAULT_BASELINE,
      bpm: safeBpm,
      period: this.bpmToPeriod(safeBpm),
      phaseShift: DEFAULT_PHASE_SHIFT,
      noiseType,
      ...noiseConfig,
    };

    switch (ekgType) {
      case EkgType.TACHYCARDIA:
        return {
          ...baseConfig,

          amplitude: 1.3,
        };
      case EkgType.BRADYCARDIA:
        return {
          ...baseConfig,

          amplitude: 1.2,
        };
      case EkgType.AFIB:
        return {
          ...baseConfig,

          irregularity: 1.0,
        };
      case EkgType.VFIB:
        return {
          ...baseConfig,

          irregularity: 2.0,
          amplitude: 0.8,
        };
      case EkgType.VTACH:
        return {
          ...baseConfig,

          amplitude: 1.5,
        };
      case EkgType.TORSADE:
        return {
          ...baseConfig,

          oscillationRate: 0.01,
          amplitude: 1.4,
        };
      case EkgType.ASYSTOLE:
        return {
          ...baseConfig,

          amplitude: 0.05,
        };
      case EkgType.HEART_BLOCK:
        return {
          ...baseConfig,

          irregularity: 0.5,
        };
      case EkgType.PVC:
        return {
          ...baseConfig,

          irregularity: 0.3,
        };
      case EkgType.NORMAL:
      case EkgType.CUSTOM:
      default:
        return baseConfig;
    }
  }

  static generateNoise(x: number, amplitude: number): number {
    const cacheKey = Math.floor(x * 10);
    if (!this.noiseCache[cacheKey]) {
      const noise =
        Math.sin(x * 0.3) * Math.cos(x * 0.7) +
        Math.sin(x * 1.1) * Math.cos(x * 2.3);

      this.noiseCache[cacheKey] = noise * amplitude;
    }
    return this.noiseCache[cacheKey];
  }

  static generateBaselineWander(x: number, amplitude: number): number {
    const wander = Math.sin(x * 0.01) * Math.cos(x * 0.005) * amplitude;

    const randomFactor = 0.2;
    this.lastBaselineWander =
      this.lastBaselineWander * (1 - randomFactor) + wander * randomFactor;
    return this.lastBaselineWander;
  }

  static generateMuscleArtifact(
    probability: number,
    amplitude: number
  ): number {
    if (Math.random() < probability) {
      const spikeIntensity = (Math.random() * 2 - 1) * amplitude * 5;
      return spikeIntensity;
    }
    return 0;
  }

  static generateIrregularity(
    x: number,
    cycleCount: number,
    strength: number
  ): number {
    const cacheKey = `${cycleCount}-${Math.floor(x)}`;
    if (!this.irregularityCache[cacheKey]) {
      const seed = Math.sin(cycleCount * 100) * 10000;
      this.irregularityCache[cacheKey] =
        (Math.sin(seed) * 0.5 + 0.5) * strength;
    }
    return this.irregularityCache[cacheKey];
  }  static generateEkgValue(
    x: number,
    ekgType: EkgType = EkgType.NORMAL,
    bpm: number = DEFAULT_BPM,
    noiseType: NoiseType = NoiseType.NONE
  ): number {
    const config = this.getConfig(ekgType, bpm, noiseType);
    
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
  }  static resetNoiseCache(): void {
    this.noiseCache = {};
    this.lastBaselineWander = 0;
    this.irregularityCache = {};
    this.pvcCounters = {};
  }

  static generateNormalSinusEkg(x: number, config: EkgConfig): number {
    const {
      baseline,
      period,
      phaseShift,
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability,
    } = config;

    const t = (x + phaseShift) % period;
    let y = baseline;

    
    if (t < 0.2 * period) {
      const u = t / (0.2 * period);
      y += Math.sin(Math.PI * u) * 2; 
    }
    
    else if (t < 0.3 * period) {
      y += 0;
    }
    
    else if (t < 0.4 * period) {
      const u = (t - 0.3 * period) / (0.1 * period);
      
      if (u < 0.3) {
        y -= (0.3 - u) * 5; 
      } else if (u < 0.6) {
        y += (u - 0.3) * 15; 
      } else {
        y -= (u - 0.6) * 8; 
      }
    }
    
    else if (t < 0.6 * period) {
      y += 0;
    }
    
    else if (t < 0.8 * period) {
      const u = (t - 0.6 * period) / (0.2 * period);
      y += Math.sin(Math.PI * u) * 3; 
    }
    
    else {
      y += 0;
    }

    
    
    const noisyY = this.addNoiseToSignal(
      x,
      y,
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability
    );
    
    return baseline + (noisyY - baseline) * 10;
  }

  static generateTachycardiaEkg(x: number, config: EkgConfig): number {
    const amplitude = config.amplitude || 1.3;
    return this.generateNormalSinusEkg(x, config) * amplitude;
  }

  static generateBradycardiaEkg(x: number, config: EkgConfig): number {
    const amplitude = config.amplitude || 1.2;
    return this.generateNormalSinusEkg(x, config) * amplitude;
  }

  static generateAFibEkg(x: number, config: EkgConfig): number {
    const {
      baseline,
      period,
      phaseShift,
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability,
    } = config;

    const irregularity = config.irregularity || 1.0;
    const t = (x + phaseShift) % period;
    let y = baseline;

    const cycleCount = Math.floor((x + phaseShift) / period);

    const tIrregular =
      t + this.generateIrregularity(x, cycleCount, irregularity * 20);

    if (tIrregular < 15) {
      y += Math.sin(tIrregular * 3) * 2 + Math.cos(tIrregular * 5) * 1.5;
    } else if (tIrregular >= 15 && tIrregular < 35) {
      if (tIrregular < 20) {
        y -= (20 - tIrregular) * 1.5;
      } else if (tIrregular < 25) {
        y += (tIrregular - 20) * 18;
      } else {
        y -= (tIrregular - 25) * 10;
      }
    } else if (tIrregular >= 40 && tIrregular < 60) {
      y += Math.sin(((tIrregular - 40) / 20) * Math.PI) * 8;
    }

    return this.addNoiseToSignal(
      x,
      y,
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability
    );
  }

  static generateVFibEkg(x: number, config: EkgConfig): number {
    const {
      baseline,
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability,
    } = config;

    const amplitude = (config.amplitude || 0.8) * 40;

    let y =
      baseline +
      Math.sin(x * 0.3) * amplitude * 0.5 +
      Math.sin(x * 0.7) * amplitude * 0.3 +
      Math.sin(x * 1.1) * amplitude * 0.7 +
      Math.sin(x * 2.3) * amplitude * 0.4;

    return this.addNoiseToSignal(
      x,
      y,
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability
    );
  }

  static generateVTachEkg(x: number, config: EkgConfig): number {
    const {
      baseline,
      period,
      phaseShift,
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability,
    } = config;

    const amplitude = config.amplitude || 1.5;
    const t = (x + phaseShift) % period;
    let y = baseline;

    if (t >= 15 && t < 45) {
      if (t < 25) {
        y -= (25 - t) * 1.0;
      } else if (t < 35) {
        y += (t - 25) * 15 * amplitude;
      } else {
        y -= (t - 35) * 8;
      }
    } else if (t >= 50 && t < 70) {
      y += Math.sin(((t - 50) / 20) * Math.PI) * 5;
    }

    return this.addNoiseToSignal(
      x,
      y,
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability
    );
  }

  static generateTorsadeEkg(x: number, config: EkgConfig): number {
    const {
      baseline,
      period,
      phaseShift,
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability,
    } = config;

    const amplitude = config.amplitude || 1.4;
    const oscillationRate = config.oscillationRate || 0.01;

    const t = (x + phaseShift) % period;

    const oscillation = Math.sin(x * oscillationRate) * 50;

    let y = baseline + oscillation;

    if (t >= 10 && t < 40) {
      const waveHeight = 20 * amplitude;

      y += Math.sin(((t - 10) / 30) * Math.PI) * waveHeight;
    }

    return this.addNoiseToSignal(
      x,
      y,
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability
    );
  }

  static generateAsystoleEkg(x: number, config: EkgConfig): number {
    const {
      baseline,
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability,
    } = config;

    const amplitude = config.amplitude || 0.05;

    let y = baseline + Math.sin(x * 0.2) * 2 * amplitude;

    return this.addNoiseToSignal(
      x,
      y,
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability
    );
  }

  static generateHeartBlockEkg(x: number, config: EkgConfig): number {
    const {
      baseline,
      period,
      phaseShift,
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability,
    } = config;

    const irregularity = config.irregularity || 0.5;

    const cycleCount = Math.floor((x + phaseShift) / period);
    const isBlockedBeat = cycleCount % 3 === 2;

    if (isBlockedBeat) {
      const t = (x + phaseShift) % period;
      let y = baseline;

      if (t < 10) {
        y += Math.sin((t / 10) * Math.PI) * 5;
      }

      return this.addNoiseToSignal(
        x,
        y,
        noiseAmplitude,
        baselineWanderAmplitude,
        muscleArtifactProbability
      );
    } else {
      const t = (x + phaseShift) % period;
      let y = baseline;

      if (t < 10) {
        y += Math.sin((t / 10) * Math.PI) * 5;
      } else if (t < 25) {
        y += 0;
      } else if (t >= 25 && t < 45) {
        if (t < 30) {
          y -= (30 - t) * 1.5;
        } else if (t < 35) {
          y += (t - 30) * 18;
        } else {
          y -= (t - 35) * 10;
        }
      } else if (t >= 50 && t < 70) {
        y += Math.sin(((t - 50) / 20) * Math.PI) * 8;
      }

      return this.addNoiseToSignal(
        x,
        y,
        noiseAmplitude,
        baselineWanderAmplitude,
        muscleArtifactProbability
      );
    }
  }

  static generatePVCEkg(x: number, config: EkgConfig): number {
    const {
      baseline,
      period,
      phaseShift,
      noiseAmplitude,
      baselineWanderAmplitude,
      muscleArtifactProbability,
    } = config;

    const cyclePeriod = 3;

    const cycleCount = Math.floor((x + phaseShift) / period);
    const trackKey = Math.floor(x / (period * cyclePeriod));

    if (this.pvcCounters[trackKey] === undefined) {
      this.pvcCounters[trackKey] = 0;
    }

    const beatPosition = cycleCount % cyclePeriod;

    if (beatPosition === cyclePeriod - 1) {
      const t = (x + phaseShift) % period;
      let y = baseline;

      if (t >= 0 && t < 40) {
        if (t < 15) {
          y -= (15 - t) * 3;
        } else if (t < 25) {
          y -= (t - 15) * 15;
        } else {
          y += (t - 25) * 12;
        }
      } else if (t >= 40 && t < 60) {
        y -= Math.sin(((t - 40) / 20) * Math.PI) * 5;
      }

      return this.addNoiseToSignal(
        x,
        y,
        noiseAmplitude,
        baselineWanderAmplitude,
        muscleArtifactProbability
      );
    } else {
      return this.generateNormalSinusEkg(x, config);
    }
  }

  private static addNoiseToSignal(
    x: number,
    y: number,
    noiseAmplitude: number,
    baselineWanderAmplitude: number,
    muscleArtifactProbability: number
  ): number {
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

  static getBpmForType(type: EkgType): number {
    switch (type) {
      case EkgType.NORMAL:
        return 72;
      case EkgType.TACHYCARDIA:
        return 120;
      case EkgType.BRADYCARDIA:
        return 45;
      case EkgType.AFIB:
        return 110;
      case EkgType.VFIB:
        return 300;
      case EkgType.VTACH:
        return 180;
      case EkgType.TORSADE:
        return 200;
      case EkgType.ASYSTOLE:
        return 0;
      case EkgType.HEART_BLOCK:
        return 40;
      case EkgType.PVC:
        return 70;
      case EkgType.CUSTOM:
      default:
        return DEFAULT_BPM;
    }
  }

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