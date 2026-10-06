# ADR-001: Serverless on AWS, managed with Terraform

- Status: Accepted
- Date: 2026-10-06

## Context

LiftLens must cost $0/month. The AWS account is on the Paid plan, so there is no automatic spending cap: anything that bills will bill.

The original design in `docs/` was a conventional web stack:

| Piece | What it needs on AWS |
|---|---|
| FastAPI backend | A server running 24/7 (EC2 or Fargate) |
| PostgreSQL | An RDS instance running 24/7 |
| Redis + Celery workers | ElastiCache plus always-on workers |
| Photo uploads | S3 plus an upload and processing pipeline |
| API Gateway / Nginx | API Gateway or a load balancer |

Almost every piece runs around the clock and bills by the hour whether anyone uses the app or not. Even the smallest database instance breaks a $0 budget in its first month.

## Decision

**Serverless.** Use only services that bill per use and whose usage fits AWS's always-free allowances:

- API: one Python Lambda behind a Lambda Function URL.
- Data: DynamoDB on-demand, keyed by `userId` + `timestamp`.
- Web: S3 + CloudFront.
- Auth: Cognito.

**Terraform** manages all of it. Its main value here is that `terraform plan` shows exactly what will be created, changed or destroyed **before** anything happens, and nothing is applied without reviewing that plan. It also means:

- `terraform destroy` removes exactly what a root created, which keeps experiments from leaving forgotten resources behind.
- The infrastructure is code in Git, with history and review.
- CI can run the same plan and apply later.

## Consequences

What we give up:

- **SQL-style queries.** DynamoDB looks items up by key; ad-hoc queries across users ("average ratio per month for September sign-ups") are hard. V1 only needs one user's history, newest first, which the `userId` + `timestamp` key serves directly. Accepted as worth it for $0.
- **Cold starts.** A Lambda that hasn't run recently takes up to about a second to answer its first request.
- **Local development.** There is no single `uvicorn main:app` equivalent; handlers are tested as plain Python functions, and the full path is tested in AWS.
- **AWS lock-in.** Lambda, DynamoDB and Cognito don't move to another provider without rework.

What we gain: $0/month at portfolio scale, nothing to patch or keep running, and infrastructure that can be reviewed before it changes and torn down cleanly.

## Alternatives considered

- **FastAPI + PostgreSQL (the original `docs/` design).** Familiar and flexible, but its always-on pieces cost money every hour.
- **Building in the console instead of Terraform.** Faster for a first try, but there's no review step before changes, no history, and cleanup depends on memory.

## Revisit when

- V2 needs cross-user analytics or reporting (consider a SQL store or an export to S3 + Athena).
- Work appears that runs longer than a Lambda allows.

`docs/` still describes the original design; it will be updated in M6.
