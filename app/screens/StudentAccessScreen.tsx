import React, { useState, useRef } from 'react';
import { StyleSheet, View, Keyboard, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, IconButton } from 'react-native-paper';
import { router } from 'expo-router';

const StudentAccessScreen = () => {
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    accessCode: '',
  });
  
  const accessCodeInputRef = useRef<any>(null);

  const validateFields = () => {
    const errors = {
      accessCode: '',
    };
    let isValid = true;

    if (!accessCode.trim()) {
      errors.accessCode = 'Kod dostępu jest wymagany';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    // Hide keyboard
    Keyboard.dismiss();
    
    // Reset general error state
    setError('');
    
    // Validate all fields
    if (!validateFields()) {
      return;
    }
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Simulate API call to validate access code
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to student profile screen with the access code
      router.push({
        pathname: '/routes/student-profile',
        params: { 
          accessCode: accessCode.trim(),
        }
      });
    } catch (err) {
      setError('Wystąpił błąd. Sprawdź wprowadzone dane i spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        
        <Text variant="headlineMedium" style={styles.title}>
          Dołącz do sesji
        </Text>
        
        <Text variant="bodyMedium" style={styles.subtitle}>
          Podaj kod dostępu otrzymany od nauczyciela
        </Text>
        
        <View style={styles.form}>
          <TextInput
            ref={accessCodeInputRef}
            label="Kod dostępu"
            value={accessCode}
            onChangeText={(text) => {
              setAccessCode(text);
              setFieldErrors(prev => ({...prev, accessCode: ''}));
            }}
            mode="outlined"
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.input}
            disabled={isLoading}
            error={!!fieldErrors.accessCode}
            onSubmitEditing={handleSubmit}
            blurOnSubmit={true}
          />
          {fieldErrors.accessCode ? (
            <HelperText type="error" visible={!!fieldErrors.accessCode}>
              {fieldErrors.accessCode}
            </HelperText>
          ) : null}
          
          {error ? (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          ) : null}
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={isLoading}
            disabled={isLoading}
          >
            Dołącz do sesji
          </Button>
        </View>
        
        <View style={styles.helpSection}>
          <Text variant="bodySmall" style={styles.helpText}>
            Potrzebujesz pomocy? Skontaktuj się z prowadzącym lub zespołem wsparcia.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 24,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 8,
    fontSize: 18,
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 6,
  },
  helpSection: {
    marginTop: 36,
    alignItems: 'center',
  },
  helpText: {
    textAlign: 'center',
    opacity: 0.7,
  }
});

export default StudentAccessScreen;