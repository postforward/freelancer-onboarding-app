-- 🔧 FIX PLATFORMS TABLE SCHEMA
-- The app is trying to update an 'enabled' column that doesn't exist

-- Step 1: Check current platforms table schema
SELECT 
    'CURRENT PLATFORMS SCHEMA' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'platforms' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check if 'enabled' column exists
SELECT 
    'ENABLED COLUMN CHECK' as check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'platforms' 
            AND column_name = 'enabled' 
            AND table_schema = 'public'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status;

-- Step 3: Add the missing 'enabled' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'platforms' 
        AND column_name = 'enabled' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE platforms ADD COLUMN enabled boolean DEFAULT false NOT NULL;
        RAISE NOTICE 'Added enabled column to platforms table';
    ELSE
        RAISE NOTICE 'Enabled column already exists';
    END IF;
END
$$;

-- Step 4: Check if there are other missing columns the app might need
-- Common platform columns that might be missing:
DO $$
BEGIN
    -- Add is_active if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'platforms' 
        AND column_name = 'is_active' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE platforms ADD COLUMN is_active boolean DEFAULT true NOT NULL;
        RAISE NOTICE 'Added is_active column to platforms table';
    END IF;
    
    -- Add status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'platforms' 
        AND column_name = 'status' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE platforms ADD COLUMN status text DEFAULT 'inactive' NOT NULL;
        RAISE NOTICE 'Added status column to platforms table';
    END IF;
END
$$;

-- Step 5: Verify the final schema
SELECT 
    'FINAL PLATFORMS SCHEMA' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'platforms' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 6: Check current platforms data (using only columns we know exist)
SELECT 'CURRENT PLATFORMS DATA' as info, * FROM platforms ORDER BY created_at DESC LIMIT 5;

SELECT '✅ PLATFORMS SCHEMA FIX COMPLETE!' as result;