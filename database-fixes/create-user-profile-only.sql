-- 🔧 Create Missing User Profile (RLS Policies Already Fixed)
-- 
-- Since you got the "policy already exists" error, the RLS policies are already fixed!
-- Now we just need to create the organization and user profile.

-- ==============================================================================
-- 🏢 STEP 1: CREATE DEFAULT ORGANIZATION
-- ==============================================================================

-- Create a default organization for the stuck user
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
    'org-' || replace(gen_random_uuid()::text, '-', ''),  -- Unique ID
    'My Company',  -- Default organization name
    'company-' || floor(extract(epoch from now()))::text,   -- Unique subdomain
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
) ON CONFLICT DO NOTHING
RETURNING id, name, subdomain;

-- ==============================================================================
-- 🔍 STEP 2: FIND YOUR USER ID
-- ==============================================================================

-- This will show you the auth users - find your email and copy the ID
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
-- 👤 STEP 3: CREATE YOUR USER PROFILE
-- ==============================================================================

-- REPLACE THE VALUES BELOW WITH YOUR ACTUAL DATA:
-- 1. Replace 'YOUR-USER-ID-HERE' with your ID from the query above
-- 2. Replace 'your-email@example.com' with your actual email
-- 3. Replace 'Your Name' with your actual name

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
    'YOUR-USER-ID-HERE',  -- Replace with your actual user ID from STEP 2
    'your-email@example.com',  -- Replace with your actual email
    'Your Name',  -- Replace with your actual name
    (SELECT id FROM organizations ORDER BY created_at DESC LIMIT 1),  -- Use the org we just created
    'owner',
    now(),
    now(),
    true
) ON CONFLICT (id) DO NOTHING;
*/

-- ==============================================================================
-- 🔍 STEP 4: VERIFY EVERYTHING WORKED
-- ==============================================================================

-- Check organizations
SELECT id, name, subdomain, created_at FROM organizations ORDER BY created_at DESC LIMIT 3;

-- Check users
SELECT id, email, full_name, organization_id, role FROM users ORDER BY created_at DESC LIMIT 3;

-- ==============================================================================
-- 📋 INSTRUCTIONS
-- ==============================================================================

/*
HOW TO USE:

1. Run STEP 1 (create organization) - should work immediately

2. Run STEP 2 (find your user ID) - look for your email and copy the 'id' value

3. Edit STEP 3:
   - Uncomment the INSERT statement (remove /* and */)
   - Replace 'YOUR-USER-ID-HERE' with the ID from step 2
   - Replace 'your-email@example.com' with your email
   - Replace 'Your Name' with your name
   - Run the INSERT statement

4. Run STEP 4 to verify it worked

5. Refresh your app - should work now!
*/