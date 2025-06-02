import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Path, G, Rect } from 'react-native-svg';

interface Etco2ChartProps {
  value: number;
  frameRate?: number;
  height?: number;
}

const MAX_HISTORY = 300;
const CHART_WIDTH = 1000;

const Etco2Chart: React.FC<Etco2ChartProps> = ({
  value,
  frameRate = 30,
  height = 120,
}) => {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [viewBox, setViewBox] = useState(`0 0 ${CHART_WIDTH} ${height}`);
  const [pathData, setPathData] = useState('');
  const containerRef = useRef<View>(null);
  const animationRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const xOffsetRef = useRef(0);
  const dataRef = useRef<number[]>([]);

  useLayoutEffect(() => {
    containerRef.current?.measure((_, __, w) => {
      if (w > 0) setWidth(w);
    });

    dataRef.current = new Array(MAX_HISTORY).fill(0);
  }, []);

  useEffect(() => {
    const interval = 1000 / frameRate;
    let lastTime = 0;

    const animate = (now: number) => {
      if (now - lastTime >= interval) {
        lastTime = now;
        updateChart();
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationRef.current);
  }, [frameRate, height]);

  const updateChart = () => {
    dataRef.current.push(value);
    if (dataRef.current.length > MAX_HISTORY) {
      dataRef.current.shift();
    }

    xOffsetRef.current += 2;
    if (xOffsetRef.current > CHART_WIDTH) {
      xOffsetRef.current = 0;
    }

    let path = '';
    for (let i = 0; i < dataRef.current.length; i++) {
      const x = i * (CHART_WIDTH / MAX_HISTORY);
      const y =
        height * (1 - Math.max(0, Math.min(100, dataRef.current[i]) / 100));

      if (i === 0) {
        path = `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }

    setPathData(path);
    setViewBox(`${xOffsetRef.current} 0 ${CHART_WIDTH} ${height}`);
  };

  return (
    <View
      ref={containerRef}
      onLayout={() => {
        containerRef.current?.measure((_, __, w) => {
          if (w > 0 && w !== width) setWidth(w);
        });
      }}
      style={[styles.container, { height }]}
    >
      {width > 0 && (
        <Svg
          width={width}
          height={height}
          viewBox={viewBox}
          preserveAspectRatio="none"
        >
          {}
          <Rect x="0" y="0" width={CHART_WIDTH} height={height} fill="#000" />

          {}
          <G
            stroke={theme.dark ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.1)'}
          >
            {Array.from({ length: 6 }).map((_, i) => {
              const yLine = (height / 5) * i;
              return (
                <Path
                  key={`grid-${i}`}
                  d={`M 0 ${yLine} H ${CHART_WIDTH}`}
                  strokeWidth="0.5"
                />
              );
            })}
          </G>

          {}
          <Path
            d={pathData}
            stroke={theme.colors.secondary}
            strokeWidth={1.5}
            fill="none"
          />
        </Svg>
      )}

      <Text
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          color: theme.colors.secondary,
          fontSize: Platform.OS === 'web' ? 20 : 18,
          fontWeight: '600',
        }}
      >
        EtCO₂: {value.toFixed(1)} mmHg
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
  },
});

export default React.memo(Etco2Chart);
