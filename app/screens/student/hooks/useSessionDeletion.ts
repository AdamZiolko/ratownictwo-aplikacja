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
  sessionJoined,
}: UseSessionDeletionProps) => {
  const router = useRouter();

  useEffect(() => {
    if (!sessionJoined || !accessCode) {
      return;
    }

    const handleSessionDeleted = (data: any) => {
      if (accessCode) {
        try {
          sessionService.leaveSession(accessCode.toString());
        } catch (e) {
          console.warn('Error leaving session on deletion:', e);
        }
      }

      router.replace({
        pathname: '/routes/student-access',
        params: {
          firstName: firstName || '',
          lastName: lastName || '',
          albumNumber: albumNumber || '',
        },
      });
    };

    const unsubscribe = socketService.on(
      'session-deleted',
      handleSessionDeleted
    );
    return () => {
      unsubscribe();
    };
  }, [sessionJoined, accessCode, router, firstName, lastName, albumNumber]);
};
