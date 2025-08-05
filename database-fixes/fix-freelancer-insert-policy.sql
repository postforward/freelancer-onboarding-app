-- Fix the INSERT policy for freelancers table
-- The previous policy didn't properly set the WITH CHECK clause

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "freelancers_insert_policy" ON public.freelancers;

-- Recreate the INSERT policy with proper syntax
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

-- Alternative approach: More permissive INSERT policy if the above still doesn't work
-- Uncomment the following if you're still having issues:

/*
-- Drop the restrictive policy and create a more permissive one
DROP POLICY IF EXISTS "freelancers_insert_policy" ON public.freelancers;

CREATE POLICY "freelancers_insert_policy" ON public.freelancers
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);  -- Allow all authenticated users to insert
*/

-- Verify the policy was created correctly
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'freelancers' 
    AND policyname = 'freelancers_insert_policy';

-- Test query to verify the organization lookup works
-- This should return your organization_id if everything is set up correctly
SELECT 
    'Test organization lookup:' as test_type,
    auth.uid() as current_user,
    u.organization_id
FROM public.users u 
WHERE u.id = auth.uid();