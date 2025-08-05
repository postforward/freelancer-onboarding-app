-- 🔍 DEBUG CURRENT DATABASE STATE
-- Run this to see what's currently in the database

-- Check auth users
SELECT 'AUTH USERS' as type, id, email, created_at, email_confirmed_at FROM auth.users ORDER BY created_at DESC;

-- Check database users
SELECT 'DB USERS' as type, id, email, full_name, organization_id, role, is_active FROM users ORDER BY created_at DESC;

-- Check organizations
SELECT 'ORGANIZATIONS' as type, id, name, subdomain, is_active FROM organizations ORDER BY created_at DESC;

-- Check RLS status
SELECT 
    'RLS STATUS' as check,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'organizations');

-- Check policies
SELECT 
    'POLICIES' as type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test a simple query that might be timing out
SELECT 'SIMPLE QUERY TEST' as test, COUNT(*) as user_count FROM users;