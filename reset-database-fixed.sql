-- 🔄 COMPLETE DATABASE RESET AND FRESH SETUP (FIXED)
-- This script will completely reset the database and set up fresh seed data

-- ==============================================================================
-- 🚨 STEP 1: DROP ALL EXISTING RLS POLICIES DYNAMICALLY
-- ==============================================================================

-- This will generate and execute DROP statements for all existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all existing RLS policies on all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Dropped policy % on table %', r.policyname, r.tablename;
    END LOOP;
END
$$;

-- ==============================================================================
-- 🚨 STEP 2: CLEAR ALL EXISTING DATA
-- ==============================================================================

-- Temporarily disable RLS to allow deletion
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS platforms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS freelancers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS freelancer_platforms DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;

-- Delete all data from tables (in correct order due to foreign keys)
DELETE FROM audit_logs;
DELETE FROM freelancer_platforms;
DELETE FROM freelancers;
DELETE FROM platforms;
DELETE FROM users;
DELETE FROM organizations;

-- Clear Supabase Auth users (WARNING: This will log out all users)
DELETE FROM auth.users;

-- Re-enable RLS
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS freelancer_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

-- Verify all tables are empty
SELECT 'ORGANIZATIONS' as table_name, COUNT(*) as record_count FROM organizations
UNION ALL
SELECT 'USERS' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'PLATFORMS' as table_name, COUNT(*) as record_count FROM platforms
UNION ALL
SELECT 'FREELANCERS' as table_name, COUNT(*) as record_count FROM freelancers
UNION ALL
SELECT 'AUTH_USERS' as table_name, COUNT(*) as record_count FROM auth.users;

-- ==============================================================================
-- 🔒 STEP 3: CREATE FRESH RLS POLICIES
-- ==============================================================================

-- Organizations policies
CREATE POLICY "authenticated_users_read_organizations" ON organizations
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_create_organizations" ON organizations  
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "org_members_update_organization" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.organization_id = organizations.id
            AND users.role IN ('owner', 'admin')
        )
    );

-- Users policies
CREATE POLICY "users_read_own_profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_read_org_members" ON users
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "authenticated_users_create_profile" ON users
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "admins_manage_org_users" ON users
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Platforms policies
CREATE POLICY "org_members_read_platforms" ON platforms
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "admins_manage_platforms" ON platforms
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Freelancers policies
CREATE POLICY "org_members_read_freelancers" ON freelancers
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "org_members_manage_freelancers" ON freelancers
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Freelancer platforms policies
CREATE POLICY "org_members_read_freelancer_platforms" ON freelancer_platforms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM freelancers f
            JOIN users u ON u.organization_id = f.organization_id
            WHERE f.id = freelancer_platforms.freelancer_id
            AND u.id = auth.uid()
        )
    );

CREATE POLICY "org_members_manage_freelancer_platforms" ON freelancer_platforms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM freelancers f
            JOIN users u ON u.organization_id = f.organization_id
            WHERE f.id = freelancer_platforms.freelancer_id
            AND u.id = auth.uid()
        )
    );

-- Audit logs policies
CREATE POLICY "org_members_read_audit_logs" ON audit_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "system_insert_audit_logs" ON audit_logs
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- ==============================================================================
-- 🌱 STEP 4: CREATE FRESH SEED DATA
-- ==============================================================================

-- Create default demo organization (for testing)
INSERT INTO organizations (
    id,
    name,
    subdomain,
    created_at,
    updated_at,
    settings,
    branding,
    subscription_tier,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Demo Company',
    'demo',
    now(),
    now(),
    '{"features": {"platform_management": true, "freelancer_management": true, "team_management": true}}',
    '{
        "company_name": "Demo Company",
        "colors": {
            "primary": "#4f46e5",
            "secondary": "#059669", 
            "accent": "#dc2626",
            "neutral": "#6b7280"
        }
    }',
    'free',
    true
);

-- Create default platform configurations
INSERT INTO platforms (
    id,
    organization_id,
    platform_id,
    display_name,
    category,
    config,
    is_enabled,
    created_at,
    updated_at
) VALUES 
-- Parsec platform
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'parsec',
    'Parsec Teams',
    'screen-sharing',
    '{"apiKey": "", "teamId": ""}',
    false,
    now(),
    now()
),
-- Monday.com platform
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    'monday',
    'Monday.com',
    'collaboration',
    '{"apiToken": "", "workspaceId": ""}',
    false,
    now(),
    now()
);

-- ==============================================================================
-- 🔍 STEP 5: VERIFY FRESH SETUP
-- ==============================================================================

-- Show all current RLS policies
SELECT 
    'CURRENT RLS POLICIES' as type,
    schemaname,
    tablename,
    policyname,
    cmd as policy_type
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Show seed data created  
SELECT 'ORGANIZATIONS CREATED' as status, COUNT(*) as count FROM organizations;
SELECT 'PLATFORMS CREATED' as status, COUNT(*) as count FROM platforms;

-- Show the demo organization
SELECT 
    'DEMO ORGANIZATION' as type,
    id,
    name,
    subdomain,
    subscription_tier,
    is_active
FROM organizations;

-- Show platform configurations
SELECT 
    'PLATFORM CONFIGS' as type,
    platform_id,
    display_name,
    category,
    is_enabled
FROM platforms;

-- Success message
SELECT '✅ DATABASE RESET COMPLETE! All old policies dropped and fresh setup ready.' as result;