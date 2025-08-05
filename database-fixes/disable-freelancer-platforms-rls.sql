-- Nuclear option: Disable RLS for freelancer_platforms table
-- Use this if the proper RLS policies are still causing issues

-- Disable RLS on freelancer_platforms table
ALTER TABLE public.freelancer_platforms DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'freelancer_platforms'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.freelancer_platforms';
    END LOOP;
END $$;

-- Grant full access to authenticated users
GRANT ALL ON public.freelancer_platforms TO authenticated;
GRANT ALL ON public.freelancer_platforms TO anon;

-- Verify RLS is disabled
SELECT 
    'RLS Status:' as info,
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'freelancer_platforms';

-- Verify no policies remain
SELECT 
    'Remaining policies:' as info,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'freelancer_platforms';