# Scoring (V1)

Code: `backend/scoring/score.py` (tests in `test_score.py`).

## What is scored

One number: the **shoulder-to-waist ratio**, with both widths measured edge to edge on the body outline (see [ADR-004](adr/004-scale-free-measurements.md)).

Why only this one:

- **It was the only steady number.** Two photos of the same person in the same session gave 1.784 and 1.785. The hip-normalised indexes differed by 11% on the same photos, so they aren't reliable enough to score yet.
- **It's the number lifters already track.** Shoulder-to-waist is the standard measure of a V-taper.

LiftLens tracks this number; it does not judge it against an "ideal" value such as 1.618. Scores compare a user only with their own first photo.

## The two results

| Shown from | Result | Formula |
|---|---|---|
| First photo | `ratio_result` | `shoulder_width / waist_width` |
| Second photo on | `progress_result` | `(current - baseline) / baseline × 100`, where `baseline` is the first photo's ratio |

Every result returns:

| Field | Meaning |
|---|---|
| `name` | What was scored |
| `value` | The number, at full precision |
| `status` | `baseline`, `increased`, `decreased` or `no_clear_change` |
| `formula` | The formula as text |
| `inputs` | Every number that went into it, by name |
| `explanation` | One plain-English sentence (numbers rounded for reading only) |

Progress is shown as a **percent change**, not points. Points would need an invented scale (how many points is 1%? what is 100?) that every explanation would then have to unwrap; a percent change is the honest number with nothing to unwrap.

Status words describe, they don't judge: a rising ratio is "increased", not "better", because users don't all share the same goal.

## Worked example

Riya's shoulder-to-waist ratio over three photos:

| Photo | Ratio | Result | Explanation |
|---|---|---|---|
| Week 0 | 1.70 | baseline | "Your shoulders are 1.70× as wide as your waist." |
| Week 4 | 1.71 | +0.6%, no clear change | "Your shoulder-to-waist ratio changed +0.6% since your first photo (1.70 → 1.71), within the ±2% measurement noise, so there's no clear change yet." |
| Week 12 | 1.78 | +4.7%, increased | "Your shoulder-to-waist ratio rose 4.7% since your first photo (1.70 → 1.78)." |

Check week 12 by hand: (1.78 − 1.70) ÷ 1.70 × 100 = 4.7.

## Measurement noise

Photos of an unchanged body still vary a little (angle, posture, lighting). A change smaller than `NOISE_THRESHOLD` is reported as "no clear change".

- Current value: **±2%**, a cautious placeholder.
- To calibrate it: take about 5 front photos in one session, measure the shoulder-to-waist ratio of each, and set the threshold to about **twice their spread** (largest minus smallest, as a fraction of the average). Update the constant and this section.

## Input checks

Ratios that aren't finite numbers, or fall outside **0.8–3.0**, are rejected with an error naming the bad input. The API receives measurements, not photos (see [ADR-002](adr/002-pose-extraction-in-browser.md)), so this is where impossible values are stopped.

## What the score does not do

- No "attractiveness" or "aesthetics" number, and no comparison with an ideal body.
- No comparison with other users.
- No hidden weights or learned models: the formula above is the whole calculation.
