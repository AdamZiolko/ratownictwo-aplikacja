import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, ScrollView, Platform } from "react-native";
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
} from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Student,
  StudentStorageService,
} from "@/services/StudentStorageService";
import { LinearGradient } from "expo-linear-gradient";
import FloatingThemeToggle from "@/components/FloatingThemeToggle";
import BackgroundGradient from "@/components/BackgroundGradient";

const StudentProfileScreen = () => {
  const theme = useTheme();
  const params = useLocalSearchParams();
  const accessCode = params.accessCode as string;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [albumNumber, setAlbumNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    firstName: "",
    lastName: "",
    albumNumber: "",
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
        setFirstName(studentData.firstName || "");
        setLastName(studentData.lastName || "");
        setAlbumNumber(studentData.albumNumber || "");
        setHasExistingData(true);
        setShowForm(false);
      } else {
        setHasExistingData(false);
        setShowForm(true);
      }
    } catch (error) {
      console.error("Failed to load student data:", error);
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
      firstName: "",
      lastName: "",
      albumNumber: "",
    };
    let isValid = true;

    if (!firstName.trim()) {
      errors.firstName = "Imię jest wymagane";
      isValid = false;
    }

    if (!lastName.trim()) {
      errors.lastName = "Nazwisko jest wymagane";
      isValid = false;
    }

    if (!albumNumber.trim()) {
      errors.albumNumber = "Numer albumu jest wymagany";
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
      console.error("Error saving student profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSession = () => {
    router.push({
      pathname: "/routes/student-access",
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
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title="Wprowadź dane studenta"
          titleStyle={{ color: theme.colors.onSurface }}
        />
        <Card.Content>
          <View style={styles.form}>
            <TextInput
              label="Imię"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                setFieldErrors((prev) => ({ ...prev, firstName: "" }));
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
                setFieldErrors((prev) => ({ ...prev, lastName: "" }));
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
                setFieldErrors((prev) => ({ ...prev, albumNumber: "" }));
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
            Zapisz i kontynuuj
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  const renderStudentCard = () => {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Title
          title="Dane studenta"
          titleStyle={{ color: theme.colors.onSurface }}
          right={(props) => (
            <IconButton
              {...props}
              icon="close"
              onPress={handleEditProfile}
              iconColor={theme.colors.onSurface}
            />
          )}
          leftStyle={styles.cardAvatarContainer}
          left={(props) => (
            <LinearGradient
              colors={
                theme.dark ? ["#4A0000", "#9A1515"] : ["#8B0000", "#D32F2F"]
              }
              style={styles.iconGradient}
            >
              <Avatar.Text
                {...props}
                size={40}
                label={`${firstName.charAt(0)}${lastName.charAt(0)}`}
                color={theme.colors.onPrimary}
                style={{ backgroundColor: "transparent" }}
              />
            </LinearGradient>
          )}
        />
        <Card.Content style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Text
              variant="bodyMedium"
              style={[
                styles.infoLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Imię:
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.infoValue, { color: theme.colors.onSurface }]}
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
              ]}
            >
              Nazwisko:
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.infoValue, { color: theme.colors.onSurface }]}
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
              ]}
            >
              Numer albumu:
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.infoValue, { color: theme.colors.onSurface }]}
            >
              {albumNumber}
            </Text>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            onPress={navigateToSession}
            style={styles.continueButton}
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
      <Appbar.Header style={{ backgroundColor: "#8B0000" }}>
        <Appbar.BackAction onPress={() => router.back()} color="#fff" />
        <Appbar.Content
          title="Profil Studenta"
          titleStyle={{ color: "#fff", fontWeight: "bold" }}
        />
      </Appbar.Header>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          variant="titleLarge"
          style={[styles.subtitle, { color: theme.colors.onBackground }]}
        >
          {showForm ? "Wprowadź swoje dane" : "Czy to Ty?"}
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
          style={[styles.subtitle, { color: theme.colors.onBackground }]}
        >
          Pamiętaj aby poprawnie wprowadzić swoje dane, gdyż będą one
          <Text style={{ fontWeight: "bold" }}> widoczne dla nauczyciela.</Text>
        </Text>
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
    justifyContent: "center",
    minHeight: "100%",
  },
  subtitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  form: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  input: {
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  cardAvatarContainer: {
    marginRight: 16,
  },
  cardContent: {
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    marginVertical: 8,
    alignItems: "center",
  },
  infoLabel: {
    width: 120,
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    fontWeight: "500",
    fontSize: 16,
  },
  continueButton: {
    marginLeft: "auto",
    marginTop: 8,
  },

  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default StudentProfileScreen;
