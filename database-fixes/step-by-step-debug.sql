-- 🔍 STEP-BY-STEP DEBUG - Run each query separately

-- QUERY 1: Check auth users
SELECT 'AUTH USERS' as type, id, email, created_at, email_confirmed_at FROM auth.users ORDER BY created_at DESC;