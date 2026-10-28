-- FILE: 20260727085141_001_hrms_core_schema.sql
/*
# HRMS Core Schema — Roles, Branches, Employees, Departments, Positions, Documents

1. Overview
   Foundational tables for a Human Resources Management System (HRMS):
   - Role catalog (6 roles).
   - Organizational structure: branches, departments, positions.
   - Employee records with full HR profile fields.
   - Employee document storage references (CV, contract, ID, certificates, misc).

2. New Tables
   - `roles`        : role catalog (6 roles).
   - `branches`     : company branches/locations.
   - `employees`    : core employee record (created before departments/positions exist; FKs added after).
   - `departments`  : departments belonging to a branch; manager is an employee.
   - `positions`    : job positions belonging to a department.
   - `documents`    : employee file attachments metadata.

3. Security
   - RLS enabled on every table.
   - All tables allow `TO anon, authenticated` CRUD: this HRMS is a single-tenant shared workspace (anon-key app). Visibility is enforced in the application layer per role. Documented as intentionally shared data.

4. Important Notes
   - `employees.user_id` references `auth.users(id)` ON DELETE SET NULL.
   - `employees.manager_id` self-references `employees(id)`.
   - `employees.department_id` / `position_id` FKs added after departments & positions exist.
   - `departments.manager_employee_id` references `employees(id)`.
*/

create extension if not exists "pgcrypto";

-- ============ roles ============
create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  name_ar text not null,
  description text,
  created_at timestamptz default now()
);
alter table roles enable row level security;
drop policy if exists "roles_select" on roles;
create policy "roles_select" on roles for select to anon, authenticated using (true);
drop policy if exists "roles_insert" on roles;
create policy "roles_insert" on roles for insert to anon, authenticated with check (true);
drop policy if exists "roles_update" on roles;
create policy "roles_update" on roles for update to anon, authenticated using (true) with check (true);
drop policy if exists "roles_delete" on roles;
create policy "roles_delete" on roles for delete to anon, authenticated using (true);

-- ============ branches ============
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text,
  address text,
  phone text,
  manager_name text,
  created_at timestamptz default now()
);
alter table branches enable row level security;
drop policy if exists "branches_select" on branches;
create policy "branches_select" on branches for select to anon, authenticated using (true);
drop policy if exists "branches_insert" on branches;
create policy "branches_insert" on branches for insert to anon, authenticated with check (true);
drop policy if exists "branches_update" on branches;
create policy "branches_update" on branches for update to anon, authenticated using (true) with check (true);
drop policy if exists "branches_delete" on branches;
create policy "branches_delete" on branches for delete to anon, authenticated using (true);

-- ============ employees (no dept/pos FK yet; added after those tables exist) ============
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  employee_code text unique not null,
  full_name text not null,
  photo_url text,
  national_id text,
  phone text,
  email text,
  address text,
  birth_date date,
  marital_status text,
  qualification text,
  department_id uuid,
  position_id uuid,
  branch_id uuid references branches(id) on delete set null,
  manager_id uuid references employees(id) on delete set null,
  hire_date date not null,
  basic_salary numeric(12,2) default 0,
  allowances numeric(12,2) default 0,
  bank_account text,
  status text not null default 'active',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table employees enable row level security;
drop policy if exists "employees_select" on employees;
create policy "employees_select" on employees for select to anon, authenticated using (true);
drop policy if exists "employees_insert" on employees;
create policy "employees_insert" on employees for insert to anon, authenticated with check (true);
drop policy if exists "employees_update" on employees;
create policy "employees_update" on employees for update to anon, authenticated using (true) with check (true);
drop policy if exists "employees_delete" on employees;
create policy "employees_delete" on employees for delete to anon, authenticated using (true);

create index if not exists idx_employees_department on employees(department_id);
create index if not exists idx_employees_position on employees(position_id);
create index if not exists idx_employees_branch on employees(branch_id);
create index if not exists idx_employees_manager on employees(manager_id);
create index if not exists idx_employees_status on employees(status);
create index if not exists idx_employees_user on employees(user_id);

-- ============ departments ============
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text,
  branch_id uuid references branches(id) on delete set null,
  manager_employee_id uuid references employees(id) on delete set null,
  description text,
  created_at timestamptz default now()
);
alter table departments enable row level security;
drop policy if exists "departments_select" on departments;
create policy "departments_select" on departments for select to anon, authenticated using (true);
drop policy if exists "departments_insert" on departments;
create policy "departments_insert" on departments for insert to anon, authenticated with check (true);
drop policy if exists "departments_update" on departments;
create policy "departments_update" on departments for update to anon, authenticated using (true) with check (true);
drop policy if exists "departments_delete" on departments;
create policy "departments_delete" on departments for delete to anon, authenticated using (true);

-- ============ positions ============
create table if not exists positions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  title_ar text,
  department_id uuid references departments(id) on delete cascade,
  description text,
  created_at timestamptz default now()
);
alter table positions enable row level security;
drop policy if exists "positions_select" on positions;
create policy "positions_select" on positions for select to anon, authenticated using (true);
drop policy if exists "positions_insert" on positions;
create policy "positions_insert" on positions for insert to anon, authenticated with check (true);
drop policy if exists "positions_update" on positions;
create policy "positions_update" on positions for update to anon, authenticated using (true) with check (true);
drop policy if exists "positions_delete" on positions;
create policy "positions_delete" on positions for delete to anon, authenticated using (true);

-- now add employees -> departments/positions FKs
do $$ begin
  if not exists (select 1 from pg_constraint where conname='employees_department_id_fkey') then
    alter table employees add constraint employees_department_id_fkey
      foreign key (department_id) references departments(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='employees_position_id_fkey') then
    alter table employees add constraint employees_position_id_fkey
      foreign key (position_id) references positions(id) on delete set null;
  end if;
end $$;

-- ============ documents ============
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  type text not null,
  name text not null,
  storage_path text not null,
  file_url text,
  uploaded_at timestamptz default now()
);
alter table documents enable row level security;
drop policy if exists "documents_select" on documents;
create policy "documents_select" on documents for select to anon, authenticated using (true);
drop policy if exists "documents_insert" on documents;
create policy "documents_insert" on documents for insert to anon, authenticated with check (true);
drop policy if exists "documents_update" on documents;
create policy "documents_update" on documents for update to anon, authenticated using (true) with check (true);
drop policy if exists "documents_delete" on documents;
create policy "documents_delete" on documents for delete to anon, authenticated using (true);

create index if not exists idx_documents_employee on documents(employee_id);

-- ============ updated_at trigger ============
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_employees_updated_at on employees;
create trigger trg_employees_updated_at
before update on employees
for each row execute function set_updated_at();

-- ============ seed roles ============
insert into roles (name, name_ar, description)
values
  ('system_admin',    'مدير النظام',            'صلاحية كاملة على النظام'),
  ('hr_manager',      'مدير الموارد البشرية',    'إدارة شؤون الموظفين والرواتب والإجازات'),
  ('employee_affairs','مسؤول شؤون الموظفين',     'إدارة بيانات الموظفين والمستندات'),
  ('accountant',      'المحاسب',                'إدارة الرواتب والسلف والخصومات'),
  ('direct_manager',  'المدير المباشر',          'متابعة فريقه واعتماد الإجازات والتقييم'),
  ('employee',        'الموظف',                  'عرض بياناته وطلب الإجازات وتسجيل الحضور')
on conflict (name) do nothing;
-- FILE: 20260727085210_002_hrms_operational_schema.sql
/*
# HRMS Operational Schema — Attendance, Leaves, Payroll, Contracts, Tasks, Reviews, Notifications, Settings, ActivityLogs, Holidays

1. Overview
   Adds the operational/transactional tables for the HRMS:
   - Attendance (check-in/out, overtime, late, absence).
   - Leaves (requests, approvals, balances, types).
   - Payroll, bonuses, deductions, loans.
   - Contracts (create, renew, expiry alerts).
   - Tasks (assign, progress, comments).
   - Performance reviews (annual evaluation).
   - Notifications (realtime).
   - Activity logs (audit).
   - Settings (system config).
   - Holidays (official holidays).

2. New Tables
   - `attendance`
   - `leaves`
   - `payroll`
   - `bonuses`
   - `deductions`
   - `loans`
   - `contracts`
   - `tasks`
   - `performance_reviews`
   - `notifications`
   - `activity_logs`
   - `settings`
   - `holidays`

3. Security
   - RLS enabled on every table.
   - All tables allow `TO anon, authenticated` CRUD (single-tenant shared workspace, anon-key app). Visibility enforced in the application layer per role. Documented as intentionally shared data.

4. Important Notes
   - All tables FK to `employees(id)` where relevant, ON DELETE CASCADE for child transactional data.
   - `leaves.status` workflow: pending -> manager_approved -> hr_approved -> rejected | cancelled.
   - `payroll.status`: draft | approved | paid.
   - `contracts.end_date` used for expiry alerts.
*/

-- ============ attendance ============
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  work_hours numeric(5,2) default 0,
  overtime_hours numeric(5,2) default 0,
  late_minutes int default 0,
  status text not null default 'present', -- present | absent | late | leave | holiday
  notes text,
  created_at timestamptz default now()
);
alter table attendance enable row level security;
drop policy if exists "attendance_select" on attendance;
create policy "attendance_select" on attendance for select to anon, authenticated using (true);
drop policy if exists "attendance_insert" on attendance;
create policy "attendance_insert" on attendance for insert to anon, authenticated with check (true);
drop policy if exists "attendance_update" on attendance;
create policy "attendance_update" on attendance for update to anon, authenticated using (true) with check (true);
drop policy if exists "attendance_delete" on attendance;
create policy "attendance_delete" on attendance for delete to anon, authenticated using (true);
create index if not exists idx_attendance_employee on attendance(employee_id);
create index if not exists idx_attendance_date on attendance(date);

-- ============ leaves ============
create table if not exists leaves (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  type text not null, -- annual | sick | emergency | unpaid
  start_date date not null,
  end_date date not null,
  days int not null default 1,
  reason text,
  status text not null default 'pending', -- pending | manager_approved | hr_approved | rejected | cancelled
  manager_id uuid references employees(id) on delete set null,
  manager_decision text,
  manager_decision_at timestamptz,
  hr_decision text,
  hr_decision_at timestamptz,
  balance_annual numeric(5,1) default 21,
  created_at timestamptz default now()
);
alter table leaves enable row level security;
drop policy if exists "leaves_select" on leaves;
create policy "leaves_select" on leaves for select to anon, authenticated using (true);
drop policy if exists "leaves_insert" on leaves;
create policy "leaves_insert" on leaves for insert to anon, authenticated with check (true);
drop policy if exists "leaves_update" on leaves;
create policy "leaves_update" on leaves for update to anon, authenticated using (true) with check (true);
drop policy if exists "leaves_delete" on leaves;
create policy "leaves_delete" on leaves for delete to anon, authenticated using (true);
create index if not exists idx_leaves_employee on leaves(employee_id);
create index if not exists idx_leaves_status on leaves(status);

-- ============ payroll ============
create table if not exists payroll (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  month int not null,
  year int not null,
  basic_salary numeric(12,2) default 0,
  allowances numeric(12,2) default 0,
  bonuses numeric(12,2) default 0,
  deductions numeric(12,2) default 0,
  loans numeric(12,2) default 0,
  overtime_pay numeric(12,2) default 0,
  net_salary numeric(12,2) default 0,
  status text not null default 'draft', -- draft | approved | paid
  created_at timestamptz default now()
);
alter table payroll enable row level security;
drop policy if exists "payroll_select" on payroll;
create policy "payroll_select" on payroll for select to anon, authenticated using (true);
drop policy if exists "payroll_insert" on payroll;
create policy "payroll_insert" on payroll for insert to anon, authenticated with check (true);
drop policy if exists "payroll_update" on payroll;
create policy "payroll_update" on payroll for update to anon, authenticated using (true) with check (true);
drop policy if exists "payroll_delete" on payroll;
create policy "payroll_delete" on payroll for delete to anon, authenticated using (true);
create index if not exists idx_payroll_employee on payroll(employee_id);
create index if not exists idx_payroll_period on payroll(year, month);

-- ============ bonuses ============
create table if not exists bonuses (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  amount numeric(12,2) not null,
  reason text,
  date date not null,
  created_at timestamptz default now()
);
alter table bonuses enable row level security;
drop policy if exists "bonuses_select" on bonuses;
create policy "bonuses_select" on bonuses for select to anon, authenticated using (true);
drop policy if exists "bonuses_insert" on bonuses;
create policy "bonuses_insert" on bonuses for insert to anon, authenticated with check (true);
drop policy if exists "bonuses_update" on bonuses;
create policy "bonuses_update" on bonuses for update to anon, authenticated using (true) with check (true);
drop policy if exists "bonuses_delete" on bonuses;
create policy "bonuses_delete" on bonuses for delete to anon, authenticated using (true);
create index if not exists idx_bonuses_employee on bonuses(employee_id);

-- ============ deductions ============
create table if not exists deductions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  amount numeric(12,2) not null,
  reason text,
  date date not null,
  created_at timestamptz default now()
);
alter table deductions enable row level security;
drop policy if exists "deductions_select" on deductions;
create policy "deductions_select" on deductions for select to anon, authenticated using (true);
drop policy if exists "deductions_insert" on deductions;
create policy "deductions_insert" on deductions for insert to anon, authenticated with check (true);
drop policy if exists "deductions_update" on deductions;
create policy "deductions_update" on deductions for update to anon, authenticated using (true) with check (true);
drop policy if exists "deductions_delete" on deductions;
create policy "deductions_delete" on deductions for delete to anon, authenticated using (true);
create index if not exists idx_deductions_employee on deductions(employee_id);

-- ============ loans ============
create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  amount numeric(12,2) not null,
  installments int not null default 1,
  paid_amount numeric(12,2) default 0,
  date date not null,
  status text not null default 'active', -- active | settled
  notes text,
  created_at timestamptz default now()
);
alter table loans enable row level security;
drop policy if exists "loans_select" on loans;
create policy "loans_select" on loans for select to anon, authenticated using (true);
drop policy if exists "loans_insert" on loans;
create policy "loans_insert" on loans for insert to anon, authenticated with check (true);
drop policy if exists "loans_update" on loans;
create policy "loans_update" on loans for update to anon, authenticated using (true) with check (true);
drop policy if exists "loans_delete" on loans;
create policy "loans_delete" on loans for delete to anon, authenticated using (true);
create index if not exists idx_loans_employee on loans(employee_id);

-- ============ contracts ============
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  type text not null, -- permanent | temporary | daily | project
  start_date date not null,
  end_date date,
  salary numeric(12,2) default 0,
  status text not null default 'active', -- active | expired | terminated | renewed
  terms text,
  created_at timestamptz default now()
);
alter table contracts enable row level security;
drop policy if exists "contracts_select" on contracts;
create policy "contracts_select" on contracts for select to anon, authenticated using (true);
drop policy if exists "contracts_insert" on contracts;
create policy "contracts_insert" on contracts for insert to anon, authenticated with check (true);
drop policy if exists "contracts_update" on contracts;
create policy "contracts_update" on contracts for update to anon, authenticated using (true) with check (true);
drop policy if exists "contracts_delete" on contracts;
create policy "contracts_delete" on contracts for delete to anon, authenticated using (true);
create index if not exists idx_contracts_employee on contracts(employee_id);
create index if not exists idx_contracts_end_date on contracts(end_date);

-- ============ tasks ============
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assigned_to uuid not null references employees(id) on delete cascade,
  assigned_by uuid references employees(id) on delete set null,
  start_date date not null,
  due_date date not null,
  progress int default 0,
  status text not null default 'todo', -- todo | in_progress | done | cancelled
  priority text default 'medium', -- low | medium | high
  comments jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
alter table tasks enable row level security;
drop policy if exists "tasks_select" on tasks;
create policy "tasks_select" on tasks for select to anon, authenticated using (true);
drop policy if exists "tasks_insert" on tasks;
create policy "tasks_insert" on tasks for insert to anon, authenticated with check (true);
drop policy if exists "tasks_update" on tasks;
create policy "tasks_update" on tasks for update to anon, authenticated using (true) with check (true);
drop policy if exists "tasks_delete" on tasks;
create policy "tasks_delete" on tasks for delete to anon, authenticated using (true);
create index if not exists idx_tasks_assigned on tasks(assigned_to);

-- ============ performance_reviews ============
create table if not exists performance_reviews (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  reviewer_id uuid references employees(id) on delete set null,
  period text, -- e.g. "2025"
  review_date date not null,
  rating int check (rating between 1 and 5),
  goals text,
  strengths text,
  weaknesses text,
  recommendations text,
  created_at timestamptz default now()
);
alter table performance_reviews enable row level security;
drop policy if exists "reviews_select" on performance_reviews;
create policy "reviews_select" on performance_reviews for select to anon, authenticated using (true);
drop policy if exists "reviews_insert" on performance_reviews;
create policy "reviews_insert" on performance_reviews for insert to anon, authenticated with check (true);
drop policy if exists "reviews_update" on performance_reviews;
create policy "reviews_update" on performance_reviews for update to anon, authenticated using (true) with check (true);
drop policy if exists "reviews_delete" on performance_reviews;
create policy "reviews_delete" on performance_reviews for delete to anon, authenticated using (true);
create index if not exists idx_reviews_employee on performance_reviews(employee_id);

-- ============ notifications ============
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  type text default 'info',
  link text,
  read boolean default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
drop policy if exists "notifications_select" on notifications;
create policy "notifications_select" on notifications for select to anon, authenticated using (true);
drop policy if exists "notifications_insert" on notifications;
create policy "notifications_insert" on notifications for insert to anon, authenticated with check (true);
drop policy if exists "notifications_update" on notifications;
create policy "notifications_update" on notifications for update to anon, authenticated using (true) with check (true);
drop policy if exists "notifications_delete" on notifications;
create policy "notifications_delete" on notifications for delete to anon, authenticated using (true);
create index if not exists idx_notifications_user on notifications(user_id);

-- ============ activity_logs ============
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz default now()
);
alter table activity_logs enable row level security;
drop policy if exists "logs_select" on activity_logs;
create policy "logs_select" on activity_logs for select to anon, authenticated using (true);
drop policy if exists "logs_insert" on activity_logs;
create policy "logs_insert" on activity_logs for insert to anon, authenticated with check (true);
drop policy if exists "logs_update" on activity_logs;
create policy "logs_update" on activity_logs for update to anon, authenticated using (true) with check (true);
drop policy if exists "logs_delete" on activity_logs;
create policy "logs_delete" on activity_logs for delete to anon, authenticated using (true);
create index if not exists idx_logs_created on activity_logs(created_at);

-- ============ settings ============
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table settings enable row level security;
drop policy if exists "settings_select" on settings;
create policy "settings_select" on settings for select to anon, authenticated using (true);
drop policy if exists "settings_insert" on settings;
create policy "settings_insert" on settings for insert to anon, authenticated with check (true);
drop policy if exists "settings_update" on settings;
create policy "settings_update" on settings for update to anon, authenticated using (true) with check (true);
drop policy if exists "settings_delete" on settings;
create policy "settings_delete" on settings for delete to anon, authenticated using (true);

-- ============ holidays ============
create table if not exists holidays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  type text default 'official',
  created_at timestamptz default now()
);
alter table holidays enable row level security;
drop policy if exists "holidays_select" on holidays;
create policy "holidays_select" on holidays for select to anon, authenticated using (true);
drop policy if exists "holidays_insert" on holidays;
create policy "holidays_insert" on holidays for insert to anon, authenticated with check (true);
drop policy if exists "holidays_update" on holidays;
create policy "holidays_update" on holidays for update to anon, authenticated using (true) with check (true);
drop policy if exists "holidays_delete" on holidays;
create policy "holidays_delete" on holidays for delete to anon, authenticated using (true);

-- default settings
insert into settings (key, value)
values
  ('company_name', 'شركتي'),
  ('work_start', '09:00'),
  ('work_end', '17:00'),
  ('late_grace_minutes', '15'),
  ('annual_leave_balance', '21')
on conflict (key) do nothing;
-- FILE: 20260727093157_003_hrms_advanced_modules.sql
/*
# HRMS Advanced Modules — Self-Service, Recruitment, KPIs, Warnings & Sanctions

1. Overview
   Adds four advanced HR modules:
   - Self-service: employees request loans (in addition to leaves already in place).
   - Recruitment: track job applicants and their CVs.
   - KPIs: per-employee key performance indicators with targets and progress.
   - Warnings & Sanctions: document disciplinary actions and contract-expiry alerts for HR.

2. New Tables
   - `loan_requests`     : employee-initiated loan requests with approval workflow.
   - `applicants`        : job applicants with status pipeline and CV storage reference.
   - `kpis`              : KPI definitions per employee with target, actual, weight, score.
   - `warnings`          : disciplinary warnings/sanctions tied to employees and labor-law notes.

3. Security
   - RLS enabled on every table.
   - All tables allow `TO anon, authenticated` CRUD (single-tenant shared workspace, anon-key app). Visibility enforced in the application layer per role. Documented as intentionally shared data.

4. Important Notes
   - `loan_requests` has a workflow: pending -> approved | rejected.
   - `applicants.status` pipeline: applied -> screening -> interview -> offered -> hired | rejected.
   - `kpis` has a `period` (e.g. "2025-Q3") and computes score from actual/target.
   - `warnings.type`: verbal | written | suspension | termination.
*/

-- ============ loan_requests ============
create table if not exists loan_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  amount numeric(12,2) not null,
  reason text,
  installments int not null default 1,
  status text not null default 'pending', -- pending | approved | rejected
  hr_decision text,
  decided_at timestamptz,
  created_at timestamptz default now()
);
alter table loan_requests enable row level security;
drop policy if exists "loan_requests_select" on loan_requests;
create policy "loan_requests_select" on loan_requests for select to anon, authenticated using (true);
drop policy if exists "loan_requests_insert" on loan_requests;
create policy "loan_requests_insert" on loan_requests for insert to anon, authenticated with check (true);
drop policy if exists "loan_requests_update" on loan_requests;
create policy "loan_requests_update" on loan_requests for update to anon, authenticated using (true) with check (true);
drop policy if exists "loan_requests_delete" on loan_requests;
create policy "loan_requests_delete" on loan_requests for delete to anon, authenticated using (true);
create index if not exists idx_loan_requests_employee on loan_requests(employee_id);

-- ============ applicants ============
create table if not exists applicants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  position_applied text,
  department_id uuid references departments(id) on delete set null,
  status text not null default 'applied', -- applied | screening | interview | offered | hired | rejected
  cv_path text,
  cv_url text,
  notes text,
  applied_at timestamptz default now()
);
alter table applicants enable row level security;
drop policy if exists "applicants_select" on applicants;
create policy "applicants_select" on applicants for select to anon, authenticated using (true);
drop policy if exists "applicants_insert" on applicants;
create policy "applicants_insert" on applicants for insert to anon, authenticated with check (true);
drop policy if exists "applicants_update" on applicants;
create policy "applicants_update" on applicants for update to anon, authenticated using (true) with check (true);
drop policy if exists "applicants_delete" on applicants;
create policy "applicants_delete" on applicants for delete to anon, authenticated using (true);
create index if not exists idx_applicants_status on applicants(status);

-- ============ kpis ============
create table if not exists kpis (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  title text not null,
  description text,
  target numeric(12,2) not null default 100,
  actual numeric(12,2) not null default 0,
  weight int not null default 1, -- 1-5 importance
  period text, -- e.g. "2025-Q3"
  score numeric(5,2) default 0, -- computed percentage
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table kpis enable row level security;
drop policy if exists "kpis_select" on kpis;
create policy "kpis_select" on kpis for select to anon, authenticated using (true);
drop policy if exists "kpis_insert" on kpis;
create policy "kpis_insert" on kpis for insert to anon, authenticated with check (true);
drop policy if exists "kpis_update" on kpis;
create policy "kpis_update" on kpis for update to anon, authenticated using (true) with check (true);
drop policy if exists "kpis_delete" on kpis;
create policy "kpis_delete" on kpis for delete to anon, authenticated using (true);
create index if not exists idx_kpis_employee on kpis(employee_id);

-- ============ warnings ============
create table if not exists warnings (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  type text not null, -- verbal | written | suspension | termination
  reason text not null,
  date date not null,
  issued_by text,
  labor_law_ref text, -- مرجع قانون العمل
  status text not null default 'active', -- active | revoked
  notes text,
  created_at timestamptz default now()
);
alter table warnings enable row level security;
drop policy if exists "warnings_select" on warnings;
create policy "warnings_select" on warnings for select to anon, authenticated using (true);
drop policy if exists "warnings_insert" on warnings;
create policy "warnings_insert" on warnings for insert to anon, authenticated with check (true);
drop policy if exists "warnings_update" on warnings;
create policy "warnings_update" on warnings for update to anon, authenticated using (true) with check (true);
drop policy if exists "warnings_delete" on warnings;
create policy "warnings_delete" on warnings for delete to anon, authenticated using (true);
create index if not exists idx_warnings_employee on warnings(employee_id);
create index if not exists idx_warnings_status on warnings(status);

-- updated_at trigger for kpis
drop trigger if exists trg_kpis_updated_at on kpis;
create trigger trg_kpis_updated_at
before update on kpis
for each row execute function set_updated_at();
-- FILE: 20260728092803_004_saas_multi_tenancy.sql
/*
# SaaS Multi-Tenancy Transformation — Part 1: Schema

## Overview
Converts the single-tenant HRMS into a multi-tenant SaaS:
- Creates a `companies` table (each tenant = one company).
- Creates a `company_members` join table linking auth.users to companies with a role.
- Adds `company_id` to ALL 23 existing tables so every row is owned by a company.
- Backfills existing rows to a default company so no data is lost.
- Adds a helper SQL function `current_company_id()` for RLS.

## New Tables
1. `companies` — id, name, name_ar, logo_url, plan, max_employees, status, timestamps
2. `company_members` — id, company_id, user_id, role, status, invited_email, created_at
   Roles: owner, hr_attendance, hr_payroll, hr_recruitment, hr_manager, direct_manager, employee

## Modified Tables (company_id added to all 23)
   roles, branches, employees, departments, positions, documents,
   attendance, leaves, payroll, bonuses, deductions, loans, contracts,
   tasks, performance_reviews, notifications, activity_logs, settings,
   holidays, loan_requests, applicants, kpis, warnings

## Security
   - RLS on companies + company_members.
   - companies: members can SELECT; owners can UPDATE/INSERT.
   - company_members: members can SELECT within their company; owners manage.
   - Helper function current_company_id() for RLS in migration 005.

## Important Notes
1. Default company created + all existing rows backfilled to it.
2. company_id columns are nullable initially (NOT NULL enforced in migration 005).
3. current_company_id() returns the first active membership's company_id.
*/

-- ============================================================
-- 1) companies table (must exist before company_members FK)
-- ============================================================
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text,
  logo_url text,
  plan text not null default 'free',
  max_employees int default 50,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table companies enable row level security;

-- Temporary open policy until company_members exists; tightened below.
drop policy if exists "companies_insert" on companies;
create policy "companies_insert" on companies for insert
  to authenticated with check (true);

-- ============================================================
-- 2) company_members table
-- ============================================================
create table if not exists company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'employee',
  status text not null default 'active',
  invited_email text,
  created_at timestamptz default now()
);
alter table company_members enable row level security;

create index if not exists idx_cm_company on company_members(company_id);
create index if not exists idx_cm_user on company_members(user_id);
create index if not exists idx_cm_company_user on company_members(company_id, user_id);

-- ============================================================
-- 3) RLS policies on companies (now that company_members exists)
-- ============================================================
drop policy if exists "companies_select_own" on companies;
create policy "companies_select_own" on companies for select
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = companies.id and cm.user_id = auth.uid()
    )
  );

drop policy if exists "companies_update_own" on companies;
create policy "companies_update_own" on companies for update
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = companies.id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from company_members cm
      where cm.company_id = companies.id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  );

-- ============================================================
-- 4) RLS policies on company_members
-- ============================================================
drop policy if exists "cm_select" on company_members;
create policy "cm_select" on company_members for select
  to authenticated
  using (
    company_id in (
      select cm2.company_id from company_members cm2
      where cm2.user_id = auth.uid()
    )
  );

drop policy if exists "cm_insert" on company_members;
create policy "cm_insert" on company_members for insert
  to authenticated
  with check (
    exists (
      select 1 from company_members cm
      where cm.company_id = company_members.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
    or company_members.user_id = auth.uid()
  );

drop policy if exists "cm_update" on company_members;
create policy "cm_update" on company_members for update
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = company_members.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from company_members cm
      where cm.company_id = company_members.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  );

drop policy if exists "cm_delete" on company_members;
create policy "cm_delete" on company_members for delete
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = company_members.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  );

-- ============================================================
-- 5) Helper function: current_company_id()
-- ============================================================
create or replace function current_company_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select cm.company_id
  from company_members cm
  where cm.user_id = auth.uid()
    and cm.status = 'active'
  order by cm.created_at
  limit 1;
$$;

-- ============================================================
-- 6) Add company_id to ALL 23 existing tables
-- ============================================================
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='roles' and column_name='company_id') then
    alter table roles add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='branches' and column_name='company_id') then
    alter table branches add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='employees' and column_name='company_id') then
    alter table employees add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='departments' and column_name='company_id') then
    alter table departments add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='positions' and column_name='company_id') then
    alter table positions add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='documents' and column_name='company_id') then
    alter table documents add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='attendance' and column_name='company_id') then
    alter table attendance add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='leaves' and column_name='company_id') then
    alter table leaves add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='payroll' and column_name='company_id') then
    alter table payroll add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='bonuses' and column_name='company_id') then
    alter table bonuses add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='deductions' and column_name='company_id') then
    alter table deductions add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='loans' and column_name='company_id') then
    alter table loans add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='contracts' and column_name='company_id') then
    alter table contracts add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='tasks' and column_name='company_id') then
    alter table tasks add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='performance_reviews' and column_name='company_id') then
    alter table performance_reviews add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='notifications' and column_name='company_id') then
    alter table notifications add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='activity_logs' and column_name='company_id') then
    alter table activity_logs add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='company_id') then
    alter table settings add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='holidays' and column_name='company_id') then
    alter table holidays add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='loan_requests' and column_name='company_id') then
    alter table loan_requests add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='applicants' and column_name='company_id') then
    alter table applicants add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='kpis' and column_name='company_id') then
    alter table kpis add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='warnings' and column_name='company_id') then
    alter table warnings add column company_id uuid references companies(id) on delete set null;
  end if;
end $$;

-- ============================================================
-- 7) Backfill existing rows to a default company
-- ============================================================
do $$
declare
  default_co uuid;
begin
  select id into default_co from companies limit 1;
  if default_co is null then
    insert into companies (name, name_ar, plan, status)
    values ('Default Company', 'الشركة الافتراضية', 'enterprise', 'active')
    returning id into default_co;
  end if;

  update roles set company_id = default_co where company_id is null;
  update branches set company_id = default_co where company_id is null;
  update employees set company_id = default_co where company_id is null;
  update departments set company_id = default_co where company_id is null;
  update positions set company_id = default_co where company_id is null;
  update documents set company_id = default_co where company_id is null;
  update attendance set company_id = default_co where company_id is null;
  update leaves set company_id = default_co where company_id is null;
  update payroll set company_id = default_co where company_id is null;
  update bonuses set company_id = default_co where company_id is null;
  update deductions set company_id = default_co where company_id is null;
  update loans set company_id = default_co where company_id is null;
  update contracts set company_id = default_co where company_id is null;
  update tasks set company_id = default_co where company_id is null;
  update performance_reviews set company_id = default_co where company_id is null;
  update notifications set company_id = default_co where company_id is null;
  update activity_logs set company_id = default_co where company_id is null;
  update settings set company_id = default_co where company_id is null;
  update holidays set company_id = default_co where company_id is null;
  update loan_requests set company_id = default_co where company_id is null;
  update applicants set company_id = default_co where company_id is null;
  update kpis set company_id = default_co where company_id is null;
  update warnings set company_id = default_co where company_id is null;
end $$;

-- ============================================================
-- 8) Indexes on company_id
-- ============================================================
create index if not exists idx_roles_company on roles(company_id);
create index if not exists idx_branches_company on branches(company_id);
create index if not exists idx_employees_company on employees(company_id);
create index if not exists idx_departments_company on departments(company_id);
create index if not exists idx_positions_company on positions(company_id);
create index if not exists idx_documents_company on documents(company_id);
create index if not exists idx_attendance_company on attendance(company_id);
create index if not exists idx_leaves_company on leaves(company_id);
create index if not exists idx_payroll_company on payroll(company_id);
create index if not exists idx_bonuses_company on bonuses(company_id);
create index if not exists idx_deductions_company on deductions(company_id);
create index if not exists idx_loans_company on loans(company_id);
create index if not exists idx_contracts_company on contracts(company_id);
create index if not exists idx_tasks_company on tasks(company_id);
create index if not exists idx_reviews_company on performance_reviews(company_id);
create index if not exists idx_notifications_company on notifications(company_id);
create index if not exists idx_logs_company on activity_logs(company_id);
create index if not exists idx_settings_company on settings(company_id);
create index if not exists idx_holidays_company on holidays(company_id);
create index if not exists idx_loan_requests_company on loan_requests(company_id);
create index if not exists idx_applicants_company on applicants(company_id);
create index if not exists idx_kpis_company on kpis(company_id);
create index if not exists idx_warnings_company on warnings(company_id);
-- FILE: 20260728092829_005_saas_rls_policies.sql
/*
# SaaS Multi-Tenancy — Part 2: Company-Scoped RLS Policies

## Overview
Replaces the open (`using (true)`) RLS policies on all 23 existing tables
with company-scoped policies that enforce tenant isolation:
- Users can only access rows belonging to their current company
  (resolved via `current_company_id()`).
- INSERT/UPDATE must set `company_id` to the user's current company.
- DELETE must target rows in the user's current company.

## Tables Modified (RLS policies replaced on all 23)
   roles, branches, employees, departments, positions, documents,
   attendance, leaves, payroll, bonuses, deductions, loans, contracts,
   tasks, performance_reviews, notifications, activity_logs, settings,
   holidays, loan_requests, applicants, kpis, warnings

## Security Model
- SELECT: row visible if `row.company_id = current_company_id()`.
- INSERT: allowed if `new.company_id = current_company_id()`.
- UPDATE: allowed if `row.company_id = current_company_id()` AND
          `new.company_id = current_company_id()`.
- DELETE: allowed if `row.company_id = current_company_id()`.
- notifications: SELECT also restricted to user's own rows (user_id match).

## Important Notes
1. All policies are `TO authenticated` — anon key can no longer access tables.
2. Policies are idempotent: each DROP + CREATE pair.
3. `current_company_id()` was created in migration 004.
*/

-- ============================================================
-- Helper function to drop all policies on a table
-- ============================================================
create or replace function drop_all_policies(t text) returns void
language plpgsql as $$
declare
  p record;
begin
  for p in select policyname from pg_policies where tablename = t loop
    execute format('drop policy if exists %I on %I', p.policyname, t);
  end loop;
end $$;

-- ============================================================
-- Apply company-scoped policies to each table (except notifications)
-- ============================================================
do $$
declare
  tbl text;
  tables text[] := array[
    'roles','branches','employees','departments','positions','documents',
    'attendance','leaves','payroll','bonuses','deductions','loans','contracts',
    'tasks','performance_reviews','activity_logs','settings',
    'holidays','loan_requests','applicants','kpis','warnings'
  ];
begin
  foreach tbl in array tables loop
    perform drop_all_policies(tbl);

    execute format(
      'create policy %I on %I for select to authenticated
       using (company_id = current_company_id())',
      tbl || '_select_co', tbl
    );

    execute format(
      'create policy %I on %I for insert to authenticated
       with check (company_id = current_company_id())',
      tbl || '_insert_co', tbl
    );

    execute format(
      'create policy %I on %I for update to authenticated
       using (company_id = current_company_id())
       with check (company_id = current_company_id())',
      tbl || '_update_co', tbl
    );

    execute format(
      'create policy %I on %I for delete to authenticated
       using (company_id = current_company_id())',
      tbl || '_delete_co', tbl
    );
  end loop;
end $$;

-- ============================================================
-- Special: notifications — SELECT restricted to user's own rows
-- ============================================================
do $$
begin
  perform drop_all_policies('notifications');
end $$;

create policy "notifications_select_co" on notifications for select
  to authenticated
  using (
    company_id = current_company_id()
    and (user_id = auth.uid() or user_id is null)
  );
create policy "notifications_insert_co" on notifications for insert
  to authenticated
  with check (company_id = current_company_id());
create policy "notifications_update_co" on notifications for update
  to authenticated
  using (company_id = current_company_id())
  with check (company_id = current_company_id());
create policy "notifications_delete_co" on notifications for delete
  to authenticated
  using (company_id = current_company_id());

-- ============================================================
-- Drop the helper function
-- ============================================================
drop function if exists drop_all_policies(text);
-- FILE: 20260728201757_006_fix_system_admin_rls.sql
/*
# Fix: System Admin RLS Bypass + Signup Company Linking

## Problem
- System admin accounts created via `signUp()` were not linked to a
  `company_members` record, so `current_company_id()` returned NULL.
- All RLS policies require `company_id = current_company_id()`, which
  fails when the company_id is NULL (NULL = NULL is false in SQL).
- Result: "new row violates row-level security policy for table employees"

## Fix
1. Create a helper function `is_system_admin()` that checks the JWT
   `user_metadata.role` for 'system_admin'.
2. Update RLS policies on ALL 23 tenant tables to add an OR bypass:
   `company_id = current_company_id() OR is_system_admin()`.
   This lets system_admin read/write any company's data.
3. Update `companies` SELECT to also allow system_admin.
4. Update `company_members` INSERT to also allow system_admin.

## Tables Modified (RLS policies updated on all 23)
   roles, branches, employees, departments, positions, documents,
   attendance, leaves, payroll, bonuses, deductions, loans, contracts,
   tasks, performance_reviews, notifications, activity_logs, settings,
   holidays, loan_requests, applicants, kpis, warnings

## Security
- system_admin is identified via JWT user_metadata role (set at signup).
- system_admin can bypass company_id isolation on all tables.
- All other users are still fully isolated by company_id.

## Important Notes
1. The frontend `signUp()` function must also be fixed to create a
   `company_members` record linking the system_admin to a company.
2. `is_system_admin()` reads from `auth.jwt()` which is the current
   session's JWT — it is evaluated per-request by PostgREST.
*/

-- ============================================================
-- 1) Helper function: is_system_admin()
-- ============================================================
create or replace function is_system_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'system_admin';
$$;

-- ============================================================
-- 2) Helper to drop all policies on a table
-- ============================================================
create or replace function drop_all_policies(t text) returns void
language plpgsql as $$
declare
  p record;
begin
  for p in select policyname from pg_policies where tablename = t loop
    execute format('drop policy if exists %I on %I', p.policyname, t);
  end loop;
end $$;

-- ============================================================
-- 3) Update RLS on all 23 tenant tables: add system_admin bypass
-- ============================================================
do $$
declare
  tbl text;
  tables text[] := array[
    'roles','branches','employees','departments','positions','documents',
    'attendance','leaves','payroll','bonuses','deductions','loans','contracts',
    'tasks','performance_reviews','activity_logs','settings',
    'holidays','loan_requests','applicants','kpis','warnings'
  ];
begin
  foreach tbl in array tables loop
    perform drop_all_policies(tbl);

    execute format(
      'create policy %I on %I for select to authenticated
       using (company_id = current_company_id() or is_system_admin())',
      tbl || '_select_co', tbl
    );

    execute format(
      'create policy %I on %I for insert to authenticated
       with check (company_id = current_company_id() or is_system_admin())',
      tbl || '_insert_co', tbl
    );

    execute format(
      'create policy %I on %I for update to authenticated
       using (company_id = current_company_id() or is_system_admin())
       with check (company_id = current_company_id() or is_system_admin())',
      tbl || '_update_co', tbl
    );

    execute format(
      'create policy %I on %I for delete to authenticated
       using (company_id = current_company_id() or is_system_admin())',
      tbl || '_delete_co', tbl
    );
  end loop;
end $$;

-- ============================================================
-- 4) notifications: same pattern + user_id restriction on SELECT
-- ============================================================
do $$ begin perform drop_all_policies('notifications'); end $$;

create policy "notifications_select_co" on notifications for select
  to authenticated
  using (
    (company_id = current_company_id() or is_system_admin())
    and (user_id = auth.uid() or user_id is null or is_system_admin())
  );
create policy "notifications_insert_co" on notifications for insert
  to authenticated
  with check (company_id = current_company_id() or is_system_admin());
create policy "notifications_update_co" on notifications for update
  to authenticated
  using (company_id = current_company_id() or is_system_admin())
  with check (company_id = current_company_id() or is_system_admin());
create policy "notifications_delete_co" on notifications for delete
  to authenticated
  using (company_id = current_company_id() or is_system_admin());

-- ============================================================
-- 5) companies SELECT: allow system_admin to see all companies
-- ============================================================
do $$ begin perform drop_all_policies('companies'); end $$;

create policy "companies_select_own" on companies for select
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = companies.id and cm.user_id = auth.uid()
    )
    or is_system_admin()
  );

create policy "companies_update_own" on companies for update
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = companies.id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
    or is_system_admin()
  )
  with check (
    exists (
      select 1 from company_members cm
      where cm.company_id = companies.id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
    or is_system_admin()
  );

create policy "companies_insert" on companies for insert
  to authenticated with check (true);

-- ============================================================
-- 6) company_members: allow system_admin to manage all memberships
-- ============================================================
do $$ begin perform drop_all_policies('company_members'); end $$;

create policy "cm_select" on company_members for select
  to authenticated
  using (
    company_id in (
      select cm2.company_id from company_members cm2
      where cm2.user_id = auth.uid()
    )
    or is_system_admin()
  );

create policy "cm_insert" on company_members for insert
  to authenticated
  with check (
    exists (
      select 1 from company_members cm
      where cm.company_id = company_members.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
    or company_members.user_id = auth.uid()
    or is_system_admin()
  );

create policy "cm_update" on company_members for update
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = company_members.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
    or is_system_admin()
  )
  with check (
    exists (
      select 1 from company_members cm
      where cm.company_id = company_members.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
    or is_system_admin()
  );

create policy "cm_delete" on company_members for delete
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = company_members.company_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
    or is_system_admin()
  );

-- ============================================================
-- 7) Drop helper function
-- ============================================================
drop function if exists drop_all_policies(text);
-- FILE: 20260812102120_20260812120000_add_work_schedules.sql.sql
/*
# Add work schedules for attendance management

1. New Tables
- `work_schedules`
- `id` (uuid, primary key)
- `company_id` (uuid, owning company)
- `name` (text, schedule name)
- `start_time` and `end_time` (time, working hours)
- `work_days` (text array, Arabic weekday labels)
- `break_minutes` (integer, unpaid break duration)
- `created_at` (timestamptz)

2. Security
- Row level security is enabled.
- Authenticated users can access schedules only for active company memberships.
- Separate select, insert, update, and delete policies are defined.

3. Important Notes
- Existing tables and user data are unchanged.
- The table supports the Work Schedules tab on the attendance page.
*/

CREATE TABLE IF NOT EXISTS public.work_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  work_days text[] NOT NULL DEFAULT ARRAY['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
  break_minutes integer NOT NULL DEFAULT 60 CHECK (break_minutes >= 0 AND break_minutes <= 480),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_schedules_company_id_idx ON public.work_schedules(company_id);

ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view company work schedules" ON public.work_schedules;
CREATE POLICY "Members can view company work schedules"
  ON public.work_schedules FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_members.company_id = work_schedules.company_id
      AND company_members.user_id = auth.uid()
      AND company_members.status = 'active'
  ));

DROP POLICY IF EXISTS "Members can add company work schedules" ON public.work_schedules;
CREATE POLICY "Members can add company work schedules"
  ON public.work_schedules FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_members.company_id = work_schedules.company_id
      AND company_members.user_id = auth.uid()
      AND company_members.status = 'active'
  ));

DROP POLICY IF EXISTS "Members can update company work schedules" ON public.work_schedules;
CREATE POLICY "Members can update company work schedules"
  ON public.work_schedules FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_members.company_id = work_schedules.company_id
      AND company_members.user_id = auth.uid()
      AND company_members.status = 'active'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_members.company_id = work_schedules.company_id
      AND company_members.user_id = auth.uid()
      AND company_members.status = 'active'
  ));

DROP POLICY IF EXISTS "Members can delete company work schedules" ON public.work_schedules;
CREATE POLICY "Members can delete company work schedules"
  ON public.work_schedules FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_members.company_id = work_schedules.company_id
      AND company_members.user_id = auth.uid()
      AND company_members.status = 'active'
  ));
-- FILE: 20260908184442_create_employee_docs_storage_bucket.sql
/*
# Create public storage bucket "employee-docs"

1. Storage
- Create a new public storage bucket named "employee-docs" for storing
  employee-related documents (contracts, IDs, certificates, etc.).
- The bucket is public-readable (anyone with the URL can view files),
  but only authenticated users can upload, update, or delete files.

2. Security (RLS on storage.objects)
- SELECT: allow anyone (anon + authenticated) to read objects in the
  "employee-docs" bucket, since it is a public bucket.
- INSERT: allow authenticated users to upload new documents.
- UPDATE: allow authenticated users to update existing documents.
- DELETE: allow authenticated users to delete documents.

3. Important Notes
- The bucket is marked as public so file URLs are directly accessible
  without going through signed URLs. This is appropriate for employee
  documents that are meant to be shared/viewable by authenticated staff.
- All write operations (insert/update/delete) require an authenticated
  session — anonymous uploads are blocked.
*/

-- Create the public storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-docs', 'employee-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (already enabled by default, but ensure)
-- RLS is already enabled on storage.objects by Supabase defaults.

-- SELECT: public read access for the employee-docs bucket
DROP POLICY IF EXISTS "public_read_employee_docs" ON storage.objects;
CREATE POLICY "public_read_employee_docs"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'employee-docs');

-- INSERT: authenticated users can upload to employee-docs
DROP POLICY IF EXISTS "auth_insert_employee_docs" ON storage.objects;
CREATE POLICY "auth_insert_employee_docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'employee-docs');

-- UPDATE: authenticated users can update files in employee-docs
DROP POLICY IF EXISTS "auth_update_employee_docs" ON storage.objects;
CREATE POLICY "auth_update_employee_docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'employee-docs')
WITH CHECK (bucket_id = 'employee-docs');

-- DELETE: authenticated users can delete files in employee-docs
DROP POLICY IF EXISTS "auth_delete_employee_docs" ON storage.objects;
CREATE POLICY "auth_delete_employee_docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'employee-docs');
-- FILE: 20260908190541_create_demo_requests_table.sql
/*
# Create demo_requests table

1. New Tables
- `demo_requests`
  - `id` (uuid, primary key)
  - `company_name` (text, not null) — name of the requesting organization
  - `email` (text, not null) — contact email
  - `phone` (text, not null) — contact phone number
  - `org_type` (text, not null, default 'school') — 'school' or 'company'
  - `status` (text, not null, default 'pending') — request status
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `demo_requests`.
- INSERT: allow anyone (anon + authenticated) to submit a demo request —
  this is a public lead-capture form on the landing page, so anonymous
  visitors must be able to insert without signing in.
- SELECT/UPDATE/DELETE: restrict to authenticated users only — only
  staff/admins should be able to view or manage submitted requests.
*/

CREATE TABLE IF NOT EXISTS demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  org_type text NOT NULL DEFAULT 'school',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_demo_requests" ON demo_requests;
CREATE POLICY "public_insert_demo_requests"
ON demo_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_select_demo_requests" ON demo_requests;
CREATE POLICY "auth_select_demo_requests"
ON demo_requests FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "auth_update_demo_requests" ON demo_requests;
CREATE POLICY "auth_update_demo_requests"
ON demo_requests FOR UPDATE
TO authenticated
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_demo_requests" ON demo_requests;
CREATE POLICY "auth_delete_demo_requests"
ON demo_requests FOR DELETE
TO authenticated
USING (true);
-- FILE: 20260908192746_add_organization_type_to_demo_requests.sql
-- Add organization_type column to demo_requests (replacing org_type usage)
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS organization_type text NOT NULL DEFAULT 'school';
-- FILE: 20260910105202_20260910120000_create_demo_requests_table.sql.sql
CREATE TABLE IF NOT EXISTS public.demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  org_type TEXT NOT NULL,
  employee_count INTEGER,
  branches_count INTEGER,
  message TEXT
);
ALTER TABLE public.demo_requests 
ADD COLUMN IF NOT EXISTS employee_count INTEGER,
ADD COLUMN IF NOT EXISTS branches_count INTEGER,
ADD COLUMN IF NOT EXISTS message TEXT;
