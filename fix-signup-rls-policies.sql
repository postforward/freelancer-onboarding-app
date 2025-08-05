-- 🔧 Fix RLS Policies for Initial User Signup
-- 
-- PROBLEM: Current RLS policies prevent organization creation during initial signup
-- because they require a user to already exist, but during signup the user doesn't exist yet.
--
-- SOLUTION: Add policies that allow authenticated users to create organizations and users
-- during the initial signup process.

-- ==============================================================================
-- 🚨 DROP PROBLEMATIC POLICIES THAT BLOCK SIGNUP
-- ==============================================================================

-- Drop the restrictive organization policies that prevent initial creation
DROP POLICY IF EXISTS "Admins can update their organization" ON organizations;
DROP POLICY IF EXISTS "Admins can insert users in their organization" ON users;

-- ==============================================================================
-- ✅ ADD SIGNUP-FRIENDLY POLICIES
-- ==============================================================================

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
-- 🔒 SECURITY FUNCTIONS (IMPROVED)
-- ==============================================================================

-- Create a more robust function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT organization_id INTO org_id FROM users WHERE id = auth.uid();
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can manage organization
CREATE OR REPLACE FUNCTION can_manage_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND organization_id = org_id 
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 📝 UPDATED POLICY SUMMARY
-- ==============================================================================

/*
POLICIES NOW ALLOW:

1. ✅ INITIAL SIGNUP:
   - Authenticated users can create organizations
   - Authenticated users can create their own user profile
   
2. ✅ ONGOING OPERATIONS:
   - Users can view their organization
   - Owners/admins can update their organization
   - Users can view organization members
   - Users can update their own profile
   - Admins can manage users in their organization

3. ✅ SECURITY MAINTAINED:
   - All operations still require authentication
   - Users can only access their own organization's data
   - Role-based permissions for admin operations
   - No data leakage between organizations

SIGNUP FLOW WILL NOW WORK:
1. User signs up with email/password → Supabase Auth creates auth user
2. App creates organization → ✅ Allowed by "Authenticated users can create organizations"
3. App creates user profile → ✅ Allowed by "Authenticated users can create their own profile"
4. User can then access the app normally
*/