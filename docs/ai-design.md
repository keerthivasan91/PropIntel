# PropIntel AI design

## Implemented: lead analysis

The backend uses the official Google Gen AI JavaScript SDK (@google/genai) to call Gemini from the server. The configured model is controlled by GEMINI_MODEL; the initial default is gemini-3.8-flash.

### Lead-analysis pipeline

1. Retrieve the selected lead from MySQL.
2. Load the fictional Northstar Homes profile, sales policies, communication guidance and escalation rules.
3. Send those approved documents and the selected lead's fields to Gemini.
4. Request JSON matching the analysis response schema.
5. Parse and semantically validate every required field and array item in the backend.
6. Calculate the lead score independently using deterministic backend rules.
7. Save a new analysis version and its score breakdown to lead_analyses.
8. Record an ai_analysis event in lead_activities.
9. Return the analysis to the salesperson for review.

The model does not receive authority to set a score, update lead status, create tasks or send customer messages.

## Implemented: persistent lead-scoped assistant

### Context assembly

Each assistant request uses four sources:

1. **Company context:** the four version-controlled fictional Northstar Homes policy documents.
2. **Lead context:** current lead fields for the selected lead ID.
3. **Latest analysis:** the most recent saved AI analysis, when one exists.
4. **Conversation memory:** the last 12 messages for that selected lead, retrieved from MySQL.

The full conversation remains stored in MySQL. Only a bounded recent window is sent to Gemini to control prompt size.

### Request pipeline

1. Validate lead ID and message.
2. Load the selected lead and its latest saved analysis.
3. Load approved company documents.
4. Load up to 12 recent conversation rows filtered by the selected lead ID.
5. Apply deterministic checks for direct prompt-extraction attempts and clearly unrelated requests.
6. Send the system instruction, selected-lead context and bounded history to Gemini.
7. Validate the structured response and any policy document identifiers.
8. Persist the user and assistant messages together in a MySQL transaction.
9. Return the response metadata and saved messages to the frontend.

Conversation roles map to Gemini roles (user and model) when building the request. MySQL remains the source of truth for history; the application does not depend on an in-memory Gemini session.

### Response contract

- decision: allowed, out_of_scope, needs_policy_clarification or escalate
- answer: user-facing response
- supporting_policy_ids: references to the known demo policy documents
- missing_information: facts that need confirmation
- suggested_action: a salesperson action to review

The backend rejects unknown decision values, unknown policy IDs, malformed arrays and oversized fields.

### Domain and policy controls

- The assistant is limited to real-estate lead and sales-support tasks.
- A small deterministic guard blocks obvious unrelated programming/homework/medical and other general-purpose requests, plus direct requests to reveal prompts or secrets.
- Other requests are evaluated by Gemini under the scope and policy instructions.
- Customer messages and previous conversation text are untrusted data; they cannot override the system instruction.
- Missing company or property facts must remain unknown.
- Legal, contractual, tax, loan and personalized investment matters should be escalated to a qualified human.
- Suggested actions are advisory. The assistant cannot update lead status, create tasks or send messages.

These are layered controls, not a guarantee that an LLM can never make an error. Prompt injection and domain-scope tests remain part of acceptance testing.

### API endpoints

- POST /api/leads/:id/chat — send a message and persist the returned turn; limited to 12 requests per 15 minutes per client IP.
- GET /api/leads/:id/conversations — retrieve up to 100 saved messages for one lead.

## Structured response and model configuration

Gemini uses JSON-schema output through the official SDK, then the backend validates the response again. JSON structure does not prove factual accuracy. GEMINI_MODEL is configurable; the default is gemini-3.8-flash.

## Secrets and operation

- GEMINI_API_KEY is read only by the backend.
- Never expose the key through a Vite variable.
- Gemini errors are logged server-side and returned as safe application errors.
- If the key is absent, model-backed requests return AI_NOT_CONFIGURED. Deterministic scope refusals and greetings do not require a model call.

## Lead scoring

The 100-point score is calculated deterministically by the backend and stored with the analysis. It is an internal prioritization aid, not a purchase probability. See docs/lead-scoring.md.

## Limitations

The scoring rules are product heuristics, not a trained conversion model. AI output can be inaccurate despite schema and semantic validation. The demo policy pack is fictional and is not Masal AI's internal policy. Use synthetic data only.


## Provider resilience

Both chat and lead-analysis calls configure the JavaScript SDK's per-request HTTP retry policy:

- Four total attempts (one initial request plus up to three retries).
- Exponential backoff starting at 1 second, capped at 4 seconds, with jitter.
- Retries for 408, 500, 502, 503 and 504 responses.
- 429 is not automatically retried because it can indicate a hard quota limit as well as a temporary rate limit.

If a transient provider error remains after the retry attempts, the API returns HTTP 503 with `AI_TEMPORARILY_UNAVAILABLE`. If Gemini returns 429, the API returns `AI_RATE_LIMITED` and recommends checking the API project's usage/quota.

A failed chat response is not written to the conversation table. The frontend keeps the unsent draft so the user can retry. A successful response persists the user and assistant messages in the same transaction.
