-- Temporary fix: Disable RLS for freelancers table
-- Use this if the proper RLS policies are still causing issues
-- WARNING: This removes security restrictions, use only for development/testing

-- Disable RLS on freelancers table temporarily
ALTER TABLE public.freelancers DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "freelancers_insert_policy" ON public.freelancers;
DROP POLICY IF EXISTS "freelancers_select_policy" ON public.freelancers;
DROP POLICY IF EXISTS "freelancers_update_policy" ON public.freelancers;
DROP POLICY IF EXISTS "freelancers_delete_policy" ON public.freelancers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.freelancers;
DROP POLICY IF EXISTS "Enable read access for organization members" ON public.freelancers;
DROP POLICY IF EXISTS "Enable update for organization members" ON public.freelancers;
DROP POLICY IF EXISTS "Enable delete for organization members" ON public.freelancers;
DROP POLICY IF EXISTS "Authenticated users can create freelancers" ON public.freelancers;
DROP POLICY IF EXISTS "Organization members can view freelancers" ON public.freelancers;
DROP POLICY IF EXISTS "Organization members can update freelancers" ON public.freelancers;
DROP POLICY IF EXISTS "Organization members can delete freelancers" ON public.freelancers;

-- Grant full access to authenticated users
GRANT ALL ON public.freelancers TO authenticated;
GRANT ALL ON public.freelancers TO anon;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'freelancers';

-- This should return 'f' (false) for rowsecurity if RLS is disabled