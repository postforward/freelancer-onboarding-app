-- 🔄 COMPLETE DATABASE RESET AND FRESH SETUP
-- This script will completely reset the database and set up fresh seed data

-- ==============================================================================
-- 🚨 STEP 1: CLEAR ALL EXISTING DATA
-- ==============================================================================

-- Temporarily disable RLS to allow deletion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE platforms DISABLE ROW LEVEL SECURITY;
ALTER TABLE freelancers DISABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_platforms DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

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
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

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
-- 🔒 STEP 2: SET UP PROPER RLS POLICIES
-- ==============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Owners and admins can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can view organization members" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can create their own profile" ON users;
DROP POLICY IF EXISTS "Admins can create users in their organization" ON users;
DROP POLICY IF EXISTS "Admins can update users in their organization" ON users;
DROP POLICY IF EXISTS "Admins can delete users in their organization" ON users;
DROP POLICY IF EXISTS "Users can view organization platforms" ON platforms;
DROP POLICY IF EXISTS "Admins can manage organization platforms" ON platforms;
DROP POLICY IF EXISTS "Users can view organization freelancers" ON freelancers;
DROP POLICY IF EXISTS "Users can create organization freelancers" ON freelancers;
DROP POLICY IF EXISTS "Users can update organization freelancers" ON freelancers;
DROP POLICY IF EXISTS "Admins can delete organization freelancers" ON freelancers;
DROP POLICY IF EXISTS "Users can view organization freelancer platforms" ON freelancer_platforms;
DROP POLICY IF EXISTS "Users can manage organization freelancer platforms" ON freelancer_platforms;
DROP POLICY IF EXISTS "Users can view organization audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

-- Organizations policies
CREATE POLICY "Allow authenticated users to read organizations" ON organizations
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to create organizations" ON organizations  
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow organization members to update their org" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.organization_id = organizations.id
            AND users.role IN ('owner', 'admin')
        )
    );

-- Users policies
CREATE POLICY "Allow users to read their own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Allow users to read org members" ON users
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Allow authenticated users to create their profile" ON users
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Allow users to update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Allow admins to manage org users" ON users
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Platforms policies
CREATE POLICY "Allow org members to view platforms" ON platforms
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Allow admins to manage platforms" ON platforms
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Freelancers policies
CREATE POLICY "Allow org members to view freelancers" ON freelancers
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Allow org members to manage freelancers" ON freelancers
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Freelancer platforms policies
CREATE POLICY "Allow org members to view freelancer platforms" ON freelancer_platforms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM freelancers f
            JOIN users u ON u.organization_id = f.organization_id
            WHERE f.id = freelancer_platforms.freelancer_id
            AND u.id = auth.uid()
        )
    );

CREATE POLICY "Allow org members to manage freelancer platforms" ON freelancer_platforms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM freelancers f
            JOIN users u ON u.organization_id = f.organization_id
            WHERE f.id = freelancer_platforms.freelancer_id
            AND u.id = auth.uid()
        )
    );

-- Audit logs policies
CREATE POLICY "Allow org members to view audit logs" ON audit_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Allow system to insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- ==============================================================================
-- 🌱 STEP 3: CREATE FRESH SEED DATA
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
-- 🔍 STEP 4: VERIFY FRESH SETUP
-- ==============================================================================

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
SELECT '✅ DATABASE RESET COMPLETE! Ready for fresh signups.' as result;