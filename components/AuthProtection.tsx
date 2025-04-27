import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { ThemedView } from './ThemedView';

interface AuthProtectionProps {
  children: React.ReactNode;
  requiredRole?: string;
}


export default function AuthProtection({ 
  children, 
  requiredRole 
}: AuthProtectionProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      
      router.replace('/routes/examiner-login');
    }
    
    
    if (
      !loading && 
      isAuthenticated && 
      requiredRole && 
      user?.roles && 
      !user.roles.includes(requiredRole)
    ) {
      
      router.replace('/routes/student-access');
    }
  }, [loading, isAuthenticated, user, requiredRole, router]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  
  if (
    isAuthenticated && 
    (!requiredRole || (user?.roles && user.roles.includes(requiredRole)))
  ) {
    return <>{children}</>;
  }

  
  return <View />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});