import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

type Orientation = 'portrait' | 'landscape';

export function useOrientation(): {
  orientation: Orientation;
  screenWidth: number;
  screenHeight: number;
} {
  const [orientation, setOrientation] = useState<Orientation>(
    getOrientation()
  );
  const [screenDimensions, setScreenDimensions] = useState({
    screenWidth: Dimensions.get('window').width,
    screenHeight: Dimensions.get('window').height,
  });

  function getOrientation(): Orientation {
    const { width, height } = Dimensions.get('window');
    return width < height ? 'portrait' : 'landscape';
  }

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const { width, height } = window;
      const newOrientation = width < height ? 'portrait' : 'landscape';
      
      setOrientation(newOrientation);
      setScreenDimensions({
        screenWidth: width,
        screenHeight: height,
      });
    });

    return () => {
      
      subscription.remove();
    };
  }, []);

  return {
    orientation,
    screenWidth: screenDimensions.screenWidth,
    screenHeight: screenDimensions.screenHeight,
  };
}