CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 10,
  visibility TEXT NOT NULL DEFAULT 'full' CHECK (visibility IN ('full','masked','counts_only')),
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE (organization_id, slug)
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('requester','agent','approver','admin')),
  department_id TEXT REFERENCES departments(id),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','disabled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (organization_id, email)
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  department_id TEXT NOT NULL REFERENCES departments(id),
  name TEXT NOT NULL,
  default_priority TEXT NOT NULL DEFAULT 'medium',
  custom_fields TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE tickets (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL DEFAULT 'request' CHECK (type IN ('request','incident','change')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  department_id TEXT NOT NULL REFERENCES departments(id),
  category_id TEXT REFERENCES categories(id),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  confidential INTEGER NOT NULL DEFAULT 0,
  requester_id TEXT NOT NULL REFERENCES users(id),
  assignee_id TEXT REFERENCES users(id),
  custom_fields TEXT NOT NULL DEFAULT '{}',
  ai_priority TEXT,
  ai_confidence REAL,
  needs_triage INTEGER NOT NULL DEFAULT 0,
  response_due_at TEXT,
  resolve_due_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT
);
CREATE INDEX idx_tickets_org_created ON tickets (organization_id, created_at DESC);
CREATE INDEX idx_tickets_org_dept_status ON tickets (organization_id, department_id, status);
CREATE INDEX idx_tickets_requester ON tickets (requester_id);

CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  author_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_comments_ticket ON comments (ticket_id, created_at);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  actor_id TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  meta TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_audit_org_created ON audit_logs (organization_id, created_at DESC);
