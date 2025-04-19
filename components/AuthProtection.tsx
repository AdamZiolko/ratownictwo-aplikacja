import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { ThemedView } from './ThemedView';

interface AuthProtectionProps {
  children: React.ReactNode;
  requiredRole?: string;
}

/**
 * Component to protect routes that require authentication
 * Can also specify a required role for more fine-grained access control
 */
export default function AuthProtection({ 
  children, 
  requiredRole 
}: AuthProtectionProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login if not authenticated
      router.replace('/routes/examiner-login');
    }
    
    // Check for required role if specified
    if (
      !loading && 
      isAuthenticated && 
      requiredRole && 
      user?.roles && 
      !user.roles.includes(requiredRole)
    ) {
      // Redirect to dashboard if user doesn't have the required role
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

  // Only render children if authenticated (and has required role if specified)
  if (
    isAuthenticated && 
    (!requiredRole || (user?.roles && user.roles.includes(requiredRole)))
  ) {
    return <>{children}</>;
  }

  // Return empty view while redirecting
  return <View />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});