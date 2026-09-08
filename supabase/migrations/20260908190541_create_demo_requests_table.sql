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
