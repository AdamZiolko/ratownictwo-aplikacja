import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import { Text, TextInput, Button, HelperText, IconButton, Card, Avatar } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Student, StudentStorageService } from '@/services/StudentStorageService';

const StudentProfileScreen = () => {
  const params = useLocalSearchParams();
  const accessCode = params.accessCode as string;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [albumNumber, setAlbumNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    firstName: '',
    lastName: '',
    albumNumber: '',
  });

  const lastNameInputRef = useRef<any>(null);
  const albumNumberInputRef = useRef<any>(null);

  
  const loadStudentData = async () => {
    try {
      setIsLoading(true);
      const studentData = await StudentStorageService.getStudent();
      if (studentData && studentData.firstName && studentData.lastName && studentData.albumNumber) {
        setFirstName(studentData.firstName || '');
        setLastName(studentData.lastName || '');
        setAlbumNumber(studentData.albumNumber || '');
        setHasExistingData(true);
        setShowForm(false);
      } else {
        setHasExistingData(false);
        setShowForm(true);
      }
    } catch (error) {
      console.error('Failed to load student data:', error);
      setHasExistingData(false);
      setShowForm(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

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
      
      const student: Student = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        albumNumber: albumNumber.trim(),
      };
      
      
      await StudentStorageService.saveStudent(student);
      
      
      setHasExistingData(true);
      setShowForm(false);
      
      
      if (!showForm) {
        navigateToSession();
      }
    } catch (error) {
      console.error('Error saving student profile:', error);
      
    } finally {
      setIsLoading(false);
    }
  };
  
  const navigateToSession = () => {
    router.push({
      pathname: '/routes/student-access',
      params: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        albumNumber: albumNumber.trim(),
        accessCode: accessCode,
      },
    });
  };

  const handleEditProfile = () => {
    setShowForm(true);
  };

  const renderStudentForm = () => {
    return (
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
    );
  };

  const renderStudentCard = () => {
    return (
      <Card style={styles.card}>
        <Card.Title
          title="Dane studenta"
          right={props => <IconButton {...props} icon="close" onPress={handleEditProfile} />}
          leftStyle={styles.cardAvatarContainer}
          left={props => (
            <Avatar.Text 
              {...props} 
              size={40} 
              label={`${firstName.charAt(0)}${lastName.charAt(0)}`} 
            />
          )}
        />
        <Card.Content style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>Imię:</Text>
            <Text variant="bodyLarge" style={styles.infoValue}>{firstName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>Nazwisko:</Text>
            <Text variant="bodyLarge" style={styles.infoValue}>{lastName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.infoLabel}>Numer albumu:</Text>
            <Text variant="bodyLarge" style={styles.infoValue}>{albumNumber}</Text>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" onPress={navigateToSession} style={styles.continueButton}>
            Kontynuuj
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <IconButton
            icon="arrow-left"
            size={Platform.select({ android: 20, ios: 20, default: 24 })}
            onPress={() => router.back()}
            style={styles.backButton}
          />
          <Text variant="titleLarge" style={styles.title}>
            Profil Studenta
          </Text>
        </View>

        <Text variant="bodyMedium" style={styles.subtitle}>
          {showForm ? 'Wprowadź swoje dane' : 'Czy to Ty?'}
        </Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Ładowanie...</Text>
          </View>
        ) : (
          <>
            {(hasExistingData && !showForm) ? renderStudentCard() : renderStudentForm()}
          </>
        )}
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
    padding: Platform.select({
      android: 8,
      ios: 12,
      default: 16
    }),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Platform.select({
      android: 8,
      ios: 8,
      default: 16
    }),
  },
  backButton: {
    marginRight: Platform.select({
      android: 8,
      ios: 8,
      default: 12
    }),
    marginLeft: Platform.select({
      android: -4,
      ios: -4,
      default: 0
    }),
  },
  title: {
    fontSize: Platform.select({
      android: 18,
      ios: 18,
      default: 24
    }),
    fontWeight: '600',
    flex: 1,
    marginLeft: Platform.select({
      android: 4,
      ios: 4,
      default: 8
    }),
  },
  subtitle: {
    marginBottom: Platform.select({
      android: 16,
      ios: 16,
      default: 32
    }),
    textAlign: 'center',
    paddingHorizontal: Platform.select({
      android: 8,
      ios: 8,
      default: 16
    }),
    fontSize: Platform.select({
      android: 14,
      ios: 14,
      default: 16
    }),
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: Platform.select({
      android: 4,
      ios: 4,
      default: 8
    }),
    fontSize: Platform.select({
      android: 14,
      ios: 14,
      default: 16
    }),
    height: Platform.select({
      android: 48,
      ios: 48,
      default: 56
    }),
  },
  submitButton: {
    marginTop: Platform.select({
      android: 16,
      ios: 16,
      default: 24
    }),
    paddingVertical: Platform.select({
      android: 4,
      ios: 4,
      default: 6
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginBottom: Platform.select({
      android: 12,
      ios: 12,
      default: 20
    }),
  },
  cardAvatarContainer: {
    marginRight: Platform.select({
      android: 12,
      ios: 12,
      default: 16
    }),
  },
  cardContent: {
    paddingVertical: Platform.select({
      android: 4,
      ios: 4,
      default: 8
    }),
  },
  infoRow: {
    flexDirection: 'row',
    marginVertical: Platform.select({
      android: 4,
      ios: 4,
      default: 8
    }),
    alignItems: 'center',
  },
  infoLabel: {
    width: Platform.select({
      android: 90,
      ios: 90,
      default: 120
    }),
    fontSize: Platform.select({
      android: 13,
      ios: 13,
      default: 14
    }),
  },
  infoValue: {
    flex: 1,
    fontWeight: '500',
    fontSize: Platform.select({
      android: 14,
      ios: 14,
      default: 16
    }),
  },
  continueButton: {
    marginLeft: 'auto',
    marginTop: Platform.select({
      android: 4,
      ios: 4,
      default: 8
    }),
  },
});

export default StudentProfileScreen;