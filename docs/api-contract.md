# API contract

## Conventions

- Base path: /api
- Request and response bodies: JSON
- Errors use an error object with a stable code and human-readable message.
- IDs are positive integers.
- Task due dates are accepted as ISO date-time strings and stored in MySQL DATETIME columns in UTC.

## Lead endpoints

- GET /api/leads — list and filter leads
- POST /api/leads — create a lead
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

Creates a follow-up task for a lead and writes a follow_up_task_created activity in the same transaction.

Request:

    {
      "title": "Call customer to confirm site visit",
      "description": "Ask for preferred weekday and time.",
      "due_at": "2026-11-08T10:00:00.000Z"
    }

description and due_at are optional. due_at may be null.

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
