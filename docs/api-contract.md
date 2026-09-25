# KAUSHAL DRISHTI — API Contract (Phase 1)

Base URL: `/api/v1`

## Response Envelope

### Success
```json
{ "success": true, "data": <T> }
```

### Paginated success
```json
{
  "success": true,
  "data": {
    "items": [<T>],
    "total": 0,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "District not found",
    "details": null
  }
}
```

### Error codes → HTTP status
| Code | HTTP |
|------|-----:|
| BAD_REQUEST | 400 |
| VALIDATION_ERROR | 422 |
| UNAUTHORIZED | 401 |
| FORBIDDEN | 403 |
| NOT_FOUND | 404 |
| CONFLICT | 409 |
| INTERNAL_ERROR | 500 |
| UNAVAILABLE | 503 |

## Query conventions
All collection endpoints accept:
- `page` (default 1, min 1)
- `pageSize` (default 20, min 1, max 100)
- `search` (free text, entity-specific fields)

Some endpoints accept filters:
- `employers`: `districtId`, `sectorId`
- `institutions`: `districtId`
- `skills`: `category`
- `job-roles`: `sectorId`
- `courses`: `sectorId`, `status`
- `data-sources`: `status`

---

## Health

### `GET /health`
Root health (no auth).
```json
{
  "status": "healthy",
  "environment": "development",
  "database": "connected",
  "redis": "not-configured",
  "service": "kaushal-drishti",
  "phase": "phase-1",
  "timestamp": "2026-09-25T09:05:44.793Z"
}
```

### `GET /api/v1/health`
Versioned health — same shape, wrapped in the success envelope.

### `GET /api/v1/meta`
Platform metadata.
```json
{
  "success": true,
  "data": {
    "service": "kaushal-drishti",
    "tagline": "From Labour-Market Evidence to Better Skill Decisions.",
    "phase": "phase-1",
    "environment": "development",
    "dataDisclaimer": "Demo Environment — Synthetic Data",
    "phases": [ { "id": "overview", "label": "Overview", "phase": 1, "active": true }, … ],
    "roles": [ { "id": "STATE_ADMIN", "label": "State Administrator" }, … ],
    "dataStatusVocab": ["REAL","SYNTHETIC","MODELLED","DEMO","UNKNOWN"],
    "counts": { "districts": 3, "sectors": 3, "jobRoles": 5, "skills": 10, "courses": 5, "employers": 5, "institutions": 3, "qualifications": 3, "dataSources": 5 }
  }
}
```

---

## Authentication

### `POST /api/v1/auth/login`
Request:
```json
{ "email": "admin@kaushal-drishti.demo", "password": "demo-admin" }
```
Response:
```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "id": "...", "email": "...", "name": "Demo State Admin", "role": "STATE_ADMIN" },
    "phase": "phase-1",
    "environment": "development"
  }
}
```
Errors: `VALIDATION_ERROR` (422), `UNAUTHORIZED` (401).

JWT payload: `{ sub, email, name, role, iat, exp }` (HS256, 12h TTL).
Send on protected requests: `Authorization: Bearer <token>`.

---

## Entity CRUD

> Identical contract for: `districts`, `sectors`, `employers`, `institutions`,
> `skills`, `job-roles`, `courses`, `qualifications`, `data-sources`.

### `GET /api/v1/<entity>?page=1&pageSize=20&search=…`
Returns paginated list (see envelope above). Each item includes relational
counts / nested relations appropriate to the entity (e.g. districts include
`_count.employers` / `_count.institutions`; courses include `sector`,
`qualification`, `courseSkills`, `courseInstitutions`).

### `GET /api/v1/<entity>/:id`
Returns single entity. `districts/:id` additionally includes `employers`
(with `industrySector`) and `institutions`.

### `POST /api/v1/<entity>`
Creates. Request body validated by Zod. Returns created entity.

Example — `POST /api/v1/districts`:
```json
{ "name": "Aurangabad", "code": "MH-AUR", "stateCode": "MH", "latitude": 19.8762, "longitude": 75.3433 }
```

Example — `POST /api/v1/courses`:
```json
{
  "name": "Industrial Automation",
  "code": "CRS-AUTO-01",
  "sectorId": "<id>",
  "qualificationId": "<id>",
  "durationHours": 320,
  "status": "ACTIVE"
}
```

### `PUT /api/v1/districts/:id`
Full update (same schema as POST). Other entities expose list/create in
Phase 1; PUT is implemented for districts (the district profile flow).

> `DELETE` is optional and not implemented in Phase 1.

---

## Validation examples
- `POST /api/v1/districts` with missing `name` → `422 VALIDATION_ERROR` with Zod flatten details.
- `POST /api/v1/employers` with duplicate `website` URL constraint is tolerated; unique constraints surface as `409 CONFLICT`.
- `GET /api/v1/districts/<bad-id>` → `404 NOT_FOUND`.
