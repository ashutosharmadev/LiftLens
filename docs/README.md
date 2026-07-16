# LiftLens

**Explainable Physique Intelligence Platform** — standardized physique photos in,
objective anthropometric measurements and explainable, reproducible progress analytics out.

Every number this product shows traces back to a measurable input. No black-box scoring.

## Status

Architecture and repo scaffolding complete. Sprint 1 (one measurement, real end-to-end pipeline)
in progress — see [`PROJECT_ROADMAP.md`](PROJECT_ROADMAP.md).

## Stack

Python 3.12 / FastAPI / SQLAlchemy 2.0 / Celery + Redis / PostgreSQL (backend)
React / TypeScript / Vite / React Query (frontend)

## Documentation

| Doc | Covers |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | System-wide architecture, all diagrams |
| [`docs/backend.md`](docs/backend.md) | Clean-architecture backend design |
| [`docs/frontend.md`](docs/frontend.md) | React feature-based frontend design |
| [`docs/database.md`](docs/database.md) | ER diagram, indexes, versioning |
| [`docs/vision-pipeline.md`](docs/vision-pipeline.md) | CV pipeline, stage by stage |
| [`docs/measurement-engine.md`](docs/measurement-engine.md) | Every measurable metric, and what's NOT measurable |
| [`docs/scoring-engine.md`](docs/scoring-engine.md) | Explainable scoring philosophy and formulas |
| [`docs/api.md`](docs/api.md) | REST API reference |
| [`PROJECT_ROADMAP.md`](PROJECT_ROADMAP.md) | 5-sprint delivery plan |

## Repo structure

```
backend/app/{api,services,repositories,models,schemas,ai,core,jobs,utils,db}
frontend/src/{pages,features,components,hooks,services,providers,layouts,types}
docs/
```

Every folder has its own `README.md` stating its single responsibility.
