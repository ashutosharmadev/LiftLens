# Build log (one line per session: date — what shipped — what I learned)

- 2026-10-02 — Plan made: serverless, $0 hard constraint, M0–M6 milestones. Account accidentally upgraded to Paid plan; guardrails moved to top priority.
- 2026-10-02 — GATE 0 done: root MFA (passkey, no root keys), $1 monthly budget (50%/100% actual + 100% forecast), Cost Anomaly alert at $1 (daily email). Billing entity: Amazon Web Services India Private Limited. Learned: budgets only notify (with delay), they don't stop spend.
- 2026-10-05 — Identity Center user + SSO CLI profile (ap-south-1), Terraform skeleton (two roots), guardrails stack applied and tested: $1 budget -> SNS -> kill switch, budget action locks the deploy role. Learned: Terraform state and plan/apply, why guardrails live in their own root, account Lambda limit of 10 blocks reserved concurrency (ADR-003).
