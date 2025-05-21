import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sessionService } from "@/services/SessionService";
import { socketService } from "@/services/SocketService";
import { Session, FormData, Storage, Preset } from "../types/types";
import { SoundQueueItem } from '../types/types';

export const useSessionManager = (user: any) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionStudents, setSessionStudents] = useState<Record<string, any[]>>({});
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");
  
  const subscribedSessions = useRef<Set<string>>(new Set());

  const storage: Storage = {
    getItem: async (key: string) => {
      if (Platform.OS === "web") {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
      if (Platform.OS === "web") {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    },
  };
    const [formData, setFormData] = useState<FormData>({
    name: "",
    temperature: "36.6",
    rhythmType: 0, 
    beatsPerMinute: "72",
    noiseLevel: 0, 
    sessionCode: "",
    isActive: true,
    bp: "120/80",
    spo2: "98",
    etco2: "35",
    rr: "12",
  });

  useEffect(() => {
    socketService.connect();
    
    const fetchAndSubscribe = async () => {
      await loadSessions();
      
      if (user) {
        sessions.forEach(session => {
          if (session.sessionCode) {
            subscribeToStudentUpdates(session.sessionCode, user.id.toString());
          }
        });
      }
    };
    
    fetchAndSubscribe();
    
    return () => {
      socketService.unsubscribeAsExaminer();
      subscribedSessions.current.clear();
    };
  }, []);
  
  useEffect(() => {
    if (!user || sessions.length === 0) return;
    
    sessions.forEach(session => {
      if (session.sessionCode) {
        subscribeToStudentUpdates(session.sessionCode, user.id.toString());
      }
    });
  }, [sessions, user]);
  
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const savedPresets = await storage.getItem("presets");
        if (savedPresets) {
          setPresets(JSON.parse(savedPresets));
        }
      } catch (error) {
        console.error("Błąd ładowania presetów:", error);
      }
    };
    loadPresets();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await sessionService.getAllSessions();
      setSessions(data);
    } catch (error) {
      console.error("Error loading sessions:", error);
      showSnackbar("Nie udało się załadować sesji", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const subscribeToStudentUpdates = async (sessionCode: string, userId: string) => {
    const subscriptionKey = `${sessionCode}-${userId}`;
    if (subscribedSessions.current.has(subscriptionKey)) {
      console.log(`Already subscribed to session ${sessionCode}, skipping duplicate subscription`);
      return;
    }
    
    subscribedSessions.current.add(subscriptionKey);
    
    try {
      socketService.connect();
      
      console.log(`Attempting to subscribe to session updates for ${sessionCode}`);
      
      const { success } = await socketService.subscribeAsExaminer(
        sessionCode,
        userId,
        undefined, 
        (data) => {
          console.log('Received student list update:', data);
          setSessionStudents(prev => ({
            ...prev,
            [data.sessionCode]: data.students
          }));
        },
        (data) => {
          console.log('Received student session update:', data);
          setSessionStudents(prev => {
            const currentStudents = prev[data.sessionCode] || [];
            
            if (data.type === 'join') {
              const exists = currentStudents.some(s => s.id === data.student.id);
              if (!exists) {
                return {
                  ...prev,
                  [data.sessionCode]: [...currentStudents, data.student]
                };
              }
            } else if (data.type === 'leave') {
              return {
                ...prev,
                [data.sessionCode]: currentStudents.filter(s => s.id !== data.student.id)
              };
            }
            
            return prev;
          });
        }
      );
      
      if (success) {
        console.log(`Successfully subscribed to student updates for session ${sessionCode}`);
      } else {
        console.error(`Failed to subscribe to student updates for session ${sessionCode}`);
        
        if (!subscribedSessions.current.has(`${subscriptionKey}-retry`)) {
          subscribedSessions.current.add(`${subscriptionKey}-retry`);
          setTimeout(() => {
            console.log(`Retrying subscription once for session ${sessionCode}`);
            
            subscribedSessions.current.delete(subscriptionKey);
            subscribeToStudentUpdates(sessionCode, userId);
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error subscribing to student updates:', error);
      
      setTimeout(() => {
        subscribedSessions.current.delete(subscriptionKey);
      }, 10000);
    }
  };

  
  const handleCreateSession = async (data: FormData) => {
    try {
      const newSession = {
        name: data.name || `Sesja ${data.sessionCode}`,
        temperature: parseFloat(data.temperature),
        rhythmType: data.rhythmType as number,
        beatsPerMinute: parseInt(data.beatsPerMinute),
        noiseLevel: data.noiseLevel as number,
        sessionCode: data.sessionCode,
        isActive: data.isActive,
        bp: data.bp,
        spo2: parseInt(data.spo2) || undefined,
        etco2: parseInt(data.etco2) || undefined,
        rr: parseInt(data.rr) || undefined,
      };

      await sessionService.createSession(newSession);
      showSnackbar("Sesja została utworzona", "success");
      loadSessions();
      return true;
    } catch (error) {
      console.error("Error creating session:", error);
      showSnackbar("Nie udało się utworzyć sesji", "error");
      return false;
    }
  };

  const handleUpdateSession = async (data: FormData) => {
    if (!currentSession) return false;

    try {
      const updatedSession = {
        name: data.name || `Sesja ${data.sessionCode}`,
        temperature: parseFloat(data.temperature),
        rhythmType: data.rhythmType as number,
        beatsPerMinute: parseInt(data.beatsPerMinute),
        noiseLevel: data.noiseLevel as number,
        sessionCode: data.sessionCode,
        isActive: data.isActive,
        bp: data.bp,
        spo2: parseInt(data.spo2) || undefined,
        etco2: parseInt(data.etco2) || undefined,
        rr: parseInt(data.rr) || undefined,
      };

      if (!currentSession.sessionId) return false;

      await sessionService.updateSession(
        currentSession.sessionId,
        updatedSession
      );
      showSnackbar("Sesja została zaktualizowana", "success");
      loadSessions();
      return true;
    } catch (error) {
      console.error("Error updating session:", error);
      showSnackbar("Nie udało się zaktualizować sesji", "error");
      return false;
    }
  };

  const handleDeleteSession = async () => {
    if (!currentSession) return false;

    try {
      // Use the new method that both deletes on API and notifies clients
      await sessionService.deleteSessionAndNotify(currentSession.sessionId!);
      showSnackbar("Sesja została usunięta", "success");
      loadSessions();
      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      showSnackbar("Nie udało się usunąć sesji", "error");
      return false;
    }
  };

  
  const handleSavePreset = async (name: string) => {
    if (!name.trim()) {
      showSnackbar("Podaj nazwę presetu", "error");
      return false;
    }
    try {
      const newPreset: Preset = {
        id: Date.now().toString(),
        name,              
        data: formData,
      };
      const updatedPresets = [...presets, newPreset];
      await storage.setItem("presets", JSON.stringify(updatedPresets));
      setPresets(updatedPresets);
      showSnackbar("Preset został zapisany", "success");
      return true;
    } catch (error) {
      console.error("Błąd zapisywania presetu:", error);
      showSnackbar("Błąd zapisywania presetu", "error");
      return false;
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    try {
      const updatedPresets = presets.filter((p) => p.id !== presetId);
      await storage.setItem("presets", JSON.stringify(updatedPresets));
      setPresets(updatedPresets);
      showSnackbar("Preset został usunięty", "success");
      return true;
    } catch (error) {
      console.error("Błąd usuwania presetu:", error);
      showSnackbar("Błąd usuwania presetu", "error");
      return false;
    }
  };

  
  const handleSendAudioCommand = (loop?: boolean) => {
    if (!currentSession || !selectedSound) return false;
  
    socketService.emitAudioCommand(
      currentSession.sessionCode,
      "PLAY",
      selectedSound,
      loop
    );
    showSnackbar("Polecenie odtworzenia dźwięku wysłane", "success");
    return true;
  };

  const handlePauseAudioCommand = () => {
    if (!currentSession || !selectedSound) return false;
    socketService.emitAudioCommand(
      currentSession.sessionCode,
      "PAUSE",
      selectedSound
    );
    return true;
  };
  
  const handleResumeAudioCommand = () => {
    if (!currentSession || !selectedSound) return false;
    socketService.emitAudioCommand(
      currentSession.sessionCode,
      "RESUME",
      selectedSound
    );
    return true;
  };
  
  const handleStopAudioCommand = () => {
    if (!currentSession || !selectedSound) return false;
    socketService.emitAudioCommand(
      currentSession.sessionCode,
      "STOP",
      selectedSound
    );
    return true;
  };

  const handleSendQueue = (queue: SoundQueueItem[]) => {
    if (!currentSession || queue.length === 0) return false;
  
    socketService.emitAudioCommand(
      currentSession.sessionCode,
      "PLAY_QUEUE",
      queue 
    );
    showSnackbar(`Wysłano kolejkę (${queue.length} dźwięków)`, "success");
    return true;
  };

  
  const showSnackbar = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  return {
    sessions,
    loading,
    refreshing,
    currentSession,
    setCurrentSession,
    sessionStudents,
    selectedSound,
    setSelectedSound,
    presets,
    formData,
    setFormData,
    snackbarVisible,
    setSnackbarVisible,
    snackbarMessage,
    snackbarType,
    loadSessions,
    onRefresh,
    showSnackbar,
    handleCreateSession,
    handleUpdateSession,
    handleDeleteSession,
    handleSavePreset,
    handleDeletePreset,
    handleSendAudioCommand,
    handlePauseAudioCommand,
    handleResumeAudioCommand,
    handleStopAudioCommand,
    handleSendQueue
  };
};