import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Dimensions } from "react-native";
import {
  Dialog,
  Button,
  RadioButton,
  Text,
  List,
  TextInput,
  IconButton,
  Checkbox,
  useTheme,
} from "react-native-paper";
import { Session, SoundQueueItem } from "../types/types";

interface SoundSelectionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  session: Session | null;
  selectedSound: string | null;
  setSelectedSound: React.Dispatch<React.SetStateAction<string | null>>;
  onSendAudioCommand: (loop?: boolean) => void;
  onSendQueue: (queue: SoundQueueItem[]) => void;
  onPauseAudioCommand: () => void;
  onResumeAudioCommand: () => void;
  onStopAudioCommand: () => void;
}

const soundStructure = {
  Adult: {
    Female: [
      "Breathing through contractions",
      "Coughing",
      "Distressed",
      "Hawk",
      "Moaning",
      "No",
      "Ok",
      "Pain",
      "Pushing - long double",
      "Pushing - long",
      "Pushing - single",
      "Screaming",
      "Sob breathing (type 2)",
      "Sob breathing",
      "Vomiting",
      "Yes",
    ],
    Male: [
      "Coughing (long)",
      "Coughing",
      "Difficult breathing",
      "Hawk",
      "Moaning (long)",
      "Moaning",
      "No",
      "Ok",
      "Screaming (type 2)",
      "Screaming",
      "Sob breathing",
      "Vomiting (type 2)",
      "Vomiting (type 3)",
      "Vomiting",
      "Yes",
    ],
  },
  Child: [
    "Coughing",
    "Hawk",
    "Moaning",
    "No",
    "Ok",
    "Screaming",
    "Sob breathing",
    "Vomiting (type 2)",
    "Vomiting",
    "Yes",
  ],
  Geriatric: {
    Female: ["Coughing", "Moaning", "No", "Screaming", "Vomiting", "Yes"],
    Male: ["Coughing", "Moaning", "No", "Screaming", "Vomiting", "Yes"],
  },
  Infant: [
    "Content",
    "Cough",
    "Grunt",
    "Hawk",
    "Hiccup",
    "Screaming",
    "Strongcry (type 2)",
    "Strongcry",
    "Weakcry",
  ],
  Speech: [
    "Chest hurts",
    "Doc I feel I could die",
    "Go away",
    "I don't feel dizzy",
    "I don't feel well",
    "I feel better now",
    "I feel really bad",
    "I'm feeling very dizzy",
    "I'm fine",
    "I'm quite nauseous",
    "I'm really hungry",
    "I'm really thirsty",
    "I'm so sick",
    "Never had pain like this before",
    "No allergies",
    "No diabetes",
    "No lung or cardiac problems",
    "No",
    "Pain for 2 hours",
    "Something for this pain",
    "Thank you",
    "That helped",
    "Yes",
  ],
};

const SoundSelectionDialog: React.FC<SoundSelectionDialogProps> = ({
  visible,
  onDismiss,
  session,
  selectedSound,
  setSelectedSound,
  onSendAudioCommand,
  onSendQueue,
  onPauseAudioCommand,
  onResumeAudioCommand,
  onStopAudioCommand,
}) => {
  const theme = useTheme();
  const [delay, setDelay] = useState("0");
  const [queue, setQueue] = useState<SoundQueueItem[]>([]);
  const [activeTab, setActiveTab] = useState<"single" | "queue">("single");
  const [isLooping, setIsLooping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [navigationStack, setNavigationStack] = useState<string[][]>([[]]);

  const getCurrentLevel = () => {
    let currentLevel: any = soundStructure;
    for (const pathPart of currentPath) {
      currentLevel = currentLevel[pathPart];
    }
    return currentLevel;
  };

  const handleNavigate = (item: string) => {
    const newPath = [...currentPath, item];
    setCurrentPath(newPath);
    setNavigationStack([...navigationStack, newPath]);
  };

  const handleGoBack = () => {
    if (currentPath.length === 0) return;
    const newStack = navigationStack.slice(0, -1);
    setNavigationStack(newStack);
    setCurrentPath(newStack[newStack.length - 1]);
  };

  const renderNavigationItems = () => {
    const currentLevel = getCurrentLevel();

    if (Array.isArray(currentLevel)) {
      return (
        <ScrollView style={styles.soundListContainer}>
          {currentLevel.map((sound) => {
            const path = [...currentPath, sound].join("/") + ".wav";
            return (
              <List.Item
                key={sound}
                title={sound}
                onPress={() => setSelectedSound(path)}
                right={(props) => (
                  <RadioButton
                    {...props}
                    value={path}
                    status={selectedSound === path ? "checked" : "unchecked"}
                  />
                )}
              />
            );
          })}
        </ScrollView>
      );
    }

    return (
      <ScrollView style={styles.soundListContainer}>
        {Object.keys(currentLevel).map((key) => (
          <List.Item
            key={key}
            title={key}
            onPress={() => handleNavigate(key)}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
          />
        ))}
      </ScrollView>
    );
  };

  const addToQueue = () => {
    if (selectedSound) {
      const newItem: SoundQueueItem = {
        soundName: selectedSound,
        delay: parseInt(delay) || 0,
      };
      setQueue((prev) => [...prev, newItem]);
      setSelectedSound(null);
      setDelay("0");
    }
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendQueueInternal = () => {
    onSendQueue(queue);
    setQueue([]);
    setSelectedSound(null);
  };

  if (!session) return null;

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={styles.dialog}
    >
      <Dialog.Title style={styles.title}>Odtwórz dźwięk</Dialog.Title>

      <View style={styles.tabsContainer}>
        <Button
          mode={activeTab === "single" ? "contained" : "outlined"}
          onPress={() => setActiveTab("single")}
          style={styles.tabButton}
          labelStyle={styles.tabLabel}
        >
          Pojedynczy
        </Button>
        <Button
          mode={activeTab === "queue" ? "contained" : "outlined"}
          onPress={() => setActiveTab("queue")}
          style={styles.tabButton}
          labelStyle={styles.tabLabel}
        >
          Kolejka
        </Button>
      </View>

      <Dialog.ScrollArea style={styles.dialogScrollArea}>
        <ScrollView>
          <View style={styles.contentContainer}>
            <Text style={styles.sectionHeader}>Wybierz dźwięk:</Text>

            {currentPath.length > 0 && (
              <Button
                mode="text"
                onPress={handleGoBack}
                icon="arrow-left"
                style={styles.backButton}
                labelStyle={styles.backLabel}
              >
                Powrót
              </Button>
            )}

            <RadioButton.Group
              onValueChange={setSelectedSound}
              value={selectedSound || ""}
            >
              {renderNavigationItems()}
            </RadioButton.Group>

            {activeTab === "single" && (
              <>
                <Text style={styles.sectionHeader}>Opcje odtwarzania:</Text>
                <View style={styles.checkboxRow}>
                  <Checkbox
                    status={isLooping ? "checked" : "unchecked"}
                    onPress={() => setIsLooping(!isLooping)}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.checkboxLabel}>Odtwarzaj w pętli</Text>
                </View>

                <Button
                  onPress={() => {
                    onSendAudioCommand(isLooping);
                    setIsPlaying(true);
                  }}
                  disabled={!selectedSound}
                  mode="contained"                  style={styles.playButton}
                >
                  Odtwórz
                </Button>

                {isLooping && (
                  <View style={styles.controlIcons}>
                    <IconButton
                      icon={isPlaying ? "pause-circle" : "play-circle"}
                      size={32}
                      onPress={() => {
                        if (isPlaying) {
                          onPauseAudioCommand();
                        } else {
                          onResumeAudioCommand();
                        }
                        setIsPlaying(!isPlaying);
                      }}
                      style={styles.controlIcon}
                      iconColor={theme.colors.primary}
                    />
                    <IconButton
                      icon="stop-circle"
                      size={32}
                      onPress={() => {
                        onStopAudioCommand();
                        setIsPlaying(false);
                        setIsLooping(false);
                      }}
                      style={styles.controlIcon}
                      iconColor={theme.colors.primary}
                    />
                  </View>
                )}
              </>
            )}

            {activeTab === "queue" && (
              <>
                <Text style={styles.sectionHeader}>Opóźnienie (ms):</Text>
                <TextInput
                  mode="outlined"
                  keyboardType="numeric"
                  value={delay}
                  onChangeText={setDelay}
                  style={styles.input}
                  outlineStyle={styles.inputOutline}
                />

                <Button
                  mode="outlined"
                  onPress={addToQueue}
                  disabled={!selectedSound}
                  style={styles.addButton}
                  icon="playlist-plus"
                >
                  Dodaj do kolejki
                </Button>

                <Text style={styles.sectionHeader}>Kolejka dźwięków:</Text>
                <ScrollView style={styles.queueList}>
                  {queue.map((item, index) => (
                    <View key={index} style={styles.queueItem}>              <Text style={styles.queueText}>
                        {item.soundName.split('/').pop()?.replace(/\.wav$/, "") || item.soundName.replace(/\.wav$/, "")} (+{item.delay}ms)
                      </Text>
                      <IconButton
                        icon="close"
                        size={20}
                        onPress={() => removeFromQueue(index)}
                        style={styles.queueIcon}
                        iconColor={theme.colors.error}
                      />
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </ScrollView>
      </Dialog.ScrollArea>

      <Dialog.Actions style={styles.actions}>
        <Button onPress={onDismiss}>Anuluj</Button>
        {activeTab === "queue" && (
          <Button
            onPress={handleSendQueueInternal}
            disabled={queue.length === 0}
            mode="contained"
            icon="send"
          >
            Wyślij ({queue.length})
          </Button>
        )}
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 550,
    width: "90%",
    borderRadius: 12,
    alignSelf: "center",
  },
  dialogScrollArea: {
    maxHeight: Dimensions.get("window").height * 0.6,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 8,
    paddingVertical: 4,
  },
  backLabel: {
    fontWeight: "500",
  },
  soundListContainer: {
    maxHeight: 260,
    marginBottom: 12,
    borderRadius: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  playButton: {
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 8,
    paddingVertical: 6,
  },
  controlIcons: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 8,
    gap: 20,
  },
  controlIcon: {
    marginHorizontal: 8,
  },
  input: {
    marginVertical: 8,
    height: 46,
  },
  inputOutline: {
    borderRadius: 8,
  },
  addButton: {
    marginVertical: 12,
    borderRadius: 8,
    paddingVertical: 4,
  },
  queueList: {
    maxHeight: 120,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  queueItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  queueText: {
    fontSize: 14,
    flex: 1,
  },
  queueIcon: {
    margin: 0,
  },
  actions: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});

export default SoundSelectionDialog;