# Database Fix Scripts

This folder contains SQL scripts used to fix various database issues during development.

## Authentication & User Issues
- `debug-current-state.sql` - Diagnostic script to check current database state
- `create-missing-user-profile.sql` - Creates missing user profiles
- `create-specific-user.sql` - Creates specific user for testing
- `create-user-profile-fixed.sql` - Fixed version of user profile creation
- `create-user-profile-only.sql` - Simple user profile creation
- `manual-user-fix.sql` - Manual fix for user issues
- `simple-user-creation.sql` - Simple user creation bypassing constraints
- `step-by-step-debug.sql` - Step-by-step debugging queries
- `test-specific-user-query.sql` - Test specific user queries

## Database Connection & Timeout Issues
- `quick-timeout-fix.sql` - Quick fix for database timeout issues
- `test-database-access.sql` - Test database connectivity
- `diagnose-and-fix-database.sql` - Comprehensive database diagnosis

## RLS (Row Level Security) Issues
- `fix-rls-policies.sql` - Fix RLS policy issues
- `fix-signup-rls-policies.sql` - Fix signup-specific RLS issues
- `nuclear-database-fix.sql` - Complete RLS removal (nuclear option)

## Schema & Constraint Issues
- `fix-foreign-key-issue.sql` - Fix foreign key constraint violations
- `fix-platforms-schema.sql` - Fix platforms table schema issues
- `fix-platforms-rls.sql` - Fix platforms table RLS issues
- `fix-freelancers-schema.sql` - Fix freelancers table schema (add phone column)
- `check-freelancers-schema.sql` - Check freelancers table structure

## Complete Database Resets
- `reset-database-complete.sql` - Complete database reset
- `reset-database-fixed.sql` - Fixed version of database reset
- `ultimate-database-fix.sql` - Comprehensive database fix

## Usage Notes

1. **Always backup your database** before running these scripts
2. **Run diagnostic scripts first** (like `debug-current-state.sql`) to understand the current state
3. **Use the least invasive fix** - start with specific fixes before using nuclear options
4. **Test after each fix** to ensure the issue is resolved

## Order of Operations for Common Issues

### User Login Issues:
1. `debug-current-state.sql`
2. `simple-user-creation.sql` or `manual-user-fix.sql`

### Platform Configuration Issues:
1. `fix-platforms-rls.sql`
2. `fix-platforms-schema.sql`

### Freelancer Creation Issues:
1. `check-freelancers-schema.sql`
2. `fix-freelancers-schema.sql`

### Complete Reset (Last Resort):
1. `ultimate-database-fix.sql` or `nuclear-database-fix.sql`