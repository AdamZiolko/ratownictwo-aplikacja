import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import {
  Text,
  Card,
  Title,
  Paragraph,
  useTheme,
  IconButton,
} from "react-native-paper";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { EkgType, EkgFactory, NoiseType } from "../../../services/EkgFactory";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface RhythmSelectionProps {
  selectedType: EkgType;
  setSelectedType: (type: EkgType) => void;
}

const RhythmSelection = ({
  selectedType = EkgType.NORMAL,
  setSelectedType,
}: RhythmSelectionProps) => {
  const theme = useTheme();

  
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

  return (
    <View style={[styles.container]}>
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
    </View>
  );
};


interface RhythmCardProps {
  type: EkgType;
  isSelected: boolean;
  onSelect: () => void;
  theme: any;
}

const RhythmCard: React.FC<RhythmCardProps> = ({
  type,
  isSelected,
  onSelect,
  theme,
}) => {
  const [pathData, setPathData] = useState("");
  const svgWidth = SCREEN_WIDTH - 48; 
  const svgHeight = 200;

  
  useEffect(() => {
    generatePreviewPath();
  }, []);

  const generatePreviewPath = () => {
    
    const bpm = EkgFactory.getBpmForType(type);

    let path = "";
    const baseline = svgHeight / 4;
    const pointsCount = 500;
    const padding = 0; 
    const effectiveWidth = svgWidth - (padding * 2); 

    
    for (let i = 0; i < pointsCount; i++) {
      const x = padding + (i / pointsCount) * effectiveWidth; 
      
      let y = EkgFactory.generateEkgValue(x - padding, type, bpm, NoiseType.NONE); 

      
      y = baseline + y; 

      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }

    setPathData(path);
  };

  
  const name = EkgFactory.getNameForType(type);
  const description = EkgFactory.getDescriptionForType(type);
  const bpm = EkgFactory.getBpmForType(type);

  
  const getSeverityColor = () => {
    switch (type) {
      case EkgType.VFIB:
      case EkgType.VTACH:
      case EkgType.TORSADE:
      case EkgType.ASYSTOLE:
        return theme.colors.error; 
      case EkgType.AFIB:
      case EkgType.HEART_BLOCK:
        return "#E65100"; 
      case EkgType.TACHYCARDIA:
      case EkgType.BRADYCARDIA:
      case EkgType.PVC:
        return theme.colors.secondary; 
      case EkgType.NORMAL:
      default:
        return theme.colors.primary; 
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
            backgroundColor: `${theme.colors.primary}10`,
          },
        ]}
        mode="outlined"
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Title style={styles.cardTitle}>{name}</Title>
              <View
                style={[
                  styles.bpmBadge,
                  { backgroundColor: getSeverityColor() },
                ]}
              >
                <Text style={styles.bpmText}>{bpm} uderzeń/min</Text>
              </View>
            </View>
          </View>

          {}
          <View style={styles.ekgPreviewContainer}>
            <Svg 
              height={svgHeight} 
              width={svgWidth}
            >
              <Path
                d={pathData}
                stroke={getSeverityColor()}
                strokeWidth={2}
                transform={`translate(0, ${-svgHeight/2})`}
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
    
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    marginRight: 16,
  },
  screenTitle: {
    fontWeight: "bold",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  bpmBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bpmText: {
    color: "white", 
    fontSize: 12,
    fontWeight: "bold",
  },
  ekgPreviewContainer: {
    marginVertical: 8,
    
    borderRadius: 8,
    overflow: "hidden",
  },
  cardDescription: {
    fontSize: 13,
    opacity: 0.8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    
  },
  applyButton: {
    width: "100%",
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default RhythmSelection;