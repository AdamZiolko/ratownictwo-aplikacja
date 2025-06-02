import apiService from "@/services/ApiService";
import React from "react";
import {
  View,
  Pressable,
  ScrollView,
  Dimensions,
  StyleSheet,
  TextInput as RNTextInput,
  Platform,
  Modal,
  Alert,
} from "react-native";
import {
  Text,
  IconButton,
  Checkbox,
  Button,
  List,
  TextInput,
  useTheme,
  Menu,
  Card,
} from "react-native-paper";

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

interface Comment {
  id: number;
  text: string;
  timestamp: Date;
}

interface Template {
  id: number;
  name: string;
  tasks: Array<{ text: string }>;
}

interface StudentTestState {
  testStarted: boolean;
  loadedTestName: string | null;
  tasks: Task[];
  comments: Comment[];
}

/**
 * Props przekazywane z rodzica (ExaminerDashboardScreen), 
 * w tym stan testu konkretnego studenta oraz callbacki do aktualizacji.
 */
interface ChecklistDialogProps {
  visible: boolean;
  top?: number;
  left?: number;
  onDismiss: () => void;
  sessionId?: string;
  student: {
    id: number;
    name: string;
    surname: string;
    albumNumber?: string;
  };
  testState: StudentTestState;
  onStartTest: () => void;
  onLoadTemplate: (name: string, tasks: Task[]) => void;
  onChangeTasks: (newTasks: Task[]) => void;
  onChangeComments: (newComments: Comment[]) => void;
}

const ChecklistDialog: React.FC<ChecklistDialogProps> = ({
  visible,
  top = 0,
  left = 0,
  onDismiss,
  sessionId,
  student,
  testState,
  onStartTest,
  onLoadTemplate,
  onChangeTasks,
  onChangeComments,
}) => {
  const theme = useTheme();



  const [newTaskText, setNewTaskText] = React.useState("");
  const [newComment, setNewComment] = React.useState("");
  const [commentsExpanded, setCommentsExpanded] = React.useState(false);
  const [showTemplateNameDialog, setShowTemplateNameDialog] = React.useState(false);
  const [templateNameInput, setTemplateNameInput] = React.useState("");

  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [selectMenuVisible, setSelectMenuVisible] = React.useState(false);
  const [deleteMenuVisible, setDeleteMenuVisible] = React.useState(false);

  const handleAddTask = () => {
    if (newTaskText.trim() === "") return;
    const newTask: Task = {
      id: Date.now(),
      text: newTaskText.trim(),
      completed: false,
    };
    onChangeTasks([...testState.tasks, newTask]);
    setNewTaskText("");
  };

  const loadTemplates = async () => {
    try {
      const response = await apiService.get("checklist/templates");
      console.log("Odpowiedź z /checklist/templates:", response);
      setTemplates(response);
    } catch (error) {
      console.error("Błąd ładowania szablonów:", error);
    }
  };

  React.useEffect(() => {
    if (visible) {
      loadTemplates();
    } else {
      setSelectMenuVisible(false);
      setDeleteMenuVisible(false);
      setTemplateNameInput("");
    }
  }, [visible]);

  const handleSaveComment = () => {
    if (newComment.trim() === "") return;
    const newC: Comment = {
      id: Date.now(),
      text: newComment.trim(),
      timestamp: new Date(),
    };
    onChangeComments([...testState.comments, newC]);
    setNewComment("");
  };

  const handleSaveTemplate = async (name: string) => {
    try {
      if (!name.trim()) {
        Alert.alert("Błąd", "Nazwa szablonu nie może być pusta");
        return;
      }
      const response = await apiService.post("checklist/templates", {
        name: name.trim(),
        tasks: testState.tasks.map((t) => ({ text: t.text })),
      });
      console.log("Odpowiedź createOrUpdateTemplate:", response);
      Alert.alert("Sukces", "Szablon został zapisany lub nadpisany");
      setTemplateNameInput("");
      setShowTemplateNameDialog(false);
      loadTemplates();
    } catch (error) {
      console.error("Błąd zapisu szablonu:", error);
      Alert.alert("Błąd", "Nie udało się zapisać szablonu");
    }
  };

  const handleSaveResults = async () => {
    try {
      if (!student || !sessionId) {
        Alert.alert("Błąd", "Brak wymaganych danych: student lub sesja");
        return;
      }
      const response = await apiService.post("checklist/test-results", {
        student: {
          name: student.name,
          surname: student.surname,
          albumNumber: student.albumNumber || "",
        },
        tasks: testState.tasks.map((t) => ({
          text: t.text,
          completed: t.completed,
        })),
        comments: testState.comments.map((c) => ({
          text: c.text,
          timestamp: c.timestamp.toISOString(),
        })),
        sessionId: sessionId,
      });
      console.log("Odpowiedź z test-results:", response);
      Alert.alert("Sukces", "Wyniki testu zostały zapisane");
    } catch (error) {
      console.error("Pełny błąd zapisu:", error);
      let errorMessage = "Nie udało się zapisać wyników testu";
      if (error instanceof Error) {
        errorMessage = `${error.message} (${error.stack})`;
      }
      Alert.alert("Błąd", errorMessage);
    }
  };

  const loadTemplate = (template: Template) => {
    const newTasks: Task[] = template.tasks.map((task, idx) => ({
      id: Date.now() + idx,
      text: task.text,
      completed: false,
    }));
    onLoadTemplate(template.name, newTasks);
    setSelectMenuVisible(false);
  };

  const toggleTaskCompleted = (taskId: number) => {
    const updated = testState.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onChangeTasks(updated);
  };

  const handleDeleteTask = (taskId: number) => {
    const updated = testState.tasks.filter((t) => t.id !== taskId);
    onChangeTasks(updated);
  };

  const openSaveTemplateModal = () => {
    setTemplateNameInput(testState.loadedTestName || "");
    setShowTemplateNameDialog(true);
  };

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      await apiService.delete(`checklist/templates/${templateId}`);
      Alert.alert("Usunięto", "Szablon został usunięty");
      loadTemplates();
      const wasLoaded = templates.find((t) => t.id === templateId);
      if (wasLoaded && wasLoaded.name === testState.loadedTestName) {
        onLoadTemplate("", []); 
      }
      setDeleteMenuVisible(false);
    } catch (error) {
      console.error("Błąd usuwania szablonu:", error);
      Alert.alert("Błąd", "Nie udało się usunąć szablonu");
    }
  };

React.useEffect(() => {
  if (
    testState.loadedTestName && 
    !templates.some(t => t.name === testState.loadedTestName)
  ) {
    onLoadTemplate("", []);
  }
}, [templates, testState.loadedTestName, onLoadTemplate]);

  const moveTaskUp = (index: number) => {
    if (index === 0) return;
    const newTasks = [...testState.tasks];
    [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
    onChangeTasks(newTasks);
  };

  const moveTaskDown = (index: number) => {
    if (index === testState.tasks.length - 1) return;
    const newTasks = [...testState.tasks];
    [newTasks[index + 1], newTasks[index]] = [newTasks[index], newTasks[index + 1]];
    onChangeTasks(newTasks);
  };

  const handleClearForm = () => {
    onChangeTasks([]);
    onChangeComments([]);
  };

  const renderContent = () => (
    <>
      <View style={styles.popupHeader}>
        <Text variant="titleMedium">
          Checklista dla {student.name} {student.surname}
        </Text>
        <IconButton icon="close" size={20} onPress={onDismiss} />
      </View>

      {!testState.testStarted ? (
        <View style={styles.centeredStart}>
          <Button mode="contained" onPress={onStartTest}>
            Zacznij test
          </Button>
        </View>
      ) : (
        <View style={styles.innerContent}>
          <List.Section style={styles.section}>
            <List.Subheader>1. Wczytaj gotowy test</List.Subheader>
            <View style={styles.templateRow}>
              {/* Menu wyboru szablonu */}
              <Menu
                visible={selectMenuVisible}
                onDismiss={() => setSelectMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setSelectMenuVisible(true)}
                    style={styles.templateButton}
                    contentStyle={{ backgroundColor: theme.colors.surface }}
                    labelStyle={{ color: theme.colors.onSurface }}
                  >
                    {testState.loadedTestName || "Wybierz szablon"}
                  </Button>
                }
              >
                {templates.length === 0 ? (
                  <Menu.Item title="Brak szablonów" disabled />
                ) : (
                  templates.map((template) => (
                    <Menu.Item
                      key={template.id}
                      onPress={() => loadTemplate(template)}
                      title={template.name}
                    />
                  ))
                )}
              </Menu>

              {/* Przycisk odświeżenia */}
              <IconButton
                icon="refresh"
                size={24}
                onPress={loadTemplates}
                style={styles.refreshButton}
                iconColor={theme.colors.primary}
              />

              {/* Menu usuwania szablonu */}
              <Menu
                visible={deleteMenuVisible}
                onDismiss={() => setDeleteMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="delete-outline"
                    size={24}
                    onPress={() => setDeleteMenuVisible(true)}
                    iconColor={theme.colors.error}
                  />
                }
              >
                {templates.length === 0 ? (
                  <Menu.Item title="Brak szablonów do usunięcia" disabled />
                ) : (
                  templates.map((template) => (
                    <Menu.Item
                      key={template.id}
                      onPress={() => handleDeleteTemplate(template.id)}
                      title={`Usuń: ${template.name}`}
                      leadingIcon="delete"
                      titleStyle={{ color: theme.colors.error }}
                    />
                  ))
                )}
              </Menu>
            </View>
          </List.Section>

          <List.Section style={styles.section}>
            <List.Subheader>2. Stwórz nowy test</List.Subheader>
            <View style={styles.newTaskRow}>
              <TextInput
                label="Nowe zadanie"
                value={newTaskText}
                onChangeText={setNewTaskText}
                mode="outlined"
                style={styles.newTaskInput}
                onSubmitEditing={handleAddTask}
                theme={{ colors: { primary: theme.colors.primary } }}
              />
              <IconButton
                icon="plus"
                size={24}
                onPress={handleAddTask}
                disabled={newTaskText.trim() === ""}
                iconColor={theme.colors.primary}
              />
            </View>

            {testState.tasks.length === 0 ? (
              <Text style={styles.noTasksText}>
                Brak zadań. Dodaj pierwsze zadanie.
              </Text>
            ) : (
              testState.tasks.map((task, idx) => (
                <View key={task.id} style={styles.taskRow}>
                  <Checkbox
                    status={task.completed ? "checked" : "unchecked"}
                    onPress={() => toggleTaskCompleted(task.id)}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.taskText}>{task.text}</Text>
                  <View style={styles.reorderButtons}>
                    <IconButton
                      icon="arrow-up"
                      size={20}
                      onPress={() => moveTaskUp(idx)}
                      disabled={idx === 0}
                      iconColor={idx === 0 ? "#BDBDBD" : theme.colors.primary}
                    />
                    <IconButton
                      icon="arrow-down"
                      size={20}
                      onPress={() => moveTaskDown(idx)}
                      disabled={idx === testState.tasks.length - 1}
                      iconColor={
                        idx === testState.tasks.length - 1
                          ? "#BDBDBD"
                          : theme.colors.primary
                      }
                    />
                  </View>
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => handleDeleteTask(task.id)}
                    iconColor={theme.colors.error}
                  />
                </View>
              ))
            )}
          </List.Section>

          <List.Section style={styles.section}>
            <List.Subheader>
              3. Komentarze ({testState.comments.length})
              <IconButton
                icon={commentsExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                onPress={() => setCommentsExpanded(!commentsExpanded)}
                style={styles.commentToggle}
                iconColor={theme.colors.primary}
              />
            </List.Subheader>
            <RNTextInput
              style={[
                styles.commentsInput,
                { backgroundColor: theme.colors.surface,  color: theme.colors.onSurface,  },
              ]}
              placeholder="Wpisz komentarz..."
              placeholderTextColor="#888"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              textAlignVertical="top"
            />
            <Button
              mode="outlined"
              onPress={handleSaveComment}
              disabled={newComment.trim() === ""}
              style={styles.actionButton}
              contentStyle={{ backgroundColor: theme.colors.surface }}
            >
              Zapisz komentarz
            </Button>

            {commentsExpanded &&
              testState.comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <Text style={styles.commentTime}>
                    {comment.timestamp.toLocaleString()}
                  </Text>
                </View>
              ))}
          </List.Section>

          <List.Section style={styles.section}>
            <List.Subheader>4. Zapis testu</List.Subheader>
            <Button
              mode="contained"
              onPress={openSaveTemplateModal}
              disabled={testState.tasks.length === 0}
              style={styles.actionButton}
              contentStyle={{ backgroundColor: theme.colors.primary }}
            >
              Zapisz jako szablon
            </Button>

            <Modal visible={showTemplateNameDialog} transparent>
              <View
                style={[
                  styles.modalContainer,
                  { backgroundColor: "rgba(0,0,0,0.4)" },
                ]}
              >
                <Card style={{ width: "80%", backgroundColor: theme.colors.surface }}>
                  <Card.Content>
                    <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                      Podaj nazwę szablonu
                    </Text>
                    <TextInput
                      value={templateNameInput}
                      onChangeText={setTemplateNameInput}
                      mode="outlined"
                      style={{ backgroundColor: theme.colors.surface }}
                      placeholder="Nazwa szablonu"
                      placeholderTextColor="#888"
                      theme={{ colors: { primary: theme.colors.primary } }}
                    />
                    <View style={styles.modalButtons}>
                      <Button onPress={() => setShowTemplateNameDialog(false)}>
                        Anuluj
                      </Button>
                      <Button
                        mode="contained"
                        onPress={() => handleSaveTemplate(templateNameInput)}
                        disabled={!templateNameInput.trim()}
                        contentStyle={{ backgroundColor: theme.colors.primary }}
                      >
                        Zapisz
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              </View>
            </Modal>

            <Button
              mode="outlined"
              onPress={handleSaveResults}
              disabled={testState.tasks.length === 0}
              style={styles.actionButton}
              contentStyle={{ backgroundColor: theme.colors.surface }}
            >
              Zapisz wyniki
            </Button>

            {/* Przycisk Wyczyść formularz */}
            <Button
              mode="outlined"
              onPress={handleClearForm}
              style={[styles.actionButton, { marginTop: 12 }]}
              contentStyle={{ backgroundColor: theme.colors.surface }}
            >
              Wyczyść formularz
            </Button>
          </List.Section>
        </View>
      )}
    </>
  );

  if (!visible) return null;

  if (Platform.OS === "web") {
    const windowHeight = Dimensions.get("window").height;
    const popupHeight = 600;
    const margin = 16;
    const calculatedTop =
      top + popupHeight + margin < windowHeight
        ? top + margin
        : top - popupHeight - margin;

    return (
      <Pressable style={styles.webOverlay} onPress={onDismiss}>
        <View
          style={[
            styles.webPopup,
            {
              top: calculatedTop,
              left: left + margin,
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.backdrop,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <ScrollView
            style={styles.fullHeight}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable onPress={() => {}} style={styles.webTouchArea}>
              {renderContent()}
            </Pressable>
          </ScrollView>
        </View>
      </Pressable>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.mobileOverlay} onPress={onDismiss}>
        <View style={[styles.mobilePopup, { backgroundColor: theme.colors.surface }]}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            overScrollMode="always"
            bounces={true}
          >
            <Pressable onPress={() => {}} style={styles.touchArea}>
              {renderContent()}
            </Pressable>
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  webOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
    zIndex: 1000,
  },
  webPopup: {
    position: "absolute",
    width: 580,
    height: 600,
    borderRadius: 8,
    elevation: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1001,
    overflow: "hidden",
  },
  fullHeight: {
    height: "100%",
  },
  mobileOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  mobilePopup: {
    width: "90%",
    maxWidth: 580,
    height: "80%",
    borderRadius: 8,
    overflow: "hidden",
  },
  popupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centeredStart: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  innerContent: {
    paddingBottom: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  touchArea: {
    flex: 1,
    minHeight: "100%",
  },
  section: {
    marginBottom: 24,
  },
  actionButton: {
    marginTop: 8,
    marginHorizontal: 8,
  },
  newTaskRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  newTaskInput: {
    flex: 1,
    height: Platform.OS === "web" ? undefined : 40,
  },
  noTasksText: {
    fontStyle: "italic",
    opacity: 0.7,
    marginTop: 8,
    marginLeft: 8,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginHorizontal: 8,
  },
  taskText: {
    flex: 1,
    marginLeft: 8,
  },
  reorderButtons: {
    flexDirection: "column",
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 4,
    padding: 8,
    minHeight: 100,
    marginTop: 4,
    marginBottom: 8,
    marginHorizontal: 8,
    fontSize: 16,
  },
  templateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  templateButton: {
    flex: 1,
  },
  refreshButton: {
    marginLeft: 8,
  },
  webTouchArea: {
    flex: 1,
    minHeight: "100%",
  },
  commentToggle: {
    position: "absolute",
    right: 0,
    top: -8,
  },
  commentItem: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 4,
  },
  commentText: {
    fontSize: 14,
  },
  commentTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 10,
  },
});

export default ChecklistDialog;
