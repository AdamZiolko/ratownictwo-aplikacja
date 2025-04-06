import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, TextInput, HelperText, IconButton, useTheme } from 'react-native-paper';
import { router } from 'expo-router';

const ExaminerLoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();

  const handleLogin = async () => {
    // Reset error state
    setError('');
    
    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Email i hasło są wymagane');
      return;
    }
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Simulate API call - in a real app, this would be a real authentication request
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // For demo purposes, just navigate to a success screen
      // In a real app, you would validate credentials against your backend
      router.push('/routes/examiner-dashboard');
    } catch (err) {
      setError('Logowanie nie powiodło się. Sprawdź swoje dane i spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <IconButton
        icon="arrow-left"
        size={24}
        onPress={() => router.back()}
        style={styles.backButton}
      />
      
      <Text variant="headlineMedium" style={styles.title}>
        Logowanie Egzaminatora
      </Text>
      
      <View style={styles.form}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          disabled={isLoading}
        />
        
        <TextInput
          label="Hasło"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={!passwordVisible}
          style={styles.input}
          right={
            <TextInput.Icon
              icon={passwordVisible ? 'eye-off' : 'eye'}
              onPress={() => setPasswordVisible(!passwordVisible)}
            />
          }
          disabled={isLoading}
        />
        
        {error ? (
          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>
        ) : null}
        
        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.loginButton}
          loading={isLoading}
          disabled={isLoading}
        >
          Zaloguj
        </Button>

        <Button
          mode="text"
          onPress={() => {
            // In a real app, this would navigate to a password reset screen
            console.log('Forgot password pressed');
          }}
          disabled={isLoading}
        >
          Zapomniałeś hasła?
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  title: {
    marginBottom: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 6,
  },
});

export default ExaminerLoginScreen;