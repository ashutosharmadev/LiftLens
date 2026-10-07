// Checks the TypeScript port against the Python prototype on real photos.
// Reference files come from dev/export_fixture.py and are gitignored with the
// photos, so this suite skips when they're missing (e.g. in CI).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type Landmark, measureFront } from "./maths";

interface ParityFixture {
  image: string;
  width: number;
  height: number;
  person_value: number;
  landmarks: Landmark[];
  waist_mask_row: number[];
  python: {
    shoulder_width_px: number;
    hip_width_px: number;
    shoulder_to_hip: number;
    waist_y: number;
    waist_left: number;
    waist_right: number;
    waist_width_px: number;
    shoulder_to_waist: number;
  };
}

const FIXTURES_DIR = join(import.meta.dirname, "../../../dev/fixtures");
const files = existsSync(FIXTURES_DIR)
  ? readdirSync(FIXTURES_DIR).filter((name) => name.endsWith(".parity.json"))
  : [];

const TOLERANCE = 0.01; // 1%

function expectWithin(actual: number, expected: number) {
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThanOrEqual(TOLERANCE);
}

describe.skipIf(files.length === 0)("parity with the Python prototype", () => {
  for (const file of files) {
    it(file, () => {
      const fixture: ParityFixture = JSON.parse(readFileSync(join(FIXTURES_DIR, file), "utf8"));
      const py = fixture.python;

      const result = measureFront(
        fixture.landmarks,
        fixture.width,
        fixture.height,
        (y) => {
          expect(y).toBe(py.waist_y);
          return fixture.waist_mask_row;
        },
        fixture.person_value,
      );

      expect(result.waistY).toBe(py.waist_y);
      expect(result.waistEdges).toEqual({ left: py.waist_left, right: py.waist_right });
      expectWithin(result.shoulderWidthPx, py.shoulder_width_px);
      expectWithin(result.hipWidthPx, py.hip_width_px);
      expectWithin(result.waistWidthPx, py.waist_width_px);
      expectWithin(result.shoulderToHip, py.shoulder_to_hip);
      expectWithin(result.shoulderToWaist, py.shoulder_to_waist);
    });
  }
});
