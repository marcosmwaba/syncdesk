import { Hono } from 'hono';
import { z } from 'zod';
import { issueTokens, readToken, toAuthUser } from '../core/auth';
import { ApiError, body, ok, parse } from '../core/http';
import { auditStmt } from '../core/domain';
import type { AppEnv, Env, Row } from '../core/types';

const m = new Hono<AppEnv>();
const demoOn = (e: Env) => e.DEMO_MODE === 'true';
const notReady = () => new ApiError(501, 'NOT_IMPLEMENTED', 'Email sign-in is not set up yet.');
const publicUser = (u: Row) => ({
  id: u.id, name: u.name, email: u.email, role: u.role,
  departmentId: u.department_id ?? null, organizationId: u.organization_id,
});

m.post('/auth/request-code', async (c) => {
  parse(z.object({ email: z.string().email() }), await body(c));
  if (!demoOn(c.env)) throw notReady();
  return ok(c, { sent: true });
});

m.post('/auth/verify', async (c) => {
  const { email, code } = parse(z.object({ email: z.string().email(), code: z.string().length(6) }), await body(c));
  if (!demoOn(c.env)) throw notReady();
  const bad = new ApiError(401, 'INVALID_CODE', 'That code did not work. Try again.');
  if (code !== '000000') throw bad;
  const u = await c.env.DB
    .prepare("SELECT * FROM users WHERE lower(email) = lower(?) AND status IN ('active','invited')")
    .bind(email).first<Row>();
  if (!u) throw bad;
  if (u.status === 'invited') {
    await c.env.DB.batch([
      c.env.DB.prepare("UPDATE users SET status = 'active' WHERE id = ?").bind(u.id),
      auditStmt(c.env.DB, u.organization_id, u.id, 'user.activated', 'user', u.id),
    ]);
  }
  const tokens = await issueTokens(c.env, toAuthUser(u));
  return ok(c, { ...tokens, user: publicUser(u) });
});

m.post('/auth/refresh', async (c) => {
  const { refreshToken } = parse(z.object({ refreshToken: z.string().min(10) }), await body(c));
  const claims = await readToken(c.env, refreshToken, 'refresh');
  const u = await c.env.DB.prepare("SELECT * FROM users WHERE id = ? AND status = 'active'").bind(claims.id).first<Row>();
  if (!u) throw new ApiError(401, 'INVALID_TOKEN', 'Your session expired. Sign in again.');
  return ok(c, await issueTokens(c.env, toAuthUser(u)));
});

m.post('/auth/logout', (c) => ok(c, { loggedOut: true }));

m.get('/auth/demo-users', async (c) => {
  if (!demoOn(c.env)) throw new ApiError(404, 'NOT_FOUND', 'Not found.');
  const { results } = await c.env.DB
    .prepare("SELECT email, name, role, department_id FROM users WHERE status = 'active' ORDER BY role, name")
    .all<Row>();
  return ok(c, results.map((u) => ({ email: u.email, name: u.name, role: u.role, departmentId: u.department_id })));
});

export default m;
