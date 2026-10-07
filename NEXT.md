# Next session — ONE task

**M1 — Port the landmark + waist logic to TypeScript**
Move the measurement logic from dev/landmark_test.py into frontend/src/measure/ (MediaPipe Tasks Vision JS), with unit tests on the fixture photos that compare against the Python prototype within a tolerance. Fixtures stay gitignored; tests skip when missing.

Before starting:
- Add the `liftlens-deploy` profile to ~/.aws/config and check `aws sts get-caller-identity --profile liftlens-deploy`.
- Check the Lambda concurrent-executions quota request (Service Quotas).
- The root .venv is broken (its Python was removed with the old Homebrew); recreate it before running the prototype.

Done when: the TS port reproduces the prototype's shoulder and waist numbers on the fixtures, and you can explain each step.
