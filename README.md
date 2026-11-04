# PropIntel

AI-powered real-estate lead intelligence and sales workflow workspace.

> **Assignment:** Masal AI – AI FDE Intern (Round 2)  
> **Current milestone:** Lead management foundation. Gemini analysis, contextual AI and task workflows are planned next.

## Product goal

PropIntel helps a real-estate sales team understand inbound leads, prioritize follow-ups and manage next actions.

## Technology

- **Frontend:** React 19 + Vite
- **Backend:** Node.js + Express
- **Database:** MySQL 8+
- **AI:** Google Gemini API (server-side integration planned)

The backend owns business rules, validation, context assembly, policy checks and database access. The browser must never receive the Gemini API key.

## Current features

- React application shell with persistent light/dark theme
- Express API health and database readiness endpoints
- MySQL schema for leads, analyses, conversations, follow-up tasks and lead activities
- Lead creation, listing, detail retrieval and partial updates
- Search, status filtering and pagination for leads
- Transactional activity logging on lead creation and updates
- Fictional Northstar Homes demo policy documents
- Request validation and API rate limiting

## Run locally

### Prerequisites

- Node.js 20.19+ and npm
- MySQL 8+

### 1. Clone and install

    git clone https://github.com/keerthivasan91/PropIntel.git
    cd PropIntel
    npm install

### 2. Configure backend environment

    cd server
    cp .env.example .env

Set MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD and MYSQL_DATABASE in server/.env. MYSQL_PASSWORD can be empty for a local MySQL account without a password.

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

## API overview

- GET /api/leads
- POST /api/leads
- GET /api/leads/:id
- PATCH /api/leads/:id
- GET /api/leads/summary

See docs/api-contract.md for request and response details.

## AI context and data handling

Conversation history will be persisted by the application in MySQL. Each assistant request will use selected-lead context, recent messages and approved company documents. The initial Northstar Homes policies are fictional demo content, not Masal AI policies. Lead priority will be calculated with backend business rules, not treated as a purchase probability.

Use synthetic data only. Do not enter real customer or sensitive personal information into a public demo.

## Implementation status

**Implemented:** Project foundation, responsive dashboard shell, light/dark theme, Express API foundation, MySQL schema, lead CRUD APIs (create/read/update), search, filters, pagination, activity logging, and request validation.

**Next:** Gemini lead analysis, deterministic priority scoring, company-context chat with persistent memory, and Sales Action Workspace.

## AI usage disclosure

AI coding assistance is used for planning, implementation support, code review and debugging. The developer is responsible for reviewing and understanding submitted code and will disclose the tools actually used in the final submission.

## License

No license has been added yet.
