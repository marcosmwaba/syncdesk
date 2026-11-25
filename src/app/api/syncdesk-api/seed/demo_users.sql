INSERT OR IGNORE INTO users (id, organization_id, email, name, role, department_id, status) VALUES
 ('usr_req',   'org_demo', 'requester@syncdesk.demo',     'Chanda Mwila', 'requester', NULL,      'active'),
 ('usr_it',    'org_demo', 'agent.it@syncdesk.demo',      'Bwalya Phiri', 'agent',     'dep_it',  'active'),
 ('usr_hr',    'org_demo', 'agent.hr@syncdesk.demo',      'Mutale Banda', 'agent',     'dep_hr',  'active'),
 ('usr_fin',   'org_demo', 'agent.finance@syncdesk.demo', 'Natasha Zulu', 'agent',     'dep_fin', 'active'),
 ('usr_cs',    'org_demo', 'agent.cs@syncdesk.demo',      'Kelvin Tembo', 'agent',     'dep_cs',  'active'),
 ('usr_appr',  'org_demo', 'approver@syncdesk.demo',      'Grace Lungu',  'approver',  'dep_it',  'active'),
 ('usr_admin', 'org_demo', 'admin@syncdesk.demo',         'Admin User',   'admin',     NULL,      'active');
