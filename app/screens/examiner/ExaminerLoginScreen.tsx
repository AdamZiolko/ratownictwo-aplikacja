import React, { useState } from "react";
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Surface,
  Snackbar,
  Appbar,
  useTheme,
  HelperText,
  Avatar,
} from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import BackgroundGradient from "@/components/BackgroundGradient";
import { useAuth } from "@/contexts/AuthContext";

const ExaminerLoginScreen = () => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const [activeTab, setActiveTab] = useState("login");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Registration state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordVisible, setRegPasswordVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const { login, register } = useAuth();

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setLoginError("");

    if (!email.trim() || !password.trim()) {
      setLoginError("Email i hasło są wymagane");
      return;
    }

    setLoginLoading(true);

    try {
      await login(email, password);
      router.push("/routes/examiner-dashboard");
    } catch (err: any) {
      setLoginError(
        err.message ||
          "Logowanie nie powiodło się. Sprawdź swoje dane i spróbuj ponownie."
      );
      setSnackbarMessage(err.message || "Logowanie nie powiodło się.");
      setSnackbarVisible(true);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegisterError("");

    if (!regUsername || !regEmail || !regPassword || !confirmPassword) {
      setRegisterError("Wszystkie pola są wymagane");
      return;
    }

    if (regPassword !== confirmPassword) {
      setRegisterError("Hasła nie są zgodne");
      return;
    }

    if (!isValidEmail(regEmail)) {
      setRegisterError("Wprowadź poprawny adres email");
      return;
    }

    if (regPassword.length < 6) {
      setRegisterError("Hasło musi zawierać co najmniej 6 znaków");
      return;
    }

    try {
      setRegisterLoading(true);
      await register(regUsername, regEmail, regPassword);
      setIsSuccess(true);
      setSnackbarMessage("Rejestracja pomyślna! Możesz się teraz zalogować.");
      setSnackbarVisible(true);

      setRegUsername("");
      setRegEmail("");
      setRegPassword("");
      setConfirmPassword("");
      setActiveTab("login");
    } catch (err: any) {
      setRegisterError(err.message || "Rejestracja nie powiodła się");
      setSnackbarMessage(err.message || "Rejestracja nie powiodła się");
      setSnackbarVisible(true);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <BackgroundGradient>
      <Appbar.Header style={{ backgroundColor: "#8B0000" }}>
        <Appbar.BackAction onPress={handleBackPress} color="#fff" />
        <Appbar.Content
          title={activeTab === "login" ? "Logowanie Nauczyciela" : "Rejestracja Nauczyciela"}
          titleStyle={{ color: "#fff", fontWeight: "bold" }}
        />
      </Appbar.Header>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.keyboardView, { backgroundColor: "transparent" }]}
      >
        <StatusBar style={theme.dark ? "light" : "dark"} />
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            isLargeScreen && styles.desktopScrollContainer,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {" "}
          <View
            style={[styles.container, isLargeScreen && styles.desktopContainer]}
          >
            <Surface
              style={[
                styles.formSurface,
                isLargeScreen && styles.desktopFormSurface,
                { backgroundColor: theme.colors.surface },
              ]}
              elevation={2}
            >
              {/* Logo and Brand Header */}
              <View style={styles.logoContainer}>
                <Avatar.Icon
                  size={isLargeScreen ? 80 : 60}
                  icon="medical-bag"
                  style={[
                    styles.logo,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                  color={theme.colors.primary}
                />
              </View>
              <SegmentedButtons
                value={activeTab}
                onValueChange={setActiveTab}
                buttons={[
                  {
                    value: "login",
                    label: "Logowanie",
                    style:
                      Platform.OS === "android" ? styles.androidButton : {},
                  },
                  {
                    value: "register",
                    label: "Rejestracja",
                    style:
                      Platform.OS === "android" ? styles.androidButton : {},
                  },
                ]}
                style={styles.segmentedButton}
              />
              {activeTab === "login" ? (
                <View style={styles.form}>
                  <Text variant="titleMedium" style={styles.formTitle}>
                    Zaloguj się do konta
                  </Text>
                  <TextInput
                    label="Email lub nazwa użytkownika"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                    disabled={loginLoading}
                    left={<TextInput.Icon icon="account" />}
                  />
                  <TextInput
                    label="Hasło"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry={!passwordVisible}
                    style={styles.input}
                    left={<TextInput.Icon icon="lock" />}
                    right={
                      <TextInput.Icon
                        icon={passwordVisible ? "eye-off" : "eye"}
                        onPress={() => setPasswordVisible(!passwordVisible)}
                      />
                    }
                    disabled={loginLoading}
                  />
                  {loginError ? (
                    <HelperText type="error" visible={!!loginError}>
                      {loginError}
                    </HelperText>
                  ) : null}{" "}
                  <Button
                    mode="contained"
                    onPress={handleLogin}
                    style={styles.actionButton}
                    loading={loginLoading}
                    disabled={loginLoading}
                  >
                    Zaloguj
                  </Button>
                </View>
              ) : (
                <View style={styles.form}>
                  <Text variant="titleMedium" style={styles.formTitle}>
                    Rejestracja nauczyciela
                  </Text>

                  <TextInput
                    label="Nazwa użytkownika"
                    value={regUsername}
                    onChangeText={setRegUsername}
                    mode="outlined"
                    style={styles.input}
                    autoCapitalize="none"
                    left={<TextInput.Icon icon="account" />}
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
                    left={<TextInput.Icon icon="email" />}
                    disabled={registerLoading}
                  />

                  <TextInput
                    label="Hasło"
                    value={regPassword}
                    onChangeText={setRegPassword}
                    mode="outlined"
                    style={styles.input}
                    secureTextEntry={!regPasswordVisible}
                    left={<TextInput.Icon icon="lock" />}
                    right={
                      <TextInput.Icon
                        icon={regPasswordVisible ? "eye-off" : "eye"}
                        onPress={() =>
                          setRegPasswordVisible(!regPasswordVisible)
                        }
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
                    left={<TextInput.Icon icon="lock-check" />}
                    right={
                      <TextInput.Icon
                        icon={confirmPasswordVisible ? "eye-off" : "eye"}
                        onPress={() =>
                          setConfirmPasswordVisible(!confirmPasswordVisible)
                        }
                      />
                    }
                    disabled={registerLoading}
                  />

                  {registerError ? (
                    <HelperText type="error" visible={!!registerError}>
                      {registerError}
                    </HelperText>
                  ) : null}

                  <View style={styles.termsContainer}>
                    <Text variant="bodySmall" style={styles.termsText}>
                      Klikając Zarejestruj się, akceptujesz nasze Warunki
                      korzystania z usługi i Politykę prywatności.
                    </Text>
                  </View>

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
              )}{" "}
            </Surface>
          </View>
        </ScrollView>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: "OK",
            onPress: () => setSnackbarVisible(false),
          }}
          style={[
            isSuccess ? styles.successSnackbar : undefined,
            Platform.OS === "android" && styles.androidSnackbar,
          ]}
          wrapperStyle={[
            styles.snackbarWrapper,
            isLargeScreen && styles.desktopSnackbarWrapper,
          ]}
        >
          {snackbarMessage}
        </Snackbar>
      </KeyboardAvoidingView>
    </BackgroundGradient>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 24,
    justifyContent: "center",
    minHeight: "100%",
  },
  desktopScrollContainer: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100%",
  },
  container: {
    flex: 1,
    paddingHorizontal: Platform.select({
      android: 16,
      default: 24,
    }),
    paddingTop: Platform.select({
      android: 16,
      default: 40,
    }),
  },
  desktopContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 0,
  },
  formSurface: {
    padding: 32,
    borderRadius: 8,
    width: "100%",
  },
  desktopFormSurface: {
    maxWidth: 480,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    marginBottom: 16,
  },
  brandText: {
    fontWeight: "500",
  },
  segmentedButton: {
    marginBottom: Platform.select({
      android: 20,
      default: 28,
    }),
  },
  androidButton: {
    flex: 1,
    minHeight: 48,
  },
  form: {
    width: "100%",
    alignSelf: "center",
  },
  formTitle: {
    marginBottom: 24,
    fontWeight: "500",
    textAlign: "center",
  },
  input: {
    marginBottom: Platform.select({
      android: 16,
      default: 20,
    }),
  },
  actionButton: {
    marginBottom: Platform.select({
      android: 16,
      default: 24,
    }),
    paddingVertical: 6,
    borderRadius: 4,
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    textAlign: "center",
    opacity: 0.7,
  },
  mobileButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  mobileLoginButton: {
    flex: 2,
  },
  mobileForgotButton: {
    flex: 1,
    alignSelf: "center",
  },
  successSnackbar: {
    backgroundColor: "#4CAF50",
  },
  androidSnackbar: {
    marginBottom: 70,
  },
  snackbarWrapper: {
    bottom: Platform.select({
      android: 70,
      default: 0,
    }),
  },
  desktopSnackbarWrapper: {
    width: "50%",
    alignSelf: "center",
  },
});

export default ExaminerLoginScreen;
