import React, { useState } from "react";
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { useOrientation } from "@/hooks/useOrientation";
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
  Card,
  TouchableRipple,
} from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import BackgroundGradient from "@/components/BackgroundGradient";
import { useAuth } from "@/contexts/AuthContext";

const ExaminerLoginScreen = () => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { orientation } = useOrientation();
  const isLargeScreen = width > 768;
  const isLandscape = orientation === "landscape";
  const [activeTab, setActiveTab] = useState("login");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  
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
// … w ExaminerLoginScreen:

const handleLogin = async () => {
  setLoginError("");
  if (!email.trim() || !password.trim()) {
    setLoginError("Email i hasło są wymagane");
    return;
  }

  setLoginLoading(true);

  try {
    // login zwraca tablicę ról, np. ["ROLE_USER"], ["ROLE_MODERATOR"], ["ROLE_ADMIN"], itd.
    const roles: string[] = await login(email, password);

    if (roles.includes("ROLE_ADMIN")) {
      // jeśli admin, idziemy na stronę admina
      router.replace("/routes/app/routes/admin");
    } else if (roles.includes("ROLE_MODERATOR")) {
      // jeśli moderator, idziemy na dashboard egzaminatora
      router.replace("/routes/examiner-dashboard");
    } else {
      // zwykły user (ROLE_USER) – wyświetlamy komunikat o oczekiwaniu na uprawnienia
      setLoginError("Twoje konto oczekuje na nadanie uprawnień. Skontaktuj się z administratorem.   :(");
      setSnackbarMessage("Konto wymaga nadania uprawnień przez administratora");
      setSnackbarVisible(true);
    }
  } catch (err: any) {
    console.log("Login error caught:", err);
    console.log("Error message:", err.message);

    let errorMessage = "Logowanie nie powiodło się. Sprawdź swoje dane i spróbuj ponownie.";

    if (err.message && typeof err.message === "string") {
      try {
        const errorData = JSON.parse(err.message);
        if (errorData.success === false) {
          if (Array.isArray(errorData.errors)) {
            const validationErrors = errorData.errors.map((e: any) => e.message).join(", ");
            errorMessage = validationErrors;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        errorMessage = err.message;
      }
    }

    if (
      errorMessage.includes("Invalid credentials") ||
      errorMessage.includes("nieprawidłowe dane")
    ) {
      errorMessage = "Nieprawidłowy email lub hasło";
    } else if (
      errorMessage.includes("User not found") ||
      errorMessage.includes("użytkownik nie znaleziony")
    ) {
      errorMessage = "Nie znaleziono użytkownika o podanym adresie email";
    } else if (
      errorMessage.includes("Account locked") ||
      errorMessage.includes("konto zablokowane")
    ) {
      errorMessage = "Konto zostało tymczasowo zablokowane";
    } else if (errorMessage.includes("Network") || errorMessage.includes("sieć")) {
      errorMessage = "Błąd połączenia z serwerem. Sprawdź połączenie internetowe";
    }

    setLoginError(errorMessage);
    setSnackbarMessage(errorMessage);
    setSnackbarVisible(true);
  } finally {
    setLoginLoading(false);
  }
};


const isValidPassword = (password: string) => {
    if (password.length < 8) {
      return { valid: false, message: "Hasło musi mieć co najmniej 8 znaków" };
    }
    
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    
    if (!hasLowerCase || !hasUpperCase || !hasNumbers || !hasSpecialChar) {
      return { 
        valid: false, 
        message: "Hasło musi zawierać: małą literę, wielką literę, cyfrę i znak specjalny (@$!%*?&)" 
      };
    }
    
    return { valid: true, message: "" };
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

    const passwordValidation = isValidPassword(regPassword);
    if (!passwordValidation.valid) {
      setRegisterError(passwordValidation.message);
      return;
    }    try {
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
      console.log('Register error caught:', err);
      console.log('Error message:', err.message);
      
      let errorMessage = "Rejestracja nie powiodła się";
      
      // Try to parse error response from backend
      if (err.message && typeof err.message === 'string') {
        try {
          const errorData = JSON.parse(err.message);
          console.log('Parsed register error data:', errorData);
          
          if (errorData.success === false) {
            // Handle validation errors
            if (errorData.errors && Array.isArray(errorData.errors)) {
              const validationErrors = errorData.errors.map((error: any) => error.message).join(', ');
              errorMessage = validationErrors;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            }
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // If parsing fails, use the original message
          console.log('Failed to parse register error message:', parseError);
          errorMessage = err.message;
        }
      }
      
      // Handle common registration errors with better Polish translations
      if (errorMessage.includes('User already exists') || errorMessage.includes('użytkownik już istnieje')) {
        errorMessage = "Użytkownik o podanym adresie email już istnieje";
      } else if (errorMessage.includes('Username already taken') || errorMessage.includes('nazwa użytkownika zajęta')) {
        errorMessage = "Nazwa użytkownika jest już zajęta";
      } else if (errorMessage.includes('Invalid email') || errorMessage.includes('nieprawidłowy email')) {
        errorMessage = "Podany adres email jest nieprawidłowy";
      } else if (errorMessage.includes('Password too weak') || errorMessage.includes('hasło zbyt słabe')) {
        errorMessage = "Hasło jest zbyt słabe. Użyj silniejszego hasła";
      } else if (errorMessage.includes('Network') || errorMessage.includes('sieć')) {
        errorMessage = "Błąd połączenia z serwerem. Sprawdź połączenie internetowe";
      }
      
      console.log('Final register error message:', errorMessage);
      
      setRegisterError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarVisible(true);
      setIsSuccess(false);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const renderLoginForm = () => (
    <View style={styles.form}>
      <Text
        variant={isLandscape ? "bodyLarge" : "titleMedium"}
        style={[styles.formTitle, isLandscape && styles.landscapeFormTitle]}
      >
        Zaloguj się do konta
      </Text>
      <View style={isLandscape ? styles.landscapeInputsRow : undefined}>
        <View
          style={isLandscape ? styles.landscapeInputHalf : { width: "100%" }}
        >
          <Card style={styles.inputCard}>
            <TouchableRipple onPress={() => {}} style={styles.inputCardContent}>
              <View style={styles.inputRow}>
                <Avatar.Icon
                  size={isLandscape ? 24 : 28}
                  icon="account"
                  style={styles.inputIcon}
                  color={theme.colors.primary}
                />
                <TextInput
                  label="Email lub nazwa użytkownika"
                  value={email}
                  onChangeText={setEmail}
                  mode="flat"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.flatInput}
                  disabled={loginLoading}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  contentStyle={[
                    styles.inputContentStyle,
                    isLandscape && styles.landscapeInputContent,
                  ]}
                />
              </View>
            </TouchableRipple>
          </Card>
        </View>

        <View
          style={isLandscape ? styles.landscapeInputHalf : { width: "100%" }}
        >
          <Card style={styles.inputCard}>
            <TouchableRipple onPress={() => {}} style={styles.inputCardContent}>
              <View style={styles.inputRow}>
                <Avatar.Icon
                  size={isLandscape ? 24 : 28}
                  icon="lock"
                  style={styles.inputIcon}
                  color={theme.colors.primary}
                />
                <TextInput
                  label="Hasło"
                  value={password}
                  onChangeText={setPassword}
                  mode="flat"
                  secureTextEntry={!passwordVisible}
                  style={styles.flatInput}
                  disabled={loginLoading}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  contentStyle={[
                    styles.inputContentStyle,
                    isLandscape && styles.landscapeInputContent,
                  ]}
                  right={
                    <TextInput.Icon
                      icon={passwordVisible ? "eye-off" : "eye"}
                      onPress={() => setPasswordVisible(!passwordVisible)}
                      forceTextInputFocus={false}
                    />
                  }
                />
              </View>
            </TouchableRipple>
          </Card>
        </View>
      </View>

      {loginError ? (
        <HelperText
          type="error"
          visible={!!loginError}
          style={styles.errorText}
        >
          {loginError}
        </HelperText>
      ) : null}
      <Button
        mode="contained"
        onPress={handleLogin}
        style={[
          styles.actionButton,
          isLandscape && styles.landscapeActionButton,
        ]}
        loading={loginLoading}
        disabled={loginLoading}
        contentStyle={[
          styles.buttonContent,
          isLandscape && styles.landscapeButtonContent,
        ]}
        labelStyle={
          isLandscape
            ? { fontSize: 14, fontWeight: "bold" }
            : { fontSize: 16, fontWeight: "bold" }
        }
      >
        Zaloguj
      </Button>
    </View>
  );

  const renderRegisterForm = () => (
    <View style={styles.form}>
      <Text
        variant={isLandscape ? "bodyLarge" : "titleMedium"}
        style={[styles.formTitle, isLandscape && styles.landscapeFormTitle]}
      >
        Rejestracja nauczyciela
      </Text>

      <View style={isLandscape ? styles.landscapeInputsRow : undefined}>
        <View
          style={isLandscape ? styles.landscapeInputHalf : { width: "100%" }}
        >
          <Card style={styles.inputCard}>
            <TouchableRipple onPress={() => {}} style={styles.inputCardContent}>
              <View style={styles.inputRow}>
                <Avatar.Icon
                  size={isLandscape ? 24 : 28}
                  icon="account"
                  style={styles.inputIcon}
                  color={theme.colors.primary}
                />
                <TextInput
                  label="Nazwa użytkownika"
                  value={regUsername}
                  onChangeText={setRegUsername}
                  mode="flat"
                  autoCapitalize="none"
                  style={styles.flatInput}
                  disabled={registerLoading}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  contentStyle={[
                    styles.inputContentStyle,
                    isLandscape && styles.landscapeInputContent,
                  ]}
                />
              </View>
            </TouchableRipple>
          </Card>
        </View>

        <View
          style={isLandscape ? styles.landscapeInputHalf : { width: "100%" }}
        >
          <Card style={styles.inputCard}>
            <TouchableRipple onPress={() => {}} style={styles.inputCardContent}>
              <View style={styles.inputRow}>
                <Avatar.Icon
                  size={isLandscape ? 24 : 28}
                  icon="email"
                  style={styles.inputIcon}
                  color={theme.colors.primary}
                />
                <TextInput
                  label="Email"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  mode="flat"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.flatInput}
                  disabled={registerLoading}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  contentStyle={[
                    styles.inputContentStyle,
                    isLandscape && styles.landscapeInputContent,
                  ]}
                />
              </View>
            </TouchableRipple>
          </Card>
        </View>
      </View>

      <View style={isLandscape ? styles.landscapeInputsRow : undefined}>
        <View
          style={isLandscape ? styles.landscapeInputHalf : { width: "100%" }}
        >
          <Card style={styles.inputCard}>
            <TouchableRipple onPress={() => {}} style={styles.inputCardContent}>
              <View style={styles.inputRow}>
                <Avatar.Icon
                  size={isLandscape ? 24 : 28}
                  icon="lock"
                  style={styles.inputIcon}
                  color={theme.colors.primary}
                />                <TextInput
                  label="Hasło"
                  value={regPassword}
                  onChangeText={setRegPassword}
                  mode="flat"
                  secureTextEntry={!regPasswordVisible}
                  style={styles.flatInput}
                  disabled={registerLoading}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  contentStyle={[
                    styles.inputContentStyle,
                    isLandscape && styles.landscapeInputContent,
                  ]}
                  right={
                    <TextInput.Icon
                      icon={regPasswordVisible ? "eye-off" : "eye"}
                      onPress={() => setRegPasswordVisible(!regPasswordVisible)}
                      forceTextInputFocus={false}
                    />
                  }
                />
              </View>
            </TouchableRipple>
          </Card>
          
          {regPassword && (
            <HelperText
              type="info"
              visible={true}
              style={styles.passwordHelpText}
            >
              Hasło musi mieć min. 8 znaków: małą literę, wielką literę, cyfrę i znak specjalny (@$!%*?&)
            </HelperText>
          )}
        </View>

        <View
          style={isLandscape ? styles.landscapeInputHalf : { width: "100%" }}
        >
          <Card style={styles.inputCard}>
            <TouchableRipple onPress={() => {}} style={styles.inputCardContent}>
              <View style={styles.inputRow}>
                <Avatar.Icon
                  size={isLandscape ? 24 : 28}
                  icon="lock-check"
                  style={styles.inputIcon}
                  color={theme.colors.primary}
                />
                <TextInput
                  label="Potwierdź hasło"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  mode="flat"
                  secureTextEntry={!confirmPasswordVisible}
                  style={styles.flatInput}
                  disabled={registerLoading}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  contentStyle={[
                    styles.inputContentStyle,
                    isLandscape && styles.landscapeInputContent,
                  ]}
                  right={
                    <TextInput.Icon
                      icon={confirmPasswordVisible ? "eye-off" : "eye"}
                      onPress={() =>
                        setConfirmPasswordVisible(!confirmPasswordVisible)
                      }
                      forceTextInputFocus={false}
                    />
                  }
                />
              </View>
            </TouchableRipple>
          </Card>
        </View>
      </View>

      {registerError ? (
        <HelperText
          type="error"
          visible={!!registerError}
          style={styles.errorText}
        >
          {registerError}
        </HelperText>
      ) : null}

      <View
        style={[
          styles.termsContainer,
          isLandscape && styles.landscapeTermsContainer,
        ]}
      >
        <Text
          variant={isLandscape ? "bodySmall" : "bodySmall"}
          style={styles.termsText}
        >
          Klikając Zarejestruj się, akceptujesz nasze Warunki korzystania z
          usługi i Politykę prywatności.
        </Text>
      </View>

      <Button
        mode="contained"
        onPress={handleRegister}
        style={[
          styles.actionButton,
          isLandscape && styles.landscapeActionButton,
        ]}
        loading={registerLoading}
        disabled={registerLoading}
        contentStyle={[
          styles.buttonContent,
          isLandscape && styles.landscapeButtonContent,
        ]}
        labelStyle={
          isLandscape
            ? { fontSize: 14, fontWeight: "bold" }
            : { fontSize: 16, fontWeight: "bold" }
        }
      >
        Zarejestruj się
      </Button>
    </View>
  );

  return (
    <BackgroundGradient>
      <Appbar.Header style={{ backgroundColor: "#8B0000" }}>
        <Appbar.BackAction onPress={handleBackPress} color="#fff" />
        <Appbar.Content
          title={
            activeTab === "login"
              ? "Logowanie Nauczyciela"
              : "Rejestracja Nauczyciela"
          }
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
                style={[
                  styles.segmentedButton,
                  isLandscape && styles.landscapeSegmentedButton,
                ]}
              />
              {activeTab === "login" ? renderLoginForm() : renderRegisterForm()}
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
      android: 8, 
      ios: 8, 
      default: 24,
    }),
    paddingTop: Platform.select({
      android: 12,
      ios: 12,
      default: 40,
    }),
    width: "100%", 
  },
  desktopContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 0,
    width: "100%", 
  },
  formSurface: {
    padding: Platform.select({
      android: 16,
      ios: 16,
      default: 32,
    }),
    borderRadius: 8,
    width: "100%",
  },
  desktopFormSurface: {
    maxWidth: 580, 
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
  landscapeLogoContainer: {
    marginBottom: 16,
  },
  landscapeLogo: {
    marginBottom: 8,
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
  landscapeSegmentedButton: {
    marginBottom: 12,
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
  landscapeFormTitle: {
    marginBottom: 12,
  },
  input: {
    marginBottom: Platform.select({
      android: 16,
      default: 20,
    }),
  },
  textInputContent: {
    height: 48,
  },
  actionButton: {
    marginBottom: Platform.select({
      android: 16,
      default: 24,
    }),
    paddingVertical: 6,
    borderRadius: 8, 
    marginTop: 8, 
    elevation: 2, 
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
  inputCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    width: "100%", 
  },
  inputCardContent: {
    paddingHorizontal: 0,
    width: "100%", 
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12, 
    width: "100%", 
    minHeight: 60, 
  },
  inputIcon: {
    backgroundColor: "transparent",
    margin: 0,
    paddingTop: 0,
    marginRight: 12, 
  },
  flatInput: {
    flex: 1,
    backgroundColor: "transparent",
    fontSize: Platform.select({
      android: 16,
      ios: 16,
      default: 16,
    }),
    width: "100%", 
  },
  inputContentStyle: {
    paddingTop: 10, 
    paddingBottom: 10, 
  },
  errorText: {
    textAlign: "center",
    marginBottom: 16,
    fontSize: 14,
  },
  buttonContent: {
    paddingVertical: 10, 
  },
  landscapeInputsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  landscapeInputHalf: {
    width: "49%",
  },
  landscapeActionButton: {
    marginBottom: 12,
    paddingVertical: 4,
  },
  landscapeButtonContent: {
    paddingVertical: 6,
  },
  landscapeTermsContainer: {
    marginBottom: 12,
  },  landscapeInputContent: {
    paddingTop: 6,
    paddingBottom: 6,
  },
  passwordHelpText: {
    textAlign: "center",
    marginBottom: 8,
    fontSize: 12,
    marginTop: -8,
  },
});

export default ExaminerLoginScreen;