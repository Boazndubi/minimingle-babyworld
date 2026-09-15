# Production Operations

## Environment

Set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, payment-provider credentials, and callback URLs in the deployment secret store. `CORS_ORIGINS` is a comma-separated list of the deployed store and admin origins.

## Database migrations

1. Review schema changes locally.
2. Run `npx prisma migrate dev --name <change>` during development.
3. Commit the generated migration directory.
4. Deploy with `npx prisma migrate deploy` before starting the application.
5. Run `npx prisma generate` after dependency or schema changes.

The saved-address migration is in `prisma/migrations/20260915_add_addresses/migration.sql`.

## Backups

Use a managed PostgreSQL point-in-time recovery feature where available. Keep an encrypted daily logical backup outside the database provider and test restoration monthly. A PostgreSQL logical backup can be created with:

```bash
pg_dump --format=custom --file=backups/minimingle-$(date +%Y-%m-%d).dump "$DATABASE_URL"
```

Restore only into a separate verification database first:

```bash
pg_restore --clean --if-exists --dbname="$RESTORE_DATABASE_URL" backups/minimingle-YYYY-MM-DD.dump
```

Never commit `.env`, database URLs, payment secrets, or backup files.

## Health and monitoring

- `GET /health` verifies the API process is responding.
- Monitor 5xx responses, 429 responses, payment callback failures, and pending-order expiry failures.
- Alert when database connectivity or payment callback delivery degrades.

## Order lifecycle

Online pending orders expire after 30 minutes. The expiry job marks them cancelled/expired and restores reserved stock. Refunds are initiated by an admin from the order panel and are recorded as `paymentStatus: refunded`.
