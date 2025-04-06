import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Appbar, Button, Surface, Text, Portal, Chip, Card, useTheme, FAB } from 'react-native-paper';
import { EkgType, NoiseType } from '../../../services/EkgFactory';
import { useLocalSearchParams, router } from 'expo-router';

// Import separated components
import EkgDisplay from '../../../components/ekg/EkgDisplay';
import EkgSettingsDialog from '../../../components/ekg/EkgSettingsDialog';

// Custom hooks
import { useEkgState } from '../../../hooks/useEkgState';
import { useNoiseState } from '../../../hooks/useNoiseState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EkgProjectionProps {
    initialBpm?: number;
    readOnly?: boolean;
}

const EkgProjection: React.FC<EkgProjectionProps> = ({ 
    initialBpm = 72,
    readOnly = false
}) => {
    const theme = useTheme();
    const params = useLocalSearchParams();
    const [showSettingsDialog, setShowSettingsDialog] = useState(false);
    const [settingsMode, setSettingsMode] = useState<'heart-rate'|'noise'|'rhytm-type'>('heart-rate');
    
    // Get rhythm type and BPM from params if provided
    const rhythmTypeParam = params.rhythmType as string;
    const bpmParam = params.bpm ? parseInt(params.bpm as string, 10) : initialBpm;
    
    // Determine initial EKG type from route parameters
    const getInitialEkgType = (): EkgType => {
        if (rhythmTypeParam && Object.values(EkgType).includes(rhythmTypeParam as EkgType)) {
            return rhythmTypeParam as EkgType;
        }
        return EkgType.NORMAL;
    };
    
    // Use custom hooks for EKG and noise state management
    const {
        ekgType,
        bpm,
        sliderValue,
        isRunning,
        togglePlayPause,
        handleSliderValueChange,
        handleSliderComplete,
        selectCustomBpm,
        selectRhythmType,
        getRhythmTypeLabel,
        getRhythmDescription,
        getCurrentBpm,
    } = useEkgState(getInitialEkgType(), bpmParam);

    const {
        noiseType,
        selectNoiseType,
        getNoiseTypeLabel,
        getNoiseColor
    } = useNoiseState();
    
    // Initialize slider value when mode changes
    useEffect(() => {
        if (settingsMode === 'heart-rate') {
            handleSliderValueChange(bpm);
        }
    }, [settingsMode, bpm, handleSliderValueChange]);

    

    return (
        <View style={styles.container}>
            {!readOnly && (
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => router.back()} />
                    <Appbar.Content title="EKG Projection" subtitle={getRhythmTypeLabel()} />
                    <Appbar.Action icon="cog" onPress={() => setShowSettingsDialog(true)} />
                </Appbar.Header>
            )}
            
            <Surface style={styles.ekgContainer}>
                <View style={styles.statusRow}>
                    <Card style={styles.statusCard}>
                        <Card.Content>
                            <View style={styles.bpmIndicator}>
                                <Text 
                                    variant="titleLarge" 
                                    style={{
                                        marginRight: 4,
                                    }}
                                >
                                    {getCurrentBpm()}
                                </Text>
                                <Text variant="labelLarge">BPM</Text>
                            </View>
                        </Card.Content>
                    </Card>
                    
                    {!readOnly && (
                        <Chip 
                            icon="noise-cancellation" 
                            onPress={() => {
                                setSettingsMode('noise');
                                setShowSettingsDialog(true);
                            }}
                            style={[styles.noiseChip, { borderColor: getNoiseColor() }]}
                            textStyle={{ color: getNoiseColor() }}
                        >
                            {getNoiseTypeLabel()}
                        </Chip>
                    )}
                </View>
                
                <EkgDisplay 
                    ekgType={ekgType} 
                    bpm={bpm} 
                    noiseType={noiseType}
                    isRunning={isRunning}
                />
            </Surface>
            
            <View style={styles.controls}>
                <Button 
                    mode="contained" 
                    icon={isRunning ? "pause" : "play"}
                    onPress={togglePlayPause}
                    style={[{ 
                        backgroundColor: theme.colors.error,
                    }, styles.button]}
                    textColor={'white'}
                >
                    {isRunning ? "Zatrzymaj" : "Wznów"}
                </Button>
                <Button 
                    mode="contained" 
                    icon="heart-pulse"
                    onPress={() => {
                        setSettingsMode('heart-rate');
                        setShowSettingsDialog(true);
                    }}
                    style={[{ 
                        backgroundColor: theme.colors.error,
                    }, styles.button]}
                    textColor={'white'}
                    labelStyle={styles.buttonLabel}
                >
                    BPM
                </Button>
            </View>

            {/* Display rhythm info */}
            <View style={styles.rhythmInfoContainer}>
                <Text style={styles.rhythmInfoTitle}>
                    {getRhythmTypeLabel()}
                </Text>
                <Text style={styles.rhythmInfoDescription}>
                    {getRhythmDescription()}
                </Text>
            </View>
            
            <Portal>
                <EkgSettingsDialog
                    visible={showSettingsDialog}
                    onDismiss={() => setShowSettingsDialog(false)}
                    settingsMode={settingsMode}
                    onSettingsModeChange={setSettingsMode}
                    ekgType={ekgType}
                    bpm={bpm}
                    sliderValue={sliderValue}
                    noiseType={noiseType}
                    onSliderValueChange={handleSliderValueChange}
                    onSliderComplete={handleSliderComplete}
                    onCustomBpmSelect={selectCustomBpm}
                    onNoiseTypeChange={selectNoiseType}
                    onRhythmTypeChange={selectRhythmType}
                />
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    ekgContainer: {
        padding: 8,
        elevation: 2,
        margin: 8,
        borderRadius: 8,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statusCard: {
        flex: 1,
        marginRight: 8,
    },
    noiseChip: {
        height: 36,
        borderWidth: 1,
    },
    bpmIndicator: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    bpmValue: {
        fontSize: 28,
        fontWeight: 'bold', 
        marginRight: 8,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
    },
    button: {
        flex: 1,
        marginHorizontal: 4,
    },
    readOnlyButton: {
        opacity: 0.7,
        backgroundColor: 'rgba(98, 0, 238, 0.6)',
    },
    rhythmInfoContainer: {
        padding: 16,
        margin: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    rhythmInfoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    rhythmInfoDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    buttonLabel: {
        fontSize: 14,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});

export default EkgProjection;