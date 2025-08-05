-- 🔧 Create Missing User Profile (Fixed UUID Issue)

-- ==============================================================================
-- 🏢 STEP 1: CREATE DEFAULT ORGANIZATION (FIXED)
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
    gen_random_uuid(),  -- Generate proper UUID
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

-- TEMPLATE - Replace the values below:
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
    'YOUR-USER-ID-HERE'::uuid,  -- Replace with your actual user ID from STEP 2
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