import { EkgType, NoiseType, EkgFactory } from '@/services/EkgFactory';
import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface EkgDisplayProps {
  ekgType?: EkgType ;
  bpm?: number ;
  noiseType?: NoiseType ;
  isRunning?: boolean ;
}

const BASELINE = 150;

const EkgDisplay: React.FC<EkgDisplayProps> = ({ 
  ekgType, 
  bpm, 
  noiseType,
  isRunning 
}) => {
  const [pathData, setPathData] = useState('');
  const [containerWidth, setContainerWidth] = useState(0);
  const xOffsetRef = useRef(0);
  const previousXRef = useRef(0);
  const previousYRef = useRef(BASELINE);
  const isFirstPointRef = useRef(true);
  const animationRef = useRef(0);
  const pathDataRef = useRef('');
  const containerRef = useRef<View>(null);

  
  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.measure((x, y, width, height, pageX, pageY) => {
        if (width > 0) {
          setContainerWidth(width);
        }
      });
    }
  }, []);

  
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
  }, [bpm, noiseType]);

  useEffect(() => {
    if (isRunning && containerWidth > 0) {
      animationRef.current = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isRunning, bpm, noiseType, containerWidth]);

  
  useEffect(() => {
    EkgFactory.resetNoiseCache();
  }, [noiseType]);

  const resetEkg = () => {
    
    xOffsetRef.current = 0;
    previousXRef.current = 0;
    previousYRef.current = BASELINE;
    isFirstPointRef.current = true;
    pathDataRef.current = '';
    setPathData('');
    
    
    EkgFactory.resetNoiseCache();
  };

  
  const onLayout = () => {
    if (containerRef.current) {
      containerRef.current.measure((x, y, width, height, pageX, pageY) => {
        if (width > 0 && width !== containerWidth) {
          setContainerWidth(width);
        }
      });
    }
  };

  return (
    <View 
      style={styles.container} 
      ref={containerRef} 
      onLayout={onLayout}
    >
      <Svg height="300" width="100%" style={styles.svg}>
        {pathData ? (
          <Path d={pathData} stroke="#00ff00" strokeWidth="2" fill="none" />
        ) : null}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  svg: {
    backgroundColor: 'black',
    borderRadius: 8,
  },
});

export default EkgDisplay;