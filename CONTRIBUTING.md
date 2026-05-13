# Contributing to Spectra Indexer

We welcome contributions to the Spectra Indexer!

## Local Setup

1. Clone the repository.
2. Setup a local PostgreSQL instance (or use Docker).
3. Install dependencies: `npm install`.
4. Run migrations: `npm run db:migrate`.
5. Start development: `npm run dev`.

## Standards

- Use strict TypeScript.
- Follow the Prettier and ESLint configurations.
- Add tests for new event parsers or API routes.
- Document any schema changes in the Prisma model.

## Pull Requests

- Ensure all tests pass: `npm test`.
- Provide a clear description of the changes.
- Update documentation as needed.
