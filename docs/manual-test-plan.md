# Manual acceptance test plan

Run these checks against a local copy before recording the demo. Use only the fictional sample leads in `database/seed.sql`.

## Setup

1. Follow the README to install dependencies, configure `server/.env`, create the database and load the seed data.
2. Start the app with `npm run dev`.
3. Confirm the API health endpoint responds and the browser reports the API as connected.

## Acceptance checks

| # | Area | Steps | Expected result |
|---:|---|---|---|
| 1 | Lead intake | Add a lead with all required fields and a budget range. Try a minimum budget greater than the maximum. | Valid lead is saved and appears in the list. Invalid budget range is rejected with a readable error. |
| 2 | Multiple leads | Open the seeded Aarav, Nisha and Kabir records. | All three records can be opened independently. |
| 3 | AI analysis | Analyse each seeded lead. Inspect the result. | Gemini returns summary, intent, requirements, objections, recommended action and suggested response. Analysis version and model are displayed. |
| 4 | Priority ranking | Return to the lead list after analyses have completed. Compare scores and labels. | Leads appear in descending order of latest score. The score and Hot/Warm/Cold label are visible. Unanalysed leads appear after analysed leads. |
| 5 | Priority refresh | Re-analyse a lead while its list page is open, then close the details. | The lead list refreshes and reflects the latest saved analysis score. |
| 6 | Analysis history | Re-analyse a lead without changing its data. | A new version is saved and previous versions remain available. Similar or identical analysis text is acceptable when the input is unchanged. |
| 7 | Contextual chat | Open Nisha and ask, “What are the customer's main requirements?” | Answer refers to Nisha's 2BHK, Sarjapur Road, budget and timeline rather than another lead. |
| 8 | Policy guardrail | Ask whether a 10% discount can be promised. | Assistant does not invent approval and points to the relevant fictional company policy or authorized approval. |
| 9 | Scope and prompt guardrails | Ask an unrelated Java question, then try a prompt-disclosure request. | Assistant declines requests outside the real-estate sales scope and does not reveal hidden instructions. |
| 10 | Lead isolation | Open a different lead and ask about its requirements. | The answer uses the newly selected lead and does not reuse Nisha's private conversation context. |
| 11 | Manual task | Create a task from the lead details, set a due date, then complete it. | Task appears against the correct lead and in Sales Action Workspace. Activity timeline records creation and completion. |
| 12 | AI-to-task handoff | Select **Use AI recommendation**, edit the prefilled draft, then cancel it. Repeat and create the task. | Opening or cancelling the draft does not save a task. Only the explicit **Create task** action saves it. The saved task appears in the lead and global workspace. |
| 13 | Task filters | Search by task or customer, change status and due-date filters, and navigate pages when available. | Results match the selected filters and pagination controls behave correctly. |
| 14 | Provider failure | In a local test only, temporarily use an invalid Gemini key and try an AI request. Restore the valid key afterwards. | AI failure is shown as an application error; non-AI lead and task screens remain available. No failed assistant turn is stored as a successful answer. |

| 15 | Public enquiry | Open `/`, submit the enquiry form and note the reference number. | The page confirms receipt. The record is created with status New and appears in the authenticated Leads page. |
| 16 | Admin API protection | Open browser dev tools or call `GET /api/leads` without signing in. | The API returns 401 and no customer records. Health and public enquiry submission remain public. |
| 17 | Admin login and logout | Open `/admin`, sign in using the configured values, then sign out. | Only the configured administrator can enter the workspace. The HTTP-only session cookie is cleared on logout. |
| 18 | Sidebar controls | Collapse and expand the sidebar on desktop. Test the mobile menu at a narrow viewport and reload. | Desktop layout toggles between full sidebar and icon rail. Mobile navigation opens as a drawer. Desktop collapsed preference is remembered. |
| 19 | Lead details and AI workspace | Open a lead, switch between Overview, AI Analysis and Activity & follow-ups, then select Ask AI. | Each tab shows its own content. The assistant opens with that lead selected and keeps its saved conversation history. |

## Automated checks

Run from the repository root:

```powershell
npm test
npm run build
```

GitHub Actions should also complete its backend test and frontend build jobs after the changes are pushed.

## Before sharing the demo

- Confirm the Gemini API key and database credentials are not committed.
- Use the seeded fictional leads; do not use actual customer data.
- Confirm the app is running from a fresh clone using only the README steps.
- Confirm the browser console and backend terminal show no blocking errors during the demo.
