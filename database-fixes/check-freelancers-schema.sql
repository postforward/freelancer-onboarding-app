-- 🔍 CHECK FREELANCERS TABLE SCHEMA
-- The app is trying to insert 'full_name' but the column doesn't exist

-- Step 1: Check current freelancers table schema
SELECT 
    'FREELANCERS SCHEMA' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'freelancers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check what the app is sending vs what the table expects
-- The error shows: "Could not find the 'full_name' column"
-- Let's see if it should be 'name' or something else

-- Step 3: Show any existing freelancers data to understand the structure
SELECT 'EXISTING FREELANCERS' as info, * FROM freelancers LIMIT 3;