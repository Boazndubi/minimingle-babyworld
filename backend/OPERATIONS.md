# Production Operations

## Environment

Set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, payment-provider credentials, and callback URLs in the deployment secret store. `CORS_ORIGINS` is a comma-separated list of the deployed store and admin origins. `RESEND_FROM_EMAIL` must use a domain verified in Resend to send to customers; `onboarding@resend.dev` is restricted to test messages sent to the Resend account's own email address.

Set `MPESA_ENV=production` in production deployments. It defaults to `sandbox` when unset, which points at Safaricom's sandbox API and will not process real payments - this must be explicitly set to `production` before going live with real M-Pesa transactions.

Set `WHATSAPP_NUMBER` to the shop's WhatsApp number in international digits-only format (for example, `254112815454`) and `WHATSAPP_DISPLAY` to its customer-facing formatted version. The backend email link defaults to the storefront's configured number if these are unset.

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

Online pending orders expire after 30 minutes. An unsuccessful M-Pesa attempt leaves the order pending so the customer can retry; the expiry job eventually marks abandoned orders cancelled/expired and restores reserved stock. Refunds are initiated by an admin from the order panel and are recorded as `paymentStatus: refunded`.
