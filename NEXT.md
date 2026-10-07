# Next session — ONE task

**M1 — Scoring module**
Design the explainable score in backend/ (pure Python + pytest): every score returns its formula, its inputs and a one-sentence explanation. Inputs are the scale-free measurements from ADR-004 (shoulder-to-waist, shoulder-to-hip, shoulder and waist indexes). Document it in docs/scoring.md.

Before starting:
- Add the `liftlens-deploy` profile to ~/.aws/config and check `aws sts get-caller-identity --profile liftlens-deploy`.
- Check the Lambda concurrent-executions quota request (Service Quotas).

Done when: the score is implemented and tested, and you can explain how any score was calculated from its inputs.
