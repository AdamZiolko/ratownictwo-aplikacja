import React, {
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useTheme } from "react-native-paper";
import Svg, {
  Rect,
  G,
  Path,
  Path as SvgPath,
  Text as SvgText,
} from "react-native-svg";

interface Spo2ChartProps {
  value: number;         
  frameRate?: number;    
  svgHeight?: number;   
  viewBoxHeight?: number;
}

const FLASH_STEP = 4;      
const BASELINE = 5;       
const PEAK_DURATION_MS = 250; 

const MIN_SPO2 = 70;
const MAX_SPO2 = 100;
const MAX_INTERVAL = 1500;  
const MIN_INTERVAL = 500;  

const Spo2Chart: React.FC<Spo2ChartProps> = ({
  value,
  frameRate = 30,
  svgHeight = Platform.OS === "web" ? 200 : 200,
  viewBoxHeight = Platform.OS === "web" ? 150 : 150,
}) => {
  const theme = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [pathData, setPathData] = useState("");
  const [lastPoints, setLastPoints] = useState<{ x: number; y: number }[]>([]);

  const containerRef = useRef<View>(null);
  const animationRef = useRef<number>();
  const dataRef = useRef<number[]>([]);       
  const pathRef = useRef<string>("");

  const timeSinceLastPeakRef = useRef<number>(0);
  const peakElapsedRef = useRef<number>(0);
  const inPeakRef = useRef<boolean>(false);
  const lastTimestampRef = useRef<number>(0);

  const computeIntervalMs = (spo2: number) => {
    const clamped = Math.max(MIN_SPO2, Math.min(MAX_SPO2, spo2));
    const t = (clamped - MIN_SPO2) / (MAX_SPO2 - MIN_SPO2); 
    return MAX_INTERVAL - (MAX_INTERVAL - MIN_INTERVAL) * t;
  };

  const plethValueAtPhase = (phase: number) => {
    if (phase < 0.2) {
      return Math.pow(phase / 0.2, 2);
    } else if (phase < 0.25) {
      return 1.0;
    } else if (phase < 0.5) {
      const t = (phase - 0.25) / 0.25; 
      return 1.0 - t * 0.8;           
    } else if (phase < 0.7) {
      const t = (phase - 0.5) / 0.2; 
      return 0.2 + t * 0.15;        
    } else {
      const t = (phase - 0.7) / 0.3; 
      return 0.35 * (1 - t);        
    }
  };

  const computeY = (v: number) => {
    return viewBoxHeight - (v * (viewBoxHeight - 2 * BASELINE) + BASELINE);
  };

  useLayoutEffect(() => {
    containerRef.current?.measure((_, __, w) => {
      if (w > 0) {
        setContainerWidth(w);
        dataRef.current = []; 
        buildPathFromData();
      }
    });
  }, [containerWidth]);

  useEffect(() => {
    const interval = 1000 / frameRate;
    let lastTime = 0;

    const animate = (now: number) => {
      if (now - lastTime >= interval) {
        lastTime = now;
        updateChart(now);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [frameRate, containerWidth, value]);

  const updateChart = (timestamp: number) => {
    if (containerWidth === 0) return;

    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
    }
    const δt = timestamp - lastTimestampRef.current; 
    lastTimestampRef.current = timestamp;

    const intervalMs = computeIntervalMs(value);

    let pleth = 0;
    if (inPeakRef.current) {
      peakElapsedRef.current += δt;
      if (peakElapsedRef.current >= PEAK_DURATION_MS) {
        inPeakRef.current = false;
        timeSinceLastPeakRef.current = 0;
        peakElapsedRef.current = 0;
        pleth = 0;
      } else {
        const phase = peakElapsedRef.current / PEAK_DURATION_MS;
        pleth = plethValueAtPhase(phase);
      }
    } else {
      timeSinceLastPeakRef.current += δt;
      if (timeSinceLastPeakRef.current >= intervalMs) {
        inPeakRef.current = true;
        peakElapsedRef.current = 0;
        timeSinceLastPeakRef.current = 0;
        pleth = plethValueAtPhase(0);
      } else {
        pleth = 0;
      }
    }

    dataRef.current.push(pleth);
    const maxPoints = Math.ceil(containerWidth / FLASH_STEP) + 1;

    if (dataRef.current.length > maxPoints) {
      dataRef.current = [];
      dataRef.current.push(pleth);
      inPeakRef.current = false;
      peakElapsedRef.current = 0;
      timeSinceLastPeakRef.current = 0;
    }

    buildPathFromData();
  };

  const buildPathFromData = () => {
    if (containerWidth === 0) {
      setPathData("");
      return;
    }

    let path = "";
    const points: { x: number; y: number }[] = [];

    dataRef.current.forEach((v, i) => {
      const x = i * FLASH_STEP;               
      const y = computeY(v);

      if (i === 0) {
        path = `M ${x} ${y}`;
      } else {
        const prevX = (i - 1) * FLASH_STEP;
        const prevY = computeY(dataRef.current[i - 1]);

        const cp1x = prevX + (x - prevX) * 0.5;
        const cp1y = prevY;
        const cp2x = x - (x - prevX) * 0.5;
        const cp2y = y;

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
      }

      points.push({ x, y });
    });

    setLastPoints(points.slice(-3));
    setPathData(path);
    pathRef.current = path;
  };

  const viewBox = `0 0 ${containerWidth} ${viewBoxHeight}`;

  const renderGrid = () => {
    if (containerWidth === 0) return null;
    const lines: JSX.Element[] = [];
    const majorColor = "rgba(0,255,0,0.15)";
    const minorColor = "rgba(0,255,0,0.05)";

    for (let y = 0; y <= viewBoxHeight; y += 50) {
      lines.push(
        <SvgPath
          key={`h-major-${y}`}
          d={`M 0 ${y} H ${containerWidth}`}
          stroke={majorColor}
          strokeWidth="1"
        />
      );
    }
    for (let x = 0; x <= containerWidth; x += 50) {
      lines.push(
        <SvgPath
          key={`v-major-${x}`}
          d={`M ${x} 0 V ${viewBoxHeight}`}
          stroke={majorColor}
          strokeWidth="1"
        />
      );
    }

    for (let y = 0; y <= viewBoxHeight; y += 10) {
      lines.push(
        <SvgPath
          key={`h-minor-${y}`}
          d={`M 0 ${y} H ${containerWidth}`}
          stroke={minorColor}
          strokeWidth="0.5"
        />
      );
    }
    for (let x = 0; x <= containerWidth; x += 10) {
      lines.push(
        <SvgPath
          key={`v-minor-${x}`}
          d={`M ${x} 0 V ${viewBoxHeight}`}
          stroke={minorColor}
          strokeWidth="0.5"
        />
      );
    }

    return <G>{lines}</G>;
  };

  return (
    <View
      ref={containerRef}
      onLayout={() =>
        containerRef.current?.measure((_, __, w) => {
          if (w > 0) setContainerWidth(w);
        })
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

          {renderGrid()}

          <Path
            d={pathData}
            stroke="#4CAF50"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

       

          <SvgText
            x={containerWidth - 10}
            y={20}
            fill="#4CAF50"
            fontSize="20"
            fontWeight="bold"
            textAnchor="end"
          >
            {`${value}%`}
          </SvgText>

          <SvgText
            x={containerWidth / 2}
            y={viewBoxHeight - 2}
            fill="#4CAF50"
            fontSize="12"
            textAnchor="middle"
          >
            Czas →
          </SvgText>
        </Svg>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
});

export default React.memo(Spo2Chart);
