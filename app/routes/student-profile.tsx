import React, { useState, useRef } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, IconButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const StudentProfileScreen = () => {
  const params = useLocalSearchParams();
  const accessCode = params.accessCode as string;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [albumNumber, setAlbumNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    firstName: '',
    lastName: '',
    albumNumber: '',
  });

  const lastNameInputRef = useRef<any>(null);
  const albumNumberInputRef = useRef<any>(null);

  const validateFields = () => {
    const errors = {
      firstName: '',
      lastName: '',
      albumNumber: '',
    };
    let isValid = true;

    if (!firstName.trim()) {
      errors.firstName = 'Imię jest wymagane';
      isValid = false;
    }

    if (!lastName.trim()) {
      errors.lastName = 'Nazwisko jest wymagane';
      isValid = false;
    }

    if (!albumNumber.trim()) {
      errors.albumNumber = 'Numer albumu jest wymagany';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push({
        pathname: '/routes/student-access',
        params: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          albumNumber: albumNumber.trim(),
          accessCode: accessCode,
        },
      });
    } catch (error) {
      console.error('Error saving student profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
          style={styles.backButton}
        />

        <Text variant="headlineMedium" style={styles.title}>
          Profil Studenta
        </Text>

        <Text variant="bodyMedium" style={styles.subtitle}>
          Wprowadź swoje dane
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Imię"
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              setFieldErrors(prev => ({ ...prev, firstName: '' }));
            }}
            mode="outlined"
            autoCapitalize="words"
            style={styles.input}
            disabled={isLoading}
            error={!!fieldErrors.firstName}
            onSubmitEditing={() => lastNameInputRef.current?.focus()}
            blurOnSubmit={false}
          />
          {fieldErrors.firstName ? (
            <HelperText type="error" visible={!!fieldErrors.firstName}>
              {fieldErrors.firstName}
            </HelperText>
          ) : null}

          <TextInput
            ref={lastNameInputRef}
            label="Nazwisko"
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              setFieldErrors(prev => ({ ...prev, lastName: '' }));
            }}
            mode="outlined"
            autoCapitalize="words"
            style={styles.input}
            disabled={isLoading}
            error={!!fieldErrors.lastName}
            onSubmitEditing={() => albumNumberInputRef.current?.focus()}
            blurOnSubmit={false}
          />
          {fieldErrors.lastName ? (
            <HelperText type="error" visible={!!fieldErrors.lastName}>
              {fieldErrors.lastName}
            </HelperText>
          ) : null}

          <TextInput
            ref={albumNumberInputRef}
            label="Numer albumu"
            value={albumNumber}
            onChangeText={(text) => {
              setAlbumNumber(text);
              setFieldErrors(prev => ({ ...prev, albumNumber: '' }));
            }}
            mode="outlined"
            keyboardType="number-pad"
            style={styles.input}
            disabled={isLoading}
            error={!!fieldErrors.albumNumber}
            onSubmitEditing={handleSubmit}
          />
          {fieldErrors.albumNumber ? (
            <HelperText type="error" visible={!!fieldErrors.albumNumber}>
              {fieldErrors.albumNumber}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={isLoading}
            disabled={isLoading}
          >
            Zapisz i kontynuuj
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
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
});

export default StudentProfileScreen;