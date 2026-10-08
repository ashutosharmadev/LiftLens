# Next session — ONE task

**M2 — Design the API: data model and endpoints**
Decide what a stored measurement looks like in DynamoDB (keys, fields), and what POST /api/measurements and GET /api/measurements accept and return, including validation and the score from backend/scoring. No Terraform yet; design first.

Before starting (needed for M2 deploys):
- Add the `liftlens-deploy` profile to ~/.aws/config and check `aws sts get-caller-identity --profile liftlens-deploy`.
- Check the Lambda concurrent-executions quota request (Service Quotas).

Done when: the data model and API contract are written down and you can explain each field.
