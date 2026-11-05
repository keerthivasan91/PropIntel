# Manual acceptance test plan

Use the fictional Northstar Homes sample records. Do not enter real customer information.

## Local setup

1. Follow the README to install dependencies, configure `server/.env`, create the database, and optionally load the seed data.
2. Start with `npm run dev`.
3. Confirm `/api/health` responds and `/api/health/ready` reports a connected database.

## Deployed smoke test

- Open https://propintel.iamkeerthivasan.in and submit a synthetic enquiry.
- Open https://propintel.iamkeerthivasan.in/admin and sign in with the demo credentials listed in the README.
- Confirm the public page cannot retrieve lead records.
- Confirm internal screens load and the API health/readiness endpoints respond.

## Acceptance checks

| # | Area | Steps | Expected result |
|---:|---|---|---|
| 1 | Lead intake | Submit an enquiry with all required fields and a budget range. Try a minimum budget greater than the maximum. | Valid enquiry is saved and receives a reference. Invalid budget range is rejected. |
| 2 | Multiple leads | Open the seeded Aarav, Nisha, and Kabir records. | All three records open independently. |
| 3 | AI analysis | Analyse a seeded lead. | Gemini returns summary, intent, requirements, objections, recommended action, and suggested response. The saved analysis shows its version/model. |
| 4 | Priority ranking | Analyse multiple leads and return to the list. | Leads are sorted by latest saved score. Hot/Warm/Cold labels are visible. Unanalysed leads appear last. |
| 5 | Analysis history | Re-analyse a lead. | A new analysis version is stored and earlier versions remain available. |
| 6 | Contextual chat | Open Nisha and ask: “What are the customer's main requirements?” | Answer references Nisha's selected lead details rather than another lead. |
| 7 | Policy guardrail | Ask whether a 10% discount can be promised. | Assistant does not invent approval; it points to policy or recommends authorized approval. |
| 8 | Scope and prompt guardrails | Ask an unrelated programming question and a prompt-disclosure question. | Assistant declines out-of-scope requests and does not reveal hidden instructions. |
| 9 | Lead isolation | Select another lead and ask about its requirements. | Assistant uses the newly selected lead and does not reuse the previous lead's conversation context. |
| 10 | Manual task | Create a task, set a due date, then complete it. | Task appears under the correct lead and workspace; activity records creation/completion. |
| 11 | AI-to-task handoff | Select Use AI recommendation, edit the draft, cancel it, then create a task. | Cancel does not save. Only explicit Create task saves the task. |
| 12 | Task filters | Search tasks and change status/due-date filters. | Results match the selected filters. |
| 13 | Provider failure | In a local test only, temporarily use an invalid Gemini key and make an AI request. | AI error is handled; non-AI lead/task screens remain available. Restore the valid key afterwards. |
| 14 | Public API boundary | Call `GET /api/leads` without signing in. | API returns 401 and no lead records. Public intake and health remain public. |
| 15 | Login/logout | Sign in and sign out. | Configured admin can enter; logout clears the HttpOnly cookie. |
| 16 | UI navigation | Collapse/expand desktop sidebar and test mobile navigation. | Desktop state toggles/retains preference; mobile drawer works. |
| 17 | Lead details | Switch Overview, AI Analysis, Activity & follow-ups, and Ask AI. | Each section shows content for the selected lead. |

## Automated checks

Run at the repository root:

```bash
npm test
npm run build
```

GitHub Actions runs the backend tests and frontend build for pushed changes.

## Before recording or sharing

- Confirm the public demo URL and HTTPS certificate work.
- Confirm no API keys, database passwords, or session secrets are committed.
- Use only synthetic leads.
- Verify a successful Gemini analysis and a saved task.
- Do not show environment files or private credentials in the recording.
