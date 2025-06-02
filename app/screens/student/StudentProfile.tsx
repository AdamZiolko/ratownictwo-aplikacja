import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  IconButton,
  Card,
  Avatar,
  Appbar,
  useTheme,
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Student,
  StudentStorageService,
} from '@/services/StudentStorageService';
import BackgroundGradient from '@/components/BackgroundGradient';
import { useOrientation } from '@/hooks/useOrientation';

const StudentProfileScreen = () => {
  const theme = useTheme();
  const { orientation } = useOrientation();
  const isLandscape = orientation === 'landscape';
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
      if (
        studentData &&
        studentData.firstName &&
        studentData.lastName &&
        studentData.albumNumber
      ) {
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
      <Card
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface },
          isLandscape && styles.landscapeCard,
        ]}
      >
        <Card.Title
          title="Wprowadź dane studenta"
          titleStyle={{ color: theme.colors.onSurface }}
          titleVariant={isLandscape ? 'titleSmall' : 'titleMedium'}
        />
        <Card.Content>
          <View style={styles.form}>
            <TextInput
              label="Imię"
              value={firstName}
              onChangeText={text => {
                setFirstName(text);
                setFieldErrors(prev => ({ ...prev, firstName: '' }));
              }}
              mode="outlined"
              autoCapitalize="words"
              style={[styles.input, isLandscape && styles.landscapeInput]}
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
              onChangeText={text => {
                setLastName(text);
                setFieldErrors(prev => ({ ...prev, lastName: '' }));
              }}
              mode="outlined"
              autoCapitalize="words"
              style={[styles.input, isLandscape && styles.landscapeInput]}
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
              onChangeText={text => {
                setAlbumNumber(text);
                setFieldErrors(prev => ({ ...prev, albumNumber: '' }));
              }}
              mode="outlined"
              keyboardType="number-pad"
              style={[styles.input, isLandscape && styles.landscapeInput]}
              disabled={isLoading}
              error={!!fieldErrors.albumNumber}
              onSubmitEditing={handleSubmit}
            />
            {fieldErrors.albumNumber ? (
              <HelperText type="error" visible={!!fieldErrors.albumNumber}>
                {fieldErrors.albumNumber}
              </HelperText>
            ) : null}
          </View>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={[
              styles.submitButton,
              isLandscape && styles.landscapeSubmitButton,
            ]}
            loading={isLoading}
            disabled={isLoading}
            buttonColor={theme.colors.primary}
          >
            Zapisz i kontynuuj
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  const renderStudentCard = () => {
    return (
      <Card
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface },
          isLandscape && styles.landscapeCard,
        ]}
      >
        <Card.Title
          title="Dane studenta"
          titleStyle={{ color: theme.colors.onSurface }}
          titleVariant={isLandscape ? 'titleSmall' : 'titleMedium'}
          right={props => (
            <IconButton
              {...props}
              icon="close"
              onPress={handleEditProfile}
              iconColor={theme.colors.onSurface}
              size={isLandscape ? 20 : 24}
            />
          )}
          leftStyle={styles.cardAvatarContainer}
          left={props => (
            <View
              style={[
                styles.iconBackground,
                { backgroundColor: theme.dark ? '#9A1515' : '#8B0000' },
                isLandscape && styles.landscapeIconBackground,
              ]}
            >
              <Avatar.Text
                {...props}
                size={isLandscape ? 32 : 40}
                label={`${firstName.charAt(0)}${lastName.charAt(0)}`}
                color={theme.colors.onPrimary}
                style={{ backgroundColor: 'transparent' }}
              />
            </View>
          )}
        />
        <Card.Content style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text
              variant="bodyMedium"
              style={[
                styles.infoLabel,
                { color: theme.colors.onSurfaceVariant },
                isLandscape && styles.landscapeInfoLabel,
              ]}
            >
              Imię:
            </Text>
            <Text
              variant="bodyLarge"
              style={[
                styles.infoValue,
                { color: theme.colors.onSurface },
                isLandscape && styles.landscapeInfoValue,
              ]}
            >
              {firstName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text
              variant="bodyMedium"
              style={[
                styles.infoLabel,
                { color: theme.colors.onSurfaceVariant },
                isLandscape && styles.landscapeInfoLabel,
              ]}
            >
              Nazwisko:
            </Text>
            <Text
              variant="bodyLarge"
              style={[
                styles.infoValue,
                { color: theme.colors.onSurface },
                isLandscape && styles.landscapeInfoValue,
              ]}
            >
              {lastName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text
              variant="bodyMedium"
              style={[
                styles.infoLabel,
                { color: theme.colors.onSurfaceVariant },
                isLandscape && styles.landscapeInfoLabel,
              ]}
            >
              Numer albumu:
            </Text>
            <Text
              variant="bodyLarge"
              style={[
                styles.infoValue,
                { color: theme.colors.onSurface },
                isLandscape && styles.landscapeInfoValue,
              ]}
            >
              {albumNumber}
            </Text>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            onPress={navigateToSession}
            style={[
              styles.continueButton,
              isLandscape && styles.landscapeContinueButton,
            ]}
            buttonColor={theme.colors.primary}
          >
            Kontynuuj
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  return (
    <BackgroundGradient>
      <Appbar.Header style={{ backgroundColor: '#8B0000' }}>
        <Appbar.BackAction onPress={() => router.back()} color="#fff" />
        <Appbar.Content
          title="Profil Studenta"
          titleStyle={{ color: '#fff', fontWeight: 'bold' }}
        />
      </Appbar.Header>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          isLandscape && styles.landscapeScrollContainer,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {isLandscape ? (
          <>
            <View style={styles.landscapeLeftColumn}>
              <Text
                variant="titleSmall"
                style={[
                  styles.subtitle,
                  {
                    color: theme.colors.onBackground,
                    backgroundColor: theme.colors.elevation.level1,
                  },
                  styles.landscapeSubtitle,
                ]}
              >
                {showForm ? 'Wprowadź swoje dane' : 'Czy to Ty?'}
              </Text>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={{ color: theme.colors.onBackground }}>
                  Ładowanie...
                </Text>
              </View>
            ) : (
              <View style={styles.landscapeMiddleColumn}>
                {hasExistingData && !showForm
                  ? renderStudentCard()
                  : renderStudentForm()}
              </View>
            )}

            <View style={styles.landscapeRightColumn}>
              <Text
                variant="bodySmall"
                style={[
                  styles.landscapeFooterText,
                  {
                    color: theme.colors.onBackground,
                    backgroundColor: theme.colors.elevation.level1,
                  },
                ]}
              >
                Pamiętaj aby poprawnie wprowadzić swoje dane, gdyż będą one
                <Text style={{ fontWeight: 'bold' }}>
                  widoczne dla nauczyciela.
                </Text>
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text
              variant="titleLarge"
              style={[
                styles.subtitle,
                {
                  color: theme.colors.onBackground,
                  backgroundColor: theme.colors.elevation.level1,
                },
              ]}
            >
              {showForm ? 'Wprowadź swoje dane' : 'Czy to Ty?'}
            </Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={{ color: theme.colors.onBackground }}>
                  Ładowanie...
                </Text>
              </View>
            ) : (
              <>
                {hasExistingData && !showForm
                  ? renderStudentCard()
                  : renderStudentForm()}
              </>
            )}
            <Text
              variant="titleMedium"
              style={[
                styles.subtitle,
                {
                  color: theme.colors.onBackground,
                  backgroundColor: theme.colors.elevation.level1,
                },
              ]}
            >
              Pamiętaj aby poprawnie wprowadzić swoje dane, gdyż będą one
              <Text style={{ fontWeight: 'bold' }}>
                widoczne dla nauczyciela.
              </Text>
            </Text>
          </>
        )}
      </ScrollView>
    </BackgroundGradient>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Platform.OS === 'web' ? 16 : 16,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  landscapeScrollContainer: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Platform.OS === 'web' ? 16 : 8,
    minHeight: '85%',
  },
  landscapeLeftColumn: {
    flex: 1,
    maxWidth: '30%',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 8,
    height: '100%',
  },
  landscapeMiddleColumn: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: '40%',
    height: '100%',
  },
  landscapeRightColumn: {
    flex: 1,
    maxWidth: '30%',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 8,
    height: '100%',
  },
  subtitle: {
    marginBottom: 20,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'auto',

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  landscapeSubtitle: {
    marginBottom: 0,
    fontSize: 16,
    lineHeight: 20,
    flex: 0,
    maxWidth: '90%',
    textAlignVertical: 'center',
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  landscapeInput: {
    marginBottom: 5,
    height: 45,
    fontSize: 14,
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 6,
  },
  landscapeSubmitButton: {
    marginTop: 10,
    paddingVertical: 4,
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
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  landscapeCard: {
    maxWidth: Platform.OS === 'web' ? 400 : 350,
    flex: Platform.OS === 'web' ? 0 : 2,
    marginBottom: 0,
    marginHorizontal: 10,
  },
  cardAvatarContainer: {
    marginRight: 16,
  },
  cardContent: {
    paddingVertical: 8,
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'center',
    minHeight: Platform.OS === 'web' ? 24 : 30,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: '100%',
  },
  infoLabel: {
    width: 120,
    fontSize: 14,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  landscapeInfoLabel: {
    width: 90,
    fontSize: 12,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  infoValue: {
    flex: 1,
    fontWeight: '500',
    fontSize: 16,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  landscapeInfoValue: {
    fontSize: 14,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  continueButton: {
    marginLeft: 'auto',
    marginTop: 8,
  },
  landscapeContinueButton: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeIconBackground: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  landscapeFooterText: {
    textAlign: 'center',
    textAlignVertical: 'center',
    opacity: 0.8,
    fontSize: 12,
    flex: 0,
    maxWidth: '90%',
    alignSelf: 'center',
    includeFontPadding: false,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
});

export default StudentProfileScreen;
