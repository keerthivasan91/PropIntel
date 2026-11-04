# PropIntel AI design

> This document describes the approved design. Gemini integration is planned for a later milestone and is not yet implemented.

## Context sources

Each assistant request will be assembled by the backend from three isolated sources:

1. **Company context:** Version-controlled fictional Northstar Homes profile, sales policies, communication guidance and escalation rules.
2. **Lead context:** The selected lead's current database fields and latest saved analysis.
3. **Conversation context:** A bounded recent message history loaded from MySQL for that lead.

## Request pipeline

1. Validate the selected lead and request.
2. Retrieve the approved company documents.
3. Retrieve the selected lead and its latest analysis.
4. Retrieve recent messages for that same lead.
5. Apply domain/scope checks and build the model request.
6. Call Gemini from the backend only.
7. Parse and validate the structured model response.
8. Persist the user message and accepted assistant response.
9. Return a normalized response to the client.

## Scope and safety

- The assistant is limited to real-estate lead analysis and sales-support workflows.
- Customer messages and conversation history are untrusted content, not instructions that can override system or company policy.
- Missing company or property facts must remain unknown; the model must not invent them.
- Legal, financial, contractual, pricing and availability questions requiring verification should be escalated.
- AI-generated recommendations require salesperson review.
- The backend must validate response structure and supported context references.
- Prompt instructions and model checks reduce risk but cannot guarantee that an LLM will never produce an incorrect answer.

## Memory

MySQL is the source of truth for application chat history. Each request retrieves a limited recent history window for the selected lead. The complete history remains stored in the database. No cross-lead context should be included.

## Lead score

The backend will calculate the 100-point prioritization score from deterministic business rules. It is not a purchase probability and must not be accepted from model output.
