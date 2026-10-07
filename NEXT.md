# Next session — ONE task

**M1 — Decide how to fix the two measurement issues found in the port**
1. Shoulder width is measured joint-to-joint (landmarks) but waist width edge-to-edge (mask), so the shoulder-to-waist ratio compares two different kinds of measurement.
2. All measurements are in pixels, not centimetres.
Decide the approach for each (with reasoning), then change maths.ts and its tests.

Before starting:
- Add the `liftlens-deploy` profile to ~/.aws/config and check `aws sts get-caller-identity --profile liftlens-deploy`.
- Check the Lambda concurrent-executions quota request (Service Quotas).

Done when: both issues have a decision you can explain and the tests reflect it.
