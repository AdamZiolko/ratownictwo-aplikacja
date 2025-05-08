import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Text, TextInput, HelperText, IconButton, useTheme, Snackbar, SegmentedButtons } from 'react-native-paper';
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
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {}
          {Platform.OS === 'android' ? (
            <View style={styles.androidHeader}>
              <IconButton
                icon="arrow-left"
                size={24}
                onPress={() => router.back()}
                style={styles.androidBackButton}
              />
              <Text variant="headlineMedium" style={styles.androidTitle}>
                Panel Egzaminatora
              </Text>
            </View>
          ) : (
            <>
              <IconButton
                icon="arrow-left"
                size={28}
                onPress={() => router.back()}
                style={styles.backButton}
              />
              <Text variant="headlineLarge" style={styles.title}>
                Panel Egzaminatora
              </Text>
            </>
          )}
          
          <SegmentedButtons
            value={activeTab}
            onValueChange={setActiveTab}
            buttons={[
              { 
                value: 'login', 
                label: 'Logowanie',
                style: Platform.OS === 'android' ? styles.androidButton : {} 
              },
              { 
                value: 'register', 
                label: 'Rejestracja',
                style: Platform.OS === 'android' ? styles.androidButton : {} 
              }
            ]}
            style={styles.segmentedButton}
          />
          
          {activeTab === 'login' ? (
            <View style={styles.form}>
              <TextInput
                label="Nazwa użytkownika"
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

              {Platform.OS === 'android' ? (
                <View style={styles.mobileButtonRow}>
                  <Button
                    mode="contained"
                    onPress={handleLogin}
                    style={[styles.actionButton, styles.mobileLoginButton]}
                    loading={loginLoading}
                    disabled={loginLoading}
                  >
                    Zaloguj
                  </Button>
                  <Button
                    mode="text"
                    onPress={() => {
                      setSnackbarMessage('Funkcja resetowania hasła będzie dostępna wkrótce.');
                      setSnackbarVisible(true);
                    }}
                    style={styles.mobileForgotButton}
                    disabled={loginLoading}
                  >
                    Zapomniałeś hasła?
                  </Button>
                </View>
              ) : (
                <>
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
                      setSnackbarMessage('Funkcja resetowania hasła będzie dostępna wkrótce.');
                      setSnackbarVisible(true);
                    }}
                    disabled={loginLoading}
                  >
                    Zapomniałeś hasła?
                  </Button>
                </>
              )}
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
        style={[
          isSuccess ? styles.successSnackbar : undefined,
          Platform.OS === 'android' && styles.androidSnackbar
        ]}
        wrapperStyle={styles.snackbarWrapper}
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
    paddingBottom: Platform.select({
      android: 16,
      default: 0
    }),
  },
  container: {
    flex: 1,
    paddingHorizontal: Platform.select({
      android: 16,
      default: 24
    }),
    paddingTop: Platform.select({
      android: 8,
      default: 40
    }),
  },
  androidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  androidBackButton: {
    marginRight: 16,
  },
  androidTitle: {
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,
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
    marginBottom: Platform.select({
      android: 16,
      default: 24
    }),
  },
  androidButton: {
    flex: 1,
    minHeight: 48,
  },
  form: {
    width: '100%',
    maxWidth: Platform.select({
      android: '100%',
      web: "100%"
    }),
    alignSelf: 'center',
  },
  input: {
    marginBottom: Platform.select({
      android: 12,
      default: 16
    }),
  },
  actionButton: {
    marginTop: Platform.select({
      android: 12,
      default: 24
    }),
    marginBottom: Platform.select({
      android: 0,
      default: 16
    }),
    paddingVertical: 6,
  },
  mobileButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  mobileLoginButton: {
    flex: 2,
  },
  mobileForgotButton: {
    flex: 1,
    alignSelf: 'center',
  },
  successSnackbar: {
    backgroundColor: '#4CAF50',
  },
  androidSnackbar: {
    marginBottom: 70,
  },
  snackbarWrapper: {
    bottom: Platform.select({
      android: 70,
      default: 0
    }),
  },
});

export default ExaminerLoginScreen;