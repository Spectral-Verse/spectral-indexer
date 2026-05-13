# Spectra Indexer Architecture

Spectra Indexer is a backend service designed to read, parse, and persist data from Spectra smart contracts on the Stellar Soroban network.

## Components

1.  **Event Fetcher**: Polls the Soroban RPC for new contract events based on a stored ledger cursor.
2.  **Event Parser**: Decodes raw XDR event topics and data into structured TypeScript objects.
3.  **Event Processor**: Handles the business logic for each event type, updating the database in atomic transactions.
4.  **Database (PostgreSQL)**: Stores indexed state (vaults, positions, balances) and a history of events.
5.  **API Server (Fastify)**: Exposes REST endpoints for querying the indexed data.

## Data Flow

1.  `IndexerService` triggers the `EventFetcher` to poll for events.
2.  `EventFetcher` retrieves raw events from the RPC.
3.  `EventProcessor` parses each event using `spectraEvents.ts`.
4.  Derived state (e.g., a user's share balance) is updated in the database.
5.  The ledger cursor in `SyncState` is advanced.
6.  External clients query the data via the REST API.

## Idempotency and Reliability

- **Cursor-based Sync**: The indexer tracks the last processed ledger to ensure no events are missed.
- **Atomic Transactions**: All database updates for a single event happen within a Prisma transaction.
- **Raw Event Storage**: Raw event XDR is stored for traceability and potential reprocessing.
