import {
  COLOR_PROTOTYPES,
  COLOR_CALIBRATION,
  COLOR_RATIO_THRESHOLDS,
  MIN_BRIGHTNESS,
} from './constants';

export interface ColorValue {
  r: number;
  g: number;
  b: number;
}

export const calculateDistance = (
  color1: ColorValue,
  color2: ColorValue
): number => {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
      Math.pow(color1.g - color2.g, 2) +
      Math.pow(color1.b - color2.b, 2)
  );
};

export const calculateSimilarity = (
  color1: ColorValue,
  color2: ColorValue
): number => {
  const sum1 = color1.r + color1.g + color1.b;
  const sum2 = color2.r + color2.g + color2.b;

  if (sum1 === 0 || sum2 === 0) return 0;

  const r1Ratio = color1.r / sum1;
  const g1Ratio = color1.g / sum1;
  const b1Ratio = color1.b / sum1;

  const r2Ratio = color2.r / sum2;
  const g2Ratio = color2.g / sum2;
  const b2Ratio = color2.b / sum2;

  const distance = Math.sqrt(
    Math.pow(r1Ratio - r2Ratio, 2) +
      Math.pow(g1Ratio - g2Ratio, 2) +
      Math.pow(b1Ratio - b2Ratio, 2)
  );

  return 1 / (1 + distance);
};

export const detectComplexColor = (color: ColorValue): string => {
  const { r, g, b } = color;
  const sum = r + g + b;

  if (sum === 0 || sum <= MIN_BRIGHTNESS) {
    console.log('[COLOR] Insufficient brightness or zero values');
    return 'none';
  }

  console.log('[COLOR] Raw values - R:', r, 'G:', g, 'B:', b);

  const distances = {
    red: calculateDistance(color, COLOR_PROTOTYPES.RED),
    green: calculateDistance(color, COLOR_PROTOTYPES.GREEN),
    blue: calculateDistance(color, COLOR_PROTOTYPES.BLUE),
  };

  console.log(
    '[COLOR] Distances - Red:',
    distances.red.toFixed(2),
    'Green:',
    distances.green.toFixed(2),
    'Blue:',
    distances.blue.toFixed(2)
  );

  let minDistance = Number.MAX_VALUE;
  let detectedColor = 'none';

  for (const [colorName, distance] of Object.entries(distances)) {
    if (distance < minDistance) {
      minDistance = distance;
      detectedColor = colorName;
    }
  }

  console.log(
    `[COLOR] Detected ${detectedColor.toUpperCase()} with distance ${minDistance.toFixed(
      2
    )}`
  );
  return detectedColor;
};

export const detectColorAdvanced = (color: ColorValue): string => {
  const { r, g, b } = color;
  const sum = r + g + b;

  if (sum === 0 || sum <= MIN_BRIGHTNESS) {
    console.log('[COLOR] Insufficient brightness or zero values');
    return 'none';
  }

  const rRatio = r / sum;
  const gRatio = g / sum;
  const bRatio = b / sum;

  console.log('[COLOR] Raw values - R:', r, 'G:', g, 'B:', b);
  console.log(
    '[COLOR] Ratios - R:',
    rRatio.toFixed(3),
    'G:',
    gRatio.toFixed(3),
    'B:',
    bRatio.toFixed(3)
  );

  const isWhite =
    Math.abs(rRatio - gRatio) < COLOR_RATIO_THRESHOLDS.WHITE_THRESHOLD &&
    Math.abs(rRatio - bRatio) < COLOR_RATIO_THRESHOLDS.WHITE_THRESHOLD &&
    Math.abs(gRatio - bRatio) < COLOR_RATIO_THRESHOLDS.WHITE_THRESHOLD;

  const isAllSimilar =
    Math.abs(r - g) < 10 && Math.abs(r - b) < 10 && Math.abs(g - b) < 10;

  if (isAllSimilar && r > 400 && r < 600) {
    console.log(
      '[COLOR] All RGB values are similar and in mid-range, likely sensor error'
    );
    return 'none';
  }

  if (isWhite) {
    console.log('[COLOR] Detected white/gray (equal RGB values)');

    if (rRatio > gRatio && rRatio > bRatio) {
      console.log('[COLOR] White with slight red tint');
      return 'red';
    } else if (gRatio > rRatio && gRatio > bRatio) {
      console.log('[COLOR] White with slight green tint');
      return 'green';
    } else if (bRatio > rRatio && bRatio > gRatio) {
      console.log('[COLOR] White with slight blue tint');
      return 'blue';
    } else {
      const colors = ['red', 'green', 'blue'];
      const randomIndex = Math.floor(Math.random() * colors.length);
      console.log(
        '[COLOR] Pure white, randomly selected:',
        colors[randomIndex]
      );
      return colors[randomIndex];
    }
  }

  const similarities = {
    red: calculateSimilarity(color, COLOR_CALIBRATION.TYPICAL_RED),
    green: calculateSimilarity(color, COLOR_CALIBRATION.TYPICAL_GREEN),
    blue: calculateSimilarity(color, COLOR_CALIBRATION.TYPICAL_BLUE),
    yellow: calculateSimilarity(color, COLOR_CALIBRATION.TYPICAL_YELLOW),
    orange: calculateSimilarity(color, COLOR_CALIBRATION.TYPICAL_ORANGE),
    purple: calculateSimilarity(color, COLOR_CALIBRATION.TYPICAL_PURPLE),
  };

  console.log(
    '[COLOR] Similarities:',
    'R:',
    similarities.red.toFixed(2),
    'G:',
    similarities.green.toFixed(2),
    'B:',
    similarities.blue.toFixed(2),
    'Y:',
    similarities.yellow.toFixed(2),
    'O:',
    similarities.orange.toFixed(2),
    'P:',
    similarities.purple.toFixed(2)
  );

  let maxSimilarity = 0;
  let dominantColor = 'none';

  for (const [colorName, similarity] of Object.entries(similarities)) {
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      dominantColor = colorName;
    }
  }

  if (maxSimilarity > 0.45) {
    console.log(
      `[COLOR] Detected ${dominantColor.toUpperCase()} based on similarity (${maxSimilarity.toFixed(
        2
      )})`
    );
    return dominantColor;
  }

  if (
    rRatio > COLOR_RATIO_THRESHOLDS.RED &&
    rRatio > gRatio * 1.1 &&
    rRatio > bRatio * 1.1
  ) {
    console.log('[COLOR] Detected RED based on ratio threshold');
    return 'red';
  }

  if (
    gRatio > COLOR_RATIO_THRESHOLDS.GREEN &&
    gRatio > rRatio * 1.1 &&
    gRatio > bRatio * 1.1
  ) {
    console.log('[COLOR] Detected GREEN based on ratio threshold');
    return 'green';
  }

  if (
    bRatio > COLOR_RATIO_THRESHOLDS.BLUE &&
    bRatio > rRatio * 1.1 &&
    bRatio > gRatio * 1.1
  ) {
    console.log('[COLOR] Detected BLUE based on ratio threshold');
    return 'blue';
  }

  if (
    rRatio > 0.3 &&
    gRatio > 0.3 &&
    bRatio < 0.25 &&
    Math.abs(rRatio - gRatio) < 0.15
  ) {
    console.log('[COLOR] Detected YELLOW based on R+G combination');
    return 'yellow';
  }

  if (
    rRatio > 0.4 &&
    gRatio > 0.2 &&
    gRatio < 0.4 &&
    bRatio < 0.25 &&
    rRatio > gRatio * 1.1
  ) {
    console.log('[COLOR] Detected ORANGE based on R>G combination');
    return 'orange';
  }

  if (
    rRatio > 0.3 &&
    bRatio > 0.3 &&
    gRatio < 0.25 &&
    Math.abs(rRatio - bRatio) < 0.15
  ) {
    console.log('[COLOR] Detected PURPLE based on R+B combination');
    return 'purple';
  }

  const rDiff = Math.max(rRatio - gRatio, rRatio - bRatio);
  const gDiff = Math.max(gRatio - rRatio, gRatio - bRatio);
  const bDiff = Math.max(bRatio - rRatio, bRatio - gRatio);

  const maxDiff = Math.max(rDiff, gDiff, bDiff);

  if (maxDiff > COLOR_RATIO_THRESHOLDS.COLOR_DIFF_THRESHOLD) {
    if (maxDiff === rDiff) {
      console.log('[COLOR] Selected RED based on maximum difference');
      return 'red';
    }
    if (maxDiff === gDiff) {
      console.log('[COLOR] Selected GREEN based on maximum difference');
      return 'green';
    }
    if (maxDiff === bDiff) {
      console.log('[COLOR] Selected BLUE based on maximum difference');
      return 'blue';
    }
  }

  if (r > g && r > b) {
    console.log('[COLOR] Last resort fallback to RED based on highest value');
    return 'red';
  }
  if (g > r && g > b) {
    console.log('[COLOR] Last resort fallback to GREEN based on highest value');
    return 'green';
  }
  if (b > r && b > g) {
    console.log('[COLOR] Last resort fallback to BLUE based on highest value');
    return 'blue';
  }

  const colors = ['red', 'green', 'blue'];
  const randomIndex = Math.floor(Math.random() * colors.length);
  console.log('[COLOR] Final random fallback:', colors[randomIndex]);
  return colors[randomIndex];
};
