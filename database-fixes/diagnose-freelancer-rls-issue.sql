-- Diagnostic script for freelancer RLS issues
-- This will help us understand what's going wrong with the INSERT policy

-- 1. Check the current user authentication
SELECT 
    'Current auth status:' as check_type,
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 2. Check if the current user exists in the users table
SELECT 
    'User lookup:' as check_type,
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.organization_id,
    u.role
FROM public.users u 
WHERE u.id = auth.uid();

-- 3. Check the exact policy definitions
SELECT 
    'Policy details:' as check_type,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'freelancers'
ORDER BY cmd, policyname;

-- 4. Test the organization lookup that the policy uses
SELECT 
    'Organization lookup test:' as check_type,
    organization_id 
FROM public.users 
WHERE id = auth.uid();

-- 5. Check if there are any other constraints on the freelancers table
SELECT 
    'Table constraints:' as check_type,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.freelancers'::regclass;

-- 6. Check the table structure
SELECT 
    'Table structure:' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'freelancers' 
    AND table_schema = 'public'
ORDER BY ordinal_position;