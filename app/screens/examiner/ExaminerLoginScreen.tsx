import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Text, TextInput, HelperText, IconButton, useTheme, Snackbar, Title, SegmentedButtons } from 'react-native-paper';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const ExaminerLoginScreen = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('login');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordVisible, setRegPasswordVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const { login, register } = useAuth();

  
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    
    setLoginError('');
    
    
    if (!email.trim() || !password.trim()) {
      setLoginError('Email i hasło są wymagane');
      return;
    }
    
    
    setLoginLoading(true);
    
    try {
      
      await login(email, password);
      
      
      router.push('/routes/examiner-dashboard');
    } catch (err: any) {
      setLoginError(err.message || 'Logowanie nie powiodło się. Sprawdź swoje dane i spróbuj ponownie.');
      setSnackbarMessage(err.message || 'Logowanie nie powiodło się.');
      setSnackbarVisible(true);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    
    setRegisterError('');
    
    
    if (!regUsername || !regEmail || !regPassword || !confirmPassword) {
      setRegisterError('Wszystkie pola są wymagane');
      return;
    }
    
    if (regPassword !== confirmPassword) {
      setRegisterError('Hasła nie są zgodne');
      return;
    }

    if (!isValidEmail(regEmail)) {
      setRegisterError('Wprowadź poprawny adres email');
      return;
    }
    
    if (regPassword.length < 6) {
      setRegisterError('Hasło musi zawierać co najmniej 6 znaków');
      return;
    }

    try {
      setRegisterLoading(true);
      await register(regUsername, regEmail, regPassword);
      setIsSuccess(true);
      setSnackbarMessage('Rejestracja pomyślna! Możesz się teraz zalogować.');
      setSnackbarVisible(true);
      
      
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      setConfirmPassword('');
      setActiveTab('login');
    } catch (err: any) {
      setRegisterError(err.message || 'Rejestracja nie powiodła się');
      setSnackbarMessage(err.message || 'Rejestracja nie powiodła się');
      setSnackbarVisible(true);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
            style={styles.backButton}
          />
          
          <Text variant="headlineMedium" style={styles.title}>
            Panel Egzaminatora
          </Text>
          
          <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            buttons={[
              { value: 'login', label: 'Logowanie' },
              { value: 'register', label: 'Rejestracja' }
            ]}
            style={styles.segmentedButton}
          />
          
          {activeTab === 'login' ? (
            <View style={styles.form}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                disabled={loginLoading}
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
                disabled={loginLoading}
              />
              
              {loginError ? (
                <HelperText type="error" visible={!!loginError}>
                  {loginError}
                </HelperText>
              ) : null}
              
              <Button
                mode="contained"
                onPress={handleLogin}
                style={styles.actionButton}
                loading={loginLoading}
                disabled={loginLoading}
              >
                Zaloguj
              </Button>

              <Button
                mode="text"
                onPress={() => {
                  
                  console.log('Forgot password pressed');
                  setSnackbarMessage('Funkcja resetowania hasła będzie dostępna wkrótce.');
                  setSnackbarVisible(true);
                }}
                disabled={loginLoading}
              >
                Zapomniałeś hasła?
              </Button>
            </View>
          ) : (
            <View style={styles.form}>
              <TextInput
                label="Nazwa użytkownika"
                value={regUsername}
                onChangeText={setRegUsername}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                disabled={registerLoading}
              />

              <TextInput
                label="Email"
                value={regEmail}
                onChangeText={setRegEmail}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                disabled={registerLoading}
              />

              <TextInput
                label="Hasło"
                value={regPassword}
                onChangeText={setRegPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry={!regPasswordVisible}
                right={
                  <TextInput.Icon
                    icon={regPasswordVisible ? 'eye-off' : 'eye'}
                    onPress={() => setRegPasswordVisible(!regPasswordVisible)}
                  />
                }
                disabled={registerLoading}
              />

              <TextInput
                label="Potwierdź hasło"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                style={styles.input}
                secureTextEntry={!confirmPasswordVisible}
                right={
                  <TextInput.Icon
                    icon={confirmPasswordVisible ? 'eye-off' : 'eye'}
                    onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  />
                }
                disabled={registerLoading}
              />

              {registerError ? (
                <HelperText type="error" visible={!!registerError}>
                  {registerError}
                </HelperText>
              ) : null}

              <Button
                mode="contained"
                onPress={handleRegister}
                style={styles.actionButton}
                loading={registerLoading}
                disabled={registerLoading}
              >
                Zarejestruj się
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
        style={isSuccess ? styles.successSnackbar : undefined}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
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
    marginBottom: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  segmentedButton: {
    marginBottom: 24,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 16,
  },
  actionButton: {
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 6,
  },
  successSnackbar: {
    backgroundColor: '#4CAF50',
  },
});

export default ExaminerLoginScreen;