# Backlog (ideas parked so they don't hijack a session)

## M0 — guardrails (must finish before any deploy)
- [x] M0.2 IAM Identity Center user + `aws configure sso`; verify `aws sts get-caller-identity`
- [x] M0.3 infra/ skeleton: versions.tf, providers.tf, main.tf; local state; .gitignore checked
- [x] M0.4 Budget Action in Terraform: at $1 actual, attach deny-all policy to build user + CI role
- [x] M0.5 Kill-switch Lambda: on budget SNS alert -> Lambda reserved concurrency 0 + disable CloudFront
- [ ] M0.6 ADR-001: Serverless + Terraform (vs FastAPI/Postgres and vs the CDK scaffold)

## Later
- [ ] When the Lambda concurrency quota increase is approved: add reserved concurrency (kill switch, API) and close the ADR exception
- [ ] ADR (later): move the app into a separate member AWS account (SCPs apply there; keeps management account empty)
- [ ] ADR-002: pose extraction in browser (MediaPipe JS) vs container-image Lambda
- [ ] Update docs/ to the serverless architecture
- [ ] M5: replace the AdministratorAccess permission set with a custom least-privilege set built from the actions Terraform actually used (CloudTrail)
- [ ] Find end-sem exam dates and shift milestones
