# Security Policy

## Responsible Disclosure

If you discover a security vulnerability, please report it to the Spectra maintainers. We are committed to addressing vulnerabilities promptly.

## Secret Handling

- Never commit `.env` files to version control.
- Use secure secret management for production deployments.
- The indexer does not require private keys for read-only indexing.

## Operational Safety

- Ensure the API is protected by rate limiting in production.
- Do not expose the database directly to the internet.
- Monitor indexer sync status to ensure data freshness.

**Note**: Indexed data is a convenience and should be verified against the direct contract state for high-value workflows.
