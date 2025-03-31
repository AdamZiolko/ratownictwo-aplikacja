import React from 'react';
import { StyleSheet, ScrollView, View, Dimensions, Platform } from 'react-native';
import { Dialog, Button, SegmentedButtons, Divider, useTheme } from 'react-native-paper';
import HeartRateControls from './HeartRateControls';
import NoiseControls from './NoiseControls';
import { EkgType, NoiseType } from '@/services/EkgFactory';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EkgSettingsDialogProps {
  visible: boolean;
  onDismiss: () => void;
  settingsMode: 'heart-rate' | 'noise';
  onSettingsModeChange: (mode: 'heart-rate' | 'noise') => void;
  ekgType: EkgType;
  bpm: number;
  sliderValue: number;
  noiseType: NoiseType;
  onSliderValueChange: (value: number) => void;
  onSliderComplete: (value: number) => void;
  onCustomBpmSelect: (value: number) => void;
  onNoiseTypeChange: (type: NoiseType) => void;
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
  onNoiseTypeChange
}) => {
  const theme = useTheme();

  return (
    <Dialog 
      visible={visible} 
      onDismiss={onDismiss} 
      style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
      dismissable={true}
    >
      <Dialog.Title style={styles.dialogTitle}>EKG Settings</Dialog.Title>
      <Dialog.Content style={styles.dialogContent}>
        <SegmentedButtons
          value={settingsMode}
          onValueChange={(value) => onSettingsModeChange(value as 'heart-rate' | 'noise')}
          buttons={[
            { value: 'heart-rate', label: 'Heart Rate' },
            { value: 'noise', label: 'Noise Level' }
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
          {settingsMode === 'heart-rate' ? (
            <HeartRateControls
              ekgType={ekgType}
              bpm={bpm}
              sliderValue={sliderValue}
              onSliderValueChange={onSliderValueChange}
              onSliderComplete={onSliderComplete}
              onCustomBpmSelect={onCustomBpmSelect}
            />
          ) : (
            <NoiseControls
              noiseType={noiseType}
              onNoiseTypeChange={onNoiseTypeChange}
            />
          )}
          
          {/* Add padding at the bottom to ensure content isn't hidden behind the buttons */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions style={styles.dialogActions}>
        <Button 
          mode="contained"
          onPress={onDismiss}
          style={styles.applyButton}
          labelStyle={styles.buttonLabel}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.buttonTextColor || theme.colors.onPrimary} 
        >
          Apply
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
  dialogActions: {
    justifyContent: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  applyButton: {
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