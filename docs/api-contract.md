# API contract

## Common conventions

- Base path: /api
- Request and response bodies: JSON
- Errors use an error object with a stable code and human-readable message.
- API keys are never sent to the browser.

## Implemented

### GET /api/health

Returns process-level API health.

    {
      "status": "ok",
      "service": "propintel-api",
      "timestamp": "2026-11-04T12:00:00.000Z"
    }

### GET /api/health/ready

Checks whether the MySQL database is configured and reachable. Returns HTTP 503 when it is not ready.

## Planned endpoints

The following endpoints are design targets and are not implemented in the foundation milestone:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/leads | Create a lead |
| GET | /api/leads | List and filter leads |
| GET | /api/leads/:id | Retrieve a lead |
| PATCH | /api/leads/:id | Update a lead |
| POST | /api/leads/:id/analyze | Generate an AI analysis |
| GET | /api/leads/:id/analyses | Retrieve analysis history |
| POST | /api/leads/:id/chat | Ask the contextual assistant |
| GET | /api/leads/:id/conversations | Retrieve conversation history |
| POST | /api/leads/:id/tasks | Create a follow-up task |
| GET | /api/tasks | List follow-up tasks |
| PATCH | /api/tasks/:id | Update a task |
| GET | /api/leads/:id/activities | Retrieve lead activity |
| GET | /api/dashboard/stats | Retrieve persisted dashboard metrics |
