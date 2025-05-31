import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { socketService } from '@/services/SocketService';
import { sessionService } from '@/services/SessionService';

interface UseSessionDeletionProps {
  accessCode?: string;
  firstName?: string;
  lastName?: string;
  albumNumber?: string;
  sessionJoined: boolean;
}

export const useSessionDeletion = ({
  accessCode,
  firstName,
  lastName,
  albumNumber,
  sessionJoined
}: UseSessionDeletionProps) => {
  const router = useRouter();

  useEffect(() => {
    // Only set up the listener after session is joined to ensure we're in the right socket room
    if (!sessionJoined || !accessCode) {
      console.log('🔌 Session deletion listener: waiting for session to be joined');
      return;
    }

    console.log('🔌 Setting up session-deleted listener for session:', accessCode);

    const handleSessionDeleted = (data: any) => {
      console.log('❌ SESSION-DELETED event received:', data);
      console.log('🚨 Session has been deleted by the examiner - redirecting student');
      
      // Immediately leave the session
      if (accessCode) {
        try {
          sessionService.leaveSession(accessCode.toString());
          console.log(`✅ Left session ${accessCode} after deletion`);
        } catch (e) {
          console.warn("Error leaving session on deletion:", e);
        }
      }
      
      // Navigate back to student access
      router.replace({
        pathname: "/routes/student-access",
        params: { 
          firstName: firstName || "", 
          lastName: lastName || "", 
          albumNumber: albumNumber || "" 
        }
      });
    };

    const unsubscribe = socketService.on('session-deleted', handleSessionDeleted);
    console.log('✅ Session deletion listener set up successfully');

    return () => {
      console.log('🧹 Cleaning up session-deleted listener');
      unsubscribe();
    };
  }, [sessionJoined, accessCode, router, firstName, lastName, albumNumber]);
};
