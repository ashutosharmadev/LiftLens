# ADR-002: Pose extraction runs in the browser

- Status: Accepted
- Date: 2026-10-07

## Context

LiftLens turns a physique photo into body measurements. The heavy step is the pose model (MediaPipe pose landmarker, about 6 MB), which finds 33 body landmarks; the measurements are simple arithmetic on those points. The working prototype is in Python (`dev/landmark_test.py`).

The model can run in one of two places:

| | Browser (MediaPipe Tasks Vision JS) | Container-image Lambda (Python MediaPipe) |
|---|---|---|
| Cost | Runs on the user's device; AWS stores only numbers | MediaPipe + OpenCV exceed the 250 MB zip limit, so it needs a container image in ECR (roughly 0.5–1 GB, about $0.05–0.10/month, not always-free), an S3 upload bucket and 1–3 s of compute per photo |
| Privacy | The photo never leaves the device | Body photos are uploaded to and stored in AWS |
| Latency | One-time model download, then well under a second per photo on most devices | Upload, plus a cold start of a large container (often several seconds), plus processing |
| Accuracy | Same model family on WebGL/WASM; small differences between devices | Identical hardware every time |
| Existing code | Port the measurement logic to TypeScript | Reuse the Python prototype |

## Decision

Run pose detection and measurement **in the browser**. The photo never leaves the user's device; the API receives only the resulting measurements.

The deciding factor is **privacy**. Physique photos are highly sensitive personal data. If LiftLens never receives them, there is nothing to leak, secure or delete, and no question of trusting us with them. Removing the ECR cost is a further benefit under the $0 constraint.

## Consequences

- **Port to TypeScript.** The landmark and measurement logic moves to `frontend/src/measure/`. Unit tests run it on the fixture photos and compare against the Python prototype's numbers within a tolerance, so porting mistakes and device drift are measurable. Fixtures stay gitignored; the tests skip when they're missing.
- **Device variation.** Results can differ slightly between devices. Accepted for a personal progress tracker, where the same user usually measures on the same device.
- **Trust boundary.** The API receives numbers, not photos, so it cannot prove a measurement came from a real photo. Accepted: LiftLens is a personal tracker and a user who submits fake numbers only misleads themselves. The API still rejects physically impossible values.
- **Scoring stays server-side.** The score and its explanation are computed in the Python API Lambda, so there is one trusted implementation.
- **Model files are self-hosted.** The `.task` and `.wasm` files are served from our own S3 + CloudFront instead of a third-party CDN.

## Alternatives considered

- **Container-image Lambda.** Reuses the Python prototype and gives identical results everywhere, but uploads and stores body photos and adds an ongoing ECR cost. Rejected on privacy.
