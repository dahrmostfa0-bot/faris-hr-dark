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
