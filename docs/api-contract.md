# API contract

## Conventions

- Base path: `/api`
- Request and response bodies: JSON
- Errors use an error object with a stable code and human-readable message.
- IDs are positive integers.
- Task due dates are accepted as ISO date-time strings and stored in MySQL DATETIME columns in UTC.

## Public customer intake

### POST /api/public/enquiries

Public endpoint for the Northstar Homes property enquiry form. It accepts only these customer fields:

- `name`: required, up to 120 characters
- `location`: required, up to 160 characters
- `property_requirement`: required, up to 160 characters
- `budget_min` and `budget_max`: optional non-negative numbers
- `buying_timeline`: required
- `customer_message`: required, up to 5,000 characters

Any caller-supplied lead status or administrative fields are ignored. The server always creates the lead with status `new`. The endpoint is rate-limited separately from admin APIs.

Success response (201):

    {
      "data": {
        "reference": 123
      }
    }

The public API does not expose list, read, search or update endpoints for customer records.

## Admin authentication

- `GET /api/auth/me` — returns whether the browser has an authenticated admin session, the username when authenticated, and whether admin credentials are configured.
- `POST /api/auth/login` — accepts `username` and `password`; returns a signed eight-hour HttpOnly, SameSite=Strict cookie on success. Login attempts are rate-limited.
- `POST /api/auth/logout` — clears the admin cookie.

The account is configured with `ADMIN_USERNAME`, `ADMIN_PASSWORD` (at least 12 characters) and `SESSION_SECRET` (at least 32 characters) in the backend environment. Never commit real values. A missing or placeholder configuration fails closed.

All lead, analysis, conversation and task endpoints below require the admin session. Requests without a valid session receive `401 ADMIN_AUTH_REQUIRED`; an unconfigured admin account receives `503 ADMIN_AUTH_NOT_CONFIGURED`.

## Lead endpoints

- GET /api/leads — list and filter leads. Each lead includes `lead_score` and `priority` from its latest saved analysis; both are null before the first analysis. Results are ordered by score descending, with unanalysed leads last, then newest lead first as a tie-breaker.
- POST /api/leads — create a lead from the admin workspace
- GET /api/leads/:id — retrieve a lead
- PATCH /api/leads/:id — update lead fields and status
- GET /api/leads/summary — counts grouped by lead status

## AI endpoints

- POST /api/leads/:id/analyze — generate and save a structured lead analysis
- GET /api/leads/:id/analyses — retrieve analysis history
- POST /api/leads/:id/chat — send a lead-specific contextual assistant message
- GET /api/leads/:id/conversations — retrieve the saved conversation

## Sales Action Workspace endpoints

### POST /api/leads/:id/tasks

Creates a follow-up task for a lead and writes a follow-up activity in the same transaction.

Request:

    {
      "title": "Call customer to confirm site visit",
      "description": "Ask for preferred weekday and time.",
      "due_at": "2026-11-08T10:00:00.000Z"
    }

Description and due_at are optional. due_at may be null.

### GET /api/leads/:id/tasks

Returns up to 50 tasks for one lead.

### GET /api/tasks

Lists tasks joined with their lead details. Query parameters:

- status: pending, completed or cancelled
- due: overdue, today, upcoming or no_date
- lead_id: filter to one lead
- search: task title, description or customer name (maximum 80 characters)
- page: positive integer, default 1
- limit: 1–50, default 20

Tasks are ordered with pending work first, then by due date.

### GET /api/tasks/summary

Returns counts for pending, overdue, completed and cancelled tasks.

### PATCH /api/tasks/:id

Updates supplied task fields. Supported fields:

- title: non-empty, up to 180 characters
- description: up to 2,000 characters or null
- due_at: valid ISO date-time string or null
- status: pending, completed or cancelled

Task status updates and their associated activity timeline event are committed in the same transaction. Completing a task sets completed_at; moving it back to pending clears that value.

### GET /api/leads/:id/activities

Returns up to 50 activity entries for the lead, oldest first.

## Error format

    {
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "A human-readable explanation."
      }
    }
