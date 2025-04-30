import React from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Dialog, Button, Text, List, Avatar, Chip, Divider } from "react-native-paper";
import { Session, StudentInSession } from "../types/types";

interface StudentsListDialogProps {
  visible: boolean;
  onDismiss: () => void;
  session: Session | null;
  students?: any[];
}

const StudentsListDialog: React.FC<StudentsListDialogProps> = ({
  visible,
  onDismiss,
  session,
  students = []
}) => {
  if (!session) return null;

  
  const studentsList = students.length > 0 ? students : (session.students || []);
  const hasStudents = studentsList && studentsList.length > 0;
  
  const formatJoinTime = (dateString?: string) => {
    if (!dateString) return "-";
    
    try {
      return new Date(dateString).toLocaleString('pl-PL');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
      <Dialog.Title>Studenci w sesji</Dialog.Title>
      <Dialog.Content>
        <View style={styles.sessionHeader}>
          <Text variant="titleMedium" style={styles.sessionHeaderText}>
            {session.name || `Sesja ${session.sessionCode}`}
          </Text>
          <Chip 
            icon={session.isActive ? "check-circle" : "cancel"}
            style={{ alignSelf: "flex-start", marginBottom: 8 }}
          >
            {session.isActive ? "Aktywna" : "Nieaktywna"}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        {!hasStudents ? (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge">Brak studentów</Text>
            <Text variant="bodyMedium" style={styles.emptyStateText}>
              Żaden student nie dołączył jeszcze do tej sesji
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.studentsList}>
            {studentsList.map((student, index) => (
              <View key={student.id || index}>
                <List.Item
                  title={`${student.name || ""} ${student.surname || ""}`}
                  description={`Album: ${student.albumNumber || "brak numeru"}`}
                  left={() => (
                    <Avatar.Icon 
                      size={40} 
                      icon="account" 
                      style={styles.avatar} 
                    />
                  )}
                  right={() => (
                    <View style={styles.joinedStatus}>
                      <Chip 
                        icon={student.student_sessions?.active ? "checkbox-marked-circle" : "close-circle"}
                        textStyle={{ fontSize: 12 }}
                        style={{ 
                          backgroundColor: student.student_sessions?.active 
                            ? "rgba(0, 200, 83, 0.1)" 
                            : "rgba(200, 0, 0, 0.1)" 
                        }}
                      >
                        {student.student_sessions?.active ? "Aktywny" : "Nieaktywny"}
                      </Chip>
                      <Text style={styles.joinTime}>
                        Dołączył: {formatJoinTime(student.student_sessions?.joinedAt)}
                      </Text>
                    </View>
                  )}
                />
                {index < studentsList.length - 1 && (
                  <Divider style={styles.itemDivider} />
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Zamknij</Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 500,
    width: "100%",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sessionHeaderText: {
    flexShrink: 1,
  },
  divider: {
    marginVertical: 12,
  },
  studentsList: {
    maxHeight: 400,
  },
  avatar: {
    backgroundColor: "#3498db",
  },
  joinedStatus: {
    alignItems: "flex-end",
  },
  joinTime: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  itemDivider: {
    marginVertical: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    textAlign: "center",
    marginTop: 8,
    opacity: 0.7,
  },
});

export default StudentsListDialog;