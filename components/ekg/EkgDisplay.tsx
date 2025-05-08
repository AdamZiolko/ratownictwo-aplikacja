import { EkgType, NoiseType, EkgFactory } from '@/services/EkgFactory';
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import Svg, { Path, Defs, Filter, FeGaussianBlur, FeDropShadow, Text, TSpan } from 'react-native-svg';

interface EkgDisplayProps {
  ekgType?: EkgType ;
  bpm?: number ;
  noiseType?: NoiseType ;
  isRunning?: boolean ;
}

const BASELINE = 150; 
const FLUCTUATION_RANGE = 2; 

const EkgDisplay: React.FC<EkgDisplayProps> = ({ 
  ekgType, 
  bpm, 
  noiseType,
  isRunning 
}) => {
  const [pathData, setPathData] = useState('');
  const [containerWidth, setContainerWidth] = useState(0);
  const [displayBpm, setDisplayBpm] = useState<number | undefined>(bpm);
  const xOffsetRef = useRef(0);
  const previousXRef = useRef(0);
  const previousYRef = useRef(BASELINE);
  const isFirstPointRef = useRef(true);
  const animationRef = useRef(0);
  const pathDataRef = useRef('');
  const containerRef = useRef<View>(null);
  const fluctuationTimerRef = useRef<NodeJS.Timeout>();

  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.measure((x, y, width, height, pageX, pageY) => {
        if (width > 0) {
          setContainerWidth(width);
        }
      });
    }
    
    
    if (ekgType !== undefined) {
      resetEkg();
    }
  }, [ekgType]);

    const draw = () => {
    if (!isRunning || containerWidth === 0) return;
    
    xOffsetRef.current += 2;
    const x = xOffsetRef.current;

    if (x > containerWidth) {
      
      xOffsetRef.current = 0;
      previousXRef.current = 0;
      previousYRef.current = BASELINE;
      isFirstPointRef.current = true;
      pathDataRef.current = '';
      setPathData('');
    } else {
      
      const ekgValue = EkgFactory.generateEkgValue(x, ekgType, bpm, noiseType);

      if (isFirstPointRef.current) {
        
        pathDataRef.current = `M 0 ${BASELINE} L ${x} ${ekgValue}`;
        isFirstPointRef.current = false;
      } else if (previousXRef.current <= x) {
        
        pathDataRef.current += ` L ${x} ${ekgValue}`;
      }
      previousXRef.current = x;
      previousYRef.current = ekgValue;
      setPathData(pathDataRef.current);
    }

    animationRef.current = requestAnimationFrame(draw);
  };

    useEffect(() => {
    resetEkg();
    
    if (isRunning && containerWidth > 0) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(draw);
    }
  }, [bpm, noiseType, ekgType]);

  useEffect(() => {
    if (isRunning && containerWidth > 0) {
      animationRef.current = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isRunning, containerWidth]);

  
  useEffect(() => {
    EkgFactory.resetNoiseCache();
  }, [noiseType]);  const resetEkg = () => {
    
    cancelAnimationFrame(animationRef.current);
    
    
    xOffsetRef.current = 0;
    previousXRef.current = 0;
    previousYRef.current = BASELINE;
    isFirstPointRef.current = true;
    pathDataRef.current = '';
    setPathData('');
    setDisplayBpm(bpm); 
    
    
    EkgFactory.resetNoiseCache();
  };

  
  const generateFluctuation = (value: number | undefined): number | undefined => {
    if (value === undefined) return undefined;

    const fluctPercent = (Math.random() - 0.5) * 2 * FLUCTUATION_RANGE;
    const fluctAmount = value * (fluctPercent / 100);
    return Math.round(value + fluctAmount);
  };

  
  useEffect(() => {
    
    setDisplayBpm(bpm);
    
    
    if (fluctuationTimerRef.current) {
      clearInterval(fluctuationTimerRef.current);
    }
    
    
    if (isRunning && bpm !== undefined) {
      fluctuationTimerRef.current = setInterval(() => {
        setDisplayBpm(generateFluctuation(bpm));
      }, 1000); 
    }
    
    return () => {
      if (fluctuationTimerRef.current) {
        clearInterval(fluctuationTimerRef.current);
      }
    };
  }, [bpm, isRunning]);

  const onLayout = () => {
    if (containerRef.current) {
      containerRef.current.measure((x, y, width, height, pageX, pageY) => {
        if (width > 0 && width !== containerWidth) {
          setContainerWidth(width);
        }
      });
    }
  };  return (
    <View 
      style={styles.container} 
      ref={containerRef} 
      onLayout={onLayout}
    >      <Svg height="300" width="100%" style={styles.svg} viewBox={`0 0 ${containerWidth} 300`}>
        <Defs>
          <Filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <FeGaussianBlur stdDeviation="2" result="blur" />
            <FeDropShadow dx="0" dy="0" stdDeviation="2" {...{'flood-color': "#00ff00", 'flood-opacity': "0.8"}} />
          </Filter>
        </Defs>
        
        {}
        {pathData ? (
          <Path d={pathData} stroke="#00ff00" strokeWidth="2" fill="none" />
        ) : null}
        
        {}
        {pathData ? (
          <Path d={pathData} stroke="#00ff00" strokeWidth="3" fill="none" filter="url(#glow)" opacity="0.7" />
        ) : null}          {}
        {displayBpm ? (
          <>
            <Text 
              x={containerWidth - 20} 
              y="40" 
              fill="#00ff00" 
              fontSize="24" 
              fontWeight="bold" 
              textAnchor="end"
            >
              {displayBpm} BPM
            </Text>
            {}
            <Text 
              x={containerWidth - 20} 
              y="40" 
              fill="#00ff00" 
              fontSize="24" 
              fontWeight="bold" 
              textAnchor="end"
              filter="url(#glow)"
              opacity="0.5"
            >
              {displayBpm} BPM
            </Text>
          </>
        ) : null}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    backgroundColor: 'black',
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default EkgDisplay;