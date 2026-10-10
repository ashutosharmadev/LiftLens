# Next session — ONE task

**M2 — Terraform for auth, data and API (then GATE 3)**
Design and write the `infra/modules/{auth,data,api}` modules called from `infra/app/`: Cognito user pool + app client, the DynamoDB table (userId + timestamp), and the API Lambda with its Function URL, 7-day logs and least-privilege role. Decide how to package PyJWT + cryptography for Lambda's Linux. Then show the plan summary (GATE 3), apply as `liftlens-deploy`, and smoke-test with curl and a real Cognito token.

First (needed to deploy as the deploy role):
- Add the `liftlens-deploy` profile to ~/.aws/config and check `aws sts get-caller-identity --profile liftlens-deploy`.
- Check the Lambda concurrent-executions quota request (Service Quotas).

Done when: POST and GET work against AWS with a real token, and you can explain every resource in the plan.

## End of every milestone
- Update README.md: status table, architecture diagram (solid = built, dashed = planned), key decisions.
- Commit, add one line to LOG.md, set the next single task here.
