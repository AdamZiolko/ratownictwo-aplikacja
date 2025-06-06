import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Dialog, TextInput, Button, Text, useTheme } from 'react-native-paper';

const screenHeight = Dimensions.get('window').height;

export interface ColorConfigModalData {
  id?: number;
  name: string;
  color: 'custom';
  colorIdentifier?: string;
  soundName: string;
  displayName?: string;
  serverAudioId?: string;
  customColorRgb?: { r: number; g: number; b: number };
  colorTolerance?: number;
}

interface ColorConfigModalProps {
  visible: boolean;
  isEditMode: boolean;
  modalData: ColorConfigModalData;
  modalLoading: boolean;
  isLoadingAudio: boolean;
  onDismiss: () => void;
  onSave: () => void;
  onSoundSelection: () => void;
  onModalDataChange: (data: Partial<ColorConfigModalData>) => void;

  sensorStatus?: 'idle' | 'scanning' | 'connected' | 'monitoring' | 'error';
  sensorColor?: { r: number; g: number; b: number };
  onConnectSensor?: () => void;
  onDisconnectSensor?: () => void;
  onAcceptSensorColor?: () => void;
}

const ColorConfigModal: React.FC<ColorConfigModalProps> = ({
  visible,
  isEditMode,
  modalData,
  modalLoading,
  isLoadingAudio,
  onDismiss,
  onSave,
  onSoundSelection,
  onModalDataChange,

  sensorStatus = 'idle',
  sensorColor = { r: 0, g: 0, b: 0 },
  onConnectSensor,
  onDisconnectSensor,
  onAcceptSensorColor,
}) => {
  const theme = useTheme();

  const handleToleranceChange = (text: string) => {
    const percentage = parseFloat(text);
    if (!isNaN(percentage) && percentage >= 5 && percentage <= 50) {
      onModalDataChange({ colorTolerance: percentage / 100 });
    }
  };
  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={Platform.OS === 'web' ? styles.webDialog : styles.dialog}
      dismissable={!modalLoading && !isLoadingAudio}
    >
      <Dialog.Title>
        {isEditMode ? 'Edytuj konfigurację' : 'Dodaj konfigurację'}
      </Dialog.Title>
      <Dialog.Content
        style={
          Platform.OS === 'web' ? styles.webDialogContent : styles.dialogContent
        }
      >
        <ScrollView
          style={
            Platform.OS === 'web'
              ? styles.webModalScrollContainer
              : styles.modalScrollContainer
          }
          showsVerticalScrollIndicator={Platform.OS !== 'web'}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 8,
            paddingBottom: 16,
          }}
        >
          <TextInput
            label="Nazwa wyświetlana"
            value={modalData.name}
            onChangeText={text =>
              onModalDataChange({
                name: text,
                displayName: text,
              })
            }
            style={styles.input}
            disabled={modalLoading}
            right={
              <TextInput.Icon
                icon="music"
                size={Platform.OS === 'web' ? 20 : 24}
                onPress={() => {
                  if (!modalLoading && !isLoadingAudio) {
                    try {
                      onSoundSelection();
                    } catch (error) {
                      console.error(
                        'Error opening sound selection from icon:',
                        error
                      );
                    }
                  } else {
                  }
                }}
                disabled={modalLoading || isLoadingAudio}
              />
            }
          />
          <Button
            mode="outlined"
            onPress={() => {
              if (!modalLoading && !isLoadingAudio) {
                try {
                  onSoundSelection();
                } catch (error) {
                  console.error('Error opening sound selection:', error);
                }
              } else {
              }
            }}
            style={styles.soundSelectionButton}
            icon="folder-music"
            disabled={modalLoading || isLoadingAudio}
            labelStyle={styles.soundSelectionButtonLabel}
            contentStyle={styles.soundSelectionButtonContent}
          >
            <Text>Wybierz dźwięk z biblioteki</Text>
          </Button>
          <View>
            <Text
              style={[styles.sectionLabel, { color: theme.colors.onSurface }]}
            >
              Konfiguracja koloru RGB:
            </Text>
            {Platform.OS === 'web' && (
              <View style={styles.webCustomColorSection}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  Kolor niestandardowy (RGB):
                </Text>
                <View style={styles.rgbInputContainer}>
                  <TextInput
                    label="R (0-255)"
                    value={modalData.customColorRgb?.r?.toString() || '255'}
                    onChangeText={text => {
                      const r = parseInt(text) || 0;
                      const clampedR = Math.max(0, Math.min(255, r));
                      onModalDataChange({
                        customColorRgb: {
                          ...modalData.customColorRgb,
                          r: clampedR,
                          g: modalData.customColorRgb?.g || 0,
                          b: modalData.customColorRgb?.b || 0,
                        },
                        color: 'custom',
                      });
                    }}
                    style={[styles.input, styles.rgbInput]}
                    keyboardType="numeric"
                    disabled={modalLoading}
                  />
                  <TextInput
                    label="G (0-255)"
                    value={modalData.customColorRgb?.g?.toString() || '0'}
                    onChangeText={text => {
                      const g = parseInt(text) || 0;
                      const clampedG = Math.max(0, Math.min(255, g));
                      onModalDataChange({
                        customColorRgb: {
                          r: modalData.customColorRgb?.r || 255,
                          g: clampedG,
                          b: modalData.customColorRgb?.b || 0,
                        },
                        color: 'custom',
                      });
                    }}
                    style={[styles.input, styles.rgbInput]}
                    keyboardType="numeric"
                    disabled={modalLoading}
                  />
                  <TextInput
                    label="B (0-255)"
                    value={modalData.customColorRgb?.b?.toString() || '0'}
                    onChangeText={text => {
                      const b = parseInt(text) || 0;
                      const clampedB = Math.max(0, Math.min(255, b));
                      onModalDataChange({
                        customColorRgb: {
                          r: modalData.customColorRgb?.r || 255,
                          g: modalData.customColorRgb?.g || 0,
                          b: clampedB,
                        },
                        color: 'custom',
                      });
                    }}
                    style={[styles.input, styles.rgbInput]}
                    keyboardType="numeric"
                    disabled={modalLoading}
                  />
                </View>
                {modalData.customColorRgb && (
                  <View style={styles.colorPreviewContainer}>
                    <View
                      style={[
                        styles.colorPreviewLarge,
                        {
                          backgroundColor: `rgb(${modalData.customColorRgb.r}, ${modalData.customColorRgb.g}, ${modalData.customColorRgb.b})`,
                        },
                      ]}
                    />
                  </View>
                )}
                <View style={styles.toleranceContainer}>
                  <TextInput
                    label="Tolerancja (5-50%)"
                    value={(
                      (modalData.colorTolerance || 0.15) * 100
                    ).toString()}
                    onChangeText={handleToleranceChange}
                    style={[styles.input, styles.toleranceInput]}
                    keyboardType="numeric"
                    disabled={modalLoading}
                  />
                </View>
              </View>
            )}
            {Platform.OS !== 'web' && (
              <View style={styles.sensorSection}>
                <Text
                  style={[
                    styles.sensorSectionTitle,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  Czujnik kolorów
                </Text>
                <View style={styles.sensorControls}>
                  {sensorStatus === 'idle' || sensorStatus === 'error' ? (
                    <Button
                      mode="outlined"
                      onPress={onConnectSensor}
                      disabled={modalLoading}
                      style={styles.sensorButton}
                      icon="bluetooth"
                    >
                      <Text>Połącz czujnik</Text>
                    </Button>
                  ) : sensorStatus === 'scanning' ||
                    sensorStatus === 'connected' ? (
                    <Button
                      mode="outlined"
                      disabled
                      style={styles.sensorButton}
                      icon="bluetooth-connect"
                    >
                      <Text>Łączenie...</Text>
                    </Button>
                  ) : (
                    <Button
                      mode="outlined"
                      onPress={onDisconnectSensor}
                      disabled={modalLoading}
                      style={styles.sensorButton}
                      icon="bluetooth-off"
                    >
                      <Text>Rozłącz czujnik</Text>
                    </Button>
                  )}
                </View>
                {sensorStatus === 'monitoring' && (
                  <View style={styles.sensorDataSection}>
                    <Text
                      style={[
                        styles.sensorDataTitle,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      Wartości na żywo z czujnika:
                    </Text>
                    <View style={styles.liveColorDisplay}>
                      <View
                        style={[
                          styles.liveColorBox,
                          {
                            backgroundColor: `rgb(${sensorColor.r}, ${sensorColor.g}, ${sensorColor.b})`,
                            borderColor: theme.colors.outline,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.liveColorValues,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        R: {sensorColor.r}, G: {sensorColor.g}, B:
                        {sensorColor.b}
                      </Text>
                    </View>
                    <Button
                      mode="contained"
                      onPress={onAcceptSensorColor}
                      style={styles.acceptColorButton}
                      disabled={modalLoading}
                      icon="check"
                    >
                      <Text>Akceptuj ten kolor</Text>
                    </Button>
                  </View>
                )}
              </View>
            )}
          </View>
          <View style={styles.buttonContainer}>
            <Button
              onPress={onDismiss}
              disabled={modalLoading || isLoadingAudio}
              mode="outlined"
              style={styles.button}
            >
              Anuluj
            </Button>
            <Button
              onPress={onSave}
              mode="contained"
              loading={modalLoading}
              disabled={modalLoading || isLoadingAudio}
              style={styles.button}
            >
              Zapisz
            </Button>
          </View>
        </ScrollView>
      </Dialog.Content>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  dialog: {
    width: '80%',
    alignSelf: 'center',
    zIndex: 9999,
    elevation: 24,
  },
  webDialog: {
    width: '90%',
    maxWidth: 600,
    maxHeight: screenHeight * 0.9,
    alignSelf: 'center',
    zIndex: 9999,
    elevation: 24,
  },
  dialogContent: {
    padding: 0,
  },
  webDialogContent: {
    padding: 0,
    maxHeight: screenHeight * 0.75,
  },
  modalScrollContainer: {
    maxHeight: '90%',
  },
  webModalScrollContainer: {
    maxHeight: screenHeight * 0.7,
    flex: 1,
  },
  input: {
    marginBottom: 16,
  },
  soundSelectionButton: {
    marginBottom: 16,
    marginTop: 8,
  },
  soundSelectionButtonLabel: {
    fontSize: Platform.OS === 'web' ? 14 : 16,
    fontWeight: '500',
  },
  soundSelectionButtonContent: {
    height: Platform.OS === 'web' ? 40 : 48,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 4,
  },
  colorPreview: {
    marginRight: 12,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: 16,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 16,
    gap: 16,
  },
  button: {
    flex: 1,
  },
  rgbContainer: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  colorPreviewContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
  },
  colorPreviewLarge: {
    width: 120,
    height: 80,
    borderRadius: 12,
    elevation: 3,
    marginTop: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  toleranceContainer: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  toleranceInput: {
    marginTop: 8,
  },

  sensorSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  sensorSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sensorControls: {
    marginBottom: 16,
  },
  sensorButton: {
    marginVertical: 4,
  },
  sensorDataSection: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  sensorDataTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  liveColorDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  liveColorBox: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
  },
  liveColorValues: {
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  acceptColorButton: {
    marginTop: 8,
  },

  webCustomColorSection: {
    marginVertical: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  rgbInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  rgbInput: {
    flex: 1,
    marginBottom: 8,
  },
});

export default ColorConfigModal;
