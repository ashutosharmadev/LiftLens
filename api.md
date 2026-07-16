# LiftLens — API Design

Base path: `/api/v1`. REST over HTTPS, JSON bodies, JWT bearer auth.

## Versioning

The `/v1` prefix is literal and load-bearing: breaking changes ship as `/v2` alongside `/v1`
rather than mutating it in place, so the frontend (or any future consumer) never breaks on
deploy. Version bump criteria: any change to a response shape, a status code's meaning, or
required-field semantics.

## Authentication

- `POST /api/v1/auth/register` — email + password → creates user.
- `POST /api/v1/auth/login` — email + password → access token (short-lived, 15 min) +
  refresh token (long-lived, httpOnly cookie).
- `POST /api/v1/auth/refresh` — refresh token (cookie) → new access token.
- `POST /api/v1/auth/logout` — invalidates refresh token.
- All other endpoints require `Authorization: Bearer <access_token>`.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/scans` | Upload front/side/back images, create scan, enqueue pipeline |
| GET | `/scans` | List current user's scans (paginated, most recent first) |
| GET | `/scans/{scan_id}` | Full scan detail: status, measurements, ratios, score, insights |
| DELETE | `/scans/{scan_id}` | Delete a scan and its stored images |
| GET | `/scans/{scan_id}/status` | Lightweight polling endpoint (status only) |
| GET | `/progress` | Time-series of measurements/scores across all of a user's scans |
| GET | `/progress/compare?a={scan_id}&b={scan_id}` | Diff of two scans |
| GET | `/users/me` | Current user profile |
| PATCH | `/users/me` | Update profile (units preference, height calibration, etc.) |
| DELETE | `/users/me` | Account + data deletion |

## Request/response model examples

**POST /scans** — request: `multipart/form-data` with `front`, `side`, `back` image files.
Response (`202 Accepted`):
```json
{ "scan_id": "uuid", "status": "pending", "created_at": "iso8601" }
```

**GET /scans/{scan_id}** — response (`200 OK`, when complete):
```json
{
  "scan_id": "uuid",
  "status": "complete",
  "pipeline_version": "v1.2.0",
  "measurements": [ { "metric_key": "shoulder_width", "value": 0.41, "confidence": 0.93 } ],
  "ratios": [ { "ratio_key": "shoulder_to_waist", "value": 1.34 } ],
  "score": {
    "proportion_score": 78.2,
    "symmetry_score": 91.0,
    "posture_score": 84.5,
    "components": [ { "key": "shoulder_to_waist", "weight": 0.4, "contribution": 31.3 } ]
  },
  "insights": [ { "category": "progress", "text": "Shoulder-to-waist ratio improved 4% since your last scan." } ]
}
```
When `status` is `pending` or `processing`, the same endpoint returns just `scan_id`, `status`,
and `created_at` — the client polls this endpoint (or `/status` for a cheaper check) until
`complete` or `failed`.

## Error handling

Consistent error envelope on every non-2xx response:
```json
{ "error": { "code": "VALIDATION_FAILED", "message": "No person detected in front-pose image.", "stage": "validation" } }
```
- `4xx` — client-correctable (bad input, auth failure, not found).
- `422` — Pydantic validation failures, FastAPI's default, kept as-is rather than
  reinvented.
- `5xx` — genuine server/pipeline faults; these are logged with full stage context
  server-side but return a generic message to the client (never leak stack traces).
- Pipeline-stage failures (e.g., detection confidence too low) surface as a `failed` scan
  status with a `failure_reason` field, not as an HTTP error — the request to *create* the scan
  succeeded; it's the async processing that failed, and the API shape should reflect that
  distinction honestly.

## Rate limiting & abuse prevention

Upload endpoints are rate-limited per user (e.g., N scans per hour) — both a cost-control
measure (CV inference isn't free) and a basic anti-abuse measure, enforced at the API-gateway
layer so it doesn't clutter route/service code.
