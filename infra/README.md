# Infrastructure

## Scenario

All LiftLens infrastructure is Terraform ([ADR-001](../docs/adr/001-serverless-terraform.md)). The account has no spending cap, so cost guardrails must exist before anything else and must keep working whatever happens to the app.

## Obstacle

- Experimental resources are destroyed often. With everything in one Terraform root, one `terraform destroy` (or one broken app change that fails the whole plan) would take the guardrails with it.
- `prevent_destroy` doesn't solve this: it makes the whole `destroy` fail rather than skipping the protected resources.
- The guardrails need to act on app resources they don't manage.

## Action

Two Terraform roots, each with its own state:

| Root | Manages | Lifecycle | Applied as |
|---|---|---|---|
| `guardrails/` | Budget, budget action, deploy role, alert topic, kill switch | Long-lived; never destroyed with the app | SSO admin (`liftlens` profile), so it stays fixable while the deploy role is locked |
| `app/` | Auth, data, API and web, via `modules/` | Can be destroyed and recreated freely | `liftlens-deploy` role, which the budget action can lock |

- Every resource gets default tags `Project`, `ManagedBy` and `Stack`. Because the two roots don't share state, the kill switch finds app resources by tag (`Project=LiftLens`, `Stack=app`), so it can never stop itself.
- No AWS profile is named in the code; credentials come from the environment (`AWS_PROFILE` locally, OIDC in CI).
- Provider versions are pinned exactly, and the lock files are committed.

## Result

- The guardrails stack is deployed (15 resources) and was tested end to end: a direct invoke of the kill switch, then a message through SNS that triggered it automatically.
- The app stack can be destroyed and rebuilt without touching cost protection.

## Troubleshooting

- **Expired sign-in during apply.** `Error: No valid credential sources found` means the 4-hour SSO session expired. Run `aws sso login --profile liftlens` and retry.
- **"Saved plan is stale".** A failed apply can still write state (for example, lookups only), which invalidates a saved plan. Check the state with `terraform state list`, run `plan` again, review it, then apply the new plan.
- **No reserved concurrency.** The account's Lambda limit of 10 allows none; see [ADR-003](../docs/adr/003-lambda-concurrency-exception.md).

## Reference: running Terraform

```sh
aws sso login --profile liftlens
export AWS_PROFILE=liftlens

cd infra/guardrails   # or infra/app (from M2, with AWS_PROFILE=liftlens-deploy)
terraform init
terraform plan -out=plan.tfplan   # review every resource
terraform apply plan.tfplan
```

The guardrails root needs `alert_email` in a gitignored `terraform.tfvars`. State is local for now (gitignored) and moves to an S3 backend in M5.
