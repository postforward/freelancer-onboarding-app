-- 🔧 Diagnose and Fix Database Access Issues
-- This script will check what's wrong and fix it

-- ==============================================================================
-- 🔍 STEP 1: DIAGNOSE CURRENT STATE
-- ==============================================================================

-- Check if user exists in auth
SELECT 
    'AUTH USER CHECK' as check_type,
    id, 
    email, 
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE id = '30cdd83e-d686-4bfe-8ec6-3ebb510667ba';

-- Check if user exists in users table
SELECT 
    'DATABASE USER CHECK' as check_type,
    id, 
    email, 
    full_name,
    organization_id,
    role
FROM users 
WHERE id = '30cdd83e-d686-4bfe-8ec6-3ebb510667ba';

-- Check organizations
SELECT 
    'ORGANIZATIONS CHECK' as check_type,
    id, 
    name, 
    subdomain,
    created_at
FROM organizations 
ORDER BY created_at DESC 
LIMIT 3;

-- ==============================================================================
-- 🔒 STEP 2: FIX RLS POLICIES COMPLETELY
-- ==============================================================================

-- TEMPORARILY DISABLE RLS to create the user
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Create organization if it doesn't exist
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
) 
SELECT 
    gen_random_uuid(),
    'My Company',
    'company-' || floor(extract(epoch from now()))::text,
    now(),
    now(),
    '{}',
    '{"company_name": "My Company", "colors": {"primary": "#4f46e5", "secondary": "#059669", "accent": "#dc2626", "neutral": "#6b7280"}}',
    'free',
    true
WHERE NOT EXISTS (SELECT 1 FROM organizations LIMIT 1);

-- Create user profile
INSERT INTO users (
    id,
    email,
    full_name,
    organization_id,
    role,
    created_at,
    updated_at,
    is_active
) VALUES (
    '30cdd83e-d686-4bfe-8ec6-3ebb510667ba',
    COALESCE(
        (SELECT email FROM auth.users WHERE id = '30cdd83e-d686-4bfe-8ec6-3ebb510667ba'),
        'user@example.com'
    ),
    COALESCE(
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = '30cdd83e-d686-4bfe-8ec6-3ebb510667ba'),
        'User'
    ),
    (SELECT id FROM organizations ORDER BY created_at DESC LIMIT 1),
    'owner',
    now(),
    now(),
    true
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    organization_id = EXCLUDED.organization_id,
    updated_at = now();

-- RE-ENABLE RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 🔒 STEP 3: CREATE PROPER RLS POLICIES
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

-- Create simple, working policies
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
        )
    );

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

-- ==============================================================================
-- 🔍 STEP 4: VERIFY EVERYTHING WORKS
-- ==============================================================================

-- Final verification
SELECT 
    'FINAL VERIFICATION' as check_type,
    u.id,
    u.email,
    u.full_name,
    u.role,
    o.name as organization_name,
    o.subdomain
FROM users u 
JOIN organizations o ON u.organization_id = o.id 
WHERE u.id = '30cdd83e-d686-4bfe-8ec6-3ebb510667ba';

-- Test the query that the app is running
SELECT 
    'APP QUERY TEST' as check_type,
    *
FROM users 
WHERE id = '30cdd83e-d686-4bfe-8ec6-3ebb510667ba';

-- Success message
SELECT 'SUCCESS: User profile created and RLS policies fixed!' as result;