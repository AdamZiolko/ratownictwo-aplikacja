import React from 'react';
import { StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { Dialog, Button, SegmentedButtons, Divider, useTheme } from 'react-native-paper';
import HeartRateControls from './HeartRateControls';
import NoiseControls from './NoiseControls';
import { EkgType, NoiseType } from '@/services/EkgFactory';
import RhythmSelection from '@/app/screens/ekg-projection/RhythmSelection';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EkgSettingsDialogProps {
  visible: boolean;
  onDismiss: () => void;
  settingsMode: 'heart-rate' | 'noise' | 'rhytm-type';
  onSettingsModeChange: (mode: 'heart-rate' | 'noise' | 'rhytm-type') => void;
  ekgType: EkgType;
  bpm: number;
  sliderValue: number;
  noiseType: NoiseType;
  onSliderValueChange: (value: number) => void;
  onSliderComplete: (value: number) => void;
  onCustomBpmSelect: (value: number) => void;
  onNoiseTypeChange: (type: NoiseType) => void;
  onRhythmTypeChange: (type: EkgType) => void;
}

const EkgSettingsDialog: React.FC<EkgSettingsDialogProps> = ({
  visible,
  onDismiss,
  settingsMode,
  onSettingsModeChange,
  ekgType,
  bpm,
  sliderValue,
  noiseType,
  onSliderValueChange,
  onSliderComplete,
  onCustomBpmSelect,
  onNoiseTypeChange,
  onRhythmTypeChange,
}) => {
  const theme = useTheme();

  return (
    <Dialog 
      visible={visible} 
      onDismiss={onDismiss} 
      style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
      dismissable={true}
    >
      <Dialog.Title style={styles.dialogTitle}>Ustawienia EKG</Dialog.Title>
      <Dialog.Content style={styles.dialogContent}>
        <SegmentedButtons
          value={settingsMode}
          onValueChange={(value) => onSettingsModeChange(value as 'heart-rate' | 'noise')}
          buttons={[
            { value: 'heart-rate', label: 'Tętno' },
            { value: 'noise', label: 'Poziom Zakłóceń' },
            { value: 'rhytm-type', label: 'Typ Rytmu'}
          ]}
          style={styles.segmentedButtons}
        />
        
        <Divider style={styles.divider} />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={true}
          bounces={false}
          overScrollMode="always"
          nestedScrollEnabled={true}
        >
          {settingsMode === 'heart-rate' && (
            <HeartRateControls
              ekgType={ekgType}
              bpm={bpm}
              sliderValue={sliderValue}
              onSliderValueChange={onSliderValueChange}
              onSliderComplete={onSliderComplete}
              onCustomBpmSelect={onCustomBpmSelect}
            />
          )}
          {settingsMode === 'noise' && (
            <NoiseControls
              noiseType={noiseType}
              onNoiseTypeChange={onNoiseTypeChange}
            />
          )}
          {settingsMode === 'rhytm-type' && (
            // TODO: Add rhythm type controls component when implemented
            <RhythmSelection
              selectedType={ekgType}
              setSelectedType={onRhythmTypeChange}
            />
          )}
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions style={{
        paddingInline: 20,
        justifyContent: 'flex-end',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 0,
      }}>
        <Button 
          mode="contained"
          onPress={onDismiss}
          style={styles.applyButton}
          labelStyle={styles.buttonLabel}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary} 
        >
          Zastosuj
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: Platform.OS === 'ios' ? SCREEN_HEIGHT * 0.7 : SCREEN_HEIGHT * 0.8,
    maxWidth: Platform.OS === 'ios' ? SCREEN_WIDTH * 0.9 : SCREEN_WIDTH * 0.9,
    width: Platform.OS === 'ios' ? SCREEN_WIDTH * 0.9 : SCREEN_WIDTH * 0.9,
    borderRadius: 12,
    elevation: 24,
    zIndex: 1000,
    alignSelf: 'center',
    padding: 0,
  },
  dialogTitle: {
    textAlign: 'center', 
    fontSize: 20,
  },
  dialogContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 0,
    maxHeight: Platform.OS === 'ios' ? 
      SCREEN_HEIGHT * 0.55 : 
      SCREEN_HEIGHT * 0.65,
  },
  scrollView: {
    flexGrow: 0,
    maxHeight: Platform.OS === 'ios' ? 
      SCREEN_HEIGHT * 0.45 : 
      SCREEN_HEIGHT * 0.55,
  },
  scrollViewContent: {
    paddingBottom: 20,
    paddingHorizontal: 4,
  },
  segmentedButtons: {
    marginVertical: 8,
  },
  divider: {
    marginVertical: 8,
  },
  applyButton: {
    margin: 12,
    minWidth: 120,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 20,
  },
});

export default EkgSettingsDialog;