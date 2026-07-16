# LiftLens — Project Roadmap

Each sprint below ships something real and demoable — no sprint depends on a future sprint to
be shown to a recruiter. Sprint 1 was scoped, per your call, around getting the full CV pipeline
working end-to-end for **one** measurement rather than scaffolding everything with nothing
working — that's the right call for avoiding an all-blueprint, no-working-code outcome.

## Sprint 1 — One measurement, fully real, end to end
**Goal:** prove the hardest part of the system works before investing in breadth.
- Repo scaffolding per `docs/architecture.md` (backend + frontend skeletons, Docker Compose
  dev environment: API + Postgres + Redis + MinIO).
- Auth (register/login/JWT) — minimum needed to attach scans to a user.
- Upload → Validation → Preprocessing → Landmark Detection, real MediaPipe (or equivalent)
  integration, no mocking.
- Measurement Engine computing exactly **one** raw measurement (`shoulder_width`) and **one**
  derived ratio (`shoulder_to_waist`) for real, from real uploaded photos.
- Scan persisted to Postgres with `PipelineVersion` tagging from day one (retrofitting
  versioning later is far more painful than starting with it).
- Minimal frontend: capture guide (basic, no live silhouette overlay yet) → upload → poll →
  display the one measurement and one ratio with the landmark overlay image.
- **Demoable outcome:** a user photographs themselves, and 10–20 seconds later sees a real,
  correctly-computed shoulder-to-waist ratio with a visual overlay proving where it came from.

## Sprint 2 — Full Measurement Engine breadth
- Expand Measurement Engine to the complete metric table in `measurement-engine.md`: all raw
  measurements, all derived ratios, symmetry metrics.
- Confidence propagation from landmark → measurement → measurement-set.
- Scan History page; multiple scans per user, basic list view.
- Background job robustness: retries, per-stage failure reporting surfaced to the user.
- **Demoable outcome:** a full, accurate measurement breakdown per scan, not just one metric.

## Sprint 3 — Scoring Engine + explainability UI
- Implement Proportion, Symmetry, and Posture scores per `scoring-engine.md`, with
  `SCORE_COMPONENT` rows stored and unit-tested for reproducibility.
- "Score & Explanation" tab: full component breakdown, not just a number.
- Posture metrics from the side-pose image.
- **Demoable outcome:** every score on screen is clickable/expandable into the exact
  measurements and weights that produced it — this is the feature that most directly
  demonstrates the "explainable, not black-box" thesis to a reviewer.

## Sprint 4 — Progress tracking + Insight Engine
- Progress Dashboard: time-series charts across all scans for measurements, ratios, and scores.
- Compare Two Scans view with landmark-overlay diff.
- Insight Engine: template-driven natural-language deltas between consecutive scans.
- **Demoable outcome:** a second (and third) scan turns the product from "single snapshot
  analyzer" into "progress tracker" — this is the point where the product's actual name starts
  to be earned.

## Sprint 5 — Production hardening & polish
- Height-calibration flow (optional absolute-cm measurements), clearly labeled as estimated.
- Capture Guide upgraded to live-feedback overlay (pose alignment checks before upload).
- Rate limiting, structured logging/observability, error-envelope consistency audit across all
  endpoints.
- Account data export/delete (privacy controls) — appropriate given the sensitivity of
  body-image data this product handles.
- Deployment: containerized API + worker on a managed platform, managed Postgres, CDN-served
  frontend build, per `docs/architecture.md` §9.
- **Demoable outcome:** the version you'd actually put a live link to in front of a recruiter.

## Explicitly out of scope for all 5 sprints
- Body composition/body-fat estimation (see `measurement-engine.md` §"What is deliberately NOT
  measured") — not without a materially different, clearly-labeled, and separately-validated
  approach.
- Cross-user comparison/leaderboards/social features.
- Mobile native app — the responsive web app is the right scope for a portfolio timeline.
