INSERT INTO organizations (id, name) VALUES ('org_demo', 'Infratel');

INSERT INTO departments (id, organization_id, name, slug, capacity, visibility) VALUES
 ('dep_it',  'org_demo', 'IT',               'it',               20, 'full'),
 ('dep_hr',  'org_demo', 'HR',               'hr',               12, 'masked'),
 ('dep_fin', 'org_demo', 'Finance',          'finance',          10, 'masked'),
 ('dep_cs',  'org_demo', 'Customer service', 'customer-service', 18, 'full');

INSERT INTO categories (id, organization_id, department_id, name, default_priority, custom_fields) VALUES
 ('cat_it_hw',   'org_demo', 'dep_it',  'Hardware',            'medium', '[]'),
 ('cat_it_net',  'org_demo', 'dep_it',  'Network and VPN',     'high',   '[]'),
 ('cat_it_acc',  'org_demo', 'dep_it',  'Access and accounts', 'medium', '[]'),
 ('cat_hr_leave','org_demo', 'dep_hr',  'Leave request',       'low',    '[{"key":"employeeId","label":"Employee ID","type":"text","required":true}]'),
 ('cat_hr_case', 'org_demo', 'dep_hr',  'Employee case',       'high',   '[{"key":"employeeId","label":"Employee ID","type":"text","required":true}]'),
 ('cat_fin_pay', 'org_demo', 'dep_fin', 'Payment query',       'medium', '[{"key":"invoiceAmount","label":"Invoice amount","type":"number","required":false}]'),
 ('cat_fin_exp', 'org_demo', 'dep_fin', 'Expense claim',       'low',    '[]'),
 ('cat_cs_cust', 'org_demo', 'dep_cs',  'Customer issue',      'high',   '[]'),
 ('cat_cs_gen',  'org_demo', 'dep_cs',  'General enquiry',     'low',    '[]');
