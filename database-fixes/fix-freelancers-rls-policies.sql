-- Fix RLS policies for freelancers table to allow proper insertion
-- This script addresses the RLS policy violation when creating new freelancers

-- First, check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'freelancers';

-- Drop existing problematic policies for freelancers
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.freelancers;
DROP POLICY IF EXISTS "Enable read access for organization members" ON public.freelancers;
DROP POLICY IF EXISTS "Enable update for organization members" ON public.freelancers;
DROP POLICY IF EXISTS "Enable delete for organization members" ON public.freelancers;
DROP POLICY IF EXISTS "Authenticated users can create freelancers" ON public.freelancers;
DROP POLICY IF EXISTS "Organization members can view freelancers" ON public.freelancers;
DROP POLICY IF EXISTS "Organization members can update freelancers" ON public.freelancers;
DROP POLICY IF EXISTS "Organization members can delete freelancers" ON public.freelancers;

-- Create comprehensive RLS policies for freelancers table
-- Policy 1: Allow authenticated users to insert freelancers for their organization
CREATE POLICY "freelancers_insert_policy" ON public.freelancers
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.users 
            WHERE id = auth.uid()
        )
    );

-- Policy 2: Allow users to view freelancers from their organization
CREATE POLICY "freelancers_select_policy" ON public.freelancers
    FOR SELECT 
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.users 
            WHERE id = auth.uid()
        )
    );

-- Policy 3: Allow users to update freelancers from their organization
CREATE POLICY "freelancers_update_policy" ON public.freelancers
    FOR UPDATE 
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.users 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.users 
            WHERE id = auth.uid()
        )
    );

-- Policy 4: Allow users to delete freelancers from their organization
CREATE POLICY "freelancers_delete_policy" ON public.freelancers
    FOR DELETE 
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.users 
            WHERE id = auth.uid()
        )
    );

-- Ensure RLS is enabled on the freelancers table
ALTER TABLE public.freelancers ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.freelancers TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'freelancers'
ORDER BY policyname;

-- Test the policies by checking if a user can access their organization's data
-- This should return data if the policies are working correctly
-- (Replace 'your-user-id' with actual user ID for testing)
/*
SELECT f.*, u.organization_id as user_org_id
FROM public.freelancers f
CROSS JOIN public.users u 
WHERE u.id = auth.uid()
LIMIT 5;
*/