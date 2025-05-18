import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, {
  Path,
  Defs,
  Filter,
  FeGaussianBlur,
  FeDropShadow,
  Text as SvgText,
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

  
  const SVG_HEIGHT = Platform.OS === 'web' ? 300 : 150;
  const VIEWBOX_HEIGHT = Platform.OS === 'web' ? 300 : 150;
  const BPM_FONT_SIZE = Platform.OS === 'web' ? 24 : 18;
  
  useLayoutEffect(() => {
    containerRef.current?.measure((_, __, width) => {
      if (width > 0) setContainerWidth(width);
    });
    
    
    if (ekgType !== undefined && ekgType !== currentEkgType.current) {
      console.log(`EKG type changed from ${currentEkgType.current} to ${ekgType}`);
      
      cancelAnimationFrame(animationRef.current);
      
      
      xOffsetRef.current = 0;
      previousXRef.current = 0;
      previousYRef.current = BASELINE;
      isFirstPointRef.current = true;
      pathDataRef.current = '';
      
      
      EkgFactory.refreshEkgDisplay();
      
      
      setRenderKey(prev => prev + 1);
      currentEkgType.current = ekgType;
    }
  }, [ekgType]);
  
  
  const drawFrame = useCallback(() => {
    if (!isRunning || containerWidth === 0) return;

    xOffsetRef.current += 2;
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
        
        xOffsetRef.current = 0;
        previousXRef.current = 0;
        previousYRef.current = BASELINE;
        isFirstPointRef.current = true;
        pathDataRef.current = '';
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
        setPathData(pathDataRef.current);
      }
    } catch (error) {
      console.error('Error drawing EKG:', error);
    }

    
    if (isRunning) {
      animationRef.current = requestAnimationFrame(drawFrame);
    }
  }, [containerWidth, ekgType, bpm, noiseType, isRunning]);
  
  
  const startAnimation = useCallback(() => {
    
    cancelAnimationFrame(animationRef.current);
    console.log(`Starting EKG animation for type ${ekgType}`);
    animationRef.current = requestAnimationFrame(drawFrame);
  }, [drawFrame, ekgType]);

  const stopAnimation = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    console.log('Stopping EKG animation');
  }, []);

  
  useEffect(() => {
    
    if (ekgType !== undefined && ekgType !== currentEkgType.current) {
      console.log(`EKG type changed from ${currentEkgType.current} to ${ekgType}`);
      
      
      stopAnimation();
      
      
      xOffsetRef.current = 0;
      previousXRef.current = 0;
      previousYRef.current = BASELINE;
      isFirstPointRef.current = true;
      pathDataRef.current = '';
      setPathData('');
      
      
      EkgFactory.refreshEkgDisplay().then(() => {
        console.log('EKG Factory refreshed successfully');
        
        
        setRenderKey(prev => prev + 1);
        
        
        if (isRunning && containerWidth > 0) {
          setTimeout(() => startAnimation(), 100);
        }
      });
      
      
      currentEkgType.current = ekgType;
    }
  }, [ekgType, stopAnimation, startAnimation, isRunning, containerWidth]);
  
  
  useEffect(() => {
    if (isRunning) {
      
      console.log(`BPM/Noise parameters changed: bpm=${bpm}, noise=${noiseType}`);
      
      
      EkgFactory.resetNoiseCache();
      
      
      
    }
  }, [bpm, noiseType, isRunning]);

  
  useEffect(() => {
    let animationTimeout: NodeJS.Timeout;
    
    if (isRunning && containerWidth > 0) {
      
      
      animationTimeout = setTimeout(() => {
        console.log(`Starting EKG animation for type ${ekgType}`);
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
  }, [isRunning, containerWidth, startAnimation, stopAnimation, ekgType]);

  useEffect(() => {
    EkgFactory.resetNoiseCache();
  }, [noiseType]);
  
  const resetEkg = () => {
    
    cancelAnimationFrame(animationRef.current);
    
    
    xOffsetRef.current = 0;
    previousXRef.current = 0;
    previousYRef.current = BASELINE;
    isFirstPointRef.current = true;
    pathDataRef.current = '';
    setPathData('');
    setDisplayBpm(bpm);
    
    
    EkgFactory.resetNoiseCache();
    
    
    try {
      
      EkgDataAdapter.resetCache();
      EkgJsonDataLoader.resetCache();
      
      console.log(`Complete EKG reset for type: ${ekgType}, bpm: ${bpm}`);
    } catch (e) {
      console.error('Error during EKG reset:', e);
    }
    
    
    setTimeout(() => {
      console.log('EKG Display reset complete');
      
      if (isRunning && containerWidth > 0) {
        
        setTimeout(() => {
          animationRef.current = requestAnimationFrame(drawFrame);
        }, 16); 
      }
    }, 50); 
  };
  
  const generateFluctuation = (value?: number): number | undefined => {
    if (value == null) return undefined;
    const fluctPercent = (Math.random() - 0.5) * 2 * FLUCTUATION_RANGE;
    const fluctAmount = value * (fluctPercent / 100);
    return Math.round(value + fluctAmount);
  };

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
  }, [bpm, isRunning]);

  const onLayout = () => {
    containerRef.current?.measure((_, __, width) => {
      if (width > 0 && width !== containerWidth) {
        setContainerWidth(width);
      }
    });
  };
  
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
        {}
        {containerWidth > 0 && (
          <>
            {}
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
            
            {}
            {Platform.OS === 'web' && Array.from({ length: Math.ceil(VIEWBOX_HEIGHT / 10) + 1 }, (_, i) => (
              <Path
                key={`h-minor-${i}`}
                d={`M 0 ${i * 10} H ${containerWidth}`}
                stroke={theme.dark ? "rgba(0, 255, 0, 0.1)" : "rgba(0, 136, 0, 0.05)"}
                strokeWidth="0.5"
              />
            ))}
            {Platform.OS === 'web' && Array.from({ length: Math.ceil(containerWidth / 10) + 1 }, (_, i) => (
              <Path
                key={`v-minor-${i}`}
                d={`M ${i * 10} 0 V ${VIEWBOX_HEIGHT}`}
                stroke={theme.dark ? "rgba(0, 255, 0, 0.1)" : "rgba(0, 136, 0, 0.05)"}
                strokeWidth="0.5"
              />
            ))}
          </>
        )}
        
        {Platform.OS === 'web' && (
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
        )}
        
        {}
        {pathData && (
          <Path
            d={pathData}
            stroke={theme.dark ? "#00ff00" : "#008800"}
            strokeWidth={Platform.OS === 'web' ? 2 : 1.5}
            fill="none"
          />
        )}
        {pathData && Platform.OS === 'web' && (
          <Path
            d={pathData}
            stroke={theme.dark ? "#00ff00" : "#008800"}
            strokeWidth="3"
            fill="none"
            filter="url(#glow)"
            opacity="0.7"
          />
        )}
        {displayBpm != null && Platform.OS === 'web' && (
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
        )}
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
  },
  mobileContainer: {
    height: 180,
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
    top: 8,
    right: 16,
  },
});

export default EkgDisplay;