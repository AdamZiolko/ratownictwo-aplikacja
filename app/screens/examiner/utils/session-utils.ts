import { EkgType, NoiseType } from "@/services/EkgFactory";
import { Session, FormData } from "../types/types";


export const formDataToSession = (formData: FormData): Omit<Session, 'sessionId'> => {
  return {
    name: formData.name || `Sesja ${formData.sessionCode}`,
    temperature: parseFloat(formData.temperature),
    rhythmType: formData.rhythmType as number,
    beatsPerMinute: parseInt(formData.beatsPerMinute),
    noiseLevel: formData.noiseLevel as number,
    sessionCode: formData.sessionCode,
    isActive: formData.isActive,
    hr: parseInt(formData.hr) || undefined,
    bp: formData.bp,
    spo2: parseInt(formData.spo2) || undefined,
    etco2: parseInt(formData.etco2) || undefined,
    rr: parseInt(formData.rr) || undefined
  };
};


export const sessionToFormData = (session: Session): FormData => {
  return {
    name: session.name || "",
    temperature: session.temperature ? session.temperature.toString() : "36.6",
    rhythmType: session.rhythmType as EkgType,
    beatsPerMinute: session.beatsPerMinute ? session.beatsPerMinute.toString() : "72",
    noiseLevel: session.noiseLevel as NoiseType,
    sessionCode: session.sessionCode,
    isActive: session.isActive !== undefined ? session.isActive : true,
    hr: session.hr ? session.hr.toString() : "80",
    bp: session.bp || "120/80",
    spo2: session.spo2 ? session.spo2.toString() : "98",
    etco2: session.etco2 ? session.etco2.toString() : "35",
    rr: session.rr ? session.rr.toString() : "12"
  };
};


export const getRhythmTypeName = (type: number): string => {
  switch(type as EkgType) {
    case EkgType.NORMAL: return "Rytm normalny (Zatokowy)";
    case EkgType.TACHYCARDIA: return "Tachykardia zatokowa";
    case EkgType.BRADYCARDIA: return "Bradykardia zatokowa";
    case EkgType.AFIB: return "Migotanie przedsionków";
    case EkgType.VFIB: return "Migotanie komór";
    case EkgType.VTACH: return "Częstoskurcz komorowy";
    case EkgType.TORSADE: return "Torsade de pointes";
    case EkgType.ASYSTOLE: return "Asystolia";
    case EkgType.HEART_BLOCK: return "Blok serca";
    case EkgType.PVC: return "Przedwczesne pobudzenie komorowe";
    default: return "Nieznany rytm";
  }
};


export const getNoiseLevelName = (type: number): string => {
  switch(type as NoiseType) {
    case NoiseType.NONE: return "Brak";
    case NoiseType.MILD: return "Łagodne";
    case NoiseType.MODERATE: return "Umiarkowane";
    case NoiseType.SEVERE: return "Silne";
    default: return "Nieznane";
  }
};