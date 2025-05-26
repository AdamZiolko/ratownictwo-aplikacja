import apiService from "@/services/ApiService";
import React, { useEffect, useState } from "react";
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
} from "react-native-paper";
import { useAuth } from "@/contexts/AuthContext";
interface Task {
  id: number;
  text: string;
  completed: boolean;
}

interface ChecklistDialogProps {
  visible: boolean;
  top?: number;
  left?: number;
  onDismiss: () => void;
sessionId?: string;
}
interface Comment {
  id: number;
  text: string;
  timestamp: Date;
}
interface Task {
  id: number;
  text: string;
  completed: boolean;
}
interface ApiResponse {
  status: number;
  data?: any;
  message?: string;
}

interface TemplateData {
  name: string;
  tasks: Array<{ text: string }>;
}

interface TestResultData {
  student: {
    name: string;
    surname: string;
    albumNumber: string;
  };
  tasks: Array<{ text: string; completed: boolean }>;
  comments: Array<{ text: string; timestamp: string }>;
  sessionId: string;
}
const ChecklistDialog: React.FC<ChecklistDialogProps> = ({
  visible,
  top = 0,
  left = 0,
  onDismiss,
  sessionId,
}) => {
  const theme = useTheme();
    const { user } = useAuth(); 
  const [testStarted, setTestStarted] = useState(false);
  const [loadedTestName, setLoadedTestName] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");

  const handleStartTest = () => setTestStarted(true);
  const handleLoadTest = () => setLoadedTestName("Przykładowy Test 1");
const [comments, setComments] = useState<Comment[]>([]);
const [newComment, setNewComment] = useState(""); 
const [commentsExpanded, setCommentsExpanded] = useState(false);
const [templateName, setTemplateName] = useState("");
const [showTemplateNameDialog, setShowTemplateNameDialog] = useState(false);
const [templateNameInput, setTemplateNameInput] = useState("")

interface Template {
  id: number;
  name: string;
  tasks: Array<{ text: string }>;
}
const [templates, setTemplates] = useState<Template[]>([]);

  const handleAddTask = () => {
    if (newTaskText.trim() === "") return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), text: newTaskText.trim(), completed: false },
    ]);
    setNewTaskText("");
  };

const loadTemplates = async () => {
  try {
    const response = await apiService.get("checklist/templates");
    if (response.status === 200) {
      setTemplates(response.data);
    }
  } catch (error) {
    console.error("Błąd ładowania szablonów:", error);
  }
};

  useEffect(() => {
  if (visible) {
    loadTemplates();
  }
}, [visible]);
const handleSaveComment = () => {
  if (newComment.trim() === "") return;
  setComments(prev => [
    ...prev,
    {
      id: Date.now(),
      text: newComment.trim(),
      timestamp: new Date()
    }
  ]);
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
  tasks: tasks.map(t => ({ text: t.text }))
});

    if (response.status === 201) {
      Alert.alert("Sukces", "Szablon został zapisany");
      setTasks([]);
      setTemplateNameInput("");
      setShowTemplateNameDialog(false);
      loadTemplates();
    }
  } catch (error) {
    console.error("Błąd zapisu szablonu:", error);
    Alert.alert("Błąd", "Nie udało się zapisać szablonu");
  }
};

const handleSaveResults = async () => {
    try {
      if (!user) {
        Alert.alert("Błąd", "Nie znaleziono danych użytkownika");
        return;
      }

      const response = await apiService.post("checklist/test-results", {
        student: {
          name: user.name,
          surname: user.surname,
          albumNumber: user.albumNumber
        },
        tasks: tasks.map(t => ({
          text: t.text,
          completed: t.completed
        })),
        comments: comments.map(c => ({
          text: c.text,
          timestamp: c.timestamp.toISOString()
        })),
        sessionId: sessionId // Użyj ID sesji z propsów
      });

      if (response.status === 201) {
        Alert.alert("Sukces", "Wyniki testu zostały zapisane");
        setTasks([]);
        setComments([]);
      }
    } catch (error) {
      console.error("Błąd zapisu wyników:", error);
      let errorMessage = "Nie udało się zapisać wyników testu";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      Alert.alert("Błąd", errorMessage);
    }
  };



const loadTemplate = (template: Template) => {
  setTasks(template.tasks.map(task => ({
    id: Date.now(), // Nowe ID dla każdego zadania
    text: task.text,
    completed: false // Resetujemy status wykonania
  })));
  setLoadedTestName(template.name);
};

  const toggleTaskCompleted = (taskId: number) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );

  const handleDeleteTask = (taskId: number) =>
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

  const renderContent = () => (
    <>
      <View style={styles.popupHeader}>
        <Text variant="titleMedium">Checklista</Text>
        <IconButton icon="close" size={20} onPress={onDismiss} />
      </View>

      {!testStarted ? (
        <View style={styles.centeredStart}>
          <Button mode="contained" onPress={handleStartTest}>
            Zacznij test
          </Button>
        </View>
      ) : (
        <View style={styles.innerContent}>
        <List.Section style={styles.section}>
  <List.Subheader>1. Wczytaj gotowy test</List.Subheader>
  
  {templates.map(template => (
    <Pressable
      key={template.id}
      onPress={() => loadTemplate(template)}
      style={styles.templateItem}
    >
      <Text>{template.name}</Text>
    </Pressable>
  ))}

  <Button
    mode="outlined"
    onPress={loadTemplates}
    style={styles.actionButton}
    icon="refresh"
  >
    Odśwież listę szablonów
  </Button>
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
              />
              <IconButton
                icon="plus"
                size={24}
                onPress={handleAddTask}
                disabled={newTaskText.trim() === ""}
              />
            </View>

            {tasks.length === 0 ? (
              <Text style={styles.noTasksText}>
                Brak zadań. Dodaj pierwsze zadanie.
              </Text>
            ) : (
              tasks.map((task) => (
                <View key={task.id} style={styles.taskRow}>
                  <Checkbox
                    status={task.completed ? "checked" : "unchecked"}
                    onPress={() => toggleTaskCompleted(task.id)}
                  />
                  <Text style={styles.taskText}>{task.text}</Text>
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => handleDeleteTask(task.id)}
                  />
                </View>
              ))
            )}
          </List.Section>

          <List.Section style={styles.section}>
  <List.Subheader>
    3. Komentarze ({comments.length})
    <IconButton
      icon={commentsExpanded ? "chevron-up" : "chevron-down"}
      size={20}
      onPress={() => setCommentsExpanded(!commentsExpanded)}
      style={styles.commentToggle}
    />
  </List.Subheader>
  
  <RNTextInput
    style={[
      styles.commentsInput,
      { backgroundColor: theme.colors.surface },
    ]}
    placeholder="Wpisz komentarz..."
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
  >
    Zapisz komentarz
  </Button>

  {commentsExpanded && comments.map(comment => (
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
            onPress={() => {
                if (tasks.length === 0) return;
                setShowTemplateNameDialog(true);
            }}
            disabled={tasks.length === 0}
            style={styles.actionButton}
            >
            Zapisz jako szablon
            </Button>
<Modal visible={showTemplateNameDialog} transparent>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text variant="titleMedium">Podaj nazwę szablonu</Text>
      <TextInput
        value={templateNameInput}
        onChangeText={setTemplateNameInput}
        mode="outlined"
        style={styles.modalInput}
      />
      <View style={styles.modalButtons}>
        <Button onPress={() => setShowTemplateNameDialog(false)}>
          Anuluj
        </Button>
        <Button 
          mode="contained" 
          onPress={() => handleSaveTemplate(templateNameInput)}
          disabled={!templateNameInput.trim()}
        >
          Zapisz
        </Button>
      </View>
    </View>
  </View>
</Modal>
            <Button
            mode="outlined"
            onPress={handleSaveResults}
            disabled={tasks.length === 0}
            style={styles.actionButton}
            >
            Zapisz wyniki
            </Button>
          </List.Section>
        </View>
      )}
    </>
  );

  if (Platform.OS === "web") {
    if (!visible) return null;

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
            <Pressable 
              onPress={() => {}}
              style={styles.webTouchArea}
            >
              {renderContent()}
            </Pressable>
          </ScrollView>
        </View>
      </Pressable>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
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
            <Pressable 
              onPress={() => {}}
              style={styles.touchArea}
            >
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
    // backgroundColor will be set inline to use theme
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
  loadedNameText: {
    marginTop: 8,
    fontStyle: "italic",
    marginLeft: 8,
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
  webTouchArea: {
    flex: 1,
    minHeight: '100%',
  },
  templateItem: {
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 6,
  },
  commentToggle: {
  position: 'absolute',
  right: 0,
  top: -8,
},
commentItem: {
  marginTop: 8,
  padding: 8,
  backgroundColor: 'rgba(0,0,0,0.05)',
  borderRadius: 4,
},
commentText: {
  fontSize: 14,
},
commentTime: {
  fontSize: 12,
  color: '#666',
  marginTop: 4,
},
modalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
},
modalContent: {
  backgroundColor: 'white',
  padding: 20,
  borderRadius: 8,
  width: '80%',
},
modalInput: {
  marginVertical: 10,
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  marginTop: 10,
  gap: 10,
},
});

export default ChecklistDialog;