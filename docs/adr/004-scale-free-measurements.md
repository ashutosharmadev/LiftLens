# ADR-004: Measurements are scale-free

- Status: Accepted
- Date: 2026-10-07

## Context

Porting the prototype (`dev/landmark_test.py`) to TypeScript surfaced two problems with what it measured.

1. **Mixed methods.** Shoulder width was the distance between the two shoulder *joint* landmarks, while waist width was measured *edge to edge* on the segmentation mask. The shoulder-to-waist ratio compared two different kinds of measurement, and it could not show deltoid growth: building the outer shoulder doesn't move the joints.
2. **Pixels, not centimetres.** A single photo shows shape, not size. Pixel widths change with camera distance and resolution, so "waist 640 px" means nothing on its own, and raw pixel widths can't be compared between photos.

## Decision

**Shoulders are measured edge to edge**, like the waist: walk the mask row at the shoulder line outward from the torso centre. Deltoid growth now changes the number.

Because arms can join the outline at shoulder height (for example when raised), outer shoulder width is checked against joint width. On good front photos it measured 1.39–1.49 times the joint width; outside **1.1–1.8** the measurement is flagged `too_wide` or `too_narrow` so the photo-quality step can ask for a retake. The range is deliberately loose and should be tuned as more photos are measured.

**No centimetres in V1.** LiftLens reports:

- **Ratios within one photo** (shoulder-to-waist, shoulder-to-hip). Pixels cancel out, so these are meaningful as they are.
- **Indexes for change over time:** shoulder width and waist width divided by **hip joint width**. Hip bones don't change with training or diet, so the hip joints act as a ruler present in every photo, and the indexes stay comparable between photos taken at different distances. Relative change ("waist index −4% since your first photo") is computed from the stored indexes once history exists.

Pixel widths are kept only for drawing the overlay; they are never shown as sizes.

## Consequences

- Users enter nothing extra: no height, no reference object.
- No absolute sizes ("42 cm") in V1.
- The indexes depend on the hip landmarks, the least precise of the four used. Turning slightly away from the camera also narrows them. The two fixture photos give the same shoulder-to-waist ratio (1.784 and 1.785) but shoulder indexes 11% apart (2.83 vs 2.51), so the hip-joint ruler can move by about that much between photos. Until more photos show the real spread, small changes in an index should be treated as noise, and the score explanation should say so.

## Alternatives considered

- **Both widths joint to joint (shoulder-to-hip only).** Stable, but hip joints barely change with fat loss or muscle gain, so progress wouldn't show.
- **Keep mixed methods as a "LiftLens index".** No new code, but deltoid growth stays invisible.
- **Centimetres from the user's height.** Gives real sizes, but needs the whole body in frame and an extra input that users may get wrong.
- **Centimetres from a reference object (e.g. A4 sheet).** Accurate when placed correctly, but awkward for users.
