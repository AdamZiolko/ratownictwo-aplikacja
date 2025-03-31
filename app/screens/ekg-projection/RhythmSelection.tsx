import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Title, Paragraph, Divider, useTheme, IconButton, Button, Surface } from 'react-native-paper';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { EkgType, EkgFactory, NoiseType } from '../../../services/EkgFactory';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RhythmSelection: React.FC = () => {
  const theme = useTheme();
  const [selectedType, setSelectedType] = useState<EkgType>(EkgType.NORMAL);
  
  // Define the rhythm types to display
  const rhythmTypes = [
    EkgType.NORMAL,
    EkgType.TACHYCARDIA,
    EkgType.BRADYCARDIA,
    EkgType.AFIB,
    EkgType.VTACH,
    EkgType.TORSADE,
    EkgType.VFIB,
    EkgType.HEART_BLOCK,
    EkgType.PVC,
    EkgType.ASYSTOLE,
  ];

  // Handle navigation to the EKG projection screen with the selected rhythm
  const navigateToEkgProjection = () => {
    const bpm = EkgFactory.getBpmForType(selectedType);
    router.push({
      pathname: '/screens/ekg-projection/EkgProjection',
      params: { rhythmType: selectedType, bpm }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text variant="headlineMedium" style={styles.screenTitle}>Heart Rhythm Patterns</Text>
      </View>
      
      <Text style={styles.description}>
        Select a cardiac rhythm pattern to simulate on the EKG display.
        Each pattern represents different cardiac conditions.
      </Text>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
      >
        {rhythmTypes.map((type) => (
          <RhythmCard 
            key={type}
            type={type}
            isSelected={selectedType === type}
            onSelect={() => setSelectedType(type)}
            theme={theme}
          />
        ))}
      </ScrollView>
      
      <Surface style={styles.footer}>
        <Button
          mode="contained"
          onPress={navigateToEkgProjection}
          style={styles.applyButton}
          labelStyle={styles.buttonLabel}
          icon="heart-pulse"
        >
          Apply Selected Rhythm
        </Button>
      </Surface>
    </View>
  );
};

// Rhythm card component that displays a rhythm type with preview
interface RhythmCardProps {
  type: EkgType;
  isSelected: boolean;
  onSelect: () => void;
  theme: any;
}

const RhythmCard: React.FC<RhythmCardProps> = ({ type, isSelected, onSelect, theme }) => {
  const [pathData, setPathData] = useState('');
  const svgWidth = SCREEN_WIDTH - 48; // Account for padding
  const svgHeight = 80;
  
  // Generate sample EKG pattern for the preview
  useEffect(() => {
    generatePreviewPath();
  }, []);
  
  const generatePreviewPath = () => {
    // Get default BPM for this rhythm type
    const bpm = EkgFactory.getBpmForType(type);
    
    let path = '';
    const baseline = svgHeight / 2;
    const pointsCount = 200;
    
    // Generate points for the path
    for (let i = 0; i < pointsCount; i++) {
      const x = (i / pointsCount) * svgWidth;
      // Use EkgFactory to generate y value based on rhythm type
      let y = EkgFactory.generateEkgValue(x, type, bpm, NoiseType.NONE);
      
      // Scale and normalize
      y = baseline - (y - 150);
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }
    
    setPathData(path);
  };
  
  // Get descriptive information about this rhythm
  const name = EkgFactory.getNameForType(type);
  const description = EkgFactory.getDescriptionForType(type);
  const bpm = EkgFactory.getBpmForType(type);
  
  // Determine the severity color based on the rhythm type
  const getSeverityColor = () => {
    switch (type) {
      case EkgType.VFIB:
      case EkgType.VTACH:
      case EkgType.TORSADE:
      case EkgType.ASYSTOLE:
        return theme.colors.error; // Critical
      case EkgType.AFIB:
      case EkgType.HEART_BLOCK:
        return '#E65100'; // Warning (orange)
      case EkgType.TACHYCARDIA:
      case EkgType.BRADYCARDIA:
      case EkgType.PVC:
        return theme.colors.secondary; // Caution
      case EkgType.NORMAL:
      default:
        return theme.colors.primary; // Normal
    }
  };
  
  return (
    <TouchableOpacity 
      onPress={onSelect}
      activeOpacity={0.8}
      style={{ marginBottom: 16 }}
    >
      <Card 
        style={[
          styles.card,
          isSelected && {
            borderColor: theme.colors.primary,
            borderWidth: 2,
            backgroundColor: `${theme.colors.primary}10`
          }
        ]}
        mode="outlined"
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Title style={styles.cardTitle}>{name}</Title>
              <View style={[styles.bpmBadge, { backgroundColor: getSeverityColor() }]}>
                <Text style={styles.bpmText}>{bpm} BPM</Text>
              </View>
            </View>
          </View>
          
          {/* EKG Preview */}
          <View style={styles.ekgPreviewContainer}>
            <Svg height={svgHeight} width={svgWidth}>
              <Path
                d={pathData}
                stroke={getSeverityColor()}
                strokeWidth={2}
                fill="none"
              />
            </Svg>
          </View>
          
          <Paragraph style={styles.cardDescription}>{description}</Paragraph>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    marginRight: 16,
  },
  screenTitle: {
    fontWeight: 'bold',
  },
  description: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 14,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  card: {
    marginBottom: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  bpmBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bpmText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ekgPreviewContainer: {
    marginVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardDescription: {
    fontSize: 13,
    opacity: 0.8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  applyButton: {
    width: '100%',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RhythmSelection;