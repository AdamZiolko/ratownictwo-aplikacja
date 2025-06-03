import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import {
  Text,
  List,
  IconButton,
  Button,
  useTheme,
  RadioButton,
  ActivityIndicator,
} from 'react-native-paper';
import { Audio } from 'expo-av';
import { audioApiService } from '@/services/AudioApiService';
import { loadAudioFromLocal } from '@/app/screens/student/utils/audioUtils';

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

interface ServerAudioFile {
  id: string;
  name: string;
  length: string;
  createdBy: string;
  filepath?: string;
}

interface SoundSelectionComponentProps {
  selectedSound: string | null;
  selectedServerAudioId: string | null;
  onSoundSelect: (
    soundName: string | null,
    serverAudioId: string | null
  ) => void;
  onSoundPreview?: (
    soundName: string | null,
    serverAudioId: string | null
  ) => void;
  style?: any;
  maxHeight?: number;
}

const SoundSelectionComponent: React.FC<SoundSelectionComponentProps> = ({
  selectedSound,
  selectedServerAudioId,
  onSoundSelect,
  onSoundPreview,
  style,
  maxHeight,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'local' | 'server'>('local');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [serverAudioFiles, setServerAudioFiles] = useState<ServerAudioFile[]>(
    []
  );
  const [loadingServerAudio, setLoadingServerAudio] = useState(false);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [currentAudioSound, setCurrentAudioSound] =
    useState<Audio.Sound | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      initializeAudioSystem();
    }

    return () => {
      if (currentAudioSound) {
        currentAudioSound.unloadAsync().catch(console.error);
      }
    };
  }, []);

  const initializeAudioSystem = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'server') {
      loadServerAudioFiles();
    }
  }, [activeTab]);

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
    const newPath = [...currentPath, item];
    setCurrentPath(newPath);
  };

  const handleGoBack = () => {
    if (currentPath.length === 0) return;
    setCurrentPath(currentPath.slice(0, -1));
  };

  const handleSoundSelect = (soundPath: string) => {
    onSoundSelect(soundPath, null);
  };

  const handleServerAudioSelect = (audioId: string) => {
    onSoundSelect(null, audioId);
  };
  const playLocalSound = async (soundPath: string) => {
    try {
      await stopSound();

      setPlayingSound(soundPath);

      if (Platform.OS === 'web') {
        if (onSoundPreview) {
          onSoundPreview(soundPath, null);
        }
        return;
      }

      try {
        const sound = await loadAudioFromLocal(soundPath);

        if (!sound) {
          console.warn(`Failed to load local audio: ${soundPath}`);
          setPlayingSound(null);
          return;
        }

        sound.setOnPlaybackStatusUpdate(status => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingSound(null);
            setCurrentAudioSound(null);
          }
        });

        setCurrentAudioSound(sound);
        await sound.playAsync();

        if (onSoundPreview) {
          onSoundPreview(soundPath, null);
        }
      } catch (audioError) {
        console.warn(
          'Failed to play local audio, falling back to preview handler:',
          audioError
        );
        setPlayingSound(null);
        if (onSoundPreview) {
          onSoundPreview(soundPath, null);
        }
      }
    } catch (error) {
      console.error('Error playing local sound:', error);
      setPlayingSound(null);
    }
  };

  const playServerAudio = async (audioId: string) => {
    try {
      await stopSound();

      setPlayingSound(`server_${audioId}`);

      if (onSoundPreview) {
        onSoundPreview(null, audioId);
      }
    } catch (error) {
      console.error('Error playing server audio:', error);
      setPlayingSound(null);
    }
  };

  const stopSound = async () => {
    try {
      if (currentAudioSound) {
        await currentAudioSound.stopAsync();
        await currentAudioSound.unloadAsync();
        setCurrentAudioSound(null);
      }
      setPlayingSound(null);
    } catch (error) {
      console.error('Error stopping sound:', error);
      setPlayingSound(null);
      setCurrentAudioSound(null);
    }
  };

  const renderNavigationItems = () => {
    const currentLevel = getCurrentLevel();

    if (Array.isArray(currentLevel)) {
      return (
        <View style={styles.soundListContainer}>
          <RadioButton.Group
            onValueChange={handleSoundSelect}
            value={selectedSound || ''}
          >
            {currentLevel.map(item => {
              const soundPath = `${currentPath.join('/')}/${item}.wav`;
              return (
                <List.Item
                  key={item}
                  title={item}
                  style={{ paddingVertical: 2 }}
                  titleStyle={{ fontSize: 14 }}
                  left={() => (
                    <RadioButton
                      value={soundPath}
                      status={
                        selectedSound === soundPath ? 'checked' : 'unchecked'
                      }
                    />
                  )}
                  right={() => (
                    <IconButton
                      icon={playingSound === soundPath ? 'stop' : 'play'}
                      size={20}
                      onPress={async () => {
                        if (playingSound === soundPath) {
                          await stopSound();
                        } else {
                          await playLocalSound(soundPath);
                        }
                      }}
                    />
                  )}
                  onPress={() => handleSoundSelect(soundPath)}
                />
              );
            })}
          </RadioButton.Group>
        </View>
      );
    } else {
      return (
        <View style={styles.soundListContainer}>
          {Object.keys(currentLevel).map(key => (
            <List.Item
              key={key}
              title={key}
              left={() => <IconButton icon="folder" size={24} />}
              style={{ paddingVertical: 2 }}
              titleStyle={{ fontSize: 14 }}
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
      <View style={styles.soundListContainer}>
        <RadioButton.Group
          onValueChange={handleServerAudioSelect}
          value={selectedServerAudioId || ''}
        >
          {serverAudioFiles.map(file => (
            <List.Item
              key={file.id}
              title={file.name}
              description={`Utworzony przez: ${file.createdBy}`}
              style={{ paddingVertical: 2 }}
              titleStyle={{ fontSize: 14 }}
              left={() => (
                <RadioButton
                  value={file.id}
                  status={
                    selectedServerAudioId === file.id ? 'checked' : 'unchecked'
                  }
                />
              )}
              right={() => (
                <IconButton
                  icon={playingSound === `server_${file.id}` ? 'stop' : 'play'}
                  size={20}
                  onPress={async () => {
                    if (playingSound === `server_${file.id}`) {
                      await stopSound();
                    } else {
                      await playServerAudio(file.id);
                    }
                  }}
                />
              )}
              onPress={() => handleServerAudioSelect(file.id)}
            />
          ))}
        </RadioButton.Group>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.tabsContainer}>
        <Button
          mode={activeTab === 'local' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('local')}
          style={styles.tabButton}
          labelStyle={styles.tabLabel}
        >
          Lokalne
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

      <ScrollView style={styles.scrollContainer}>
        {activeTab === 'local' && (
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

            {renderNavigationItems()}
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
            {renderServerAudioList()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Platform.OS === 'web' ? 16 : 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    minHeight: 40,
  },
  tabLabel: {
    fontSize: Platform.OS === 'web' ? 12 : 14,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backLabel: {
    fontSize: 14,
  },
  soundListContainer: {
    flex: 1,
    paddingBottom: 16,
  },
  serverControlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 150,
  },
  loadingText: {
    marginTop: 8,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 150,
  },
});

export default SoundSelectionComponent;
