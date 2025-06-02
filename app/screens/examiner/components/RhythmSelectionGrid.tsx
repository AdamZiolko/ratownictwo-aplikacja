import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  FlatList,
  LayoutChangeEvent,
  useWindowDimensions,
} from 'react-native';
import {
  Text,
  Title,
  useTheme,
  Surface,
  Chip,
  Searchbar,
} from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';
import {
  EkgType,
  EkgFactory,
  NoiseType,
} from '../../../../services/EkgFactory';
import { EkgDataAdapter } from '../../../../services/EkgDataAdapter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_SPACING = 12;
const TILE_HEIGHT = 140;

interface RhythmSelectionGridProps {
  selectedType: EkgType;
  setSelectedType: (type: EkgType) => void;
}

const RhythmSelectionGrid = ({
  selectedType = EkgType.NORMAL_SINUS_RHYTHM,
  setSelectedType,
}: RhythmSelectionGridProps) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTypes, setFilteredTypes] = useState<EkgType[]>([]);
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);

  const getNumberOfColumns = () => {
    return width < 480 ? 1 : 2;
  };

  const getTileWidth = () => {
    const columns = getNumberOfColumns();
    return (containerWidth - TILE_SPACING * (columns + 1)) / columns;
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const rhythmCategories = {
    Normalne: [EkgType.NORMAL_SINUS_RHYTHM],
    'Arytmie zatokowe': [
      EkgType.SINUS_TACHYCARDIA,
      EkgType.SINUS_BRADYCARDIA,
      EkgType.SINUS_ARRHYTHMIA,
      EkgType.SINUS_ARREST,
    ],
    'Arytmie przedsionkowe': [
      EkgType.ATRIAL_FIBRILLATION,
      EkgType.ATRIAL_FLUTTER_A,
      EkgType.ATRIAL_FLUTTER_B,
      EkgType.WANDERING_ATRIAL_PACEMAKER,
      EkgType.MULTIFOCAL_ATRIAL_TACHYCARDIA,
      EkgType.PREMATURE_ATRIAL_CONTRACTION,
    ],
    'Bloki przewodzenia': [
      EkgType.FIRST_DEGREE_AV_BLOCK,
      EkgType.SECOND_DEGREE_AV_BLOCK,
      EkgType.MOBITZ_TYPE_AV_BLOCK,
      EkgType.SA_BLOCK,
    ],
    'Arytmie komorowe': [
      EkgType.VENTRICULAR_TACHYCARDIA,
      EkgType.TORSADE_DE_POINTES,
      EkgType.VENTRICULAR_FIBRILLATION,
      EkgType.VENTRICULAR_FLUTTER,
      EkgType.PREMATURE_VENTRICULAR_CONTRACTION,
      EkgType.ACCELERATED_VENTRICULAR_RHYTHM,
      EkgType.IDIOVENTRICULAR_RHYTHM,
      EkgType.VENTRICULAR_ESCAPE_BEAT,
    ],
    'Inne arytmie': [
      EkgType.PREMATURE_JUNCTIONAL_CONTRACTION,
      EkgType.ACCELERATED_JUNCTIONAL_RHYTHM,
      EkgType.JUNCTIONAL_ESCAPE_BEAT,
      EkgType.ASYSTOLE,
    ],
  };

  type CategoryKey = keyof typeof rhythmCategories;

  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(
    null
  );

  const allRhythmTypes = Object.values(rhythmCategories).flat();

  useEffect(() => {
    EkgDataAdapter.initialize();

    if (selectedCategory) {
      setFilteredTypes([...rhythmCategories[selectedCategory]]);
    } else {
      setFilteredTypes([...allRhythmTypes]);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      if (selectedCategory) {
        setFilteredTypes([...rhythmCategories[selectedCategory]]);
      } else {
        setFilteredTypes([...allRhythmTypes]);
      }
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allRhythmTypes.filter(type => {
      const name = EkgFactory.getNameForType(type).toLowerCase();
      const description = EkgFactory.getDescriptionForType(type).toLowerCase();
      return name.includes(query) || description.includes(query);
    });

    setFilteredTypes([...filtered]);
  }, [searchQuery, selectedCategory]);

  const handleTypeSelect = (type: EkgType) => {
    setSelectedType(type);
  };

  const handleCategorySelect = (category: CategoryKey) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    setSearchQuery('');
  };

  const renderCategoryChips = () => {
    return Object.keys(rhythmCategories).map(category => (
      <Chip
        key={category}
        selected={category === selectedCategory}
        onPress={() => handleCategorySelect(category as CategoryKey)}
        style={styles.categoryChip}
        mode={category === selectedCategory ? 'flat' : 'outlined'}
      >
        {category}
      </Chip>
    ));
  };
  return (
    <View style={styles.container} onLayout={handleLayout}>
      <Searchbar
        placeholder="Szukaj rytmu..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {renderCategoryChips()}
      </ScrollView>

      <FlatList
        data={filteredTypes}
        numColumns={getNumberOfColumns()}
        key={getNumberOfColumns().toString()}
        keyExtractor={item => item.toString()}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: type }) => (
          <RhythmTile
            type={type}
            isSelected={selectedType === type}
            onSelect={() => handleTypeSelect(type)}
            theme={theme}
            tileWidth={getTileWidth()}
            columnsCount={getNumberOfColumns()}
          />
        )}
      />
    </View>
  );
};

interface RhythmTileProps {
  type: EkgType;
  isSelected: boolean;
  onSelect: () => void;
  theme: any;
  tileWidth: number;
  columnsCount: number;
}

const RhythmTile: React.FC<RhythmTileProps> = ({
  type,
  isSelected,
  onSelect,
  theme,
  tileWidth,
  columnsCount,
}) => {
  const [pathData, setPathData] = useState('');
  const svgWidth = tileWidth - 20;
  const svgHeight = 60;

  useEffect(() => {
    const fixedBpm = 60;
    const baseline = svgHeight / 2;
    const pointsCount = 120;
    let path = '';

    for (let i = 0; i < pointsCount; i++) {
      const x = (i / pointsCount) * svgWidth;
      const ekgValue = EkgDataAdapter.getValueAtTime(
        type,
        x,
        fixedBpm,
        NoiseType.NONE
      );

      let verticalScale = 0.4;

      if (type === EkgType.ASYSTOLE) {
        verticalScale = 0.1;
      } else if (
        type === EkgType.VENTRICULAR_FIBRILLATION ||
        type === EkgType.ATRIAL_FIBRILLATION
      ) {
        verticalScale = 0.6;
      }

      const y = baseline + (ekgValue - 150) * verticalScale;
      path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    setPathData(path);
  }, [type, svgWidth, svgHeight]);

  const name = EkgFactory.getNameForType(type);
  const fixedBpm = 60;

  const getSeverityColor = () => {
    switch (type) {
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
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.7}
      style={[
        styles.tileContainer,
        {
          width: columnsCount === 1 ? Math.min(tileWidth, 320) : tileWidth,
        },
      ]}
    >
      <Surface
        style={[
          styles.tile,
          {
            width: columnsCount === 1 ? Math.min(tileWidth, 320) : tileWidth,
          },
          isSelected && {
            borderColor: theme.colors.primary,
            borderWidth: 2,
            backgroundColor: `${theme.colors.primary}10`,
          },
        ]}
        elevation={2}
      >
        <Title style={styles.tileTitle} numberOfLines={1}>
          {name}
        </Title>

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

        <View
          style={[styles.bpmBadge, { backgroundColor: getSeverityColor() }]}
        >
          <Text style={styles.bpmText}>{fixedBpm} uderzeń/min</Text>
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    flex: 1,
  },
  searchbar: {
    marginBottom: 12,
    elevation: 2,
  },
  categoryContainer: {
    paddingVertical: 8,
    flexDirection: 'row',
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  gridContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  tileContainer: {
    marginHorizontal: TILE_SPACING / 2,
    marginBottom: TILE_SPACING,
    alignSelf: 'center',
  },
  tile: {
    padding: 10,
    borderRadius: 8,
    height: TILE_HEIGHT,
    overflow: 'hidden',
  },
  tileTitle: {
    fontSize: 14,
    marginBottom: 6,
  },
  ekgPreviewContainer: {
    marginVertical: 6,
  },
  bpmBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  bpmText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default RhythmSelectionGrid;
