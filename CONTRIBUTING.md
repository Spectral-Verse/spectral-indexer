# Contributing to Spectral Indexer

We welcome contributions to the Spectral Verse Indexer!

## How to Contribute

### Finding Issues to Work On
- Browse the [issues](https://github.com/your-org/spectral-indexer/issues) page
- Look for labels like `good first issue`, `help wanted`, or `drips-wave` for beginner-friendly or Drips Wave-eligible tasks
- Comment on an issue to let others know you're working on it

### Drips Wave Contribution
This repository participates in [Drips Wave](https://docs.drips.network/wave/). Look for issues labeled `drips-wave` for eligible tasks.

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

1. Create a branch for your changes.
2. Ensure all tests pass: `npm test`, build passes: `npm run build`, and lint passes: `npm run lint`.
3. Submit a PR using the [PR template](.github/PULL_REQUEST_TEMPLATE.md), linking to the issue it addresses.
4. Provide a clear description of the changes.
5. Update documentation as needed.
6. A maintainer will review your PR and provide feedback.

## Communication
- Use issues for bug reports and feature requests
- Use PR comments for discussion about specific changes
- Be respectful and follow our [Code of Conduct](CODE_OF_CONDUCT.md)

## Issue Guidelines
- Check if the issue already exists before opening a new one
- Provide clear steps to reproduce any bugs
- For feature requests, explain the use case and proposed implementation
- Use the appropriate issue template when creating a new issue
