import { useState, useEffect } from "react";
import { router } from "expo-router";
import { sessionService } from "@/services/SessionService";
import { socketService } from "@/services/SocketService";
import type { Session } from "@/services/SessionService";

interface UseSessionManagerProps {
  accessCode: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  albumNumber: string | undefined;
}

export const useSessionManager = ({ 
  accessCode, 
  firstName, 
  lastName, 
  albumNumber 
}: UseSessionManagerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<Session | null>(null);

  const handleRetry = () => {
    fetchSession();
  };

  const fetchSession = async () => {
    if (!accessCode) {
      setError("No access code provided");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const resp = await sessionService.getSessionByCode(accessCode.toString());
      if (!resp) {
        setError("Session not found");
      } else {
        setSessionData(resp);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch session");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [accessCode]);
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let sessionDeletedUnsubscribe: (() => void) | undefined;
    let mounted = true;

    async function setupSessionSubscription() {
      if (!accessCode || !mounted) return;

      try {
        const name = firstName || "";
        const surname = lastName || "";
        const albumNum = albumNumber || "";

        console.log(`Setting up session subscription for ${accessCode}`);

        // Subscribe to session updates
        const unsubscribeSession = await sessionService.subscribeToSessionUpdates(
          accessCode.toString(),
          (updated) => {
            if (!mounted) return;
            
            console.log('Session data updated:', updated);
            setSessionData(updated);
            
            if (updated.isActive === false) {
              setError("Sesja została dezaktywowana przez egzaminatora");
              
              setTimeout(() => {
                if (mounted) {
                  try {
                    sessionService.leaveSession(accessCode.toString());
                  } catch (e) {
                    console.warn("Error leaving session on inactive:", e);
                  }
                  
                  router.replace({
                    pathname: "/routes/student-access",
                    params: { 
                      firstName: firstName || "", 
                      lastName: lastName || "", 
                      albumNumber: albumNumber || "" 
                    }
                  });
                }
              }, 3000);
            }
          },
          {
            name,
            surname,
            albumNumber: albumNum,
          }
        );

        // Subscribe to session deletion events
        sessionDeletedUnsubscribe = socketService.on('session-deleted', (data) => {
          if (!mounted) return;
          
          console.log('❌ Session has been deleted by the examiner', data);
          setError("Sesja została zakończona przez egzaminatora");
          
          try {
            sessionService.leaveSession(accessCode.toString());
          } catch (e) {
            console.warn("Error leaving session on deletion:", e);
          }
          
          router.replace({
            pathname: "/routes/student-access",
            params: { 
              firstName: firstName || "", 
              lastName: lastName || "", 
              albumNumber: albumNumber || "" 
            }
          });
        });

        cleanup = () => {
          console.log(`Cleaning up session subscription for ${accessCode}`);
          unsubscribeSession?.();
          sessionDeletedUnsubscribe?.();
          
          if (accessCode) {
            try {
              sessionService.leaveSession(accessCode.toString());
            } catch (e) {
              console.warn("Error leaving session during cleanup:", e);
            }
          }
        };

      } catch (error) {
        console.error('Error setting up session subscription:', error);
        if (mounted) {
          setError('Błąd połączenia z sesją');
        }
      }
    }

    setupSessionSubscription();

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [accessCode, firstName, lastName, albumNumber]);

  return {
    isLoading,
    error,
    sessionData,
    handleRetry,
  };
};
