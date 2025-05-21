import React, { useEffect, useRef, useState, useLayoutEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, {
  Path,
  Defs,
  Filter,
  FeGaussianBlur,
  FeDropShadow,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { EkgType, NoiseType, EkgFactory } from '../../services/EkgFactory';
import { EkgDataAdapter } from '../../services/EkgDataAdapter';
import { EkgJsonDataLoader } from '../../services/EkgJsonDataLoader';

interface EkgDisplayProps {
  ekgType?: EkgType;
  bpm?: number;
  noiseType?: NoiseType;
  isRunning?: boolean;
}


const DEFAULT_MIDPOINT = 44.98086978240213;
const BASELINE = 50;
const FLUCTUATION_RANGE = 2;
const ANIMATION_FRAME_STEP = 3; 

const EkgDisplay: React.FC<EkgDisplayProps> = ({
  ekgType,
  bpm,
  noiseType,
  isRunning,
}) => {
  const theme = useTheme();
  const [pathData, setPathData] = useState('');
  const [containerWidth, setContainerWidth] = useState(0);
  const [displayBpm, setDisplayBpm] = useState<number | undefined>(bpm);
  
  const [renderKey, setRenderKey] = useState(0);

  
  const xOffsetRef = useRef(0);
  const previousXRef = useRef(0);
  const previousYRef = useRef(BASELINE);
  const isFirstPointRef = useRef(true);
  const animationRef = useRef(0);
  const pathDataRef = useRef('');
  const containerRef = useRef<View>(null);
  const fluctuationTimerRef = useRef<NodeJS.Timeout>();
  const currentEkgType = useRef<EkgType | undefined>(ekgType);
  const lastRenderTimeRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  
  
  const SVG_HEIGHT = Platform.OS === 'web' ? 300 : 280;
  const VIEWBOX_HEIGHT = Platform.OS === 'web' ? 300 : 280;
  const BPM_FONT_SIZE = Platform.OS === 'web' ? 24 : 22;
  
  
  useLayoutEffect(() => {
    containerRef.current?.measure((_, __, width) => {
      if (width > 0) setContainerWidth(width);
    });
    
    if (ekgType !== undefined && ekgType !== currentEkgType.current) {
      resetEkgState();
      EkgFactory.refreshEkgDisplay();
      setRenderKey(prev => prev + 1);
      currentEkgType.current = ekgType;
    }
  }, [ekgType]);
  
  
  const resetEkgState = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    xOffsetRef.current = 0;
    previousXRef.current = 0;
    previousYRef.current = BASELINE;
    isFirstPointRef.current = true;
    pathDataRef.current = '';
    frameCountRef.current = 0;
  }, []);
  
  
  const drawFrame = useCallback(() => {
    if (!isRunning || containerWidth === 0) return;

    const now = performance.now();
    const elapsed = now - lastRenderTimeRef.current;
    
    
    if (elapsed < 33 && frameCountRef.current > 0) {
      animationRef.current = requestAnimationFrame(drawFrame);
      return;
    }
    
    lastRenderTimeRef.current = now;
    frameCountRef.current++;
    
    xOffsetRef.current += ANIMATION_FRAME_STEP;
    const x = xOffsetRef.current;
    
    let ekgValue;
    try {
      ekgValue = EkgDataAdapter.getValueAtTime(
        ekgType || EkgType.NORMAL_SINUS_RHYTHM,
        x,
        bpm || 72,
        noiseType || NoiseType.NONE
      );
      
      const centeredValue = BASELINE + (ekgValue - DEFAULT_MIDPOINT);
      
      if (x > containerWidth) {
        resetEkgState();
        setPathData('');
      } else {
        if (isFirstPointRef.current) {
          pathDataRef.current = `M 0 ${centeredValue} L ${x} ${centeredValue}`;
          isFirstPointRef.current = false;
        } else {
          pathDataRef.current += ` L ${x} ${centeredValue}`;
        }
        
        previousXRef.current = x;
        previousYRef.current = centeredValue;
        
        
        if (frameCountRef.current % 2 === 0 || x >= containerWidth - ANIMATION_FRAME_STEP) {
          setPathData(pathDataRef.current);
        }
      }
    } catch (error) {
      console.error('Error drawing EKG:', error);
    }

    if (isRunning) {
      animationRef.current = requestAnimationFrame(drawFrame);
    }
  }, [containerWidth, ekgType, bpm, noiseType, isRunning, resetEkgState]);
  
  const startAnimation = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    frameCountRef.current = 0;
    lastRenderTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(drawFrame);
  }, [drawFrame]);

  const stopAnimation = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
  }, []);

  
  useEffect(() => {
    if (ekgType !== undefined && ekgType !== currentEkgType.current) {
      stopAnimation();
      resetEkgState();
      setPathData('');
      
      EkgFactory.refreshEkgDisplay().then(() => {
        setRenderKey(prev => prev + 1);
        
        if (isRunning && containerWidth > 0) {
          setTimeout(() => startAnimation(), 100);
        }
      });
      
      currentEkgType.current = ekgType;
    }
  }, [ekgType, stopAnimation, startAnimation, isRunning, containerWidth, resetEkgState]);
  
  
  useEffect(() => {
    if (isRunning) {
      EkgFactory.resetNoiseCache();
    }
  }, [bpm, noiseType, isRunning]);

  
  useEffect(() => {
    let animationTimeout: NodeJS.Timeout;
    
    if (isRunning && containerWidth > 0) {
      animationTimeout = setTimeout(() => {
        startAnimation();
      }, 50);
    } else {
      stopAnimation();
    }
    
    return () => {
      stopAnimation();
      if (animationTimeout) {
        clearTimeout(animationTimeout);
      }
    };
  }, [isRunning, containerWidth, startAnimation, stopAnimation]);

  
  useEffect(() => {
    EkgFactory.resetNoiseCache();
  }, [noiseType]);
  
  const resetEkg = useCallback(() => {
    resetEkgState();
    setPathData('');
    setDisplayBpm(bpm);
    
    EkgFactory.resetNoiseCache();
    
    try {
      EkgDataAdapter.resetCache();
      EkgJsonDataLoader.resetCache();
    } catch (e) {
      console.error('Error during EKG reset:', e);
    }
    
    setTimeout(() => {
      if (isRunning && containerWidth > 0) {
        setTimeout(() => {
          animationRef.current = requestAnimationFrame(drawFrame);
        }, 16); 
      }
    }, 50); 
  }, [bpm, isRunning, containerWidth, drawFrame, resetEkgState]);
    const generateFluctuation = useCallback((value?: number): number | undefined => {
    if (value == null) return undefined;
    const fluctPercent = (Math.random() - 0.5) * 2 * FLUCTUATION_RANGE;
    const fluctAmount = value * (fluctPercent / 100);
    return Math.round(value + fluctAmount);
  }, []);

  
  useEffect(() => {
    setDisplayBpm(bpm);
    if (fluctuationTimerRef.current) clearInterval(fluctuationTimerRef.current);
    if (isRunning && bpm != null) {
      fluctuationTimerRef.current = setInterval(() => {
        setDisplayBpm(generateFluctuation(bpm));
      }, 1000);
    }
    return () => {
      if (fluctuationTimerRef.current) clearInterval(fluctuationTimerRef.current);
    };
  }, [bpm, isRunning, generateFluctuation]);

  const onLayout = useCallback(() => {
    containerRef.current?.measure((_, __, width) => {
      if (width > 0 && width !== containerWidth) {
        setContainerWidth(width);
      }
    });
  }, [containerWidth]);
  
  
  const majorGridLines = useMemo(() => {
    if (containerWidth === 0) return null;
    
    return (
      <>
        {Array.from({ length: Math.ceil(VIEWBOX_HEIGHT / 50) + 1 }, (_, i) => (
          <Path
            key={`h-major-${i}`}
            d={`M 0 ${i * 50} H ${containerWidth}`}
            stroke={theme.dark ? "rgba(0, 255, 0, 0.2)" : "rgba(0, 136, 0, 0.15)"}
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: Math.ceil(containerWidth / 50) + 1 }, (_, i) => (
          <Path
            key={`v-major-${i}`}
            d={`M ${i * 50} 0 V ${VIEWBOX_HEIGHT}`}
            stroke={theme.dark ? "rgba(0, 255, 0, 0.2)" : "rgba(0, 136, 0, 0.15)"}
            strokeWidth="1"
          />
        ))}
      </>
    );
  }, [containerWidth, theme.dark]);
  
  
  const minorGridLines = useMemo(() => {
    if (containerWidth === 0 || Platform.OS !== 'web') return null;
    
    return (
      <>
        {Array.from({ length: Math.ceil(VIEWBOX_HEIGHT / 10) + 1 }, (_, i) => (
          <Path
            key={`h-minor-${i}`}
            d={`M 0 ${i * 10} H ${containerWidth}`}
            stroke={theme.dark ? "rgba(0, 255, 0, 0.1)" : "rgba(0, 136, 0, 0.05)"}
            strokeWidth="0.5"
          />
        ))}
        {Array.from({ length: Math.ceil(containerWidth / 10) + 1 }, (_, i) => (
          <Path
            key={`v-minor-${i}`}
            d={`M ${i * 10} 0 V ${VIEWBOX_HEIGHT}`}
            stroke={theme.dark ? "rgba(0, 255, 0, 0.1)" : "rgba(0, 136, 0, 0.05)"}
            strokeWidth="0.5"
          />
        ))}
      </>
    );
  }, [containerWidth, theme.dark]);
  
  
  const filterDefs = useMemo(() => {
    if (Platform.OS !== 'web') return null;
    
    return (
      <Defs>
        <Filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <FeGaussianBlur stdDeviation="2" result="blur" />
          <FeDropShadow
            dx="0"
            dy="0"
            stdDeviation="2"
            flood-color={theme.dark ? '#00ff00' : '#008800'}
            flood-opacity="0.8"
          />
        </Filter>
      </Defs>
    );
  }, [theme.dark]);
  
  
  const ekgLines = useMemo(() => {
    if (!pathData) return null;
    
    return (
      <>
        <Path
          d={pathData}
          stroke={theme.dark ? "#00ff00" : "#008800"}
          strokeWidth={Platform.OS === 'web' ? 2 : 1.5}
          fill="none"
        />
        {Platform.OS === 'web' && (
          <Path
            d={pathData}
            stroke={theme.dark ? "#00ff00" : "#008800"}
            strokeWidth="3"
            fill="none"
            filter="url(#glow)"
            opacity="0.7"
          />
        )}
      </>
    );
  }, [pathData, theme.dark]);
  
  
  const bpmText = useMemo(() => {
    if (displayBpm == null || Platform.OS !== 'web') return null;
    
    return (
      <SvgText
        x={containerWidth - 20}
        y="40"
        fill={theme.dark ? "#00ff00" : "#008800"}
        fontSize={BPM_FONT_SIZE}
        fontWeight="bold"
        textAnchor="end"
        fontFamily={theme.fonts.labelLarge.fontFamily}
      >
        {displayBpm} BPM
      </SvgText>
    );
  }, [displayBpm, containerWidth, theme.dark, theme.fonts.labelLarge.fontFamily, BPM_FONT_SIZE]);

  return (
    <View
      key={renderKey}
      style={[
        styles.container,
        Platform.OS !== 'web' && styles.mobileContainer
      ]}
      ref={containerRef}
      onLayout={onLayout}
    >
      <Svg
        height={SVG_HEIGHT}
        width="100%"
        style={styles.svg}
        viewBox={`0 0 ${containerWidth} ${VIEWBOX_HEIGHT}`}
      >
        {containerWidth > 0 && (
          <G>
            {majorGridLines}
            {minorGridLines}
          </G>
        )}
        
        {filterDefs}
        {ekgLines}
        {bpmText}
      </Svg>
      
      {displayBpm != null && Platform.OS !== 'web' && (
        <Text 
          variant="labelLarge"
          style={[
            styles.bpmText,
            styles.mobileBpmText,
            { 
              color: theme.dark ? '#00ff00' : '#008800',
              textShadowColor: theme.dark ? 'rgba(0, 255, 0, 0.8)' : 'rgba(0, 136, 0, 0.5)'
            }
          ]}
        >
          {displayBpm} BPM
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'web' ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
    paddingVertical: Platform.OS === 'web' ? 0 : 12,
  },
  mobileContainer: {
    height: 320,
  },
  svg: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
  },
  bpmText: {
    position: 'absolute',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  mobileBpmText: {
    top: 16,
    right: 20,
  },
});

export default React.memo(EkgDisplay);