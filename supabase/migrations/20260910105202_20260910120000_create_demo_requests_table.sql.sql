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
