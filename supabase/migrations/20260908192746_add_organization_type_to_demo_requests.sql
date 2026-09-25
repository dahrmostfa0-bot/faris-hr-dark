-- Add organization_type column to demo_requests (replacing org_type usage)
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS organization_type text NOT NULL DEFAULT 'school';
