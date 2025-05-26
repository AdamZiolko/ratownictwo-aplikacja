export interface VitalWithFluctuation {
  baseValue: number | null;
  currentValue: number | null;
  unit: string;
  fluctuationRange: number;
}

export interface BloodPressure {
  systolic: number | null;
  diastolic: number | null;
  currentSystolic: number | null;
  currentDiastolic: number | null;
}

export interface SoundQueueItem {
  soundName: string;
  delay?: number;
}

export interface AudioCommand {
  command: 'PLAY' | 'STOP' | 'PAUSE' | 'RESUME' | 'PLAY_QUEUE';
  soundName: string | SoundQueueItem[];
  loop?: boolean;
}

export interface ServerAudioCommand {
  command: 'PLAY' | 'STOP' | 'PAUSE' | 'RESUME';
  audioId: string;
  loop?: boolean;
}
