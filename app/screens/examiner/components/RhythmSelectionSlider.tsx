import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
} from "react-native";
import {
  Text,
  Card,
  Title,
  Paragraph,
  useTheme,
  IconButton,
} from "react-native-paper";
import Svg, { Path } from "react-native-svg";
import { EkgType, EkgFactory, NoiseType } from "../../../../services/EkgFactory";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_SPACING = 8;

interface RhythmSelectionSliderProps {
  selectedType: EkgType;
  setSelectedType: (type: EkgType) => void;
}

const RhythmSelectionSlider = ({
  selectedType = EkgType.NORMAL,
  setSelectedType,
}: RhythmSelectionSliderProps) => {
  const theme = useTheme();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const selectedIndex = rhythmTypes.findIndex(type => type === selectedType);

  useEffect(() => {
    setCurrentIndex(selectedIndex !== -1 ? selectedIndex : 0);
  }, [selectedIndex]);

  const scrollToIndex = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };

  const navigateTo = (index: number) => {
    if (index >= 0 && index < rhythmTypes.length) {
      scrollToIndex(index);
      setCurrentIndex(index);
      setSelectedType(rhythmTypes[index]);
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < rhythmTypes.length) {
          setCurrentIndex(newIndex);
          setSelectedType(rhythmTypes[newIndex]);
        }
      },
    }
  );

  const renderPagination = () => {
    return rhythmTypes.map((_, index) => {
      const inputRange = [
        (index - 1) * (CARD_WIDTH + CARD_SPACING),
        index * (CARD_WIDTH + CARD_SPACING),
        (index + 1) * (CARD_WIDTH + CARD_SPACING),
      ];

      const scaleX = scrollX.interpolate({
        inputRange,
        outputRange: [0.5, 1, 0.5],
        extrapolate: 'clamp',
      });

      return (
        <TouchableOpacity
          key={index}
          onPress={() => navigateTo(index)}
          activeOpacity={0.6}
        >
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{ scaleX }],
                backgroundColor: theme.colors.primary,
                opacity: currentIndex === index ? 1 : 0.3,
              },
            ]}
          />
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderTitle}>Wybierz typ rytmu EKG</Text>
      <View style={styles.container}>
        <IconButton
          icon="chevron-left"
          size={30}
          iconColor={theme.colors.primary}
          style={styles.navigationButton}
          disabled={currentIndex === 0}
          onPress={() => navigateTo(currentIndex - 1)}
        />
        <Animated.FlatList
          ref={flatListRef}
          data={rhythmTypes}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          snapToAlignment="center"
          decelerationRate="fast"
          keyExtractor={item => item.toString()}
          initialScrollIndex={selectedIndex !== -1 ? selectedIndex : 0}
          getItemLayout={(data, index) => ({
            length: CARD_WIDTH + CARD_SPACING,
            offset: (CARD_WIDTH + CARD_SPACING) * index,
            index,
          })}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item: type, index }) => (
            <RhythmCard
              key={type}
              type={type}
              isSelected={selectedType === type}
              onSelect={() => navigateTo(index)}
              theme={theme}
              scrollX={scrollX}
              index={index}
            />
          )}
        />
        <IconButton
          icon="chevron-right"
          size={30}
          iconColor={theme.colors.primary}
          style={styles.navigationButton}
          disabled={currentIndex === rhythmTypes.length - 1}
          onPress={() => navigateTo(currentIndex + 1)}
        />
      </View>

      <View style={styles.paginationContainer}>{renderPagination()}</View>
    </View>
  );
};

interface RhythmCardProps {
  type: EkgType;
  isSelected: boolean;
  onSelect: () => void;
  theme: any;
  scrollX?: Animated.Value;
  index?: number;
}

const RhythmCard: React.FC<RhythmCardProps> = ({
  type,
  isSelected,
  onSelect,
  theme,
  scrollX,
  index = 0,
}) => {
  const [pathData, setPathData] = useState("");
  const svgWidth = CARD_WIDTH - 32;
  const svgHeight = 150;

  const animatedStyle = React.useMemo(() => {
    const baseStyle = { width: CARD_WIDTH, marginHorizontal: CARD_SPACING / 2 };
    if (!scrollX) return baseStyle;
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ];
    const scale = scrollX.interpolate({ inputRange, outputRange: [0.9, 1, 0.9], extrapolate: 'clamp' });
    return { ...baseStyle, transform: [{ scale }] };
  }, [scrollX, index]);

  useEffect(() => {
    const bpm = EkgFactory.getBpmForType(type);
    const baseline = svgHeight / 4;
    const pointsCount = 500;
    let path = "";
    for (let i = 0; i < pointsCount; i++) {
      const x = (i / pointsCount) * svgWidth;
      const y = baseline + EkgFactory.generateEkgValue(x, type, bpm, NoiseType.NONE);
      path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    setPathData(path);
  }, [type]);

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
        return '#E65100';
      case EkgType.TACHYCARDIA:
      case EkgType.BRADYCARDIA:
      case EkgType.PVC:
        return theme.colors.secondary;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity onPress={onSelect} activeOpacity={0.8} style={styles.cardTouchable}>
        <Card
          style={[
            styles.cardContent,
            isSelected && { borderColor: theme.colors.primary, borderWidth: 2, backgroundColor: `${theme.colors.primary}10` },
          ]} mode="outlined"
        >
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <Title style={styles.cardTitle}>{name}</Title>
                <View style={[styles.bpmBadge, { backgroundColor: getSeverityColor() }]}>  
                  <Text style={styles.bpmText}>{bpm} uderzeń/min</Text>
                </View>
              </View>
            </View>
            <View style={styles.ekgPreviewContainer}>
              <Svg height={svgHeight} width={svgWidth}>
                <Path d={pathData} stroke={getSeverityColor()} strokeWidth={2} transform={`translate(0, ${-svgHeight/2})`} fill="none" />
              </Svg>
            </View>
            <Paragraph style={styles.cardDescription}>{description}</Paragraph>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: { marginBottom: 16 },
  sliderTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navigationButton: { margin: 0, padding: 0 },
  flatListContent: { paddingVertical: 16, paddingHorizontal: 8 },
  cardTouchable: { flex: 1 },
  cardContent: { elevation: 4, height: '100%' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  bpmBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bpmText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  ekgPreviewContainer: { marginVertical: 8, borderRadius: 8, overflow: 'hidden' },
  cardDescription: { fontSize: 12, opacity: 0.8, maxHeight: 100 },
  paginationContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 16 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4, width: 8 },
});

export default RhythmSelectionSlider;