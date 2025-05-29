import React, {
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Svg, { Path, Rect, G } from "react-native-svg";

interface Spo2ChartProps {
  value: number;
  frameRate?: number;
  svgHeight?: number;
  viewBoxHeight?: number;
}

const FLASH_STEP = 2;

const Spo2Chart: React.FC<Spo2ChartProps> = ({
  value,
  frameRate = 30,
  svgHeight = Platform.OS === "web" ? 300 : 280,
  viewBoxHeight = Platform.OS === "web" ? 300 : 280,
}) => {
  const theme = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewBox, setViewBox] = useState(`0 0 0 0`);
  const [pathData, setPathData] = useState(``);

  const containerRef = useRef<View>(null);
  const animationRef = useRef<number>();
  const xOffsetRef = useRef(0);
  const dataRef = useRef<number[]>([]);

  useLayoutEffect(() => {
    containerRef.current?.measure((_, __, w) => {
      if (w > 0) {
        setContainerWidth(w);
        const count = Math.ceil(w / FLASH_STEP) + 1;
        dataRef.current = new Array(count).fill(value / 100);
      }
    });
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
    return () => cancelAnimationFrame(animationRef.current!);
  }, [frameRate, containerWidth]);

  const updateChart = () => {
    if (containerWidth === 0) return;
    const amp = Math.max(0, Math.min(1, value / 100));
    dataRef.current.push(amp);
    if (dataRef.current.length > Math.ceil(containerWidth / FLASH_STEP) + 1) {
      dataRef.current.shift();
    }

    let path = ``;
    dataRef.current.forEach((v, i) => {
      const x = i * FLASH_STEP;
      const y = viewBoxHeight * (1 - v);
      path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    xOffsetRef.current = (xOffsetRef.current + FLASH_STEP) % containerWidth;
    setPathData(path);
    setViewBox(`${xOffsetRef.current} 0 ${containerWidth} ${viewBoxHeight}`);
  };

  const renderGrid = () => {
    const lines: JSX.Element[] = [];
    for (let y = 0; y <= viewBoxHeight; y += 50) {
      lines.push(
        <Path
          key={`h-major-${y}`}
          d={`M0 ${y} H${containerWidth}`}
          stroke={theme.dark ? "rgba(0,255,0,0.2)" : "rgba(0,136,0,0.15)"}
          strokeWidth={1}
        />
      );
    }
    for (let x = 0; x <= containerWidth; x += 50) {
      lines.push(
        <Path
          key={`v-major-${x}`}
          d={`M${x} 0 V${viewBoxHeight}`}
          stroke={theme.dark ? "rgba(0,255,0,0.2)" : "rgba(0,136,0,0.15)"}
          strokeWidth={1}
        />
      );
    }
    if (Platform.OS === "web") {
      for (let y = 0; y <= viewBoxHeight; y += 10) {
        lines.push(
          <Path
            key={`h-minor-${y}`}
            d={`M0 ${y} H${containerWidth}`}
            stroke={theme.dark ? "rgba(0,255,0,0.1)" : "rgba(0,136,0,0.05)"}
            strokeWidth={0.5}
          />
        );
      }
      for (let x = 0; x <= containerWidth; x += 10) {
        lines.push(
          <Path
            key={`v-minor-${x}`}
            d={`M${x} 0 V${viewBoxHeight}`}
            stroke={theme.dark ? "rgba(0,255,0,0.1)" : "rgba(0,136,0,0.05)"}
            strokeWidth={0.5}
          />
        );
      }
    }
    return lines;
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.primary }]}>SpO₂: {value.toFixed(1)}%</Text>
      <View
        ref={containerRef}
        onLayout={() =>
          containerRef.current?.measure((_, __, w) => w > 0 && setContainerWidth(w))
        }
        style={[styles.container, { height: svgHeight }]}
      >
        {containerWidth > 0 && (
          <Svg
            width={containerWidth}
            height={svgHeight}
            viewBox={viewBox}
            preserveAspectRatio="none"
          >
            <Rect width={containerWidth} height={viewBoxHeight} fill="#000" />
            <G>{renderGrid()}</G>
            <Path d={pathData} stroke={theme.colors.primary} strokeWidth={2} fill="none" />
          </Svg>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { width: "100%", backgroundColor: "transparent" },
  container: { width: "100%", overflow: "hidden" },
  label: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontWeight: "600",
    fontSize: Platform.OS === "web" ? 20 : 18,
  },
});

export default React.memo(Spo2Chart);
