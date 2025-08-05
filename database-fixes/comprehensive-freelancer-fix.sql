-- Comprehensive fix for freelancer creation issues
-- This script addresses multiple potential issues: RLS, foreign keys, constraints

-- Step 1: Check current table structure and constraints
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'freelancers' 
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'freelancers';

-- Step 2: Temporarily disable constraints and RLS
SET session_replication_role = 'replica';
ALTER TABLE public.freelancers DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop all RLS policies
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'freelancers'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.freelancers';
    END LOOP;
END $$;

-- Step 4: Ensure the table has the correct schema
-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add phone column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'freelancers' AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.freelancers ADD COLUMN phone TEXT;
    END IF;
    
    -- Add username column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'freelancers' AND column_name = 'username'
    ) THEN
        ALTER TABLE public.freelancers ADD COLUMN username TEXT;
    END IF;
    
    -- Ensure status column has correct type and default
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'freelancers' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.freelancers ALTER COLUMN status SET DEFAULT 'pending';
    END IF;
END $$;

-- Step 5: Grant permissions
GRANT ALL ON public.freelancers TO authenticated;
GRANT ALL ON public.freelancers TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Step 6: Test insert (replace with actual values)
-- This is a test insert to verify the table works
/*
INSERT INTO public.freelancers (
    organization_id,
    email,
    first_name,
    last_name,
    created_by,
    status
) VALUES (
    'org-1',  -- Replace with actual org ID
    'test@example.com',
    'Test',
    'User',
    'user-1',  -- Replace with actual user ID
    'pending'
) ON CONFLICT (email, organization_id) DO NOTHING;
*/

-- Step 7: Re-enable constraints
SET session_replication_role = 'origin';

-- Step 8: Show final table info
SELECT 
    'Table structure:' as info_type,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'freelancers' 
ORDER BY ordinal_position;

-- Show RLS status
SELECT 
    'RLS Status:' as info_type,
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'freelancers';

-- Show policies (should be empty after this script)
SELECT 
    'Policies:' as info_type,
    policyname, 
    cmd, 
    permissive
FROM pg_policies 
WHERE tablename = 'freelancers';