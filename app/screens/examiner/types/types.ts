import { EkgType, NoiseType } from "@/services/EkgFactory";

export interface StudentInSession {
  id?: number;
  name?: string;
  surname?: string;
  albumNumber?: string;
  student_sessions?: {
    active?: boolean;
    joinedAt?: string;
  };
}

export interface Session {
  sessionId?: string;
  name?: string;
  temperature?: number;
  rhythmType: number;
  beatsPerMinute: number;
  noiseLevel: number;
  sessionCode: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  
  
  hr?: number;
  bp?: string;
  spo2?: number;
  etco2?: number;
  rr?: number;
  
  students?: StudentInSession[];
}

export interface FormData {
  name: string;
  temperature: string;
  rhythmType: EkgType;
  beatsPerMinute: string;
  noiseLevel: NoiseType;
  sessionCode: string;
  isActive: boolean;
  bp: string;
  spo2: string;
  etco2: string;
  rr: string;
}

export interface FormErrors {
  temperature: string;
  beatsPerMinute: string;
  sessionCode: string;
  spo2: string;
  etco2: string;
  rr: string;
}

export type Preset = {
  id: string;
  name: string;
  data: FormData;
};

export interface Storage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

export interface SoundQueueItem {
  soundName: string;
  delay: number;
}