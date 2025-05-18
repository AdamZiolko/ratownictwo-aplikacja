import React from "react";
import { StyleSheet, View, Platform } from "react-native";
import {
  Text,
  Card,
  Surface,
  useTheme,
  Appbar,
  Avatar,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import FloatingThemeToggle from "@/components/FloatingThemeToggle";
import BackgroundGradient from "@/components/BackgroundGradient";

const RoleSelectionScreen = () => {
  const theme = useTheme();

  const handleRoleSelect = (role: "examiner" | "student") => {
    if (role === "examiner") {
      router.push("/routes/examiner-login");
    } else {
      router.push("/routes/student-profile");
    }
  };

  const platformLabel =
    Platform.OS === "android" ? "Wersja mobilna (Android)" : "Wersja webowa";

  const cardBackgroundColor = theme.dark
    ? "rgba(255, 255, 255, 0.05)"
    : "rgba(0, 0, 0, 0.03)";
  const cardContentBackgroundColor = theme.dark
    ? "rgba(255, 255, 255, 0.03)"
    : "rgba(0, 0, 0, 0.02)";

  return (
    <BackgroundGradient containerStyle={styles.container}>
      <View style={styles.cardsContainer}>
        <Text variant="titleLarge" style={styles.subtitle}>
          Wybierz swoją rolę:
        </Text>
        <Surface
          style={[
            styles.cardSurface,
            Platform.OS === "android" && styles.androidCardSurface,
            { backgroundColor: cardBackgroundColor },
          ]}
          elevation={2}
        >
          <Card
            style={[
              styles.card,
              styles.fillCard,
              { backgroundColor: cardContentBackgroundColor },
            ]}
            onPress={() => handleRoleSelect("examiner")}
          >
            <Card.Title
              title="Nauczyciel"
              subtitle="Zaloguj się aby tworzyć sesje treningowe dla studentów"
              titleNumberOfLines={2}
              subtitleNumberOfLines={3}
              left={(props) => (
                <LinearGradient
                  colors={["#8B0000", "#D32F2F"]}
                  style={styles.iconGradient}
                >
                  <Avatar.Icon
                    {...props}
                    icon="account-tie"
                    size={36}
                    color="#fff"
                    style={{ backgroundColor: "transparent" }}
                  />
                </LinearGradient>
              )}
              titleStyle={{ fontWeight: "600" }}
            />
          </Card>
        </Surface>

        <Surface
          style={[
            styles.cardSurface,
            Platform.OS === "android" && styles.androidCardSurface,
            { backgroundColor: cardBackgroundColor },
          ]}
          elevation={2}
        >
          <Card
            style={[
              styles.card,
              styles.fillCard,
              { backgroundColor: cardContentBackgroundColor },
            ]}
            onPress={() => handleRoleSelect("student")}
          >
            <Card.Title
              title="Student"
              subtitle="Wpisz kod dostępu aby dołączyć do sesji"
              titleNumberOfLines={2}
              subtitleNumberOfLines={3}
              left={(props) => (
                <LinearGradient
                  colors={["#8B0000", "#D32F2F"]}
                  style={styles.iconGradient}
                >
                  <Avatar.Icon
                    {...props}
                    icon="account"
                    size={36}
                    color="#fff"
                    style={{ backgroundColor: "transparent" }}
                  />
                </LinearGradient>
              )}
              titleStyle={{ fontWeight: "600" }}
            />
          </Card>
        </Surface>

        <Text variant="titleSmall" style={styles.subtitle}>
          Aplikacja służąca do nauki i ćwiczeń z zakresu ratownictwa medycznego.
        </Text>
      </View>
      <Text style={styles.debugText}>{platformLabel}</Text>
      <FloatingThemeToggle position="topRight" size={24} />
    </BackgroundGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Platform.OS === "web" ? 16 : 16,
    paddingTop: Platform.OS === "web" ? 80 : 50,
    alignItems: "center",
    width: "100%",
    alignSelf: "center",
    justifyContent: "center", // Add vertical centering
  },
  title: {
    marginBottom: 8,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
  cardsContainer: {
    width: "100%",
    flex: 1, // Take remaining space
    justifyContent: "center", // Center content vertically
    ...Platform.select({
      android: {
        flexDirection: "column",
        alignItems: "stretch",
        paddingHorizontal: 16,
        marginHorizontal: 0,
      },
      ios: {
        flexDirection: "column",
        alignItems: "stretch",
        paddingHorizontal: 16,
        marginHorizontal: 0,
      },
      web: {
        flexDirection: "column",
        alignItems: "stretch",
        maxWidth: 600,
        alignSelf: "center",
      },
      default: {
        flexDirection: "column",
        width: "100%",
      },
    }),
  },
  cardSurface: {
    borderRadius: 12,
    ...Platform.select({
      android: {
        marginVertical: 8,
        marginHorizontal: 0,
        minHeight: 120,
        overflow: "hidden",
        alignSelf: "stretch",
      },
      ios: {
        marginVertical: 8,
        marginHorizontal: 0,
        minHeight: 120,
        overflow: "hidden",
        alignSelf: "stretch",
      },
      web: {
        margin: 16,
        minHeight: 140,
        overflow: "hidden",
      },
      default: {
        marginBottom: 16,
        width: "100%",
      },
    }),
  },
  androidCardSurface: {
    elevation: 4,
  },
  card: {
    borderRadius: 12,
  },
  fillCard: {
    flex: 1,
    justifyContent: "center",
  },
  cardContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
  cardDescription: {
    marginTop: 8,
    textAlign: "center",
  },
  debugText: {
    marginTop: 32,
    fontSize: 12,
    color: "gray",
  },

  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default RoleSelectionScreen;
