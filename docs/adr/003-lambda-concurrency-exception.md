# ADR-003: No reserved concurrency until the account quota is raised

- Status: Accepted (temporary)
- Date: 2026-10-05

## Context

The project rule is that every Lambda sets reserved concurrency (default 2), so no single function can run away and so the kill switch always has capacity.

This account's Lambda quota is **10 concurrent executions**, and AWS requires at least 10 to stay unreserved. With a quota of 10, no function can reserve any concurrency: setting it fails. Setting a function to **0** is still allowed, which is what the kill switch relies on.

Consequences of the low quota:

- The whole account can run at most 10 Lambda invocations at once. Extra requests are throttled, not queued, and throttled requests cost nothing. This acts as an account-wide cap on Lambda spend.
- All functions share those 10 slots. A flood of API traffic could briefly crowd out the kill switch. SNS delivers to Lambda asynchronously and Lambda retries throttled async events, so the kill switch is delayed rather than lost.

## Decision

1. Request a quota increase to 1,000 concurrent executions (Service Quotas, free).
2. Until it is approved, deploy Lambdas **without** reserved concurrency. The account quota of 10 is the interim cap.
3. When the increase is approved, give every Lambda reserved concurrency (kill switch and API at 2) and mark this ADR superseded.

## Alternatives considered

- **Wait for the quota increase before building.** Safest, but approval can take days and may be refused for new accounts.
- **Build without reservations and leave it.** Leaves the kill switch exposed to being crowded out with no plan to fix it.
