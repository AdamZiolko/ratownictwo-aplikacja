export const DEFAULT_BASELINE = 150;
const DEFAULT_PHASE_SHIFT = 5;

export var DEFAULT_X_OFFSET = 5;

const DEFAULT_BPM = 72;
const MIN_BPM = 30;
const MAX_BPM = 220;

const DEFAULT_NOISE_AMPLITUDE = 0;
const DEFAULT_BASELINE_WANDER_AMPLITUDE = 0;
const DEFAULT_MUSCLE_ARTIFACT_PROBABILITY = 0;

export enum EkgType {
  NORMAL_SINUS_RHYTHM = 0,
  SINUS_TACHYCARDIA = 1,
  SINUS_BRADYCARDIA = 2,
  ATRIAL_FIBRILLATION = 3,
  VENTRICULAR_FIBRILLATION = 4,
  VENTRICULAR_TACHYCARDIA = 5,
  TORSADE_DE_POINTES = 6,
  ASYSTOLE = 7,
  FIRST_DEGREE_AV_BLOCK = 8,
  SECOND_DEGREE_AV_BLOCK = 9,
  MOBITZ_TYPE_AV_BLOCK = 10,
  SA_BLOCK = 11,
  WANDERING_ATRIAL_PACEMAKER = 12,
  SINUS_ARRHYTHMIA = 13,
  PREMATURE_VENTRICULAR_CONTRACTION = 14,
  PREMATURE_ATRIAL_CONTRACTION = 15,
  PREMATURE_JUNCTIONAL_CONTRACTION = 16,
  ACCELERATED_VENTRICULAR_RHYTHM = 17,
  ACCELERATED_JUNCTIONAL_RHYTHM = 18,
  IDIOVENTRICULAR_RHYTHM = 19,
  VENTRICULAR_FLUTTER = 20,
  ATRIAL_FLUTTER_A = 21,
  ATRIAL_FLUTTER_B = 22,
  MULTIFOCAL_ATRIAL_TACHYCARDIA = 23,
  SINUS_ARREST = 24,
  VENTRICULAR_ESCAPE_BEAT = 25,
  JUNCTIONAL_ESCAPE_BEAT = 26,
  CUSTOM = 27,
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
  xOffset?: number; 

  amplitude?: number;
  irregularity?: number;
  oscillationRate?: number;
  ekgType?: EkgType;
}

export class EkgFactory {
  private static noiseCache: { [key: number]: number } = {};
  private static lastBaselineWander = 0;
  private static irregularityCache: { [key: string]: number } = {};
  private static pvcCounters: { [key: number]: number } = {};
  
  static async initialize(): Promise<void> {
    try {
      
      const { EkgJsonDataLoader } = require('./EkgJsonDataLoader');
      const { EkgDataAdapter } = require('./EkgDataAdapter');
      
      
      await EkgJsonDataLoader.initialize();
      EkgDataAdapter.initialize();
      
      console.log('EkgFactory initialized with JSON data');
    } catch (e) {
      console.error('Failed to initialize EkgFactory with JSON data:', e);
      throw e; 
    }
  }

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
    const safeBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));    const baseConfig = {
      baseline: DEFAULT_BASELINE,
      bpm: safeBpm,
      period: this.bpmToPeriod(safeBpm),
      phaseShift: DEFAULT_PHASE_SHIFT,
      noiseType,
      ekgType,
      xOffset: DEFAULT_X_OFFSET, 
      ...noiseConfig,
    };
    
    switch (ekgType) {
      case EkgType.SINUS_TACHYCARDIA:
        return {
          ...baseConfig,
          amplitude: 1.3,
        };
      case EkgType.SINUS_BRADYCARDIA:
        return {
          ...baseConfig,
          amplitude: 1.2,
        };
      case EkgType.ATRIAL_FIBRILLATION:
        return {
          ...baseConfig,
          irregularity: 1.0,
        };
      case EkgType.VENTRICULAR_FIBRILLATION:
        return {
          ...baseConfig,
          irregularity: 2.0,
          amplitude: 0.8,
        };
      case EkgType.VENTRICULAR_TACHYCARDIA:
        return {
          ...baseConfig,
          amplitude: 1.5,
        };
      case EkgType.TORSADE_DE_POINTES:
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
      case EkgType.FIRST_DEGREE_AV_BLOCK:
      case EkgType.SECOND_DEGREE_AV_BLOCK:
      case EkgType.MOBITZ_TYPE_AV_BLOCK:
        return {
          ...baseConfig,
          irregularity: 0.5,
        };
      case EkgType.PREMATURE_VENTRICULAR_CONTRACTION:
        return {
          ...baseConfig,
          irregularity: 0.3,
        };
      case EkgType.NORMAL_SINUS_RHYTHM:
      case EkgType.CUSTOM:
      default:
        return baseConfig;
    }
  }

  
  static generateNoise(x: number, amplitude: number): number {
    return 0; 
  }

  
  static generateBaselineWander(x: number, amplitude: number): number {
    return 0; 
  }

  
  static generateMuscleArtifact(probability: number, amplitude: number): number {
    return 0; 
  }

  
  static generateIrregularity(x: number, cycleCount: number, strength: number): number {
    return 0; 
  }  static generateEkgValue(
    x: number,
    ekgType: EkgType = EkgType.NORMAL_SINUS_RHYTHM,
    bpm: number = DEFAULT_BPM,
    noiseType: NoiseType = NoiseType.NONE,
    xOffset: number = DEFAULT_X_OFFSET
  ): number {
    
    try {
        const { EkgDataAdapter } = require('./EkgDataAdapter');
      
      
      return EkgDataAdapter.getValueAtTime(ekgType, x, bpm, noiseType);
    } catch (e) {
      console.error('Error loading EKG data, falling back to default:', e);
      
      
      if (ekgType === EkgType.ASYSTOLE) {
        return 150; 
      } else if (ekgType === EkgType.VENTRICULAR_FIBRILLATION) {
        return 150 + (Math.random() - 0.5) * 80; 
      } else {
        
        return 150 + Math.sin(x * 0.1) * 30;
      }
    }
  }

  
  static getEkgValueWithOffset(
    x: number,
    ekgType: EkgType = EkgType.NORMAL_SINUS_RHYTHM,
    bpm: number = DEFAULT_BPM,
    noiseType: NoiseType = NoiseType.NONE,
    xOffset: number = DEFAULT_X_OFFSET
  ): number {
    return this.generateEkgValue(x, ekgType, bpm, noiseType, xOffset);
  }

  
  static resetNoiseCache(): void {
    this.noiseCache = {};
    this.lastBaselineWander = 0;
    this.irregularityCache = {};
    this.pvcCounters = {};
    
    
    try {
      const { EkgJsonDataLoader } = require('./EkgJsonDataLoader');
      EkgJsonDataLoader.resetCache();
    } catch (e) {
      
    }
  }

  
  
    static generateNormalSinusEkg(x: number, config: EkgConfig): number {
    return this.generateEkgValue(x, EkgType.NORMAL_SINUS_RHYTHM, config.bpm, config.noiseType, config.xOffset);
  }

  static generateTachycardiaEkg(x: number, config: EkgConfig): number {
    return this.generateEkgValue(x, EkgType.SINUS_TACHYCARDIA, config.bpm, config.noiseType, config.xOffset);
  }

  static generateBradycardiaEkg(x: number, config: EkgConfig): number {
    return this.generateEkgValue(x, EkgType.SINUS_BRADYCARDIA, config.bpm, config.noiseType, config.xOffset);
  }

  static generateAFibEkg(x: number, config: EkgConfig): number {
    return this.generateEkgValue(x, EkgType.ATRIAL_FIBRILLATION, config.bpm, config.noiseType, config.xOffset);
  }

  static generateVFibEkg(x: number, config: EkgConfig): number {
    return this.generateEkgValue(x, EkgType.VENTRICULAR_FIBRILLATION, config.bpm, config.noiseType, config.xOffset);
  }

  static generateVTachEkg(x: number, config: EkgConfig): number {
    return this.generateEkgValue(x, EkgType.VENTRICULAR_TACHYCARDIA, config.bpm, config.noiseType, config.xOffset);
  }
  static generateTorsadeEkg(x: number, config: EkgConfig): number {
    return this.generateEkgValue(x, EkgType.TORSADE_DE_POINTES, config.bpm, config.noiseType, config.xOffset);
  }

  static generateAsystoleEkg(x: number, config: EkgConfig): number {
    return this.generateEkgValue(x, EkgType.ASYSTOLE, config.bpm, config.noiseType, config.xOffset);
  }

  static generateHeartBlockEkg(x: number, config: EkgConfig): number {
    
    switch(config.ekgType) {
      case EkgType.SECOND_DEGREE_AV_BLOCK:
        return this.generateEkgValue(x, EkgType.SECOND_DEGREE_AV_BLOCK, config.bpm, config.noiseType, config.xOffset);
      case EkgType.MOBITZ_TYPE_AV_BLOCK:
        return this.generateEkgValue(x, EkgType.MOBITZ_TYPE_AV_BLOCK, config.bpm, config.noiseType, config.xOffset);
      case EkgType.FIRST_DEGREE_AV_BLOCK:
      default:
        return this.generateEkgValue(x, EkgType.FIRST_DEGREE_AV_BLOCK, config.bpm, config.noiseType, config.xOffset);
    }
  }
  static generatePVCEkg(x: number, config: EkgConfig): number {
    return this.generateEkgValue(x, EkgType.PREMATURE_VENTRICULAR_CONTRACTION, config.bpm, config.noiseType, config.xOffset);
  }

  
  private static addNoiseToSignal(
    x: number,
    y: number,
    noiseAmplitude: number,
    baselineWanderAmplitude: number,
    muscleArtifactProbability: number
  ): number {
    
    return y;
  }

  static getBpmForType(type: EkgType): number {
    try {
      const { EkgJsonDataLoader } = require('./EkgJsonDataLoader');
      return EkgJsonDataLoader.getBpmForType(type);
    } catch (e) {
      
      switch (type) {
        case EkgType.NORMAL_SINUS_RHYTHM:
          return 72;
        case EkgType.SINUS_TACHYCARDIA:
          return 120;
        case EkgType.SINUS_BRADYCARDIA:
          return 45;
        case EkgType.ATRIAL_FIBRILLATION:
          return 110;
        case EkgType.VENTRICULAR_FIBRILLATION:
          return 300;
        case EkgType.VENTRICULAR_TACHYCARDIA:
          return 180;
        case EkgType.TORSADE_DE_POINTES:
          return 200;
        case EkgType.ASYSTOLE:
          return 0;
        case EkgType.FIRST_DEGREE_AV_BLOCK:
        case EkgType.SECOND_DEGREE_AV_BLOCK:
        case EkgType.MOBITZ_TYPE_AV_BLOCK:
          return 40;
        case EkgType.PREMATURE_VENTRICULAR_CONTRACTION:
          return 70;
        case EkgType.WANDERING_ATRIAL_PACEMAKER:
          return 90;
        case EkgType.SINUS_ARRHYTHMIA:
          return 75;
        case EkgType.PREMATURE_ATRIAL_CONTRACTION:
          return 80;
        case EkgType.PREMATURE_JUNCTIONAL_CONTRACTION:
          return 75;
        case EkgType.ACCELERATED_VENTRICULAR_RHYTHM:
          return 85;
        case EkgType.ACCELERATED_JUNCTIONAL_RHYTHM:
          return 80;
        case EkgType.IDIOVENTRICULAR_RHYTHM:
          return 35;
        case EkgType.VENTRICULAR_FLUTTER:
          return 280;
        case EkgType.ATRIAL_FLUTTER_A:
        case EkgType.ATRIAL_FLUTTER_B:
          return 150;
        case EkgType.MULTIFOCAL_ATRIAL_TACHYCARDIA:
          return 130;
        case EkgType.SINUS_ARREST:
          return 30;
        case EkgType.VENTRICULAR_ESCAPE_BEAT:
          return 35;
        case EkgType.JUNCTIONAL_ESCAPE_BEAT:
          return 50;
        case EkgType.CUSTOM:
        default:
          return DEFAULT_BPM;
      }
    }
  }

  static getNameForType(type: EkgType): string {
    switch (type) {
      case EkgType.NORMAL_SINUS_RHYTHM:
        return "Prawidłowy rytm zatokowy";
      case EkgType.SINUS_TACHYCARDIA:
        return "Tachykardia zatokowa";
      case EkgType.SINUS_BRADYCARDIA:
        return "Bradykardia zatokowa";
      case EkgType.ATRIAL_FIBRILLATION:
        return "Migotanie przedsionków";
      case EkgType.VENTRICULAR_FIBRILLATION:
        return "Migotanie komór";
      case EkgType.VENTRICULAR_TACHYCARDIA:
        return "Częstoskurcz komorowy";
      case EkgType.TORSADE_DE_POINTES:
        return "Torsade de Pointes";
      case EkgType.ASYSTOLE:
        return "Asystolia";
      case EkgType.FIRST_DEGREE_AV_BLOCK:
        return "Blok przedsionkowo-komorowy 1 stopnia";
      case EkgType.SECOND_DEGREE_AV_BLOCK:
        return "Blok przedsionkowo-komorowy 2 stopnia";
      case EkgType.MOBITZ_TYPE_AV_BLOCK:
        return "Blok przedsionkowo-komorowy 2 stopnia typu Mobitza";
      case EkgType.SA_BLOCK:
        return "Blok zatokowo-przedsionkowy";
      case EkgType.WANDERING_ATRIAL_PACEMAKER:
        return "Nadkomorowe wędrowanie rozrusznika";
      case EkgType.SINUS_ARRHYTHMIA:
        return "Nadmiarowość zatokowa";
      case EkgType.PREMATURE_VENTRICULAR_CONTRACTION:
        return "Przedwczesne pobudzenie komorowe";
      case EkgType.PREMATURE_ATRIAL_CONTRACTION:
        return "Przedwczesne pobudzenie przedsionkowe";
      case EkgType.PREMATURE_JUNCTIONAL_CONTRACTION:
        return "Przedwczesne pobudzenie węzłowe";
      case EkgType.ACCELERATED_VENTRICULAR_RHYTHM:
        return "Przyspieszony rytm komorowy";
      case EkgType.ACCELERATED_JUNCTIONAL_RHYTHM:
        return "Przyspieszony rytm węzłowy";
      case EkgType.IDIOVENTRICULAR_RHYTHM:
        return "Rytm komorowy idowentrykularny";
      case EkgType.VENTRICULAR_FLUTTER:
        return "Trzepotanie komór";
      case EkgType.ATRIAL_FLUTTER_A:
        return "Trzepotanie przedsionków typu A";
      case EkgType.ATRIAL_FLUTTER_B:
        return "Trzepotanie przedsionków typu B";
      case EkgType.MULTIFOCAL_ATRIAL_TACHYCARDIA:
        return "Wieloogniskowy częstoskurcz przedsionkowy";
      case EkgType.SINUS_ARREST:
        return "Zahamowanie zatokowe";
      case EkgType.VENTRICULAR_ESCAPE_BEAT:
        return "Zastępcze pobudzenie komorowe";
      case EkgType.JUNCTIONAL_ESCAPE_BEAT:
        return "Zastępcze pobudzenie węzłowe";
      case EkgType.CUSTOM:
        return "Rytm niestandardowy";
      default:
        return "Nieznany rytm";
    }
  }

  static getDescriptionForType(type: EkgType): string {
    switch (type) {
      case EkgType.NORMAL_SINUS_RHYTHM:
        return "Regularny rytm z prawidłową falą P, zespołem QRS i falą T. Częstość 60-100 uderzeń na minutę.";
      case EkgType.SINUS_TACHYCARDIA:
        return "Regularny rytm o prawidłowej morfologii, ale przyspieszonej częstości powyżej 100 uderzeń na minutę.";
      case EkgType.SINUS_BRADYCARDIA:
        return "Regularny rytm o prawidłowej morfologii, ale obniżonej częstości poniżej 60 uderzeń na minutę.";
      case EkgType.ATRIAL_FIBRILLATION:
        return "Nieregularny rytm z brakiem fal P, zastąpionych przez chaotyczną linię podstawową. Zmienne odstępy R-R.";
      case EkgType.VENTRICULAR_FIBRILLATION:
        return "Chaotyczny, nieregularny rytm bez wyraźnych załamków. Bezpośrednie zagrożenie życia.";
      case EkgType.VENTRICULAR_TACHYCARDIA:
        return "Regularny, szeroki zespół QRS o szybkiej częstości z dysocjacją przedsionkowo-komorową. Zagrożenie życia.";
      case EkgType.TORSADE_DE_POINTES:
        return "Polimorficzny częstoskurcz komorowy z zespołami QRS, które wydają się skręcać wokół linii podstawowej. Zagrożenie życia.";
      case EkgType.ASYSTOLE:
        return "Płaska linia z minimalną aktywnością elektryczną. Zatrzymanie akcji serca wymagające natychmiastowej resuscytacji.";
      case EkgType.FIRST_DEGREE_AV_BLOCK:
        return "Wydłużony odstęp PR powyżej 200ms, wszystkie impulsy przedsionkowe są przewodzone do komór, ale z opóźnieniem.";
      case EkgType.SECOND_DEGREE_AV_BLOCK:
        return "Niektóre impulsy przedsionkowe nie są przewodzone do komór, powodując wypadnięcie zespołów QRS.";
      case EkgType.MOBITZ_TYPE_AV_BLOCK:
        return "Blok typu Mobitz II z nagłym wypadnięciem zespołu QRS bez poprzedzającego wydłużenia odstępu PR.";
      case EkgType.SA_BLOCK:
        return "Zaburzenie generacji lub przewodzenia impulsów w węźle zatokowo-przedsionkowym.";
      case EkgType.WANDERING_ATRIAL_PACEMAKER:
        return "Zmienne miejsce pochodzenia pobudzenia w przedsionkach, co widoczne jest jako zmienne morfologie załamka P.";
      case EkgType.SINUS_ARRHYTHMIA:
        return "Rytm zatokowy z cyklicznymi zmianami częstości, często związany z oddychaniem.";
      case EkgType.PREMATURE_VENTRICULAR_CONTRACTION:
        return "Przedwczesne pobudzenie komór, widoczne jako szeroki, dziwaczny zespół QRS bez poprzedzającego załamka P.";
      case EkgType.PREMATURE_ATRIAL_CONTRACTION:
        return "Przedwczesne pobudzenie przedsionków, widoczne jako przedwczesny załamek P o odmiennej morfologii.";
      case EkgType.PREMATURE_JUNCTIONAL_CONTRACTION:
        return "Przedwczesne pobudzenie z łącza przedsionkowo-komorowego, często z krótkim lub niewidocznym załamkiem P.";
      case EkgType.ACCELERATED_VENTRICULAR_RHYTHM:
        return "Seria trzech lub więcej pobudzeń komorowych o częstości 50-100/min.";
      case EkgType.ACCELERATED_JUNCTIONAL_RHYTHM:
        return "Rytm z łącza przedsionkowo-komorowego o częstości 60-100/min, szybszy niż właściwy rytm zastępczy.";
      case EkgType.IDIOVENTRICULAR_RHYTHM:
        return "Powolny rytm pochodzenia komorowego, zwykle o częstości 20-40/min.";
      case EkgType.VENTRICULAR_FLUTTER:
        return "Bardzo szybki, regularny rytm komorowy (250-350/min) dający obraz fal podobnych do sinusoidy.";
      case EkgType.ATRIAL_FLUTTER_A:
        return "Regularne, szybkie załamki trzepotania przedsionków typu A, przypominające ząbki piły.";
      case EkgType.ATRIAL_FLUTTER_B:
        return "Regularne, szybkie załamki trzepotania przedsionków typu B, o morfologii nieco różniącej się od typu A.";
      case EkgType.MULTIFOCAL_ATRIAL_TACHYCARDIA:
        return "Częstoskurcz przedsionkowy z co najmniej trzema różnymi morfologiami załamka P.";
      case EkgType.SINUS_ARREST:
        return "Czasowe zatrzymanie aktywności węzła zatokowego, powodujące pauzę w rytmie serca.";
      case EkgType.VENTRICULAR_ESCAPE_BEAT:
        return "Pobudzenie komorowe pojawiające się po pauzie, zabezpieczające przed asystolią.";
      case EkgType.JUNCTIONAL_ESCAPE_BEAT:
        return "Pobudzenie z łącza przedsionkowo-komorowego pojawiające się po pauzie.";
      case EkgType.CUSTOM:
        return "Niestandardowy rytm z parametrami zdefiniowanymi przez użytkownika.";
      default:
        return "Nieokreślony rytm serca.";
    }
  }

  
  static getAvailableTypes(): EkgType[] {
    try {
      const { EkgJsonDataLoader } = require('./EkgJsonDataLoader');
      return EkgJsonDataLoader.getAvailableTypes();
    } catch (e) {
      
      return [
        EkgType.NORMAL_SINUS_RHYTHM,
        EkgType.SINUS_TACHYCARDIA,
        EkgType.SINUS_BRADYCARDIA,
        EkgType.ATRIAL_FIBRILLATION,
      ];
    }
  }  
  static async resetAllCaches(): Promise<void> {
    console.log('Resetting all EKG caches...');
    
    
    this.noiseCache = {};
    this.lastBaselineWander = 0;
    this.irregularityCache = {};
    this.pvcCounters = {};
    
    try {
      
      const { EkgJsonDataLoader } = require('./EkgJsonDataLoader');
      EkgJsonDataLoader.resetCache();
      
      
      const { EkgDataAdapter } = require('./EkgDataAdapter');
      EkgDataAdapter.resetCache();
      
      
      (global as any).EkgCacheObject = null;
      
      
      await EkgJsonDataLoader.initialize();
      
      
      console.log('All EKG caches have been reset successfully');
      console.log(`Memory cleanup timestamp: ${Date.now()}`);
    } catch (e) {
      console.error('Error while resetting caches:', e);
      throw e;
    }
  }
  
  static async refreshEkgDisplay(): Promise<void> {
    console.log('Forcing EKG display refresh...');
    
    
    await this.resetAllCaches();
    
    try {
      
      const { EkgJsonDataLoader } = require('./EkgJsonDataLoader');
      await EkgJsonDataLoader.initialize();
      console.log('EKG display refresh completed');
    } catch (e) {
      console.error('Error refreshing EKG display:', e);
      throw e;
    }
  }

  
  static setDefaultXOffset(offset: number): number {
    return (DEFAULT_X_OFFSET = offset);
  }
}