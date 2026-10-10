# Next session — ONE task

**M2 — Build the measurements API handler (no AWS yet)**
Implement POST and GET /api/measurements as a Python Lambda handler following docs/api.md: token check, validation, server-computed ratio and shoulderCheck, server timestamp, DynamoDB read/write behind a small interface, and scores via backend/scoring (add the `flagged` status). Test it with pytest using a fake table and fake tokens. Start by deciding how the handler verifies Cognito tokens.

Before any M2 deploy:
- Add the `liftlens-deploy` profile to ~/.aws/config and check `aws sts get-caller-identity --profile liftlens-deploy`.
- Check the Lambda concurrent-executions quota request (Service Quotas).

Done when: the handler passes tests for every row of the validation and error tables in docs/api.md, and you can explain the request path end to end.

## End of every milestone
- Update README.md: status table, architecture diagram (solid = built, dashed = planned), key decisions.
- Commit, add one line to LOG.md, set the next single task here.
