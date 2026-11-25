import type { MiddlewareHandler } from 'hono';
import { sign, verify } from 'hono/jwt';
import { ApiError } from './http';
import type { AppEnv, AuthUser, Env, Role, Row } from './types';

export const toAuthUser = (u: Row): AuthUser => ({
  id: u.id,
  org: u.organization_id,
  role: u.role,
  dept: u.department_id ?? null,
  email: u.email,
  name: u.name,
});

export async function issueTokens(env: Env, u: AuthUser) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { sub: u.id, org: u.org, role: u.role, dept: u.dept, email: u.email, name: u.name };
  const accessToken = await sign({ ...claims, typ: 'access', exp: now + 3600 }, env.JWT_SECRET, 'HS256');
  const refreshToken = await sign({ ...claims, typ: 'refresh', exp: now + 60 * 60 * 24 * 30 }, env.JWT_SECRET, 'HS256');
  return { accessToken, refreshToken, expiresIn: 3600 };
}

export async function readToken(env: Env, token: string, typ: 'access' | 'refresh'): Promise<AuthUser> {
  try {
    const p: any = await verify(token, env.JWT_SECRET, 'HS256');
    if (p.typ !== typ) throw new Error('wrong token type');
    return { id: p.sub, org: p.org, role: p.role, dept: p.dept ?? null, email: p.email, name: p.name };
  } catch {
    throw new ApiError(401, 'INVALID_TOKEN', 'Your session expired. Sign in again.');
  }
}

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const h = c.req.header('Authorization') ?? '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
  c.set('user', await readToken(c.env, token, 'access'));
  await next();
};

export const requireRole =
  (...roles: Role[]): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    if (!roles.includes(c.get('user').role)) throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this.');
    await next();
  };
