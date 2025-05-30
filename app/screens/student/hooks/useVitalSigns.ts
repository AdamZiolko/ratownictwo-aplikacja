import { useState, useEffect } from "react";
import type { VitalWithFluctuation, BloodPressure } from "../types";
import type { Session } from "@/services/SessionService";

export const useVitalSigns = (sessionData: Session | null) => {
  const [temperature, setTemperature] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: "°C",
    fluctuationRange: 0.2,
  });

  const [bloodPressure, setBloodPressure] = useState<BloodPressure>({
    systolic: null,
    diastolic: null,
    currentSystolic: null,
    currentDiastolic: null,
  });

  const [spo2, setSpo2] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: "%",
    fluctuationRange: 1,
  });

  const [etco2, setEtco2] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: "mmHg",
    fluctuationRange: 2,
  });

  const [respiratoryRate, setRespiratoryRate] = useState<VitalWithFluctuation>({
    baseValue: null,
    currentValue: null,
    unit: "breaths/min",
    fluctuationRange: 5,
  });

 
  const generateFluctuation = (
    value: number | null,
    fluctuationRange: number,
    min: number | null = null,  
    max: number | null = null  
  ): number | null => {
    if (value === null) return null;
    
    const fluctPercent = (Math.random() - 0.5) * 2 * fluctuationRange;
    const fluctAmount = value * (fluctPercent / 100);
    let result = Math.round((value + fluctAmount) * 10) / 10;
    
    // Ograniczanie wartości do dozwolonego zakresu
    if (min !== null && result < min) result = min;
    if (max !== null && result > max) result = max;
    
    return result;
  };

  const parseBloodPressure = (
    bpString: string | null | undefined
  ): { systolic: number | null; diastolic: number | null } => {
    if (!bpString) return { systolic: null, diastolic: null };
    const parts = bpString.split("/");
    if (parts.length !== 2) return { systolic: null, diastolic: null };
    const systolic = parseInt(parts[0], 10) || null;
    const diastolic = parseInt(parts[1], 10) || null;
    return { systolic, diastolic };
  };

  const formatBloodPressure = (): string => {
    if (
      bloodPressure.currentSystolic === null ||
      bloodPressure.currentDiastolic === null
    ) {
      return "N/A";
    }
    return `${Math.round(bloodPressure.currentSystolic)}/${Math.round(
      bloodPressure.currentDiastolic
    )}`;
  };

  // Update vital signs when session data changes
  useEffect(() => {
    if (!sessionData) return;

    const tempValue =
      sessionData.temperature !== undefined && sessionData.temperature !== null
        ? typeof sessionData.temperature === "string"
          ? parseFloat(sessionData.temperature)
          : sessionData.temperature
        : null;

    const { systolic, diastolic } = parseBloodPressure(sessionData.bp);

    const spo2Value =
      sessionData.spo2 !== undefined && sessionData.spo2 !== null
        ? typeof sessionData.spo2 === "string"
          ? parseInt(sessionData.spo2, 10)
          : sessionData.spo2
        : null;

    const etco2Value =
      sessionData.etco2 !== undefined && sessionData.etco2 !== null
        ? typeof sessionData.etco2 === "string"
          ? parseInt(sessionData.etco2, 10)
          : sessionData.etco2
        : null;

    const rrValue =
      sessionData.rr !== undefined && sessionData.rr !== null
        ? typeof sessionData.rr === "string"
          ? parseInt(sessionData.rr, 10)
          : sessionData.rr
        : null;

    setTemperature((prev) => ({
      ...prev,
      baseValue: tempValue,
      currentValue: tempValue,
    }));
    setBloodPressure({
      systolic,
      diastolic,
      currentSystolic: systolic,
      currentDiastolic: diastolic,
    });
    setSpo2((prev) => ({
      ...prev,
      baseValue: spo2Value,
      currentValue: spo2Value,
    }));
    setEtco2((prev) => ({
      ...prev,
      baseValue: etco2Value,
      currentValue: etco2Value,
    }));
    setRespiratoryRate((prev) => ({
      ...prev,
      baseValue: rrValue,
      currentValue: rrValue,
    }));

    // Set up fluctuation timer
    const fluctuationTimer = setInterval(() => {
      setTemperature((prev) => ({
        ...prev,
        currentValue: generateFluctuation(
          prev.baseValue,
          prev.fluctuationRange
        ),
      }));
      setBloodPressure((prev) => ({
        ...prev,
        currentSystolic: generateFluctuation(prev.systolic, 2),
        currentDiastolic: generateFluctuation(prev.diastolic, 2),
      }));
       setSpo2((prev) => ({
        ...prev,
        currentValue: generateFluctuation(
          prev.baseValue,
          prev.fluctuationRange,
          70,  
          100 
        ),
      }));
      setEtco2((prev) => ({
        ...prev,
        currentValue: generateFluctuation(
          prev.baseValue,
          prev.fluctuationRange
        ),
      }));
      setRespiratoryRate((prev) => ({
        ...prev,
        currentValue: generateFluctuation(
          prev.baseValue,
          prev.fluctuationRange
        ),
      }));
    }, 2000);

    return () => clearInterval(fluctuationTimer);
  }, [sessionData]);

  return {
    temperature,
    bloodPressure,
    spo2,
    etco2,
    respiratoryRate,
    formatBloodPressure,
  };
};
