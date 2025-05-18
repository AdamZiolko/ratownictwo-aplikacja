import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { StyleSheet, View, Keyboard, ScrollView, Platform } from "react-native";
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Appbar,
  useTheme,
  Card,
} from "react-native-paper";
import { router } from "expo-router";
import { sessionService } from "@/services/SessionService";
import { StudentStorageService } from "@/services/StudentStorageService";
import BackgroundGradient from "@/components/BackgroundGradient";
import { useOrientation } from "@/hooks/useOrientation";

const MemoizedHelpSection = React.memo(() => (
  <View style={styles.helpSection}>
    <Text variant="bodySmall" style={styles.helpText}>
      Potrzebujesz pomocy? Skontaktuj się z prowadzącym lub zespołem wsparcia.
    </Text>
  </View>
));

const StudentAccessScreen = () => {
  const theme = useTheme();
  const { orientation } = useOrientation();
  const isLandscape = orientation === 'landscape';
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    accessCode: "",
  });
  const [studentData, setStudentData] = useState<{
    firstName: string;
    lastName: string;
    albumNumber: string;
  } | null>(null);

  const accessCodeInputRef = useRef<any>(null);

  useEffect(() => {
    async function loadStudentProfile() {
      try {
        const studentProfile = await StudentStorageService.getStudent();
        if (studentProfile) {
          setStudentData(studentProfile);
        }
      } catch (error) {
        console.error("Failed to load student profile:", error);
      }
    }

    loadStudentProfile();
  }, []);

  const validateFields = useCallback(() => {
    const errors = {
      accessCode: "",
    };
    let isValid = true;

    if (!accessCode.trim()) {
      errors.accessCode = "Kod dostępu jest wymagany";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  }, [accessCode]);

  const handleSubmit = useCallback(async () => {
    Keyboard.dismiss();

    setError("");

    if (!validateFields()) {
      return;
    }

    setIsLoading(true);

    try {
      const isSessionValid = await sessionService.getSessionByCode(
        accessCode.trim()
      );

      if (!isSessionValid) {
        setError("Nieprawidłowy kod dostępu");
        setIsLoading(false);
        return;
      }
      if (studentData) {
        router.push({
          pathname: "/routes/student-session",
          params: {
            accessCode: accessCode.trim(),
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            albumNumber: studentData.albumNumber,
          },
        });
      } else {
        router.push({
          pathname: "/routes/student-profile",
          params: {
            accessCode: accessCode.trim(),
          },
        });
      }
    } catch (err) {
      setError("Wystąpił błąd. Sprawdź wprowadzone dane i spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  }, [accessCode, validateFields]);

  const handleTextChange = useCallback(
    (text: string) => {
      setAccessCode(text);
      if (fieldErrors.accessCode || error) {
        setFieldErrors((prev) => ({ ...prev, accessCode: "" }));
        setError("");
      }
    },
    [fieldErrors.accessCode, error]
  );

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  const errorMessage = useMemo(() => {
    if (fieldErrors.accessCode) {
      return (
        <HelperText type="error" visible={true}>
          {fieldErrors.accessCode}
        </HelperText>
      );
    } else if (error) {
      return (
        <HelperText type="error" visible={true}>
          {error}
        </HelperText>
      );
    }
    return null;
  }, [fieldErrors.accessCode, error]);

  return (
    <BackgroundGradient>
      <Appbar.Header style={{ backgroundColor: "#8B0000" }}>
        <Appbar.BackAction onPress={handleBackPress} color="#fff" />
        <Appbar.Content
          title="Dołącz do sesji"
          titleStyle={{ color: "#fff", fontWeight: "bold" }}
        />
      </Appbar.Header>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          isLandscape && styles.landscapeScrollContainer
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          variant={isLandscape ? "titleSmall" : "titleMedium"}
          style={[
            styles.subtitle, 
            { 
              color: theme.colors.onBackground,
              backgroundColor: theme.colors.elevation.level1
            },
            isLandscape && styles.landscapeSubtitle
          ]}
        >
          Podaj kod dostępu otrzymany od nauczyciela
        </Text>
        <Card 
          style={[
            styles.card, 
            { backgroundColor: theme.colors.surface },
            isLandscape && styles.landscapeCard
          ]}
        >
          <Card.Title
            title="Wprowadź kod dostępu"
            titleStyle={{ color: theme.colors.onSurface }}
            titleVariant={isLandscape ? "titleSmall" : "titleMedium"}
          />
          <Card.Content>
            <View style={styles.form}>
              <TextInput
                ref={accessCodeInputRef}
                label="Kod dostępu"
                value={accessCode}
                onChangeText={handleTextChange}
                mode="outlined"
                autoCapitalize="characters"
                autoCorrect={false}
                style={[
                  styles.input, 
                  { backgroundColor: "transparent" },
                  isLandscape && styles.landscapeInput
                ]}
                disabled={isLoading}
                error={!!fieldErrors.accessCode || !!error}
                onSubmitEditing={handleSubmit}
                keyboardType="default"
              />
              {errorMessage}
            </View>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={[styles.submitButton, isLandscape && styles.landscapeSubmitButton]}
              loading={isLoading}
              disabled={isLoading}
              buttonColor={theme.colors.primary}
            >
              Dołącz do sesji
            </Button>
          </Card.Actions>
        </Card>
        {!isLandscape && <MemoizedHelpSection />}
        {isLandscape && (
          <Text variant="bodySmall" style={[
            styles.landscapeHelpText, 
            { 
              color: theme.colors.onBackground,
              backgroundColor: theme.colors.elevation.level1 
            }
          ]}>
            Potrzebujesz pomocy? Skontaktuj się z prowadzącym.
          </Text>
        )}
      </ScrollView>
    </BackgroundGradient>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Platform.OS === "web" ? 16 : 16,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center", // Center vertically
    minHeight: '100%',
  },
  landscapeScrollContainer: {
    paddingVertical: 10,
    flexDirection: Platform.OS === "web" ? "column" : "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: Platform.OS === "web" ? 16 : 8,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  title: {
    marginBottom: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 40,
    textAlign: "center",
    textAlignVertical: "center",
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
    marginBottom: 15,
    marginTop: 5,
    fontSize: 16,
    lineHeight: 20,
    flex: Platform.OS === "web" ? 0 : 1,
    maxWidth: Platform.OS === "web" ? "100%" : "30%",
    alignSelf: "center",
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
  card: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 12,
  },
  landscapeCard: {
    maxWidth: Platform.OS === "web" ? 400 : 350,
    flex: Platform.OS === "web" ? 0 : 2,
    marginBottom: 10,
    marginHorizontal: 10,
  },
  form: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    ...Platform.select({
      web: {
        maxWidth: 600,
      },
    }),
  },
  input: {
    marginBottom: 8,
    fontSize: 18,
  },
  landscapeInput: {
    fontSize: 16,
    marginBottom: 5,
    height: 45,
  },
  submitButton: {
    marginLeft: "auto",
    marginTop: 8,
    paddingVertical: 6,
  },
  landscapeSubmitButton: {
    marginTop: 5,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  helpSection: {
    marginTop: 36,
    alignItems: "center",
  },
  helpText: {
    textAlign: "center",
    opacity: 0.7,
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
  landscapeHelpText: {
    textAlign: "center",
    opacity: 0.8,
    fontSize: 10,
    marginTop: 5,
    flex: Platform.OS === "web" ? 0 : 1,
    maxWidth: Platform.OS === "web" ? "100%" : "30%",
    alignSelf: "center",
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

export default React.memo(StudentAccessScreen);
