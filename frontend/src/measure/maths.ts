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

/**
 * Plausible range for outer shoulder width / shoulder joint width.
 * Good front photos measured 1.39–1.49. Wider usually means raised or spread
 * arms joined the outline; narrower means the walk stopped at a gap.
 */
export const SHOULDER_EDGE_TO_JOINT_MIN = 1.1;
export const SHOULDER_EDGE_TO_JOINT_MAX = 1.8;

export type ShoulderCheck = "ok" | "too_wide" | "too_narrow";

export interface TorsoPoints {
  leftShoulder: Point;
  rightShoulder: Point;
  leftHip: Point;
  rightHip: Point;
}

export interface BodyEdges {
  left: number;
  right: number;
}

export interface FrontMeasurements {
  /** Outer shoulder width: edge to edge of the body outline at the shoulder line. */
  shoulderWidthPx: number;
  /** Distance between the two shoulder joint landmarks. */
  shoulderJointWidthPx: number;
  shoulderY: number;
  shoulderEdges: BodyEdges;
  /** Whether outer shoulder width is plausible relative to joint width. */
  shoulderCheck: ShoulderCheck;
  /** Distance between the two hip joint landmarks. */
  hipWidthPx: number;
  /** Joint to joint: shoulder joints / hip joints. */
  shoulderToHip: number;
  waistY: number;
  waistEdges: BodyEdges;
  waistWidthPx: number;
  /** Edge to edge: outer shoulder width / waist width. */
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

/** Pixel row of the shoulder line, midway between the two shoulder joints. */
export function shoulderRowY(points: TorsoPoints): number {
  return Math.trunc((points.leftShoulder.y + points.rightShoulder.y) / 2);
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
export function findBodyEdges(
  row: ArrayLike<number>,
  startX: number,
  personValue: number,
): BodyEdges | null {
  if (startX < 0 || startX >= row.length || row[startX] !== personValue) return null;

  let left = startX;
  while (left > 0 && row[left - 1] === personValue) left--;

  let right = startX;
  while (right < row.length - 1 && row[right + 1] === personValue) right++;

  return { left, right };
}

export function checkShoulder(edgeWidth: number, jointWidth: number): ShoulderCheck {
  const ratio = edgeWidth / jointWidth;
  if (ratio > SHOULDER_EDGE_TO_JOINT_MAX) return "too_wide";
  if (ratio < SHOULDER_EDGE_TO_JOINT_MIN) return "too_narrow";
  return "ok";
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
  const centerX = torsoCenterX(points);
  const shoulderJointWidthPx = distance(points.leftShoulder, points.rightShoulder);
  const hipWidthPx = distance(points.leftHip, points.rightHip);

  const edgesAt = (y: number, what: string) => {
    const edges = findBodyEdges(maskRowAt(y), centerX, personValue);
    if (!edges) throw new Error(`No person pixels at the torso centre on the ${what} row (${y})`);
    return edges;
  };

  // Both widths are edge to edge on the mask, so the ratio compares like with like.
  const shoulderY = shoulderRowY(points);
  const shoulderEdges = edgesAt(shoulderY, "shoulder");
  const shoulderWidthPx = shoulderEdges.right - shoulderEdges.left;

  const waistY = waistRowY(points);
  const waistEdges = edgesAt(waistY, "waist");
  const waistWidthPx = waistEdges.right - waistEdges.left;

  return {
    shoulderWidthPx,
    shoulderJointWidthPx,
    shoulderY,
    shoulderEdges,
    shoulderCheck: checkShoulder(shoulderWidthPx, shoulderJointWidthPx),
    hipWidthPx,
    shoulderToHip: shoulderJointWidthPx / hipWidthPx,
    waistY,
    waistEdges,
    waistWidthPx,
    shoulderToWaist: shoulderWidthPx / waistWidthPx,
  };
}
