-- 🔧 Create Missing User Profile for Stuck Authentication
-- 
-- This script will:
-- 1. First apply the RLS policy fixes to prevent future issues
-- 2. Create a default organization for the stuck user
-- 3. Create the missing user profile in the database
-- 
-- IMPORTANT: You'll need to replace the email address and user ID with your actual values

-- ==============================================================================
-- 🔒 STEP 1: FIX RLS POLICIES (CRITICAL)
-- ==============================================================================

-- Drop problematic policies that block organization and user creation
DROP POLICY IF EXISTS "Admins can update their organization" ON organizations;
DROP POLICY IF EXISTS "Admins can insert users in their organization" ON users;

-- Allow authenticated users to create organizations (for initial signup)
CREATE POLICY "Authenticated users can create organizations" ON organizations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to create their own user profile (for initial signup)
CREATE POLICY "Authenticated users can create their own profile" ON users
    FOR INSERT WITH CHECK (id = auth.uid());

-- Allow organization owners/admins to update their organization
CREATE POLICY "Owners and admins can update their organization" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.organization_id = organizations.id 
            AND users.role IN ('owner', 'admin')
        )
    );

-- Allow admins to create users in their organization (after initial setup)
CREATE POLICY "Admins can create users in their organization" ON users
    FOR INSERT WITH CHECK (
        -- Allow self-creation (initial signup)
        id = auth.uid() 
        OR 
        -- Or allow admins to create users in their org
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ==============================================================================
-- 🏢 STEP 2: CREATE DEFAULT ORGANIZATION
-- ==============================================================================

-- Create a default organization for the stuck user
-- NOTE: This will fail if organization already exists - that's OK
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
    'default-org-' || extract(epoch from now())::text,  -- Unique ID
    'My Company',  -- Default organization name
    'my-company-' || extract(epoch from now())::text,   -- Unique subdomain
    now(),
    now(),
    '{}',  -- Empty settings JSON
    '{
        "company_name": "My Company",
        "colors": {
            "primary": "#4f46e5",
            "secondary": "#059669", 
            "accent": "#dc2626",
            "neutral": "#6b7280"
        }
    }',  -- Default branding
    'free',  -- Free tier
    true     -- Active
) ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 👤 STEP 3: CREATE MISSING USER PROFILE
-- ==============================================================================

-- Get the organization ID we just created (or existing one)
-- You'll need to get the actual user ID from Supabase Auth

-- OPTION A: If you know the exact email and user ID, use this:
/*
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
    'YOUR-ACTUAL-USER-ID-FROM-SUPABASE-AUTH',  -- Replace with real user ID
    'your-email@example.com',                  -- Replace with your email
    'Your Name',                               -- Replace with your name
    (SELECT id FROM organizations ORDER BY created_at DESC LIMIT 1),  -- Use the org we just created
    'owner',
    now(),
    now(),
    true
) ON CONFLICT (id) DO NOTHING;
*/

-- OPTION B: If you don't know the user ID, let's find it first
-- This query will show you all users in Supabase Auth:
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- ==============================================================================
-- 🔍 STEP 4: DIAGNOSTIC QUERIES
-- ==============================================================================

-- Show current organizations
SELECT id, name, subdomain, created_at FROM organizations ORDER BY created_at DESC;

-- Show current users in database
SELECT id, email, full_name, organization_id, role FROM users ORDER BY created_at DESC;

-- Show auth users (to find the stuck user ID)
SELECT id, email, created_at, email_confirmed_at FROM auth.users ORDER BY created_at DESC LIMIT 3;

-- ==============================================================================
-- 📋 INSTRUCTIONS FOR USE
-- ==============================================================================

/*
HOW TO USE THIS SCRIPT:

1. Run STEPS 1 & 2 first (RLS policies and organization creation)

2. Look at the results of the diagnostic queries in STEP 4

3. Find your user ID from the auth.users table 

4. Copy your user ID and email

5. Uncomment OPTION A in STEP 3 and replace:
   - 'YOUR-ACTUAL-USER-ID-FROM-SUPABASE-AUTH' with your actual user ID
   - 'your-email@example.com' with your actual email
   - 'Your Name' with your actual name

6. Run the updated INSERT statement

7. Refresh your app - it should now work!

EXAMPLE:
If the auth.users query shows:
id: 'abc123-def456-ghi789'
email: 'test@example.com'

Then your INSERT would be:
INSERT INTO users (id, email, full_name, organization_id, role, created_at, updated_at, is_active)
VALUES (
    'abc123-def456-ghi789',
    'test@example.com', 
    'Test User',
    (SELECT id FROM organizations ORDER BY created_at DESC LIMIT 1),
    'owner',
    now(),
    now(),
    true
) ON CONFLICT (id) DO NOTHING;
*/