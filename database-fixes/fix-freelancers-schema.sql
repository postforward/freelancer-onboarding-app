-- 🔧 FIX FREELANCERS TABLE SCHEMA
-- Add missing phone column and handle full_name vs first_name/last_name

-- Step 1: Add missing phone column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'freelancers' 
        AND column_name = 'phone' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE freelancers ADD COLUMN phone character varying;
        RAISE NOTICE 'Added phone column to freelancers table';
    ELSE
        RAISE NOTICE 'Phone column already exists';
    END IF;
END
$$;

-- Step 2: Check if we should add full_name column or use first_name/last_name
-- Since the table already has first_name and last_name, we'll keep that structure
-- and fix the app code to split full_name into first_name and last_name

-- Step 3: Verify the final schema
SELECT 
    'FINAL FREELANCERS SCHEMA' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'freelancers' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '✅ FREELANCERS SCHEMA FIX COMPLETE!' as result;