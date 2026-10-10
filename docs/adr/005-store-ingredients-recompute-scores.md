# ADR-005: Store measurement ingredients, recompute scores

- Status: Accepted
- Date: 2026-10-10

## Context

Photos never leave the user's device ([ADR-002](002-pose-extraction-in-browser.md)). Once a check-in is over, the photo is gone, so any number not saved that day can never be calculated later.

At the same time, the measurement and scoring rules are still young:

- The hip-joint "ruler" behind the indexes varies by about 11% between photos of the same body ([ADR-004](004-scale-free-measurements.md)); a steadier ruler may replace it.
- The ±2% noise threshold is a placeholder awaiting calibration ([scoring.md](../scoring.md)).
- `maths.ts` may get bug fixes.

## Decision

**Store the ingredients.** Each measurement stores, besides the shoulder-to-waist ratio, the pixel values from that photo that any future ratio could be built from: outer shoulder width, waist width, shoulder joint width, hip joint width and torso length. Pixel values are meaningless *between* photos but exact *within* one, so ratios built from them later are valid for old photos too. They are never shown to users.

Each item also records `methodVersion`, the version of the measurement maths that produced its numbers, so results from different versions can be told apart or recomputed.

**Recompute scores on every read.** Scores and their explanations are never stored. Each request reads the user's items and scores them with the current rules, so a calibrated noise threshold or a fixed formula applies to the whole history at once.

**Keep flagged photos.** A measurement whose shoulder outline looks implausible is saved with its `shoulderCheck`, shown greyed out, and excluded from the baseline and from progress, so the history stays complete.

## Consequences

- A better ruler or formula improves every past measurement, not just new ones.
- Items are a little larger (five extra numbers, a few bytes each).
- A user's explanation for an old photo can change wording when the rules change. That is intended: it always reflects the current, best rules.
- Every read scores every item. At about one item per user per week this is negligible; if histories grow very large, add pagination or a cached baseline.

## Alternatives considered

- **Store only the ratio.** Smallest item, but nothing invented later can be applied to past photos, because the photos are gone.
- **Store the score with each item.** Explanations never change, but old items keep outdated thresholds and formulas forever.
- **Reject flagged photos.** Every stored item would be reliable, but gaps would appear in the history with no record of why.
