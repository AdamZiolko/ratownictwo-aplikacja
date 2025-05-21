import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Text, Surface, useTheme, Button, IconButton } from "react-native-paper";
import Svg, { Path } from "react-native-svg";
import { EkgType, EkgFactory, NoiseType } from "../../../../services/EkgFactory";
import { EkgDataAdapter } from "../../../../services/EkgDataAdapter";
import RhythmSelectionModal from "./RhythmSelectionModal";

interface RhythmSelectionButtonProps {
  selectedType: EkgType;
  setSelectedType: (type: EkgType) => void;
  label?: string;
}

const RhythmSelectionButton = ({
  selectedType = EkgType.NORMAL_SINUS_RHYTHM,
  setSelectedType,
  label = "Wybierz rytm EKG",
}: RhythmSelectionButtonProps) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [pathData, setPathData] = useState("");
  
  const svgWidth = Dimensions.get("window").width * 0.8;
  const svgHeight = 80;

  useEffect(() => {
    
    EkgDataAdapter.initialize();
    
    
    const fixedBpm = 60;
    const baseline = svgHeight / 2;
    const pointsCount = 200;
    let path = "";
    
    for (let i = 0; i < pointsCount; i++) {
      const x = (i / pointsCount) * svgWidth;
      const ekgValue = EkgDataAdapter.getValueAtTime(selectedType, x, fixedBpm, NoiseType.NONE);
      
      let verticalScale = 0.5;
      
      if (selectedType === EkgType.ASYSTOLE) {
        verticalScale = 0.1;
      } else if (selectedType === EkgType.VENTRICULAR_FIBRILLATION || 
                selectedType === EkgType.ATRIAL_FIBRILLATION) {
        verticalScale = 0.8;
      }
      
      const y = baseline + (ekgValue - 150) * verticalScale;
      path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    setPathData(path);
  }, [selectedType, svgWidth, svgHeight]);

  const rhythmName = EkgFactory.getNameForType(selectedType);
  
  const getSeverityColor = () => {
    switch (selectedType) {
      case EkgType.VENTRICULAR_FIBRILLATION:
      case EkgType.VENTRICULAR_TACHYCARDIA:
      case EkgType.TORSADE_DE_POINTES:
      case EkgType.ASYSTOLE:
      case EkgType.VENTRICULAR_FLUTTER:
        return theme.colors.error;
      case EkgType.ATRIAL_FIBRILLATION:
      case EkgType.FIRST_DEGREE_AV_BLOCK:
      case EkgType.SECOND_DEGREE_AV_BLOCK:
      case EkgType.MOBITZ_TYPE_AV_BLOCK:
      case EkgType.SA_BLOCK:
        return '#E65100';
      case EkgType.SINUS_TACHYCARDIA:
      case EkgType.SINUS_BRADYCARDIA:
      case EkgType.PREMATURE_VENTRICULAR_CONTRACTION:
      case EkgType.PREMATURE_ATRIAL_CONTRACTION:
      case EkgType.PREMATURE_JUNCTIONAL_CONTRACTION:
        return theme.colors.secondary;
      default:
        return theme.colors.primary;
    }
  };

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity
        onPress={openModal}
        activeOpacity={0.8}
        style={styles.buttonContainer}
      >
        <Surface style={styles.rhythmPreview} elevation={2}>
          <View style={styles.rhythmNameContainer}>
            <Text style={styles.rhythmName} numberOfLines={1}>
              {rhythmName}
            </Text>
            <IconButton
              icon="chevron-down"
              size={20}
              onPress={openModal}
              style={styles.dropdownIcon}
            />
          </View>
          
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
          
          <View style={[styles.bpmBadge, { backgroundColor: getSeverityColor() }]}>  
            <Text style={styles.bpmText}>60 uderzeń/min</Text>
          </View>
        </Surface>
      </TouchableOpacity>
      
      <RhythmSelectionModal
        visible={modalVisible}
        onDismiss={closeModal}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    padding: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  buttonContainer: {
    width: '100%',
  },
  rhythmPreview: {
    padding: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  rhythmNameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rhythmName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  dropdownIcon: {
    margin: 0,
  },
  ekgPreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bpmBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  bpmText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default RhythmSelectionButton;