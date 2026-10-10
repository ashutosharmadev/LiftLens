# LiftLens: the project story (SOART)

Scenario, Obstacle, Action, Result, Troubleshooting. This is how LiftLens was planned and built, the decisions behind it, and what went wrong along the way. The detailed reasoning for each decision is in the [ADRs](adr/).

**Status:** in progress. Cost guardrails (M0) and the measurement engine (M1) are done; the API is built and tested locally and is next to be deployed (M2).

---

## S: Scenario

**Gym-goers can't objectively track physique progress from photos.**

Progress photos are compared by eye. Lighting, camera distance, posture and memory all change from one week to the next, so it's hard to tell whether your shoulders actually got wider or the photo was just taken closer. Body-fat scales and tape measures exist, but none of them answer the question a lifter asks in the mirror: *is my shape changing?*

I wanted an app that turns a front-facing photo into a number you can track and check, with every result explained in plain English, and that I could run in public as a portfolio project.

Two personal constraints shaped everything:

- **It must cost $0/month.** My AWS account is on the Paid plan, which has no automatic spending cap. A single mistake (an always-on database, a NAT gateway) bills every hour until someone notices.
- **I'm new to AWS and Terraform.** I needed to be able to explain every resource and every permission, not just get something running.

## O: Obstacles

1. **No safety net on spending.** On a Paid-plan account, cost protection has to be built before anything else is deployed. Budget alerts alone only *notify*, hours late; they don't stop anything.
2. **The original design couldn't be free.** My first design (FastAPI, PostgreSQL, Redis, Celery workers) needs servers and a database running 24/7. Every one of them bills by the hour, whether anyone uses the app or not.
3. **Physique photos are extremely sensitive.** Storing people's body photos means being responsible for encrypting, securing and deleting them, and one mistake exposes strangers' images.
4. **A photo shows shape, not size.** Pixel widths change with camera distance, so "waist 640 px" means nothing, and comparing raw pixels between weeks is misleading.
5. **The prototype measured inconsistently.** My Python prototype measured shoulders between the shoulder *joints* but the waist between the body's *edges*, so its headline ratio compared two different kinds of measurement and couldn't show deltoid growth.
6. **The API runs on a device I don't control.** Anyone can edit requests in their browser's developer tools, so the server can't trust anything the browser claims, including who the user is.

## A: Actions

### 1. Built the cost guardrails before anything else

- Locked down the account: root MFA with a passkey, no root access keys, a $1 monthly budget with three alerts, and cost-anomaly alerts lowered from $100 to $1.
- Stopped using root day to day: set up **IAM Identity Center** so my terminal gets temporary credentials through browser sign-in, with no long-lived access keys on disk.
- Wrote a separate Terraform stack for the guardrails, kept apart from the app so that destroying the app can never remove them:
  - **Budget → SNS → kill-switch Lambda**, which finds app resources by tag, sets Lambda concurrency to 0 and disables CloudFront. It never touches stored data or itself.
  - **Budget action → deny-all policy on a dedicated `liftlens-deploy` role**, so automated deploys stop if spending passes $1.
  - Every permission least-privilege and explained; no wildcard actions in any *allow*.
- Reviewed every `terraform plan` before applying, and tested the kill switch for real: a direct invoke, then a message through SNS, which triggered it automatically.

### 2. Redesigned the architecture to be serverless ([ADR-001](adr/001-serverless-terraform.md))

I replaced the always-on stack with services that bill per use and fit AWS's always-free allowances: Lambda, DynamoDB on-demand, S3 + CloudFront and Cognito, all managed with Terraform. I accepted the trade-off: DynamoDB can't do ad-hoc SQL queries, but V1 only needs "one user's history, newest first".

### 3. Moved the measurement into the browser ([ADR-002](adr/002-pose-extraction-in-browser.md))

My first instinct was to run the pose model in a Lambda. When I weighed it properly, it would have meant storing users' body photos in AWS and paying for a container image every month. I chose to run MediaPipe **in the browser** instead: the photo never leaves the device, and the API only ever receives numbers.

- Split the code into `models.ts` (needs the ML models and a browser) and `maths.ts` (pure functions), so the maths can be unit-tested without a model. The waist function takes a single row of the body mask, not the photo.
- Proved the TypeScript port is faithful: a Python script runs the prototype on real photos and saves its inputs and results, and a parity test checks that the TypeScript gets the same numbers within 1%.

### 4. Fixed what the measurements actually mean ([ADR-004](adr/004-scale-free-measurements.md))

- **Both widths edge to edge.** Shoulders are now measured on the body outline like the waist, so building deltoids moves the number. To catch photos where raised arms join the outline, outer shoulder width is compared with joint width; on good photos it's 1.4–1.5×, and anything outside 1.1–1.8× is flagged.
- **No centimetres.** Ratios cancel pixels within a photo, so shoulder-to-waist is valid at any distance. For comparing widths across photos, I divide by hip-joint width, a bone measurement that doesn't change with training, so it acts as a ruler present in every photo.

### 5. Designed an honest, explainable score ([scoring](scoring.md))

- Tracked **one number**, shoulder-to-waist, because it was the only measurement that stayed steady across two photos of the same body, and it's the standard V-taper metric lifters already follow.
- Compared users **only with their own first photo**, never with an "ideal" body or with other users.
- Reported progress as a **percent change**, not invented points, so every result can be checked by hand, and treated changes under ±2% as noise.

### 6. Designed and built the API around a trust boundary ([API contract](api.md), [ADR-005](adr/005-store-ingredients-recompute-scores.md))

- The user ID comes **only from the verified sign-in token**, never from the request, so nobody can read or write another user's history.
- The server stamps the time and computes the ratio itself; the browser sends raw measurements only.
- Because the photo is gone after each check-in, every measurement stores the **raw per-photo values** too, so better formulas can be applied to past photos later. Scores are recomputed on every read, so a recalibrated threshold improves the whole history at once.
- Token verification uses a standard library (PyJWT) against Cognito's public keys, cached between requests, with no network call per request.
- Everything that talks to the outside world (keys, clock, database) sits behind small interfaces, so tests run the real logic with fakes.

### 7. Documented as I went

Five ADRs, an API contract, a scoring document and a README with architecture diagrams that mark what's built and what's planned.

## R: Results

- **Built to run at $0/month** (the bill showed $0.00 at the last check), with automatic protection: if spending ever passes $1, the app stops and deploys are locked without anyone being awake. The kill switch was tested end to end and fires within about a second of the alert.
- **Photos never leave the device.** There are no stored images to secure, leak or delete, and no container image costs.
- **Measurements you can trust and check:**
  - The TypeScript engine matches the Python reference within 1% on real photos.
  - Two photos of the same body gave shoulder-to-waist ratios of **1.784 and 1.785**.
  - Every score shows its formula, its inputs and a one-sentence explanation.
- **Tested:** 21 TypeScript tests and 89 Python tests. The security tests include forged signatures, an edited user ID and expired tokens, and every validation rule in the API contract has a test.
- **Decisions on record:** five ADRs, each with the alternatives I rejected and why.

## T: Troubleshooting

Each entry gives the problem, its root cause, the fix, and what I took away from it.

### Cost and AWS setup

**A default setting would have broken the $0 rule.**
- *Problem:* enabling IAM Identity Center preselected a "multi-Region" instance.
- *Cause:* multi-Region instances encrypt with a customer managed KMS key, about $1/month per key.
- *Fix:* chose a single-Region instance, then checked that encryption showed "AWS owned key" (free) before continuing.
- *Lesson:* read every default on a setup screen; cost hides in encryption and replication options.

**The cost alert threshold had a hidden second condition.**
- *Problem:* the anomaly alert was set to $1 but also required "AND 40% above expected".
- *Cause:* with AND, both conditions must be true, so the extra percentage could suppress a real alert.
- *Fix:* removed the percentage condition, so the alert fires on $1 alone.
- *Lesson:* also, instant (individual) anomaly alerts need an SNS topic, so I used daily email summaries until Terraform creates one.

**The Lambda concurrency limit made a project rule impossible.**
- *Problem:* the project requires every Lambda to reserve concurrency, but setting it failed.
- *Cause:* the new account's limit is 10 concurrent executions, and AWS keeps at least 10 unreserved, so nothing can be reserved.
- *Fix:* requested an increase to 1,000, built without reservations in the meantime, and recorded the exception and its risk (the kill switch could be briefly crowded out) in [ADR-003](adr/003-lambda-concurrency-exception.md), with a follow-up task.
- *Lesson:* check account quotas early. The limit also turned out to be a free account-wide cap on Lambda spend.

**Terraform refused my approved plan: "Saved plan is stale".**
- *Problem:* my SSO session expired just as I applied, so the apply failed with "No valid credential sources found". After signing in again, Terraform refused the plan I had reviewed.
- *Cause:* the failed attempt had already written a state file holding only lookups (account ID, region, zip file), which changed the state the plan was based on.
- *Fix:* confirmed the state contained no real resources, re-ran the plan, checked it was identical (15 to add, 0 to change, 0 to destroy), and approved it again before applying.
- *Lesson:* Terraform ties a saved plan to the exact state it was made from. That's a safety feature, and any approval should cover the plan that actually runs.

### Local tooling

**The AWS CLI wouldn't install.**
- *Problem:* `brew install awscli` compiled from source for a long time, then failed.
- *Cause:* Homebrew was the Intel version in `/usr/local` running under Rosetta on an Apple Silicon Mac, an unsupported setup with no prebuilt packages.
- *Fix:* migrated to native Homebrew in `/opt/homebrew`. Then `aws: command not found` in the same window, because the open terminal still had the old PATH; reloading the shell environment fixed it.
- *Lesson:* check the machine's architecture before blaming the tool. The migration also broke the prototype's old Python environment, so I rebuilt it in a separate one.

**The CLI saved my sign-in in the old format.**
- *Problem:* `aws configure sso` warned about a "legacy format".
- *Cause:* the session-name prompt had been left empty.
- *Fix:* cancelled and re-ran it with a session name, so the CLI can refresh sign-ins automatically.

### Code and tests

**The Python reference script crashed on the body mask.**
- *Problem:* `TypeError: only 0-dimensional arrays can be converted to Python scalars`.
- *Cause:* the segmentation mask came back as `(height, width, 1)` rather than `(height, width)`, so each pixel was a one-element array.
- *Fix:* dropped the extra axis with `squeeze()`.

**The production build failed because of a test file.**
- *Problem:* the parity test reads files with Node's `fs`, and the browser build's type check didn't know about Node.
- *Cause:* tests and app code shared one TypeScript configuration.
- *Fix:* gave the tests their own `tsconfig.test.json`, with Node types, and excluded them from the browser build.
- *Lesson:* Node-only test code now can't leak into the code that ships to browsers.

**Two API tests failed with 401 Unauthorized.**
- *Problem:* tests that moved a fake clock forward a week started getting "Token expired".
- *Cause:* the tests minted tokens that expire one hour after the original time; the API was correctly rejecting them.
- *Fix:* the tests now mint tokens relative to the fake clock's current time.
- *Lesson:* a failing test can be proof that the code works. Read the failure before changing the code.

### Design problems found by testing

**The headline ratio compared two different things.**
- *Problem:* while porting the prototype, I noticed shoulders were measured joint to joint and the waist edge to edge.
- *Fix:* measured both edge to edge and added the plausibility check, then updated the Python reference so the parity test checks the new method ([ADR-004](adr/004-scale-free-measurements.md)).
- *Lesson:* port faithfully first, then change the logic as a separate, visible step, so porting bugs and design changes can't be confused.

**The "ruler" was noisier than I estimated.**
- *Problem:* I first assumed hip-normalised widths would vary about 3% between photos.
- *Cause:* two photos of the same body in the same session gave indexes 11% apart, while the shoulder-to-waist ratio barely moved.
- *Fix:* recorded the real figure, kept the score on the steady ratio, stored raw per-photo values so a better ruler can be applied to past photos, and added a calibration task.
- *Lesson:* measure noise before trusting small changes.
