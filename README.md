# PropIntel

AI-powered real-estate lead intelligence and sales workflow workspace.

> **Assignment project:** Masal AI – AI FDE Intern (Round 2)  
> **Status:** Initial foundation. Features are being implemented incrementally.

## Product scope

PropIntel helps a real-estate sales team understand inbound leads, prioritize follow-ups and manage next actions.

Planned capabilities:

- Lead intake and management
- Gemini-powered lead analysis with structured output
- Explainable deterministic lead prioritization
- Lead-specific AI conversations with persistent history
- Company-policy-aware, domain-restricted assistant
- Sales Action Workspace for tasks and activity history
- Light and dark themes

## Architecture

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** MySQL
- **AI:** Google Gemini API (server-side only)

The backend owns business rules, lead scoring, context assembly, policy checks and database access. The browser must never receive the Gemini API key.

## Repository layout

```text
propintel/
├── client/              # React application
├── server/              # Express API
│   └── src/
│       └── knowledge/   # Fictional demo company policies
├── database/            # SQL schema and demo seed
├── docs/                # Architecture and API notes
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js 20 or later
- npm
- MySQL 8 or compatible MySQL server
- A Gemini API key for AI features

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/keerthivasan91/PropIntel.git
cd PropIntel
```

### 2. Configure MySQL

Create a database and run:

```bash
mysql -u root -p < database/schema.sql
```

Optional demo data:

```bash
mysql -u root -p propintel < database/seed.sql
```

### 3. Configure the backend

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Fill in the MySQL connection settings and Gemini API key in `server/.env`. Never commit this file.

### 4. Configure the frontend

In another terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open the Vite URL printed in the terminal.

## Environment variables

See `server/.env.example` and `client/.env.example`. The Gemini key belongs only in the server environment.

## AI and data-handling design

- Conversation history is persisted by the application in MySQL; it is not assumed that separate Gemini API calls share memory automatically.
- Each assistant request is assembled with the selected lead, bounded recent chat history and the fictional demo company's approved policy documents.
- AI output is treated as untrusted input and validated by the backend.
- Lead priority is calculated by backend business rules, not accepted as an LLM-generated probability.
- The demo policy pack is fictional and is not a statement of Masal AI policy.
- Do not enter real customer or other sensitive personal information into this public demo.

## Limitations

This repository is being implemented in milestones. Consult the code and the project status before assuming a planned capability is already available. AI output can be wrong; policy instructions and output validation reduce risk but do not guarantee perfect model behaviour.

## AI usage disclosure

AI coding assistance is used for planning, implementation support, code review and debugging. The developer is responsible for reviewing and understanding submitted code and will disclose the tools actually used in the final submission.

## License

No license has been added yet.