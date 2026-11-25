# SyncDesk API (Cloudflare Worker)

Hono + D1. Put this folder at `apps/api` in your repo.

## First deploy
1. `npm install`
2. `npx wrangler login`
3. `npx wrangler d1 create syncdesk-db`  -> paste the database_id into wrangler.toml
4. `npm run db:migrate:remote`
5. `npm run db:seed:remote`            (demo users, demo only)
6. `npx wrangler secret put JWT_SECRET` (any long random string)
7. `npm run deploy`                    -> note the workers.dev URL

## Demo sign-in
DEMO_MODE=true: request-code always succeeds and the code is 000000.
Seeded users (all @syncdesk.demo): requester, agent.it, agent.hr, agent.finance, agent.cs, approver, admin.
GET /auth/demo-users lists them for a "sign in as" switcher.
Before real use: set DEMO_MODE to "false", restrict ALLOWED_ORIGINS, wire an email provider.

## Local
cp .dev.vars.example .dev.vars; npm run db:migrate:local; npm run db:seed:local; npm run dev

## Add a feature
Create src/modules/<name>.ts (a Hono app) and add it to src/modules/registry.ts.
