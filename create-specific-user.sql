-- 🔧 Create Missing User Profile for ID: 30cdd83e-d686-4bfe-8ec6-3ebb510667ba

-- ==============================================================================
-- 🏢 STEP 1: CREATE ORGANIZATION (if needed)
-- ==============================================================================

-- Create organization first
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
    gen_random_uuid(),
    'My Company',
    'company-' || floor(extract(epoch from now()))::text,
    now(),
    now(),
    '{}',
    '{
        "company_name": "My Company",
        "colors": {
            "primary": "#4f46e5",
            "secondary": "#059669", 
            "accent": "#dc2626",
            "neutral": "#6b7280"
        }
    }',
    'free',
    true
) ON CONFLICT DO NOTHING
RETURNING id, name, subdomain;

-- ==============================================================================
-- 👤 STEP 2: CREATE USER PROFILE FOR YOUR STUCK USER
-- ==============================================================================

-- Get the user's email from auth
SELECT id, email, created_at FROM auth.users WHERE id = '30cdd83e-d686-4bfe-8ec6-3ebb510667ba';

-- Create the missing user profile
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
    '30cdd83e-d686-4bfe-8ec6-3ebb510667ba'::uuid,
    (SELECT email FROM auth.users WHERE id = '30cdd83e-d686-4bfe-8ec6-3ebb510667ba'),
    COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = '30cdd83e-d686-4bfe-8ec6-3ebb510667ba'), 'User'),
    (SELECT id FROM organizations ORDER BY created_at DESC LIMIT 1),
    'owner',
    now(),
    now(),
    true
) ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 🔍 STEP 3: VERIFY THE USER WAS CREATED
-- ==============================================================================

-- Check if user was created successfully
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    o.name as organization_name
FROM users u 
JOIN organizations o ON u.organization_id = o.id 
WHERE u.id = '30cdd83e-d686-4bfe-8ec6-3ebb510667ba';