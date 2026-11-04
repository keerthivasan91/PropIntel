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

### GET /api/leads/:id/analyses

Returns up to 20 saved analyses, newest version first.

## Conversational assistant endpoints

### POST /api/leads/:id/chat

Request:

    {
      "message": "Can we promise this customer a discount?"
    }

The backend loads the selected lead, latest saved analysis, approved fictional company policies and up to 12 recent messages for that lead. It applies basic deterministic scope checks, sends the context to Gemini, validates the structured response and saves the user/assistant turn in a database transaction.

Successful response:

    {
      "data": {
        "reply": {
          "decision": "needs_policy_clarification",
          "answer": "The demo policy requires authorized approval before a discount is promised.",
          "supporting_policy_ids": ["sales_policies"],
          "missing_information": ["Whether an authorized discount approval exists"],
          "suggested_action": "Confirm approval with an authorized representative."
        },
        "messages": [
          { "id": "11", "role": "user", "message": "Can we promise this customer a discount?" },
          { "id": "12", "role": "assistant", "message": "The demo policy requires authorized approval before a discount is promised." }
        ]
      }
    }

Decisions:
- allowed
- out_of_scope
- needs_policy_clarification
- escalate

The endpoint accepts messages up to 2,000 characters and is limited to 12 requests per 15 minutes per client IP. Direct prompt-extraction attempts and clearly unrelated requests receive a deterministic refusal without a Gemini call.

### GET /api/leads/:id/conversations

Returns up to 100 saved messages for the requested lead, oldest first. The query is always filtered by that lead ID.

## Standard error response

    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "A human-readable explanation."
      }
    }

Relevant AI errors include AI_NOT_CONFIGURED, AI_RATE_LIMITED, AI_MODEL_ERROR, AI_PROVIDER_ERROR and INVALID_AI_RESPONSE.

## Planned endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/leads/:id/tasks | Create a follow-up task |
| GET | /api/tasks | List follow-up tasks |
| PATCH | /api/tasks/:id | Update a task |
| GET | /api/leads/:id/activities | Retrieve lead activity |
| GET | /api/dashboard/stats | Retrieve persisted dashboard metrics |
