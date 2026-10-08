"""Explainable scoring for LiftLens.

V1 scores one number, the shoulder-to-waist ratio (edge to edge, see
docs/adr/004-scale-free-measurements.md), against the user's own first photo:

- ratio_result: the ratio itself, shown from the first photo on.
- progress_result: percent change since the first photo, from the second photo on.

Every result carries its formula, its named inputs and a one-sentence
explanation, so any number shown to a user can be recomputed by hand.
See docs/scoring.md.
"""

from dataclasses import dataclass, field
from math import isfinite

# Changes smaller than this (as a fraction) are treated as measurement noise.
# Placeholder until calibrated from same-session photos (see docs/scoring.md).
NOISE_THRESHOLD = 0.02

# Shoulder-to-waist ratios outside this range are rejected as implausible.
MIN_RATIO = 0.8
MAX_RATIO = 3.0


@dataclass(frozen=True)
class ScoreResult:
    name: str
    value: float
    status: str  # "baseline" | "increased" | "decreased" | "no_clear_change"
    formula: str
    inputs: dict[str, float] = field(default_factory=dict)
    explanation: str = ""


def validate_ratio(ratio: float, label: str = "shoulder_to_waist") -> float:
    if isinstance(ratio, bool) or not isinstance(ratio, (int, float)) or not isfinite(ratio):
        raise ValueError(f"{label} must be a finite number, got {ratio!r}")
    if not MIN_RATIO <= ratio <= MAX_RATIO:
        raise ValueError(f"{label} {ratio} is outside the plausible range {MIN_RATIO}–{MAX_RATIO}")
    return float(ratio)


def ratio_result(shoulder_to_waist: float) -> ScoreResult:
    ratio = validate_ratio(shoulder_to_waist)
    return ScoreResult(
        name="shoulder_to_waist",
        value=ratio,
        status="baseline",
        formula="shoulder_width / waist_width (both edge to edge)",
        inputs={"shoulder_to_waist": ratio},
        explanation=f"Your shoulders are {ratio:.2f}× as wide as your waist.",
    )


def progress_result(current: float, baseline: float) -> ScoreResult:
    current = validate_ratio(current, "current")
    baseline = validate_ratio(baseline, "baseline")

    change = (current - baseline) / baseline
    percent = change * 100
    numbers = f"({baseline:.2f} → {current:.2f})"

    if abs(change) < NOISE_THRESHOLD:
        status = "no_clear_change"
        explanation = (
            f"Your shoulder-to-waist ratio changed {percent:+.1f}% since your first photo {numbers}, "
            f"within the ±{NOISE_THRESHOLD:.0%} measurement noise, so there's no clear change yet."
        )
    elif change > 0:
        status = "increased"
        explanation = f"Your shoulder-to-waist ratio rose {percent:.1f}% since your first photo {numbers}."
    else:
        status = "decreased"
        explanation = f"Your shoulder-to-waist ratio fell {abs(percent):.1f}% since your first photo {numbers}."

    return ScoreResult(
        name="shoulder_to_waist_change_percent",
        value=percent,
        status=status,
        formula="(current - baseline) / baseline × 100",
        inputs={"current": current, "baseline": baseline, "noise_threshold": NOISE_THRESHOLD},
        explanation=explanation,
    )
