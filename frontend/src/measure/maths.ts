// Pure measurement maths: landmarks and mask rows in, numbers out.
// Ported from dev/landmark_test.py. No model, no browser APIs, so every
// function here is unit-testable with made-up data.

/** A pose landmark in normalised image coordinates (0..1). */
export interface Landmark {
  x: number;
  y: number;
  visibility?: number;
}

export interface Point {
  x: number;
  y: number;
}

/** MediaPipe pose landmark indices used by the measurements. */
export const LANDMARK = {
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
} as const;

/** The waist sits this far down from the shoulder line to the hip line. */
export const WAIST_FRACTION = 0.65;

export interface TorsoPoints {
  leftShoulder: Point;
  rightShoulder: Point;
  leftHip: Point;
  rightHip: Point;
}

export interface WaistEdges {
  left: number;
  right: number;
}

export interface FrontMeasurements {
  shoulderWidthPx: number;
  hipWidthPx: number;
  shoulderToHip: number;
  waistY: number;
  waistEdges: WaistEdges;
  waistWidthPx: number;
  shoulderToWaist: number;
}

export function toPx(landmark: Landmark, width: number, height: number): Point {
  return { x: landmark.x * width, y: landmark.y * height };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function torsoPoints(landmarks: Landmark[], width: number, height: number): TorsoPoints {
  const at = (index: number) => {
    const landmark = landmarks[index];
    if (!landmark) throw new Error(`Missing landmark ${index}`);
    return toPx(landmark, width, height);
  };
  return {
    leftShoulder: at(LANDMARK.LEFT_SHOULDER),
    rightShoulder: at(LANDMARK.RIGHT_SHOULDER),
    leftHip: at(LANDMARK.LEFT_HIP),
    rightHip: at(LANDMARK.RIGHT_HIP),
  };
}

/** Pixel row of the waist: WAIST_FRACTION of the way from shoulders to hips. */
export function waistRowY(points: TorsoPoints): number {
  const shoulderMidY = (points.leftShoulder.y + points.rightShoulder.y) / 2;
  const hipMidY = (points.leftHip.y + points.rightHip.y) / 2;
  // Math.trunc matches Python's int() in the prototype.
  return Math.trunc(shoulderMidY + WAIST_FRACTION * (hipMidY - shoulderMidY));
}

/** Approximate torso centre column, midway between the shoulders. */
export function torsoCenterX(points: TorsoPoints): number {
  return Math.trunc((points.leftShoulder.x + points.rightShoulder.x) / 2);
}

/**
 * Walk left and right from startX along one mask row while pixels belong to
 * the person. Returns the outermost person pixels on each side, or null if
 * startX is not on the person. Stops at the first gap, e.g. between arm and torso.
 */
export function findWaistEdges(
  row: ArrayLike<number>,
  startX: number,
  personValue: number,
): WaistEdges | null {
  if (startX < 0 || startX >= row.length || row[startX] !== personValue) return null;

  let left = startX;
  while (left > 0 && row[left - 1] === personValue) left--;

  let right = startX;
  while (right < row.length - 1 && row[right + 1] === personValue) right++;

  return { left, right };
}

/**
 * Front-photo measurements in pixels.
 * maskRowAt(y) returns row y of the segmentation mask.
 */
export function measureFront(
  landmarks: Landmark[],
  width: number,
  height: number,
  maskRowAt: (y: number) => ArrayLike<number>,
  personValue: number,
): FrontMeasurements {
  const points = torsoPoints(landmarks, width, height);
  const shoulderWidthPx = distance(points.leftShoulder, points.rightShoulder);
  const hipWidthPx = distance(points.leftHip, points.rightHip);

  const waistY = waistRowY(points);
  const waistEdges = findWaistEdges(maskRowAt(waistY), torsoCenterX(points), personValue);
  if (!waistEdges) {
    throw new Error(`No person pixels at the torso centre on row ${waistY}`);
  }
  // Same as the prototype: distance between the two edge pixels.
  const waistWidthPx = waistEdges.right - waistEdges.left;

  return {
    shoulderWidthPx,
    hipWidthPx,
    shoulderToHip: shoulderWidthPx / hipWidthPx,
    waistY,
    waistEdges,
    waistWidthPx,
    shoulderToWaist: shoulderWidthPx / waistWidthPx,
  };
}
