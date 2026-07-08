# Spectral Indexer

Spectral Indexer is a robust backend service for indexing and querying activity from [Spectral Verse Contracts](file:///c:/Users/useer/OneDrive/Desktop/Maintainer/Spectral-Verse/spectral-contracts) on the Stellar Soroban network.

## Features

- **Event Indexing**: Real-time polling and parsing of Spectral Verse contract events.
- **Vault Tracking**: Maintains current state for all indexed vaults, including allocations and total shares.
- **Position Tracking**: Tracks user share balances and historical activity.
- **REST API**: Exposes queryable endpoints for vaults, positions, and analytics.
- **Sync Management**: Persistent sync state with support for backfilling historical data.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose (optional, for local setup)

## Getting Started

### 1. Setup Database

Using Docker Compose:
```bash
docker-compose up -d
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

### 4. Run Migrations

```bash
npm run db:migrate
```

### 5. Start the Indexer and API

```bash
npm run dev
```

## API Documentation

Once the server is running, visit `http://localhost:3000/docs` for the interactive OpenAPI documentation.

## Scripts

- `npm run dev`: Start the service in development mode.
- `npm run build`: Build the project for production.
- `npm run start`: Start the production build.
- `npm run test`: Run the test suite.
- `npm run indexer:backfill`: Run a manual backfill job.

## Security

Please see [SECURITY.md](SECURITY.md) for security policies and disclosure instructions.


## License

MIT
