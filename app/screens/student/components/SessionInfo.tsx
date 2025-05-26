import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useTheme, Text, Surface, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface SessionInfoProps {
  accessCode: string;
  firstName: string;
  lastName: string;
  albumNumber: string;
  sessionData: any;
  isSessionPanelExpanded?: boolean;
  setIsSessionPanelExpanded?: (expanded: boolean) => void;
  isMobile?: boolean;
}

const SessionInfo: React.FC<SessionInfoProps> = ({
  accessCode,
  firstName,
  lastName,
  albumNumber,
  sessionData,
  isSessionPanelExpanded = true,
  setIsSessionPanelExpanded,
  isMobile = false,
}) => {
  const theme = useTheme();

  const SessionContent = () => (
    <Surface style={styles.sessionInfo} elevation={3}>
      <View style={styles.sessionHeader}>
        <MaterialCommunityIcons
          name="medical-bag"
          size={24}
          color={theme.colors.primary}
          style={styles.headerIcon}
        />
        <Text style={styles.title}>Sesja #{accessCode}</Text>
      </View>
      <View style={styles.patientInfoRow}>
        <MaterialCommunityIcons
          name="account"
          size={20}
          color={theme.colors.secondary}
        />
        <Text style={styles.patientInfoText}>
          {firstName} {lastName} (Album: {albumNumber})
        </Text>
      </View>
      {sessionData?.name && (
        <View style={styles.patientInfoRow}>
          <MaterialCommunityIcons
            name="tag"
            size={20}
            color={theme.colors.secondary}
          />
          <Text style={styles.sessionName}>
            {sessionData.name}
          </Text>
        </View>
      )}

      <View style={styles.sessionMetaInfo}>
        <View style={styles.metaItemRow}>
          <MaterialCommunityIcons
            name={
              sessionData?.isActive
                ? "check-circle"
                : "close-circle"
            }
            size={18}
            color={
              sessionData?.isActive
                ? theme.colors.primary
                : theme.colors.error
            }
          />
          <Text style={styles.metaItemLabel}>
            Status:{" "}
            {sessionData?.isActive ? "Aktywna" : "Nieaktywna"}
          </Text>
        </View>
        {sessionData?.createdAt && (
          <View style={styles.metaItemRow}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={18}
              color={theme.colors.secondary}
            />
            <Text style={styles.metaItemLabel}>
              Utworzono:{" "}
              {new Date(sessionData.createdAt).toLocaleString()}
            </Text>
          </View>
        )}
        {sessionData?.updatedAt && (
          <View style={styles.metaItemRow}>
            <MaterialCommunityIcons
              name="update"
              size={18}
              color={theme.colors.secondary}
            />
            <Text style={styles.metaItemLabel}>
              Ostatnia aktualizacja:{" "}
              {new Date(sessionData.updatedAt).toLocaleString()}
            </Text>
          </View>
        )}
      </View>
    </Surface>
  );

  if (isMobile) {
    return (
      <View style={styles.mobileSessionHeader}>
        <View style={styles.mobileHeaderButtons}>
          <Button
            mode="elevated"
            onPress={() => setIsSessionPanelExpanded?.(!isSessionPanelExpanded)}
            icon={isSessionPanelExpanded ? "chevron-up" : "chevron-down"}
          >
            Informacje o sesji
          </Button>
        </View>
        {isSessionPanelExpanded && <SessionContent />}
      </View>
    );
  }

  return <SessionContent />;
};

const styles = StyleSheet.create({
  sessionInfo: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  mobileHeaderButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  sessionName: {
    fontSize: 16,
    marginTop: 8,
    fontStyle: "italic",
  },
  sessionMetaInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  mobileSessionHeader: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerIcon: {
    marginRight: 8,
  },
  patientInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  patientInfoText: {
    marginLeft: 8,
    fontSize: 16,
  },
  metaItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  metaItemLabel: {
    marginLeft: 8,
    fontSize: 14,
    opacity: 0.8,
  },
});

export default SessionInfo;
