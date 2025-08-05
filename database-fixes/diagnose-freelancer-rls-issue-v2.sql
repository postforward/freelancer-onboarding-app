-- Diagnostic script for freelancer RLS issues (works with current schema)
-- This will help us understand what's going wrong with the INSERT policy

-- 1. Check the current user authentication
SELECT 
    'Current auth status:' as check_type,
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 2. Check the current users table structure first
SELECT 
    'Users table structure:' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if the current user exists in the users table (using existing schema)
SELECT 
    'User lookup:' as check_type,
    u.id,
    u.email,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') 
        THEN u.full_name 
        ELSE CONCAT(u.first_name, ' ', u.last_name)
    END as display_name,
    u.organization_id,
    u.role
FROM public.users u 
WHERE u.id = auth.uid();

-- 4. Check the exact policy definitions
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

-- 5. Test the organization lookup that the policy uses
SELECT 
    'Organization lookup test:' as check_type,
    organization_id 
FROM public.users 
WHERE id = auth.uid();

-- 6. Check freelancers table structure
SELECT 
    'Freelancers table structure:' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'freelancers' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Check if there are any other constraints on the freelancers table
SELECT 
    'Table constraints:' as check_type,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.freelancers'::regclass;

-- 8. Test if we can query both tables (this tests basic permissions)
SELECT 
    'Permission test:' as check_type,
    COUNT(*) as user_count
FROM public.users;

SELECT 
    'Permission test:' as check_type,
    COUNT(*) as freelancer_count
FROM public.freelancers;