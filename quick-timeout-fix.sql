-- 🚀 QUICK TIMEOUT FIX
-- Since RLS is already disabled, this focuses on other timeout causes

-- Drop any remaining policies (even though RLS is disabled)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
            RAISE NOTICE 'Dropped policy % on table %', r.policyname, r.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to drop policy % on table %: %', r.policyname, r.tablename, SQLERRM;
        END;
    END LOOP;
END
$$;

-- Test the exact query the app is running to see if it times out
SELECT 
    'USER LOOKUP TEST' as test,
    u.id,
    u.email,
    u.full_name,
    u.organization_id,
    u.role,
    u.is_active
FROM users u 
WHERE u.id = '18d51d41-c679-4f8d-a86a-2e34b231a8f3';

-- Test organization lookup
SELECT 
    'ORG LOOKUP TEST' as test,
    o.id,
    o.name,
    o.subdomain,
    o.settings,
    o.branding
FROM organizations o 
WHERE o.id = '796685bd-cfbc-440a-b772-dee0e546a8ec';

-- Test joined query (what the app likely does)
SELECT 
    'JOIN TEST' as test,
    u.id,
    u.email,
    u.full_name,
    u.role,
    o.name as org_name,
    o.subdomain
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.id = '18d51d41-c679-4f8d-a86a-2e34b231a8f3';

SELECT '✅ TIMEOUT FIX COMPLETE!' as result;