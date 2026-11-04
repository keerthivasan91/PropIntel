# API contract

## Common conventions

- Base path: /api
- Request and response bodies: JSON
- Errors use an error object with a stable code and human-readable message.
- API keys are never sent to the browser.

## Health endpoints

### GET /api/health

Returns process-level API health.

### GET /api/health/ready

Checks whether the MySQL database is configured and reachable. Returns HTTP 503 when it is not ready.

## Lead endpoints

### POST /api/leads

Creates a lead and records a lead_created activity in the same database transaction.

Required fields: name, location, property_requirement, buying_timeline and customer_message.

Optional fields: budget_min, budget_max and status. Budgets are non-negative numeric amounts; status defaults to new.

### GET /api/leads

Lists leads, newest first.

Query parameters:
- search: matches name, location or property requirement (maximum 80 characters)
- status: new, contacted, qualified, site_visit, negotiation, won or lost
- page: positive integer, default 1
- limit: 1–50, default 10

Response includes leads and pagination metadata.

### GET /api/leads/summary

Returns total leads and counts grouped by status.

### GET /api/leads/:id

Returns one lead or a 404 response.

### PATCH /api/leads/:id

Updates supplied lead fields. Status and text fields are validated. Budget range is checked against the current stored value inside a transaction. A lead_updated activity is recorded.

## AI analysis endpoints

### POST /api/leads/:id/analyze

Generates a structured Gemini analysis and persists it as a new analysis version. The backend calculates the lead score independently and records an activity event.

No request body is required. The API requires a valid lead ID, a configured MySQL database, a valid backend-only GEMINI_API_KEY, and access to the configured GEMINI_MODEL.

Successful response shape:

    {
      "data": {
        "analysis": {
          "id": "1",
          "lead_id": "1",
          "summary": "Customer summary",
          "customer_intent": "Customer intent",
          "key_requirements": ["3BHK apartment"],
          "objections": [],
          "recommended_action": "Confirm preferred possession date.",
          "suggested_response": "Thank you for sharing your requirements...",
          "lead_score": 82,
          "priority": "hot",
          "score_breakdown": {},
          "model_name": "gemini-3.8-flash",
          "analysis_version": 1,
          "created_at": "2026-11-04T12:00:00.000Z"
        }
      }
    }

### GET /api/leads/:id/analyses

Returns up to 20 saved analyses, newest version first. Returns an empty array when the lead has not yet been analysed.

## Standard error response

    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "A human-readable explanation."
      }
    }

Relevant AI errors include AI_NOT_CONFIGURED, AI_RATE_LIMITED, AI_MODEL_ERROR, AI_PROVIDER_ERROR and INVALID_AI_RESPONSE.

## Planned endpoints

The following endpoints are not implemented yet:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/leads/:id/chat | Ask the contextual assistant |
| GET | /api/leads/:id/conversations | Retrieve conversation history |
| POST | /api/leads/:id/tasks | Create a follow-up task |
| GET | /api/tasks | List follow-up tasks |
| PATCH | /api/tasks/:id | Update a task |
| GET | /api/leads/:id/activities | Retrieve lead activity |
| GET | /api/dashboard/stats | Retrieve persisted dashboard metrics |
