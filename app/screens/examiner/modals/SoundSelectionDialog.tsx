import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dialog, Button, RadioButton, Text, List, TextInput, IconButton, Checkbox } from 'react-native-paper';
import { Session, SoundQueueItem } from '../types/types';

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
  const [delay, setDelay] = useState('0');
  const [queue, setQueue] = useState<SoundQueueItem[]>([]);
  const [activeTab, setActiveTab] = useState<'single' | 'queue'>('single');
  const [isLooping, setIsLooping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const addToQueue = () => {
    if (selectedSound) {
      const newItem = {
        soundName: selectedSound,
        delay: parseInt(delay) || 0,
      };
      setQueue([...queue, newItem]);
      setSelectedSound(null);
      setDelay('0');
    }
  };

  const removeFromQueue = (index: number) => {
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);
  };

  const handleSendQueue = () => {
    onSendQueue(queue);
    setQueue([]);
    setSelectedSound(null);
  };

  if (!session) return null;

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>Odtwórz dźwięk</Dialog.Title>

      <View style={styles.tabsContainer}>
        <Button
          mode={activeTab === 'single' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('single')}
          style={styles.tabButton}
        >
          Pojedynczy
        </Button>
        <Button
          mode={activeTab === 'queue' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('queue')}
          style={styles.tabButton}
        >
          Kolejka
        </Button>
      </View>

      <Dialog.Content>
        <Text style={styles.sectionHeader}>Wybierz dźwięk:</Text>
        <RadioButton.Group
          onValueChange={setSelectedSound}
          value={selectedSound || ''}
        >
          {[
            { label: 'Kaszel', value: 'kaszel' },
            { label: 'Szum serca', value: 'serce' },
            { label: 'Normalne bicie', value: 'normalne-bicie' },
          ].map(option => (
            <List.Item
              key={option.value}
              title={option.label}
              onPress={() => setSelectedSound(option.value)}
              right={props => (
                <RadioButton {...props} value={option.value} />
              )}
            />
          ))}
        </RadioButton.Group>

        {activeTab === 'single' && (
          <>
            <Text style={styles.sectionHeader}>Odtwarzaj w pętli:</Text>
            <View style={styles.checkboxRow}>
              <Checkbox
                status={isLooping ? 'checked' : 'unchecked'}
                onPress={() => setIsLooping(!isLooping)}
              />
              <Text style={{ alignSelf: 'center' }}>Odtwarzaj w pętli</Text>
            </View>

            <Button
              onPress={() => {
                onSendAudioCommand(isLooping);
                setIsPlaying(true);
              }}
              disabled={!selectedSound}
              mode="contained"
            >
              Odtwórz
            </Button>

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
            />
            <IconButton
              icon="stop-circle"
              size={32}
              onPress={() => {
                onStopAudioCommand();
                setIsPlaying(false);
                setIsLooping(false);
              }}
            />
          </View>
        )}
          </>
        )}

        {activeTab === 'queue' && (
          <>
            <Text style={styles.sectionHeader}>Opóźnienie (ms):</Text>
            <TextInput
              mode="outlined"
              keyboardType="numeric"
              value={delay}
              onChangeText={setDelay}
              style={styles.input}
            />

            <Button
              mode="outlined"
              onPress={addToQueue}
              disabled={!selectedSound}
              style={styles.addButton}
            >
              Dodaj do kolejki
            </Button>

            <Text style={styles.sectionHeader}>Kolejka dźwięków:</Text>
            {queue.map((item, index) => (
              <View key={index} style={styles.queueItem}>
                <Text>
                  {item.soundName} (+{item.delay}ms)
                </Text>
                <Button
                  icon="close"
                  compact
                  onPress={() => removeFromQueue(index)}
                  children={undefined}
                />
              </View>
            ))}
          </>
        )}
      </Dialog.Content>

      <Dialog.Actions>
        <Button onPress={onDismiss}>Anuluj</Button>
        {activeTab === 'queue' && (
          <Button
            onPress={handleSendQueue}
            disabled={queue.length === 0}
            mode="contained"
          >
            Wyślij kolejkę ({queue.length})
          </Button>
        )}
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  sectionHeader: {
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    marginVertical: 10,
  },
  addButton: {
    marginVertical: 10,
  },
  queueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  controlIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
});

export default SoundSelectionDialog;