import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ApiError } from './core/http';
import type { AppEnv } from './core/types';
import { modules } from './modules/registry';

const app = new Hono<AppEnv>();

app.use('*', async (c, next) => {
  const allowed = (c.env.ALLOWED_ORIGINS ?? '*').split(',').map((s) => s.trim());
  return cors({
    origin: (origin) => (allowed.includes('*') ? '*' : allowed.includes(origin) ? origin : ''),
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 86400,
  })(c, next);
});

app.get('/', (c) => c.json({ data: { name: 'syncdesk-api', status: 'ok' } }));
app.get('/health', (c) => c.json({ data: { status: 'ok' } }));

for (const m of modules) app.route('/', m);

app.notFound((c) =>
  c.json({ error: { code: 'NOT_FOUND', message: `No route for ${c.req.method} ${new URL(c.req.url).pathname}` } }, 404),
);

app.onError((err, c) => {
  if (err instanceof ApiError) {
    return c.json({ error: { code: err.code, message: err.message, fields: err.fields } }, err.status as 400);
  }
  console.error(err);
  return c.json({ error: { code: 'INTERNAL', message: 'Something went wrong. Try again.' } }, 500);
});

export default app;
