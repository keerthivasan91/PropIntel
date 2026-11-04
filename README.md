# PropIntel

AI-powered real-estate lead intelligence and sales workflow workspace.

> Assignment: Masal AI – AI FDE Intern (Round 2)
> Current milestone: Gemini lead analysis and deterministic prioritization. Contextual chat and Sales Action Workspace are planned next.

## Product goal

PropIntel helps a real-estate sales team understand inbound leads, prioritize follow-ups and manage next actions.

## Technology

- Frontend: React 19 + Vite
- Backend: Node.js + Express
- Database: MySQL 8+
- AI: Google Gen AI JavaScript SDK (@google/genai) with Gemini

The backend owns validation, lead scoring, context assembly, policy checks and database access. The browser never receives the Gemini API key.

## Current features

- React application shell with persistent light/dark theme
- Express API health and database readiness endpoints
- MySQL schema for leads, analyses, conversations, follow-up tasks and lead activities
- Lead creation, listing, detail retrieval and partial updates
- Search, status filtering and pagination for leads
- Transactional activity logging on lead creation and updates
- Fictional Northstar Homes demo policy documents
- Gemini-powered structured lead analysis
- Backend semantic validation of model output
- Deterministic 100-point lead score with an explainable breakdown
- Analysis version history in MySQL
- AI analysis rate limit

## Run locally

### Prerequisites

- Node.js 20.19+ and npm (or pnpm)
- MySQL 8+
- A Gemini API key from Google AI Studio for analysis features

### 1. Clone and install

    git clone https://github.com/keerthivasan91/PropIntel.git
    cd PropIntel
    npm install

### 2. Configure backend environment

    cd server
    cp .env.example .env

Set MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD and MYSQL_DATABASE in server/.env. Add your Gemini API key to GEMINI_API_KEY. GEMINI_MODEL defaults to gemini-3.8-flash and can be changed if your API project uses another supported model.

Return to the project root:

    cd ..

### 3. Initialize the database

    mysql -u root -p < database/schema.sql

Optional synthetic records (run once):

    mysql -u root -p propintel < database/seed.sql

### 4. Start both applications

    npm run dev

- Frontend: http://localhost:5173
- API health: http://localhost:5000/api/health
- Database readiness: http://localhost:5000/api/health/ready

The Vite development server proxies /api requests to Express.

### Useful commands

    npm test
    npm run build

## Lead API overview

- GET /api/leads
- POST /api/leads
- GET /api/leads/:id
- PATCH /api/leads/:id
- GET /api/leads/summary

## AI API overview

- POST /api/leads/:id/analyze
- GET /api/leads/:id/analyses

The selected lead's details and the fictional Northstar Homes policy pack are sent to Gemini from the backend. The response is validated and stored as a new analysis version.

## Lead score

The 100-point score is calculated deterministically by the backend: buying timeline (30), budget clarity (25), requirement clarity (25) and engagement signals (20). Priority bands are Hot (75–100), Warm (45–74) and Cold (0–44). It is an internal prioritization aid, not a purchase probability. See docs/lead-scoring.md.

## AI context and data handling

The included Northstar Homes policies are fictional demo content, not Masal AI policies. Customer content is treated as data, not as instructions. AI may be inaccurate; verify property facts and review suggested responses before using them. Use synthetic data only. Do not enter real customer or sensitive personal information into a public demo.

Conversation memory and the Sales Action Workspace remain planned milestones.

## Implementation status

Implemented: project foundation, responsive dashboard, light/dark theme, MySQL schema, lead CRUD APIs and UI, search/filter/pagination, activity logging, Gemini lead analysis, response validation, deterministic scoring and analysis history.

Next: persistent company-context conversations and Sales Action Workspace.

## AI usage disclosure

AI coding assistance is used for planning, implementation support, code review and debugging. The developer is responsible for reviewing and understanding submitted code and will disclose the tools actually used in the final submission.

## License

No license has been added yet.
