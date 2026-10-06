# Next session — ONE task

**M0.6 — ADR-001: serverless + Terraform**
Write docs/adr/001-serverless-terraform.md: why LiftLens runs on Lambda, DynamoDB, S3 and CloudFront managed by Terraform, instead of the FastAPI/Celery/Postgres design in docs/ or the old CDK scaffold. Cover cost ($0 constraint), operations, learning value and what we give up.

Before starting, if not done yet:
- Add the `liftlens-deploy` profile to ~/.aws/config and check `aws sts get-caller-identity --profile liftlens-deploy`.
- Check the Lambda concurrent-executions quota request (Service Quotas).

Done when: ADR-001 is committed and you can explain each trade-off in it without reading it.
