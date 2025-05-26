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
    let unsub: (() => void) | undefined;

    async function setupSessionSubscription() {
      if (!accessCode) return;

      let name = firstName || "";
      let surname = lastName || "";
      let albumNum = albumNumber || "";

      sessionService
        .subscribeToSessionUpdates(
          accessCode.toString(),
          (updated) => {
            setSessionData(updated);
            
            if (updated.isActive === false) {
              setError("Sesja została dezaktywowana przez egzaminatora");
              
              if (accessCode) {
                try {
                  sessionService.leaveSession(accessCode.toString());
                } catch (e) {
                  console.warn("Error leaving session on inactive:", e);
                }
              }
              
              setTimeout(() => {
                router.replace({
                  pathname: "/routes/student-access",
                  params: { 
                    firstName: firstName || "", 
                    lastName: lastName || "", 
                    albumNumber: albumNumber || "" 
                  }
                });
              }, 3000);
            }
          },
          {
            name,
            surname,
            albumNumber: albumNum,
          }
        )
        .then((fn) => {
          unsub = fn;
        })
        .catch(console.error);

      const sessionDeletedUnsubscribe = socketService.on('session-deleted', (data) => {
        console.log('❌ Session has been deleted by the examiner', data);
        
        setError("Sesja została zakończona przez egzaminatora");
        
        if (accessCode) {
          try {
            sessionService.leaveSession(accessCode.toString());
          } catch (e) {
            console.warn("Error leaving session on deletion:", e);
          }
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

      return () => {
        unsub?.();
        sessionDeletedUnsubscribe();

        if (accessCode) {
          sessionService.leaveSession(accessCode.toString());
          console.log(`Left session ${accessCode}`);
        }
      };
    }

    setupSessionSubscription();
    return () => {
      unsub?.();

      if (accessCode) {
        sessionService.leaveSession(accessCode.toString());
        console.log(`Left session ${accessCode}`);
      }
    };
  }, [accessCode, firstName, lastName, albumNumber, router]);

  return {
    isLoading,
    error,
    sessionData,
    handleRetry,
  };
};
