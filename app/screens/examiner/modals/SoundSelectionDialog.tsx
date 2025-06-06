import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Dimensions } from 'react-native';
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
  ActivityIndicator,
} from 'react-native-paper';
import { Session, SoundQueueItem } from '../types/types';
import { audioApiService } from '@/services/AudioApiService';

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
  onServerAudioCommand?: (audioId: string, loop?: boolean) => void;
  onServerAudioPauseCommand?: (audioId: string) => void;
  onServerAudioResumeCommand?: (audioId: string) => void;
  onServerAudioStopCommand?: (audioId: string) => void;
  lastLoopedSound: string | null;

  isColorAssignmentMode?: boolean;
  onSoundAssign?: (
    soundName: string | null,
    serverAudioId: string | null,
    isLooping: boolean
  ) => void;
}

interface ServerAudioFile {
  id: string;
  name: string;
  length: string;
  createdAt: string;
  createdBy: string;
}

const soundStructure = {
  Adult: {
    Female: [
      'Breathing through contractions',
      'Coughing',
      'Distressed',
      'Hawk',
      'Moaning',
      'No',
      'Ok',
      'Pain',
      'Pushing - long double',
      'Pushing - long',
      'Pushing - single',
      'Screaming',
      'Sob breathing (type 2)',
      'Sob breathing',
      'Vomiting',
      'Yes',
    ],
    Male: [
      'Coughing (long)',
      'Coughing',
      'Difficult breathing',
      'Hawk',
      'Moaning (long)',
      'Moaning',
      'No',
      'Ok',
      'Screaming (type 2)',
      'Screaming',
      'Sob breathing',
      'Vomiting (type 2)',
      'Vomiting (type 3)',
      'Vomiting',
      'Yes',
    ],
  },
  Child: [
    'Coughing',
    'Hawk',
    'Moaning',
    'No',
    'Ok',
    'Screaming',
    'Sob breathing',
    'Vomiting (type 2)',
    'Vomiting',
    'Yes',
  ],
  Geriatric: {
    Female: ['Coughing', 'Moaning', 'No', 'Screaming', 'Vomiting', 'Yes'],
    Male: ['Coughing', 'Moaning', 'No', 'Screaming', 'Vomiting', 'Yes'],
  },
  Infant: [
    'Content',
    'Cough',
    'Grunt',
    'Hawk',
    'Hiccup',
    'Screaming',
    'Strongcry (type 2)',
    'Strongcry',
    'Weakcry',
  ],
  Speech: [
    'Chest hurts',
    'Doc I feel I could die',
    'Go away',
    "I don't feel dizzy",
    "I don't feel well",
    'I feel better now',
    'I feel really bad',
    "I'm feeling very dizzy",
    "I'm fine",
    "I'm quite nauseous",
    "I'm really hungry",
    "I'm really thirsty",
    "I'm so sick",
    'Never had pain like this before',
    'No allergies',
    'No diabetes',
    'No lung or cardiac problems',
    'No',
    'Pain for 2 hours',
    'Something for this pain',
    'Thank you',
    'That helped',
    'Yes',
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
  onServerAudioCommand,
  onServerAudioPauseCommand,
  onServerAudioResumeCommand,
  onServerAudioStopCommand,
  isColorAssignmentMode = false,
  onSoundAssign,
  lastLoopedSound,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'single' | 'queue' | 'server'>(
    'single'
  );
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isLooping, setIsLooping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [delay, setDelay] = useState('0');
  const [queue, setQueue] = useState<SoundQueueItem[]>([]);
  const [serverAudioFiles, setServerAudioFiles] = useState<ServerAudioFile[]>(
    []
  );
  const [loadingServerAudio, setLoadingServerAudio] = useState(false);
  const [selectedServerAudioId, setSelectedServerAudioId] = useState<
    string | null
  >(null);
  const [serverIsLooping, setServerIsLooping] = useState(false);
  const [serverIsPlaying, setServerIsPlaying] = useState(false);

  useEffect(() => {
    if (lastLoopedSound) {
      setSelectedSound(lastLoopedSound);
      setIsPlaying(true);
      setIsLooping(true);
    }
  }, [visible, lastLoopedSound]);

  useEffect(() => {
    if (activeTab === 'server' && visible) {
      loadServerAudioFiles();
    }
  }, [activeTab, visible]);

  const loadServerAudioFiles = async () => {
    try {
      setLoadingServerAudio(true);
      const response = await audioApiService.getAudioList();
      setServerAudioFiles(response);
    } catch (error) {
      console.error('Error loading server audio files:', error);
    } finally {
      setLoadingServerAudio(false);
    }
  };

  const getCurrentLevel = () => {
    let currentLevel: any = soundStructure;
    for (const pathPart of currentPath) {
      currentLevel = currentLevel[pathPart];
    }
    return currentLevel;
  };

  const handleNavigate = (item: string) => {
    setCurrentPath(prev => [...prev, item]);
  };

  const handleGoBack = () => {
    if (currentPath.length === 0) return;
    setCurrentPath(prev => prev.slice(0, -1));
  };

  const renderNavigationItems = () => {
    const currentLevel = getCurrentLevel();

    if (Array.isArray(currentLevel)) {
      return (
        <View style={styles.listWrapper}>
          <RadioButton.Group
            onValueChange={setSelectedSound}
            value={selectedSound || ''}
          >
            {currentLevel.map(item => (
              <List.Item
                key={item}
                title={item}
                style={styles.listItem}
                titleStyle={styles.listItemText}
                left={() => (
                  <RadioButton value={`${currentPath.join('/')}/${item}`} />
                )}
                onPress={() =>
                  setSelectedSound(`${currentPath.join('/')}/${item}`)
                }
              />
            ))}
          </RadioButton.Group>
        </View>
      );
    } else {
      return (
        <View style={styles.listWrapper}>
          {Object.keys(currentLevel).map(key => (
            <List.Item
              key={key}
              title={key}
              left={() => <IconButton icon="folder" size={24} />}
              style={styles.listItem}
              titleStyle={styles.listItemText}
              onPress={() => handleNavigate(key)}
            />
          ))}
        </View>
      );
    }
  };

  const renderServerAudioList = () => {
    if (loadingServerAudio) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>
            Ładowanie plików audio z serwera...
          </Text>
        </View>
      );
    }

    if (serverAudioFiles.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text>Brak plików audio na serwerze</Text>
        </View>
      );
    }

    return (
      <View style={styles.listWrapper}>
        <RadioButton.Group
          onValueChange={value => setSelectedServerAudioId(value)}
          value={selectedServerAudioId || ''}
        >
          {serverAudioFiles.map(file => (
            <List.Item
              key={file.id}
              title={file.name}
              description={`Utworzony przez: ${file.createdBy}`}
              style={styles.listItem}
              titleStyle={styles.listItemText}
              left={() => (
                <RadioButton
                  value={file.id}
                  status={
                    selectedServerAudioId === file.id ? 'checked' : 'unchecked'
                  }
                />
              )}
              right={() => (
                <View style={{ flexDirection: 'row' }}>
                  <IconButton
                    icon="play"
                    size={20}
                    onPress={() => {
                      setSelectedServerAudioId(file.id);
                      handleServerAudioPlayback();
                    }}
                    disabled={serverIsPlaying && selectedServerAudioId === file.id}
                  />
                  <IconButton
                    icon="stop"
                    size={20}
                    onPress={() => {
                      setSelectedServerAudioId(file.id);
                      handleServerAudioStop();
                    }}
                    disabled={!serverIsPlaying || selectedServerAudioId !== file.id}
                  />
                </View>
              )}
              onPress={() => setSelectedServerAudioId(file.id)}
            />
          ))}
        </RadioButton.Group>
      </View>
    );
  };

  const addToQueue = () => {
    if (selectedSound) {
      const newItem: SoundQueueItem = {
        soundName: selectedSound,
        delay: parseInt(delay) || 0,
      };
      setQueue(prev => [...prev, newItem]);
      setSelectedSound(null);
      setDelay('0');
    }
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendQueueInternal = () => {
    onSendQueue(queue);
    setQueue([]);
    setSelectedSound(null);
  };

  const handleServerAudioPlayback = () => {
    if (onServerAudioCommand && selectedServerAudioId) {
      onServerAudioCommand(selectedServerAudioId, serverIsLooping);
      setServerIsPlaying(true);
    }
  };

  const handleServerAudioPause = () => {
    if (onServerAudioPauseCommand && selectedServerAudioId) {
      onServerAudioPauseCommand(selectedServerAudioId);
      setServerIsPlaying(false);
    }
  };

  const handleServerAudioResume = () => {
    if (onServerAudioResumeCommand && selectedServerAudioId) {
      onServerAudioResumeCommand(selectedServerAudioId);
      setServerIsPlaying(true);
    }
  };
  const handleServerAudioStop = () => {
    if (onServerAudioStopCommand && selectedServerAudioId) {
      onServerAudioStopCommand(selectedServerAudioId);
      setServerIsPlaying(false);
      setServerIsLooping(false);
    }
  };

  const handleAssignSound = () => {
    if (onSoundAssign && selectedSound) {
      onSoundAssign(selectedSound, null, isLooping);
    }
  };

  const handleAssignServerAudio = () => {
    if (onSoundAssign && selectedServerAudioId) {
      onSoundAssign(null, selectedServerAudioId, serverIsLooping);
    }
  };

  if (!session) return null;

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
      <Dialog.Title style={styles.title}>
        {isColorAssignmentMode ? 'Wybierz dźwięk dla koloru' : 'Odtwórz dźwięk'}
      </Dialog.Title>
      <View style={styles.tabsContainer}>
        <Button
          mode={activeTab === 'single' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('single')}
          style={styles.tabButton}
          labelStyle={styles.tabLabel}
        >
          Pojedynczy
        </Button>
        <Button
          mode={activeTab === 'queue' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('queue')}
          style={styles.tabButton}
          labelStyle={styles.tabLabel}
        >
          Kolejka
        </Button>
        <Button
          mode={activeTab === 'server' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('server')}
          style={styles.tabButton}
          labelStyle={styles.tabLabel}
        >
          Serwer
        </Button>
      </View>
      <Dialog.Content style={styles.contentContainer}>
        <ScrollView 
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ flexGrow: 1 }}
        >
        {(activeTab === 'single' || activeTab === 'queue') && (
          <>
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
            <ScrollView 
              style={styles.listContainer}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <RadioButton.Group
                onValueChange={setSelectedSound}
                value={selectedSound || ''}
              >
                {renderNavigationItems()}
              </RadioButton.Group>
            </ScrollView>
          </>
        )}

        {activeTab === 'server' && (
          <>
            <View style={styles.serverControlsHeader}>
              <Text style={styles.sectionHeader}>Pliki audio serwera:</Text>
              <Button
                mode="text"
                icon="refresh"
                onPress={loadServerAudioFiles}
                disabled={loadingServerAudio}
              >
                Odśwież
              </Button>
            </View>
            <ScrollView 
              style={styles.listContainer}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {renderServerAudioList()}
            </ScrollView>
          </>
        )}
        {activeTab === 'single' && (
          <View style={styles.bottomPane}>
            <Text style={styles.sectionHeader}>Opcje odtwarzania:</Text>
            <View style={styles.checkboxRow}>
              <Checkbox
                status={isLooping ? 'checked' : 'unchecked'}
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
              mode="contained"
              style={styles.playButton}
            >
              Odtwórz
              {selectedSound
                ? `(${selectedSound.split('/').pop()})`
                : '(wybierz dźwięk)'}
            </Button>

            {isColorAssignmentMode && (
              <Button
                onPress={handleAssignSound}
                disabled={!selectedSound}
                mode="contained"
                style={[styles.playButton, { backgroundColor: '#4CAF50' }]}
                icon="check"
              >
                Przypisz dźwięk
                {selectedSound
                  ? `(${selectedSound.split('/').pop()})`
                  : '(wybierz dźwięk)'}
              </Button>
            )}

            {isLooping && (
              <View style={styles.controlIcons}>
                <IconButton
                  icon={isPlaying ? 'pause-circle' : 'play-circle'}
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
          </View>
        )}

        {activeTab === 'server' && (
          <View style={styles.bottomPane}>
            <Text style={styles.sectionHeader}>Opcje odtwarzania:</Text>
            <View style={styles.checkboxRow}>
              <Checkbox
                status={serverIsLooping ? 'checked' : 'unchecked'}
                onPress={() => setServerIsLooping(!serverIsLooping)}
                color={theme.colors.primary}
              />
              <Text style={styles.checkboxLabel}>Odtwarzaj w pętli</Text>
            </View>

            <Button
              onPress={handleServerAudioPlayback}
              disabled={!selectedServerAudioId || !onServerAudioCommand}
              mode="contained"
              style={styles.playButton}
            >
              Odtwórz dla całej sesji
              {selectedServerAudioId
                ? `(${
                    serverAudioFiles.find(f => f.id === selectedServerAudioId)
                      ?.name
                  })`
                : '(wybierz plik)'}
            </Button>

            {isColorAssignmentMode && (
              <Button
                onPress={handleAssignServerAudio}
                disabled={!selectedServerAudioId}
                mode="contained"
                style={[styles.playButton, { backgroundColor: '#4CAF50' }]}
                icon="check"
              >
                Przypisz plik
                {selectedServerAudioId
                  ? `(${
                      serverAudioFiles.find(f => f.id === selectedServerAudioId)
                        ?.name
                    })`
                  : '(wybierz plik)'}
              </Button>
            )}

            {serverIsLooping && (
              <View style={styles.controlIcons}>
                <IconButton
                  icon={serverIsPlaying ? 'pause-circle' : 'play-circle'}
                  size={32}
                  onPress={() => {
                    if (serverIsPlaying) {
                      handleServerAudioPause();
                    } else {
                      handleServerAudioResume();
                    }
                  }}
                  style={styles.controlIcon}
                  iconColor={theme.colors.primary}
                  disabled={
                    !onServerAudioPauseCommand || !onServerAudioResumeCommand
                  }
                />
                <IconButton
                  icon="stop-circle"
                  size={32}
                  onPress={handleServerAudioStop}
                  style={styles.controlIcon}
                  iconColor={theme.colors.primary}
                  disabled={!onServerAudioStopCommand}
                />
              </View>
            )}
          </View>
        )}

        {activeTab === 'queue' && (
          <View style={styles.bottomPane}>
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
                <View key={index} style={styles.queueItem}>
                  <Text style={styles.queueText}>
                    {item.soundName
                      .split('/')
                      .pop()
                      ?.replace(/\.wav$/, '') ||
                      item.soundName.replace(/\.wav$/, '')}
                    (+{item.delay}ms)
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
          </View>
        )}
        </ScrollView>
      </Dialog.Content>

      <Dialog.Actions style={styles.actions}>
        <Button onPress={onDismiss}>Anuluj</Button>
        {activeTab === 'queue' && (
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

const { width, height } = Dimensions.get('window');
const isLandscape = width > height;
const isTablet = width > 768;

const styles = StyleSheet.create({
  dialog: {
    maxWidth: isTablet ? 550 : width * 0.95,
    width: isTablet ? '90%' : '95%',
    maxHeight: isLandscape ? height * 0.9 : height * 0.8,
    borderRadius: 12,
    alignSelf: 'center',
  },
  title: {
    fontSize: isLandscape ? 18 : 20,
    fontWeight: '700',
    paddingHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: isLandscape ? 8 : 16,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: isLandscape ? height * 0.65 : height * 0.6,
    minHeight: isLandscape ? height * 0.4 : height * 0.4,
  },
  debugContainer: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    marginBottom: 12,
    borderRadius: 4,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: isLandscape ? 8 : 12,
    marginBottom: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
  },
  backLabel: {
    fontWeight: '500',
  },
  listContainer: {
    maxHeight: isLandscape ? height * 0.35 : 300,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
  },
  listWrapper: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  listItem: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    minHeight: 48,
  },
  listItemText: {
    fontSize: 14,
  },
  bottomPane: {
    marginTop: isLandscape ? 4 : 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  playButton: {
    marginTop: isLandscape ? 8 : 12,
    marginBottom: isLandscape ? 12 : 16,
    borderRadius: 8,
    paddingVertical: 6,
  },
  controlIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
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
    maxHeight: isLandscape ? height * 0.15 : 120,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  queueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  serverControlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

export default SoundSelectionDialog;
