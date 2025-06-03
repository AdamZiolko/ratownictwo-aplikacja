import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Platform } from 'react-native';
import {
  Text,
  Card,
  Button,
  Snackbar,
  ProgressBar,
  Portal,
  useTheme,
  IconButton,
  Appbar,
} from 'react-native-paper';
import {
  ColorConfig,
  ColorConfigRequest,
  colorConfigService,
} from '@/services/ColorConfigService';
import { socketService } from '@/services/SocketService';
import ExaminerColorSensor from '@/components/ExaminerColorSensor';
import {
  ColorConfigItem,
  ColorConfigModal,
  DeleteConfirmationModal,
  SoundSelectionModal,
  ColorConfigModalData,
} from '@/components/colorConfig';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { getPlayingSoundKey } from '@/components/colorConfig/constants';
import { useBleManager } from '@/components/bleColorSensor';
import { ColorValue } from '@/components/bleColorSensor';

interface ColorConfigTabProps {
  sessionId: string | null;
  sessionCode: string | null;
  onGoBack?: () => void;
}

const ColorConfigTab: React.FC<ColorConfigTabProps> = ({
  sessionId,
  sessionCode,
  onGoBack,
}) => {
  const theme = useTheme();
  const {
    playingSound,
    isLoadingAudio,
    loadingAudioKey,
    playSound,
    stopSound,
  } = useAudioPlayer();

  const [colorConfigs, setColorConfigs] = useState<ColorConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [soundSelectionVisible, setSoundSelectionVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const [modalData, setModalData] = useState<ColorConfigModalData>({
    name: '',
    color: 'custom',
    soundName: '',
    displayName: '',
    customColorRgb: { r: 255, g: 0, b: 0 },
    colorTolerance: 0.15,
  });

  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);

  const [sensorColor, setSensorColor] = useState<ColorValue>({
    r: 0,
    g: 0,
    b: 0,
  });

  const handleSensorColorUpdate = async (color: ColorValue) => {
    setSensorColor(color);
  };

  const {
    status: sensorStatus,
    error: sensorError,
    isReconnecting: sensorReconnecting,
    startConnection: connectSensor,
    disconnectDevice: disconnectSensor,
  } = useBleManager(handleSensorColorUpdate);

  useEffect(() => {
    if (sessionId) {
      loadColorConfigs();
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const handleColorConfigListUpdate = (data: {
      sessionId: string;
      colorConfigs: ColorConfig[];
    }) => {
      if (data.sessionId === sessionId) {
        setColorConfigs(data.colorConfigs);
      }
    };

    const unsubscribeListUpdate = socketService.on(
      'color-config-list-update',
      handleColorConfigListUpdate
    );

    return () => {
      unsubscribeListUpdate();
    };
  }, [sessionId]);

  const loadColorConfigs = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const configs = await colorConfigService.getColorConfigs(sessionId);
      setColorConfigs(configs);
    } catch (error) {
      console.error('Error loading color configs:', error);
      showSnackbar('Błąd podczas ładowania konfiguracji kolorów');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };
  const resetModalData = () => {
    setModalData({
      name: '',
      color: 'custom',
      soundName: '',
      displayName: '',
      serverAudioId: undefined,
      customColorRgb: { r: 255, g: 0, b: 0 },
      colorTolerance: 0.15,
    });
  };

  const handleColorCalibrated = (
    color: string,
    rgbValues: any,
    tolerance: number
  ) => {
    setModalData(prev => ({
      ...prev,
      color: 'custom',
      customColorRgb: rgbValues,
      colorTolerance: tolerance,
    }));
    setAddModalVisible(true);
    showSnackbar(
      `Kalibracja koloru zakończona: RGB(${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b})`
    );
  };

  const openAddModal = () => {
    resetModalData();
    setAddModalVisible(true);
  };
  const openEditModal = (config: ColorConfig) => {
    setModalData({
      id: config.id,
      name: config.displayName || config.soundName || '',
      color: config.color,
      soundName: config.soundName || '',
      displayName: config.displayName,
      serverAudioId: config.serverAudioId,
      customColorRgb: config.customColorRgb || { r: 255, g: 0, b: 0 },
      colorTolerance: config.colorTolerance || 0.15,
    });
    setSelectedConfigId(config.id);
    setEditModalVisible(true);
  };

  const openDeleteModal = (configId: number) => {
    setSelectedConfigId(configId);
    setDeleteModalVisible(true);
  };

  const handleSaveConfig = async () => {
    if (!sessionId) return;
    if (!modalData.name.trim()) {
      showSnackbar('Nazwa dźwięku jest wymagana');
      return;
    }

    if (modalData.color === 'custom' && Platform.OS === 'web') {
      if (
        !modalData.customColorRgb ||
        modalData.customColorRgb.r < 0 ||
        modalData.customColorRgb.r > 255 ||
        modalData.customColorRgb.g < 0 ||
        modalData.customColorRgb.g > 255 ||
        modalData.customColorRgb.b < 0 ||
        modalData.customColorRgb.b > 255
      ) {
        showSnackbar(
          'Dla koloru niestandardowego wymagane są prawidłowe wartości RGB (0-255)'
        );
        return;
      }
    }
    if (!modalData.id) {
      if (modalData.customColorRgb) {
        const existingCustomConfig = colorConfigs.find(
          config =>
            config.color === 'custom' &&
            config.customColorRgb &&
            config.customColorRgb.r === modalData.customColorRgb!.r &&
            config.customColorRgb.g === modalData.customColorRgb!.g &&
            config.customColorRgb.b === modalData.customColorRgb!.b
        );
        if (existingCustomConfig) {
          showSnackbar('Konfiguracja z tymi wartościami RGB już istnieje');
          return;
        }
      }
    } else {
      const currentConfig = colorConfigs.find(
        config => config.id === modalData.id
      );

      if (currentConfig && modalData.customColorRgb) {
        const conflictingCustomConfig = colorConfigs.find(
          config =>
            config.id !== modalData.id &&
            config.color === 'custom' &&
            config.customColorRgb &&
            config.customColorRgb.r === modalData.customColorRgb!.r &&
            config.customColorRgb.g === modalData.customColorRgb!.g &&
            config.customColorRgb.b === modalData.customColorRgb!.b
        );
        if (conflictingCustomConfig) {
          showSnackbar('Konfiguracja z tymi wartościami RGB już istnieje');
          return;
        }
      }
    }

    setModalLoading(true);
    try {
      const configRequest: ColorConfigRequest = {
        color: modalData.color as any,
        soundName: modalData.soundName,
        displayName: modalData.displayName || modalData.name,
        serverAudioId: modalData.serverAudioId,
        isEnabled: true,
        volume: 1.0,
        isLooping: false,
        customColorRgb: modalData.customColorRgb,
        colorTolerance: modalData.colorTolerance,
        ...(modalData.id && { id: modalData.id }),
      };

      await colorConfigService.saveColorConfig(sessionId, configRequest);

      showSnackbar(
        modalData.id ? 'Konfiguracja zaktualizowana' : 'Konfiguracja dodana'
      );

      if (sensorStatus === 'monitoring') {
        disconnectSensor();
      }

      setAddModalVisible(false);
      setEditModalVisible(false);
      resetModalData();
      await loadColorConfigs();
    } catch (error) {
      console.error('Error saving config:', error);
      showSnackbar('Błąd podczas zapisywania konfiguracji');
    } finally {
      setModalLoading(false);
    }
  };
  const handleDeleteConfig = async () => {
    if (!sessionId || !selectedConfigId) return;

    const configToDelete = colorConfigs.find(c => c.id === selectedConfigId);
    if (!configToDelete) return;

    setModalLoading(true);
    try {
      await colorConfigService.deleteColorConfig(sessionId, configToDelete.id);
      showSnackbar('Konfiguracja usunięta');
      setDeleteModalVisible(false);
      setSelectedConfigId(null);
      await loadColorConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
      showSnackbar('Błąd podczas usuwania konfiguracji');
    } finally {
      setModalLoading(false);
    }
  };

  const handlePlaySound = async (config: ColorConfig) => {
    if (isLoadingAudio) return;

    const soundKey = getPlayingSoundKey(config);

    if (playingSound === soundKey) {
      await stopSound();
    } else {
      try {
        if (config.serverAudioId) {
          await playSound(config.soundName || '', true, config.serverAudioId);
        } else if (config.soundName) {
          await playSound(config.soundName);
        }
      } catch (error) {
        showSnackbar('Błąd podczas odtwarzania dźwięku');
      }
    }
  };
  const handleSoundSelection = (
    soundName: string | null,
    serverAudioId: string | null
  ) => {
    if (serverAudioId) {
      setModalData(prev => ({
        ...prev,
        soundName: '',
        displayName: '',
        serverAudioId: serverAudioId,
      }));
    } else if (soundName) {
      const pathParts = soundName.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const displayName = fileName.replace(/\.[^/.]+$/, '');

      setModalData(prev => ({
        ...prev,
        name: displayName,
        soundName: soundName,
        displayName: displayName,
        serverAudioId: undefined,
      }));
    }
    setSoundSelectionVisible(false);
  };
  const handleSoundPreview = async (
    soundName: string | null,
    serverAudioId: string | null
  ) => {
    try {
      if (serverAudioId) {
        await playSound('', true, serverAudioId);
      } else if (soundName) {
        await playSound(soundName);
      }
    } catch (error) {
      showSnackbar('Błąd podczas odtwarzania podglądu dźwięku');
    }
  };

  const handleAcceptSensorColor = () => {
    if (sensorStatus !== 'monitoring') {
      showSnackbar('Czujnik nie jest połączony');
      return;
    }

    const { r, g, b } = sensorColor;
    const totalBrightness = r + g + b;

    if (totalBrightness < 100) {
      showSnackbar(
        'Zbyt niska jasność koloru. Przyłóż czujnik do obiektu o wyraźnym kolorze.'
      );
      return;
    }

    setModalData(prev => ({
      ...prev,
      customColorRgb: { r, g, b },
    }));

    showSnackbar(`Kolor zaakceptowany: RGB(${r}, ${g}, ${b})`);
  };

  const renderColorConfigItem = ({ item }: { item: ColorConfig }) => (
    <ColorConfigItem
      item={item}
      onPlay={handlePlaySound}
      onEdit={openEditModal}
      onDelete={openDeleteModal}
      isLoadingAudio={isLoadingAudio}
      playingSound={playingSound}
      loadingAudioKey={loadingAudioKey}
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
        Brak konfiguracji kolorów dla tej sesji
      </Text>
      <Text
        style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}
      >
        Dodaj pierwszą konfigurację używając przycisku poniżej
      </Text>
    </View>
  );
  if (!sessionId) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
            Brak wybranej sesji
          </Text>
          <Text
            style={[
              styles.emptySubtext,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Aby zarządzać konfiguracją kolorów, wróć do karty "Sesje" i kliknij
            przycisk palety kolorów (🎨) przy wybranej sesji
          </Text>
          {onGoBack && (
            <Button
              mode="contained"
              onPress={onGoBack}
              style={{ marginTop: 16 }}
            >
              Powrót do sesji
            </Button>
          )}
        </View>
      </View>
    );
  }
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {sessionCode && onGoBack && (
        <Appbar.Header>
          <Appbar.BackAction onPress={onGoBack} />
          <Appbar.Content
            title="Konfiguracja kolorów"
            subtitle={`Sesja: ${sessionCode}`}
          />
        </Appbar.Header>
      )}
      {sessionCode && !onGoBack && (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                Konfiguracja kolorów
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Sesja: {sessionCode}
              </Text>
            </View>
          </View>
        </View>
      )}
      {loading && <ProgressBar indeterminate style={styles.progressBar} />}
      <FlatList
        data={colorConfigs}
        renderItem={renderColorConfigItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.addButtonContainer}>
        <Button
          mode="contained"
          icon="plus"
          onPress={isLoadingAudio ? undefined : openAddModal}
          disabled={isLoadingAudio}
          style={[styles.addButton]}
        >
          Dodaj konfigurację
        </Button>
      </View>
      <Portal>
        <ColorConfigModal
          visible={addModalVisible || editModalVisible}
          isEditMode={editModalVisible}
          modalData={modalData}
          modalLoading={modalLoading}
          isLoadingAudio={isLoadingAudio}
          onDismiss={() => {
            if (sensorStatus === 'monitoring') {
              disconnectSensor();
            }

            setAddModalVisible(false);
            setEditModalVisible(false);
            resetModalData();
          }}
          onSave={handleSaveConfig}
          onSoundSelection={() => {
            setSoundSelectionVisible(true);
          }}
          onModalDataChange={data =>
            setModalData(prev => ({ ...prev, ...data }))
          }
          sensorStatus={sensorStatus}
          sensorColor={sensorColor}
          onConnectSensor={connectSensor}
          onDisconnectSensor={disconnectSensor}
          onAcceptSensorColor={handleAcceptSensorColor}
        />
        <DeleteConfirmationModal
          visible={deleteModalVisible}
          loading={modalLoading}
          isLoadingAudio={isLoadingAudio}
          onConfirm={handleDeleteConfig}
          onCancel={() => {
            setDeleteModalVisible(false);
            setSelectedConfigId(null);
          }}
        />
        <SoundSelectionModal
          visible={soundSelectionVisible}
          selectedSound={modalData.soundName}
          selectedServerAudioId={modalData.serverAudioId || null}
          isLoadingAudio={isLoadingAudio}
          onSoundSelect={handleSoundSelection}
          onSoundPreview={handleSoundPreview}
          onClose={() => setSoundSelectionVisible(false)}
        />
      </Portal>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  progressBar: {
    marginBottom: 16,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.7,
  },
  noSessionText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 20,
    borderRadius: 28,
    elevation: 6,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    alignItems: 'stretch',
  },
  addButton: {
    borderRadius: 8,
    minHeight: 48,
    width: 200,
    alignSelf: 'flex-end',
  },
  addButtonContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensorCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default ColorConfigTab;
