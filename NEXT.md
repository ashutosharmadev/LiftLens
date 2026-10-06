# Next session — ONE task

**M1 / GATE 2 — ADR-002: where pose detection runs**
Decide between MediaPipe in the browser and a container-image Lambda. Compare cost, privacy, latency, accuracy and portfolio value, then write docs/adr/002-pose-extraction.md with the decision.

Before starting:
- Add the `liftlens-deploy` profile to ~/.aws/config and check `aws sts get-caller-identity --profile liftlens-deploy`.
- Check the Lambda concurrent-executions quota request (Service Quotas).

Done when: ADR-002 is committed and you can explain why the other option lost.
