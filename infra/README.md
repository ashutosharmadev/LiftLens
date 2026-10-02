# Infrastructure

Two Terraform roots, each with its own state:

| Root | Manages | Lifecycle |
|---|---|---|
| `guardrails/` | Budget action, alert topic, kill switch | Long-lived; never destroyed with the app |
| `app/` | Auth, data, API and web, via `modules/` | Can be destroyed and recreated freely |

The kill switch finds app resources by the `Project = LiftLens` tag, because the two roots don't share state.

## Running locally

```sh
aws sso login --profile liftlens
export AWS_PROFILE=liftlens

cd infra/guardrails   # or infra/app
terraform init
terraform plan
```

Every resource gets the default tags `Project`, `ManagedBy` and `Stack`. State is local for now (gitignored) and moves to an S3 backend in M5.
