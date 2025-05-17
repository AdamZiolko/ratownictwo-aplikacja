/**
 * EkgTypes.ts
 * 
 * This file contains type definitions for the EKG system
 */

import { EkgType, NoiseType } from './EkgFactory';

/**
 * Structure of EKG JSON data files
 */
export interface EkgJsonData {
  sample_rate: number;
  period_count: number;
  timestamps: number[];
  values: number[];
}

/**
 * Structure for EKG time series data
 */
export interface EkgTimeSeriesData {
  type: EkgType;
  timestamps: number[];
  values: number[];
  bpm: number;
  noiseType: NoiseType;
}

/**
 * Structure for EKG rendering configuration
 */
export interface EkgRenderConfig {
  lineColor: string;
  gridColor: string;
  backgroundColor: string;
  lineWidth: number;
  gridSpacing: number;
  timeScale: number;
  amplitudeScale: number;
  showGrid: boolean;
}

/**
 * Supported noise application methods
 */
export enum NoiseApplicationMethod {
  ADDITIVE = 'additive',
  MULTIPLICATIVE = 'multiplicative',
  COMBINED = 'combined'
}

/**
 * Structure for noise configuration
 */
export interface NoiseConfig {
  type: NoiseType;
  amplitude: number;
  baselineWanderFrequency: number;
  baselineWanderAmplitude: number;
  applicationMethod: NoiseApplicationMethod;
}