# LiftLens — Measurement Engine

This is the highest-risk, highest-value component in the system. Get this wrong and every
downstream ratio, score, and insight is wrong too. This document is deliberately conservative
about what's actually extractable from standardized 2D photos.

## A constraint that shapes everything below

**A single 2D monocular photo has no inherent scale.** Pixel distances are not centimeters
unless something in the frame provides a known real-world reference. Two options, and this is
a real product decision, not a footnote:

1. **No calibration** (Sprint 1 default): every raw measurement is expressed in **normalized
   units** — as a fraction of a stable reference length in the same image (e.g., shoulder width
   ÷ torso height). This is honest, requires no extra user input, and is sufficient for
   everything the Ratio and Scoring engines actually need, since those are ratios anyway.
2. **User-entered height as a calibration reference** (optional, later sprint): if the user
   enters their height once, the engine can scale normalized measurements into approximate
   centimeters. This is explicitly an *approximation* — it assumes the person is standing fully
   upright and fully in frame at capture time — and the UI must label calibrated measurements as
   estimated, not measured.

Do not build absolute-cm measurement as if it's ground truth from image analysis alone; it
isn't, and presenting it as such is the kind of overclaim that damages credibility with a
technical reviewer who understands monocular vision limitations.

## Raw measurements (landmark-distance based)

All computed as normalized distances between detected landmark pairs, from front pose unless
noted:

| Metric key | Description | Landmarks used |
|---|---|---|
| `shoulder_width` | Biacromial width | left/right shoulder |
| `chest_width` | Chest breadth at underarm level | left/right underarm proxy points |
| `waist_width` | Waist breadth at navel level | left/right torso-side points at waist height |
| `hip_width` | Hip breadth | left/right hip |
| `neck_width` | Neck breadth | left/right neck-base points |
| `bicep_width_left/right` | Upper-arm breadth, relaxed | shoulder–elbow midpoint region |
| `forearm_width_left/right` | Forearm breadth | elbow–wrist midpoint region |
| `thigh_width_left/right` | Thigh breadth (front or side) | hip–knee midpoint region |
| `calf_width_left/right` | Calf breadth | knee–ankle midpoint region |
| `torso_length` | Shoulder-to-hip vertical distance | shoulder midpoint, hip midpoint |
| `leg_length_left/right` | Hip-to-ankle vertical distance | hip, ankle |
| `arm_length_left/right` | Shoulder-to-wrist distance | shoulder, elbow, wrist |

All widths are estimated at a fixed fraction of body height along the vertical axis (e.g.,
"waist" = the width at the vertical position where a waist is anatomically expected), since
none of these are hard anatomical landmarks a pose model directly outputs — this is an
approximation the docs should not hide from a technical reader.

## Derived ratios

| Ratio key | Formula | What it represents |
|---|---|---|
| `shoulder_to_waist` | shoulder_width / waist_width | Classic V-taper indicator |
| `waist_to_hip` | waist_width / hip_width | Waist-hip proportion |
| `shoulder_to_hip` | shoulder_width / hip_width | Upper-body-to-frame proportion |
| `chest_to_waist` | chest_width / waist_width | Torso taper |
| `arm_to_torso` | arm_length / torso_length | Limb-to-torso proportion |
| `leg_to_torso` | leg_length / torso_length | Limb-to-torso proportion |

## Symmetry metrics (left vs. right, front pose)

Computed as `abs(left - right) / max(left, right)` for each bilateral pair:
`shoulder_height_symmetry`, `hip_height_symmetry`, `bicep_width_symmetry`,
`forearm_width_symmetry`, `thigh_width_symmetry`, `calf_width_symmetry`.
Lower is more symmetric; each is stored as its own row so the UI/Insight Engine can call out
the specific asymmetry rather than a vague aggregate.

## Posture metrics (side pose)

These are genuinely approximate — 2D side-view posture assessment is a simplification of what a
clinician would assess in 3D, and the docs/UI must say so:
- `shoulder_protraction_angle` — forward-rounding of the shoulder relative to the torso's
  vertical axis (ear–shoulder–hip angle).
- `head_forward_angle` — ear position relative to shoulder's vertical line.
- `pelvic_tilt_estimate` — hip landmark angle relative to vertical, a rough proxy only; framed
  in the UI as "estimate," never "diagnosis" — this is wellness/fitness information, not a
  medical assessment, and the product must not present it as one.

## Explainability & confidence metrics

- Every `RawMeasurement` and `DerivedRatio` row carries a `confidence` value, propagated from
  the minimum per-landmark detection confidence among the landmarks it was computed from — a
  measurement is only as trustworthy as its weakest input landmark.
- Every measurement stores which landmarks it was derived from (`formula_ref` /
  supporting-landmark IDs), so the UI's "Measurements" tab can draw the exact points used —
  this is the concrete mechanism behind "explainable," not just a marketing word.
- A measurement-set-level aggregate confidence is computed (e.g., mean of all per-metric
  confidences) and used to flag a whole scan as low-confidence if capture quality was poor.

## What is deliberately NOT measured

- Body fat percentage, muscle mass, or any composition estimate — these require either
  calibrated 3D scanning or bioelectrical/DEXA-class hardware; a photo-based estimate would be
  a black-box guess dressed up as a measurement, which violates this project's core promise.
  If this is wanted later, it belongs behind an explicit "estimated, low-confidence" disclosure
  and ideally a separate, clearly-labeled model — not folded into the Measurement Engine's
  otherwise-deterministic outputs.
- Absolute skinfold/circumference measurements (as a caliper or tape measure would give) — 2D
  photos can approximate *width*, not circumference, without a second calibrated view axis.
