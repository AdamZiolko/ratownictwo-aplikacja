import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, PanResponder, GestureResponderEvent, LayoutChangeEvent, Platform } from 'react-native';

interface CustomSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  onValueChange: (value: number) => void;
  onSlidingComplete: (value: number) => void;
  style?: any;
  trackColor?: string;
  thumbColor?: string;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  minimumValue,
  maximumValue,
  onValueChange,
  onSlidingComplete,
  style,
  trackColor,
  thumbColor,
}: CustomSliderProps) => {
  const sliderRef = useRef<View>(null);
  const [measureWidth, setMeasureWidth] = useState(200); 
  const [localValue, setLocalValue] = useState(value); 
  const thumbRadius = 12;
  const isSlidingRef = useRef(false);
  const startPositionRef = useRef(0);
  const trackPositionRef = useRef({ x: 0, width: 0 });
  
  
  useEffect(() => {
    if (!isSlidingRef.current) {
      setLocalValue(value);
    }
  }, [value]);
  
  
  const calculateValueFromTouch = useCallback((x: number): number => {
    const { x: trackX, width: trackWidth } = trackPositionRef.current;
    if (trackWidth <= 0) return localValue;
    
    
    const relativePosition = Math.max(0, Math.min(1, (x - trackX) / trackWidth));
    
    
    const newValue = minimumValue + relativePosition * (maximumValue - minimumValue);
    
    
    return Math.round(Math.max(minimumValue, Math.min(maximumValue, newValue)));
  }, [localValue, minimumValue, maximumValue]);
  
  
  const getThumbPosition = useCallback((): number => {
    if (measureWidth <= 0) return thumbRadius;
    
    const percentage = (localValue - minimumValue) / (maximumValue - minimumValue);
    const position = percentage * (measureWidth - 2 * thumbRadius) + thumbRadius;
    
    return Math.max(thumbRadius, Math.min(measureWidth - thumbRadius, position));
  }, [localValue, minimumValue, maximumValue, measureWidth]);
  
  
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== measureWidth) {
      setMeasureWidth(width);
      
      
      if (sliderRef.current) {
        sliderRef.current.measure((x, y, width, height, pageX, pageY) => {
          trackPositionRef.current = { x: pageX, width: width };
        });
      }
    }
  }, [measureWidth]);
  
  
  const handleTrackPress = useCallback((event: GestureResponderEvent) => {
    if (!sliderRef.current) return;
    
    
    sliderRef.current.measure((x, y, width, height, pageX, pageY) => {
      trackPositionRef.current = { x: pageX, width: width };
      const touchX = event.nativeEvent.pageX;
      const newValue = calculateValueFromTouch(touchX);
      
      setLocalValue(newValue);
      onValueChange(newValue);
      onSlidingComplete(newValue);
    });
  }, [calculateValueFromTouch, onValueChange, onSlidingComplete]);
  
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gestureState) => {
        
        isSlidingRef.current = true;
        
        
        if (sliderRef.current) {
          sliderRef.current.measure((x, y, width, height, pageX, pageY) => {
            trackPositionRef.current = { x: pageX, width: width };
          });
        }
      },
      onPanResponderMove: (event, gestureState) => {
        
        const touchX = event.nativeEvent.pageX;
        const newValue = calculateValueFromTouch(touchX);
        
        if (newValue !== localValue) {
          setLocalValue(newValue);
          onValueChange(newValue);
        }
      },
      onPanResponderRelease: (event, gestureState) => {
        
        const touchX = event.nativeEvent.pageX;
        const newValue = calculateValueFromTouch(touchX);
        
        setLocalValue(newValue);
        onSlidingComplete(newValue);
        
        
        isSlidingRef.current = false;
      },
    })
  ).current;
  
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sliderRef.current) {
        sliderRef.current.measure((x, y, width, height, pageX, pageY) => {
          if (width > 0) {
            setMeasureWidth(width);
            trackPositionRef.current = { x: pageX, width: width };
          }
        });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [minimumValue, maximumValue]);
  
  return (
    <View 
      style={[styles.customSlider, style]} 
      ref={sliderRef}
      onLayout={handleLayout}
    >
      {}
      <TouchableOpacity 
        style={styles.sliderTrackArea}
        onPress={handleTrackPress}
        activeOpacity={0.8}
      >
        {}
        <View 
          style={[
            styles.sliderTrack, 
            { backgroundColor: trackColor || '#E0E0E0' }
          ]} 
        />
        
        {}
        <View 
          style={[
            styles.sliderFill, 
            { 
              backgroundColor: thumbColor || '#2196F3',
              width: getThumbPosition()
            }
          ]} 
        />
      </TouchableOpacity>
      
      {}
      <View 
        style={[
          styles.sliderThumb,
          { 
            backgroundColor: thumbColor || '#2196F3',
            left: getThumbPosition() - thumbRadius,
            
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 2,
              },
              android: { elevation: 4 }
            })
          }
        ]}
        {...panResponder.panHandlers}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  customSlider: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  sliderTrackArea: {
    height: 40, 
    justifyContent: 'center',
    borderRadius: 2,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  sliderFill: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    left: 0,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    top: 8,
    marginTop: -6, 
    zIndex: 1, 
    
  },
});

export default CustomSlider;