export type Role = 'requester' | 'agent' | 'approver' | 'admin';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  DEMO_MODE?: string;
  ALLOWED_ORIGINS?: string;
}

export interface AuthUser {
  id: string;
  org: string;
  role: Role;
  dept: string | null;
  email: string;
  name: string;
}

export type AppEnv = { Bindings: Env; Variables: { user: AuthUser } };
export type Row = Record<string, any>;
