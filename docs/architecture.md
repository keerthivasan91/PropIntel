# PropIntel architecture

## Current foundation

PropIntel is a modular monolith with two runtime applications:

- React/Vite client
- Express API

MySQL is the relational persistence layer. The browser communicates with the backend through REST endpoints. The Vite development server proxies /api requests to the local Express server.

## Request flow

    Browser (React)
        |
        | HTTP / JSON
        v
    Express API
        |
        +--> Request validation and middleware
        |
        +--> Domain services (being added in later milestones)
        |
        +--> MySQL connection pool
        |
        +--> Gemini API (server-side; planned)

## Design choices

- Keep the first delivery as a modular monolith rather than introducing microservices.
- Keep API keys and database credentials in server environment variables.
- Use MySQL foreign keys and indexes for relational integrity and common access paths.
- Keep lead scoring in deterministic backend business logic.
- Persist conversation messages in MySQL; do not depend on transient model-provider chat state.
- Keep the demo workspace synthetic and clearly labelled.

## Runtime endpoints

- GET /api/health: process-level API health.
- GET /api/health/ready: readiness check that requires a configured, reachable MySQL database.

## Current scope boundary

This milestone establishes the application shell, server, database connection setup, initial schema and documentation. Lead CRUD, Gemini integration, scoring, contextual conversation and task management are not implemented yet.
