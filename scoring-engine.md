# LiftLens — Scoring Engine

## Philosophy

The scoring engine's entire job is to compress many measurements into a small number of
interpretable composite scores — **without ever hiding how that compression happened.**
Concretely, this means:

1. **A score is always a weighted sum of named, visible components.** No neural network, no
   learned embedding, no opaque similarity-to-reference-population computation. If a component's
   weight can't be stated in the documentation, it doesn't belong in the formula.
2. **Every score decomposes back to its inputs.** `SCORE_COMPONENT` rows (see `database.md`)
   store each contributing metric, its weight, and its resulting contribution — the UI's
   "Score & Explanation" tab is a direct render of these rows, not a separate narrative.
3. **Reproducibility is a testable property.** Given a `MeasurementSet` and a
   `PipelineVersion`, the composite score must be exactly reproducible by re-running the
   published formula — this is enforced with unit tests that recompute scores from stored
   components and assert equality with the stored `composite_value`.
4. **Scored against the user's own history and stated goals, not a "universal ideal" body.**
   A single culturally-loaded "ideal proportions" target is both scientifically shaky and the
   single most alienating design choice available to this product. Default scoring should
   measure *symmetry, proportion consistency, and progress relative to the user's own
   baseline* — not a comparison to an external "attractiveness" standard.

## What gets scored (v1)

Three composite scores, each fully decomposable:

- **Proportion Score** — weighted combination of `shoulder_to_waist`, `waist_to_hip`,
  `shoulder_to_hip` ratio deviations from population-neutral reference *ranges* (not a single
  ideal point) published in `docs/measurement-engine.md`'s ratio table.
- **Symmetry Score** — weighted average of the symmetry metrics (lower asymmetry → higher
  score), inverted and scaled to 0–100.
- **Posture Score** — weighted combination of posture-metric deviations from neutral-alignment
  reference angles, explicitly labeled as a fitness/posture-awareness score, not a clinical
  assessment.

A single "overall" score, if built at all, is an explicit weighted average of the three above
with the weights themselves visible in the UI — never a fourth independently-learned number.

## Formula example (illustrative, not final tuning)

```
proportion_score = 100 - Σ [ weight_i * clamp(|ratio_i - target_range_i.center| / target_range_i.width, 0, 1) ] * 100 / Σ weight_i
```

Where `target_range_i` is a documented, published range per ratio (sourced from published
anthropometric proportion research, cited in the formula's docstring) — not a single
"perfect" number and not tuned to flatter any particular body type.

## Confidence gating

If a `MeasurementSet`'s aggregate confidence is below a threshold, the Scoring Engine still
computes scores but flags them `low_confidence=true` — the UI must visually distinguish these
rather than presenting a shaky score with the same authority as a high-confidence one.

## What this engine explicitly refuses to do

- Refuses to produce a single unexplained "attractiveness" or "aesthetics" number — this is the
  line between a defensible fitness-analytics product and something that invites (correctly)
  harsh scrutiny for pseudo-scientific body-image scoring.
- Refuses to compare a user against other users' bodies by default — cross-user comparison, if
  ever added, should be opt-in and framed carefully, not a default dashboard feature.
