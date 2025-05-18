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
  IconButton,
  Appbar,
  useTheme,
  Card,
} from "react-native-paper";
import { router } from "expo-router";
import { sessionService } from "@/services/SessionService";
import { StudentStorageService } from "@/services/StudentStorageService";
import { LinearGradient } from "expo-linear-gradient";
import FloatingThemeToggle from "@/components/FloatingThemeToggle";
import BackgroundGradient from "@/components/BackgroundGradient";

const MemoizedTitle = React.memo(({ title }: { title: string }) => (
  <Text variant="headlineMedium" style={styles.title}>
    {title}
  </Text>
));

const MemoizedSubtitle = React.memo(({ subtitle }: { subtitle: string }) => (
  <Text variant="bodyMedium" style={styles.subtitle}>
    {subtitle}
  </Text>
));

const MemoizedHelpSection = React.memo(() => (
  <View style={styles.helpSection}>
    <Text variant="bodySmall" style={styles.helpText}>
      Potrzebujesz pomocy? Skontaktuj się z prowadzącym lub zespołem wsparcia.
    </Text>
  </View>
));

const StudentAccessScreen = () => {
  const theme = useTheme();
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
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          variant="titleMedium"
          style={[styles.subtitle, { color: theme.colors.onBackground }]}
        >
          Podaj kod dostępu otrzymany od nauczyciela
        </Text>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Title
            title="Wprowadź kod dostępu"
            titleStyle={{ color: theme.colors.onSurface }}
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
                style={[styles.input, { backgroundColor: "transparent" }]}
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
              style={styles.submitButton}
              loading={isLoading}
              disabled={isLoading}
              buttonColor={theme.colors.primary}
            >
              Dołącz do sesji
            </Button>
          </Card.Actions>
        </Card>
        <MemoizedHelpSection />{" "}
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
  },
  card: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 12,
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
  submitButton: {
    marginLeft: "auto",
    marginTop: 8,
    paddingVertical: 6,
  },
  helpSection: {
    marginTop: 36,
    alignItems: "center",
  },
  helpText: {
    textAlign: "center",
    opacity: 0.7,
  },
});

export default React.memo(StudentAccessScreen);
