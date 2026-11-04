# PropIntel

AI-powered real-estate lead intelligence and sales workflow workspace.

> Assignment: Masal AI – AI FDE Intern (Round 2)

## Product goal

PropIntel helps a real-estate sales team understand inbound leads, prioritize follow-ups and manage next actions.

## Technology

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL 8+
- AI: Google Gen AI JavaScript SDK (@google/genai) with Gemini

The backend owns validation, lead scoring, context assembly, policy checks and database access. The browser never receives the Gemini API key.

## Current features

- Responsive React application with persistent light/dark theme
- Lead intake, listing, details, status changes, search and filtering
- MySQL persistence across the five approved relational tables
- Gemini-powered structured lead analysis with validated output
- Deterministic 100-point lead priority score and stored analysis history
- Lead-scoped conversational assistant with company policy, lead and latest-analysis context
- Persistent conversation history per lead
- Sales Action Workspace with task creation, due dates, completion and cancellation
- Task search, status filters, overdue/today/upcoming filters and summary metrics
- Lead activity timeline with task creation/completion and existing lead/AI events
- Server-side Gemini API key handling and request rate limits

## Run locally

### Prerequisites

- Node.js 20.19+ and npm or pnpm
- MySQL 8+
- Gemini API key from Google AI Studio

### 1. Clone and install

    git clone https://github.com/keerthivasan91/PropIntel.git
    cd PropIntel
    pnpm install

### 2. Configure backend environment

    cd server
    copy .env.example .env

Set MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD and MYSQL_DATABASE in server/.env. Add your Gemini key to GEMINI_API_KEY. Set GEMINI_MODEL to the model available to your Google AI Studio project. For example: gemini-3.5-flash-lite.

Return to the project root:

    cd ..

### 3. Initialize the database

    mysql -u root -p < database/schema.sql

Optional synthetic records (run once):

    mysql -u root -p propintel < database/seed.sql

The task and activity tables are included in the five-table schema. This milestone does not require an additional migration.

### 4. Start both applications

    pnpm run dev

- Frontend: http://localhost:5173
- API health: http://localhost:5000/api/health
- Database readiness: http://localhost:5000/api/health/ready

## Useful commands

    pnpm test
    pnpm run build

## API overview

- GET /api/leads
- POST /api/leads
- GET /api/leads/:id
- PATCH /api/leads/:id
- POST /api/leads/:id/analyze
- GET /api/leads/:id/analyses
- POST /api/leads/:id/chat
- GET /api/leads/:id/conversations
- GET /api/leads/:id/tasks
- POST /api/leads/:id/tasks
- GET /api/leads/:id/activities
- GET /api/tasks
- GET /api/tasks/summary
- PATCH /api/tasks/:id

See docs/api-contract.md for query filters and response details.

## Lead scoring

The 100-point score is calculated deterministically by the backend: buying timeline (30), budget clarity (25), requirement clarity (25) and engagement signals (20). Priority bands are Hot (75–100), Warm (45–74) and Cold (0–44). It is an internal prioritization aid, not a purchase probability. See docs/lead-scoring.md.

## AI context and data handling

The assistant assembles the selected lead, latest analysis, approved demo policy documents and the most recent 12 saved messages for that lead. Full conversation history remains in MySQL. The included Northstar Homes policies are fictional demo content, not Masal AI policies.

Customer and conversation content are untrusted reference data, not instructions. AI output can be inaccurate. Verify property facts and review suggestions. Use synthetic data only; do not enter real customer or sensitive personal information into this public demo.

## Task dates

Task due dates are accepted as ISO date-time values and stored in MySQL DATETIME columns using UTC. The frontend converts local date-time input to an ISO timestamp before submitting. Overdue and due-date filters are calculated against UTC.

## Implementation status

Implemented: project foundation, responsive dashboard, lead CRUD, search/filter/pagination, Gemini analysis, deterministic scoring, analysis history, contextual lead-specific assistant, persistent chat, follow-up task management, Sales Action Workspace, and lead activity timeline.

## AI usage disclosure

AI coding assistance is used for planning, implementation support, code review and debugging. The developer is responsible for reviewing and understanding submitted code and will disclose the tools actually used in the final submission.

## License

No license has been added yet.
