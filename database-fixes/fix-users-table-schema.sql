-- Fix users table schema - migrate from full_name to first_name/last_name
-- This script safely migrates the users table to match our application schema

-- Step 1: Check current table structure
SELECT 
    'Current users table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add new columns if they don't exist
DO $$ 
BEGIN
    -- Add first_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'first_name' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN first_name TEXT;
        RAISE NOTICE 'Added first_name column to users table';
    ELSE
        RAISE NOTICE 'first_name column already exists';
    END IF;
    
    -- Add last_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_name' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users ADD COLUMN last_name TEXT;
        RAISE NOTICE 'Added last_name column to users table';
    ELSE
        RAISE NOTICE 'last_name column already exists';
    END IF;
END $$;

-- Step 3: Migrate data from full_name to first_name/last_name (if full_name exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'full_name' AND table_schema = 'public'
    ) THEN
        -- Update first_name and last_name from full_name
        UPDATE public.users 
        SET 
            first_name = COALESCE(SPLIT_PART(full_name, ' ', 1), ''),
            last_name = COALESCE(TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)), '')
        WHERE full_name IS NOT NULL 
            AND (first_name IS NULL OR last_name IS NULL);
        
        RAISE NOTICE 'Migrated full_name data to first_name/last_name';
        
        -- Set default values for empty names
        UPDATE public.users 
        SET first_name = 'Unknown' 
        WHERE first_name IS NULL OR first_name = '';
        
        UPDATE public.users 
        SET last_name = 'User' 
        WHERE last_name IS NULL OR last_name = '';
    ELSE
        RAISE NOTICE 'full_name column does not exist, skipping migration';
    END IF;
END $$;

-- Step 4: Make the new columns NOT NULL if they aren't already
ALTER TABLE public.users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN last_name SET NOT NULL;

-- Step 5: Optionally drop the full_name column (commented out for safety)
-- Uncomment the following lines if you want to completely remove full_name
/*
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'full_name' AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users DROP COLUMN full_name;
        RAISE NOTICE 'Dropped full_name column';
    END IF;
END $$;
*/

-- Step 6: Verify the final table structure
SELECT 
    'Updated users table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 7: Show sample data to verify migration
SELECT 
    'Sample migrated data:' as info,
    id,
    email,
    first_name,
    last_name,
    organization_id,
    role
FROM public.users 
LIMIT 5;