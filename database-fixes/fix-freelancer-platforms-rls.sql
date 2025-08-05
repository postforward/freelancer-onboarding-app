-- Fix RLS policies for freelancer_platforms table
-- This addresses the 400 Bad Request error when creating platform associations

-- First, check current policies on freelancer_platforms
SELECT 
    'Current freelancer_platforms policies:' as info,
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'freelancer_platforms';

-- Check the table structure
SELECT 
    'freelancer_platforms table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'freelancer_platforms' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop existing problematic policies for freelancer_platforms
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.freelancer_platforms;
DROP POLICY IF EXISTS "Enable read access for organization members" ON public.freelancer_platforms;
DROP POLICY IF EXISTS "Enable update for organization members" ON public.freelancer_platforms;
DROP POLICY IF EXISTS "Enable delete for organization members" ON public.freelancer_platforms;
DROP POLICY IF EXISTS "Authenticated users can create freelancer_platforms" ON public.freelancer_platforms;
DROP POLICY IF EXISTS "Organization members can view freelancer_platforms" ON public.freelancer_platforms;
DROP POLICY IF EXISTS "Organization members can update freelancer_platforms" ON public.freelancer_platforms;
DROP POLICY IF EXISTS "Organization members can delete freelancer_platforms" ON public.freelancer_platforms;

-- Create comprehensive RLS policies for freelancer_platforms table
-- Policy 1: Allow authenticated users to insert freelancer_platforms for freelancers in their organization
CREATE POLICY "freelancer_platforms_insert_policy" ON public.freelancer_platforms
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        freelancer_id IN (
            SELECT f.id 
            FROM public.freelancers f
            JOIN public.users u ON f.organization_id = u.organization_id
            WHERE u.id = auth.uid()
        )
    );

-- Policy 2: Allow users to view freelancer_platforms for freelancers in their organization
CREATE POLICY "freelancer_platforms_select_policy" ON public.freelancer_platforms
    FOR SELECT 
    TO authenticated
    USING (
        freelancer_id IN (
            SELECT f.id 
            FROM public.freelancers f
            JOIN public.users u ON f.organization_id = u.organization_id
            WHERE u.id = auth.uid()
        )
    );

-- Policy 3: Allow users to update freelancer_platforms for freelancers in their organization
CREATE POLICY "freelancer_platforms_update_policy" ON public.freelancer_platforms
    FOR UPDATE 
    TO authenticated
    USING (
        freelancer_id IN (
            SELECT f.id 
            FROM public.freelancers f
            JOIN public.users u ON f.organization_id = u.organization_id
            WHERE u.id = auth.uid()
        )
    )
    WITH CHECK (
        freelancer_id IN (
            SELECT f.id 
            FROM public.freelancers f
            JOIN public.users u ON f.organization_id = u.organization_id
            WHERE u.id = auth.uid()
        )
    );

-- Policy 4: Allow users to delete freelancer_platforms for freelancers in their organization
CREATE POLICY "freelancer_platforms_delete_policy" ON public.freelancer_platforms
    FOR DELETE 
    TO authenticated
    USING (
        freelancer_id IN (
            SELECT f.id 
            FROM public.freelancers f
            JOIN public.users u ON f.organization_id = u.organization_id
            WHERE u.id = auth.uid()
        )
    );

-- Ensure RLS is enabled on the freelancer_platforms table
ALTER TABLE public.freelancer_platforms ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.freelancer_platforms TO authenticated;

-- Verify the policies were created
SELECT 
    'New freelancer_platforms policies:' as info,
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'freelancer_platforms'
ORDER BY policyname;

-- Test query to verify the policy logic works
-- This should return freelancers that the current user can manage
SELECT 
    'Test - Manageable freelancers:' as info,
    f.id as freelancer_id,
    f.email,
    f.first_name,
    f.last_name,
    f.organization_id,
    u.organization_id as user_org_id
FROM public.freelancers f
JOIN public.users u ON f.organization_id = u.organization_id
WHERE u.id = auth.uid()
LIMIT 5;