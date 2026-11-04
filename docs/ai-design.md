# PropIntel AI design

## Implemented: lead analysis

The backend uses the official Google Gen AI JavaScript SDK (@google/genai) to call Gemini from the server. The configured model is controlled by GEMINI_MODEL; the initial default is gemini-3.8-flash.

### Lead-analysis pipeline

1. Validate and retrieve the selected lead from MySQL.
2. Load the fictional Northstar Homes profile, sales policies, communication guidance and escalation rules.
3. Send those approved documents and the selected lead's fields to Gemini.
4. Request JSON matching the analysis response schema.
5. Parse and semantically validate every required field and array item in the backend.
6. Calculate the lead score independently using deterministic backend rules.
7. Save a new analysis version and its score breakdown to lead_analyses.
8. Record an ai_analysis event in lead_activities.
9. Return the analysis to the salesperson for review.

The model does not receive authority to set a score, update lead status, create tasks or send customer messages.

## Structured response fields

- summary
- customer_intent
- key_requirements
- objections
- recommended_action
- suggested_response

JSON-schema output improves response structure, but syntactically valid JSON is not proof that the contents are true. Backend semantic validation and human review remain necessary.

## Context and restrictions

- Company context is loaded from version-controlled fictional Northstar Homes documents.
- Customer fields are passed as data and must not be followed as instructions.
- Missing property or company facts must remain unknown.
- The model must not invent availability, prices, amenities, approvals, dates or commercial terms.
- Legal, tax, loan and personalized investment matters require human escalation.
- Suggested responses are drafts; the system does not send them automatically.

## API endpoints

- POST /api/leads/:id/analyze — generate and persist a new analysis; limited to 8 requests per 15 minutes per client IP.
- GET /api/leads/:id/analyses — retrieve up to 20 saved analyses, newest version first.

## Secrets and operation

- GEMINI_API_KEY is read only by the backend.
- GEMINI_MODEL can be changed through the backend environment.
- Gemini errors are logged server-side and returned as safe application errors.
- If the key is absent, the API responds with AI_NOT_CONFIGURED.

## Planned: conversational memory

The contextual assistant remains a later milestone. Its planned memory design uses the selected lead, approved company context and bounded recent conversation history retrieved from MySQL. This analysis endpoint does not claim to implement chat memory.

## Limitations

The initial scoring rules are a product heuristic rather than a trained conversion model. AI output can be inaccurate despite schema and semantic validation. The salesperson remains responsible for verifying facts and deciding what action to take.
