"""Building stored measurements and scoring a user's history. Pure functions."""

from dataclasses import asdict

from score import ScoreResult, flagged_result, progress_result, ratio_result, since_previous_result
from validation import Ingredients

# Same plausible range as SHOULDER_EDGE_TO_JOINT_MIN/MAX in frontend/src/measure/maths.ts.
SHOULDER_EDGE_TO_JOINT_MIN = 1.1
SHOULDER_EDGE_TO_JOINT_MAX = 1.8


def shoulder_check(edge_px: float, joint_px: float) -> str:
    ratio = edge_px / joint_px
    if ratio > SHOULDER_EDGE_TO_JOINT_MAX:
        return "too_wide"
    if ratio < SHOULDER_EDGE_TO_JOINT_MIN:
        return "too_narrow"
    return "ok"


def build_card(user_id: str, timestamp: str, ing: Ingredients) -> dict:
    """The item stored in DynamoDB. Ratio and check are computed here, never trusted from the client."""
    return {
        "userId": user_id,
        "timestamp": timestamp,
        "shoulderToWaist": ing.shoulder_edge_px / ing.waist_edge_px,
        "shoulderEdgePx": ing.shoulder_edge_px,
        "waistEdgePx": ing.waist_edge_px,
        "shoulderJointPx": ing.shoulder_joint_px,
        "hipJointPx": ing.hip_joint_px,
        "torsoLengthPx": ing.torso_length_px,
        "shoulderCheck": shoulder_check(ing.shoulder_edge_px, ing.shoulder_joint_px),
        "methodVersion": ing.method_version,
    }


def score_history(cards: list[dict]) -> tuple[str | None, list[tuple[dict, ScoreResult]]]:
    """Score every card against the baseline: the earliest card whose shoulderCheck is ok."""
    ordered = sorted(cards, key=lambda card: card["timestamp"])
    baseline = next((card for card in ordered if card["shoulderCheck"] == "ok"), None)

    scored = []
    for card in ordered:
        if card["shoulderCheck"] != "ok":
            result = flagged_result(card["shoulderToWaist"], card["shoulderCheck"])
        elif card is baseline:
            result = ratio_result(card["shoulderToWaist"])
        else:
            result = progress_result(card["shoulderToWaist"], baseline["shoulderToWaist"])
        scored.append((card, result))

    return (baseline["timestamp"] if baseline else None), scored


def since_previous(cards: list[dict]) -> dict[str, ScoreResult]:
    """For each ok card after the first, its change since the previous ok card. Flagged cards are skipped."""
    ok_cards = [card for card in sorted(cards, key=lambda card: card["timestamp"]) if card["shoulderCheck"] == "ok"]
    return {
        current["timestamp"]: since_previous_result(current["shoulderToWaist"], previous["shoulderToWaist"])
        for previous, current in zip(ok_cards, ok_cards[1:])
    }


def public_card(card: dict, baseline_timestamp: str | None) -> dict:
    """What the browser sees. Pixel ingredients are never returned."""
    return {
        "timestamp": card["timestamp"],
        "shoulderToWaist": card["shoulderToWaist"],
        "shoulderCheck": card["shoulderCheck"],
        "methodVersion": card["methodVersion"],
        "isBaseline": card["timestamp"] == baseline_timestamp,
    }


def score_dict(result: ScoreResult) -> dict:
    return asdict(result)
