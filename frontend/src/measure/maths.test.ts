import { describe, expect, it } from "vitest";
import {
  distance,
  findWaistEdges,
  type Landmark,
  LANDMARK,
  measureFront,
  toPx,
  torsoCenterX,
  torsoPoints,
  waistRowY,
} from "./maths";

const P = 0; // person
const B = 255; // background

function landmarksWith(points: Record<number, Landmark>): Landmark[] {
  const all: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0 }));
  for (const [index, point] of Object.entries(points)) all[Number(index)] = point;
  return all;
}

// A 100 x 200 image with shoulders at y=40 and hips at y=140.
const BODY = landmarksWith({
  [LANDMARK.LEFT_SHOULDER]: { x: 0.7, y: 0.2 },
  [LANDMARK.RIGHT_SHOULDER]: { x: 0.3, y: 0.2 },
  [LANDMARK.LEFT_HIP]: { x: 0.6, y: 0.7 },
  [LANDMARK.RIGHT_HIP]: { x: 0.4, y: 0.7 },
});

describe("toPx", () => {
  it("scales normalised coordinates by image size", () => {
    expect(toPx({ x: 0.5, y: 0.25 }, 200, 400)).toEqual({ x: 100, y: 100 });
  });
});

describe("distance", () => {
  it("is the straight-line distance (3-4-5 triangle)", () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe("waistRowY and torsoCenterX", () => {
  const points = torsoPoints(BODY, 100, 200);

  it("puts the waist 65% of the way from shoulders to hips", () => {
    // shoulders y=40, hips y=140 -> 40 + 0.65 * 100 = 105
    expect(waistRowY(points)).toBe(105);
  });

  it("centres between the shoulders", () => {
    expect(torsoCenterX(points)).toBe(50);
  });
});

describe("findWaistEdges", () => {
  it("finds the outermost person pixels around the start", () => {
    const row = [B, B, P, P, P, P, B, B];
    expect(findWaistEdges(row, 3, P)).toEqual({ left: 2, right: 5 });
  });

  it("stops at the first gap, so arms beside the torso are excluded", () => {
    const row = [P, P, B, P, P, P, B, P];
    expect(findWaistEdges(row, 4, P)).toEqual({ left: 3, right: 5 });
  });

  it("returns null when the start is on background", () => {
    expect(findWaistEdges([P, B, P], 1, P)).toBeNull();
  });

  it("returns null when the start is outside the row", () => {
    expect(findWaistEdges([P, P], 5, P)).toBeNull();
  });

  it("reaches the image edge when the person fills the row", () => {
    expect(findWaistEdges([P, P, P, P], 1, P)).toEqual({ left: 0, right: 3 });
  });
});

describe("measureFront", () => {
  it("combines widths and ratios", () => {
    // Torso spans columns 30..70 on the waist row.
    const row = Array.from({ length: 100 }, (_, x) => (x >= 30 && x <= 70 ? P : B));
    const result = measureFront(BODY, 100, 200, () => row, P);

    expect(result.shoulderWidthPx).toBeCloseTo(40);
    expect(result.hipWidthPx).toBeCloseTo(20);
    expect(result.shoulderToHip).toBeCloseTo(2);
    expect(result.waistY).toBe(105);
    expect(result.waistEdges).toEqual({ left: 30, right: 70 });
    expect(result.waistWidthPx).toBe(40);
    expect(result.shoulderToWaist).toBeCloseTo(1);
  });

  it("asks for the mask row at the waist", () => {
    const rowsRequested: number[] = [];
    const row = Array(100).fill(P);
    measureFront(BODY, 100, 200, (y) => (rowsRequested.push(y), row), P);
    expect(rowsRequested).toEqual([105]);
  });

  it("throws a clear error when no person is at the torso centre", () => {
    const row = Array(100).fill(B);
    expect(() => measureFront(BODY, 100, 200, () => row, P)).toThrow(/No person pixels/);
  });
});
