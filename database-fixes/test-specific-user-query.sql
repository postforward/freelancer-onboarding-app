-- 🧪 TEST THE SPECIFIC USER QUERY THAT'S TIMING OUT
-- This will test the exact query the app is running

-- Test 1: Look up your specific user ID
SELECT 
    'SPECIFIC USER TEST' as test,
    u.id,
    u.email,
    u.full_name,
    u.organization_id,
    u.role,
    u.is_active
FROM users u 
WHERE u.id = '18d51d41-c679-4f8d-a86a-2e34b231a8f3';

-- Test 2: Test with a non-existent user ID (should return no results, not timeout)
SELECT 
    'NON-EXISTENT USER TEST' as test,
    COUNT(*) as found_count
FROM users u 
WHERE u.id = '00000000-0000-0000-0000-000000000000';

-- Test 3: Test a simple count query
SELECT 'SIMPLE COUNT TEST' as test, COUNT(*) as total_users FROM users;

-- Test 4: Check if there are any performance issues with the users table
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM users WHERE id = '18d51d41-c679-4f8d-a86a-2e34b231a8f3';