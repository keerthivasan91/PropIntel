# PropIntel

AI-powered real-estate lead intelligence and sales workflow workspace.

> **Assignment:** Masal AI – AI FDE Intern (Round 2)  
> **Current milestone:** Project foundation (Milestone 1). Lead management, AI workflows and sales actions are planned next.

## Product goal

PropIntel helps a real-estate sales team understand inbound leads, prioritize follow-ups and manage next actions.

Planned capabilities:

- Structured lead intake and lead management
- Gemini-powered lead analysis with validated structured output
- Explainable deterministic lead prioritization
- Lead-specific AI conversations with persistent MySQL history
- Company-policy-aware, domain-restricted assistant
- Sales Action Workspace for follow-up tasks and activity history
- Light and dark themes

## Technology

- **Frontend:** React 19 + Vite
- **Backend:** Node.js + Express
- **Database:** MySQL 8+
- **AI:** Google Gemini API (server-side integration planned)

The backend owns business rules, lead scoring, context assembly, policy checks and database access. The browser must never receive the Gemini API key.

## Repository layout

    propintel/
    ├── client/                 # React application
    ├── server/                 # Express API
    │   ├── src/
    │   │   ├── config/
    │   │   ├── middleware/
    │   │   ├── routes/
    │   │   └── knowledge/
    │   │       └── company/    # Fictional demo company policies
    │   └── test/
    ├── database/               # MySQL schema and demo seed
    ├── docs/                   # Architecture and AI design notes
    ├── package.json            # npm workspaces and root scripts
    └── README.md

## Prerequisites

- Node.js 20.19+ (or a current supported Node.js release)
- npm
- MySQL 8+ for database-backed milestones

Check your versions:

    node --version
    npm --version
    mysql --version

## Run locally

### 1. Clone the repository

    git clone https://github.com/keerthivasan91/PropIntel.git
    cd PropIntel

### 2. Install dependencies

Run this once from the repository root:

    npm install

### 3. Configure the backend

    cd server
    cp .env.example .env

Edit server/.env and set your local MySQL connection values. MYSQL_PASSWORD may be left empty if your local MySQL user has no password. The Gemini key can be added when AI integration is implemented. Never commit .env.

Return to the repository root:

    cd ..

### 4. Create the database

    mysql -u root -p < database/schema.sql

Optional synthetic demo data (run once):

    mysql -u root -p propintel < database/seed.sql

### 5. Start frontend and backend

From the repository root:

    npm run dev

- Frontend: http://localhost:5173
- Backend health: http://localhost:5000/api/health
- Backend readiness (includes MySQL check): http://localhost:5000/api/health/ready

The frontend development server proxies /api requests to the Express server.

### Other commands

    npm run build
    npm test
    npm run dev:server
    npm run dev:client

## Environment variables

See server/.env.example. The Gemini API key belongs only in the backend environment.

## AI and data-handling design

- Conversation history will be persisted by the application in MySQL; the application will not assume separate Gemini requests automatically share memory.
- Each assistant request will be assembled with the selected lead, bounded recent chat history and the fictional demo company's approved policy documents.
- AI output will be treated as untrusted input and validated by the backend.
- Lead priority will be calculated by backend business rules, not accepted as an LLM-generated conversion probability.
- The included policy pack is fictional and is not a statement of Masal AI policy.
- Use synthetic data only. Do not enter real customer or sensitive personal information into a public demo.

## Current implementation status

**Available in this initial commit**
- React/Vite application shell
- Persistent light/dark theme preference
- Express API health endpoint
- MySQL connection configuration and readiness check
- Initial five-table MySQL schema
- Fictional demo company policy documents
- Setup documentation and a backend health test

**Planned next**
- Lead CRUD APIs and UI
- Gemini lead analysis and deterministic scoring
- Persistent, policy-aware contextual chat
- Follow-up tasks and activity timeline
- Dashboard metrics backed by real data

Planned features are not represented as implemented until their workflows are connected and tested.

## AI usage disclosure

AI coding assistance is used for planning, implementation support, code review and debugging. The developer is responsible for reviewing and understanding submitted code and will disclose the tools actually used in the final submission.

## License

No license has been added yet.
