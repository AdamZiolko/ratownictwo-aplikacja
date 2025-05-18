

import { EkgType, NoiseType } from './EkgFactory';


export interface EkgJsonData {
  sample_rate: number;
  period_count: number;
  timestamps: number[];
  values: number[];
  midpoint?: number; 
}


export interface EkgTimeSeriesData {
  type: EkgType;
  timestamps: number[];
  values: number[];
  bpm: number;
  noiseType: NoiseType;
  xOffset?: number; // Offset for the x-axis (positive number shifts left)
}


export interface EkgRenderConfig {
  lineColor: string;
  gridColor: string;
  backgroundColor: string;
  lineWidth: number;
  gridSpacing: number;
  timeScale: number;
  amplitudeScale: number;
  showGrid: boolean;
  xOffset?: number; // Offset for the x-axis (positive number shifts left)
}


export enum NoiseApplicationMethod {
  ADDITIVE = 'additive',
  MULTIPLICATIVE = 'multiplicative',
  COMBINED = 'combined'
}


export interface NoiseConfig {
  type: NoiseType;
  amplitude: number;
  baselineWanderFrequency: number;
  baselineWanderAmplitude: number;
  applicationMethod: NoiseApplicationMethod;
}