# Solution: Fix 404 and 406 API Errors

## Executive Summary

The application is experiencing HTTP 404 and 406 errors when trying to access Supabase REST API endpoints. **The root cause is that database migrations have not been applied** to the Supabase instance at `htxtlyouzyxmbfbotbvf.supabase.co`.

**Solution:** Apply the existing migration files to the database using one of the methods described below.

## Error Analysis

### 404 Errors (Not Found)
These errors indicate that the database tables don't exist:
- `notifications` table
- `departments` table  
- `tasks` table
- `chat_channels` table

### 406 Errors (Not Acceptable)
These errors indicate schema mismatches or missing columns:
- `employees` table is missing the `user_id` column

## Why This Happened

The application code is correct and complete. All necessary migration files exist in the `supabase/migrations/` directory. However, these SQL migration files have not been executed against the actual Supabase database. 

Think of it like having construction blueprints (migration files) but not having built the building yet (database schema).

## Solution Steps

### Option 1: Using Supabase CLI (Recommended - Easiest)

This is the cleanest and safest approach:

```bash
# 1. Install Supabase CLI globally
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Navigate to project directory
cd /path/to/ERP

# 4. Link to your Supabase project
supabase link --project-ref htxtlyouzyxmbfbotbvf

# 5. Push all migrations to the database
supabase db push
```

**What this does:**
- Connects to your Supabase project
- Reads all migration files from `supabase/migrations/`
- Applies them in the correct order
- Tracks which migrations have been applied
- Handles dependencies automatically

### Option 2: Using the Provided Node.js Script

If you can't install the Supabase CLI, use the included script:

```bash
# 1. Get your service role key from:
#    https://app.supabase.com/project/htxtlyouzyxmbfbotbvf/settings/api

# 2. Run the migration script
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... node scripts/apply-migrations.js
```

**Security Note:** The service role key has full admin access. Never commit it to Git or share it publicly.

### Option 3: Manual Application via Supabase Dashboard

If the above options don't work, manually apply each migration:

1. Go to https://app.supabase.com/project/htxtlyouzyxmbfbotbvf/sql/new
2. Open the first migration file: `supabase/migrations/20251002124536_64305a90-df9a-489b-9f26-3be017af4ccc.sql`
3. Copy the entire content
4. Paste it into the SQL Editor
5. Click "Run"
6. Repeat for each migration file in chronological order (see list below)

**Migration Order:**
The migrations MUST be applied in this exact order:

1. `20251002124536_64305a90-df9a-489b-9f26-3be017af4ccc.sql`
2. `20251002124802_4025581a-f673-4ed6-9759-12139676ed84.sql`
3. `20251002124823_4e34174a-71dd-4a26-b875-0470817aec86.sql`
4. `20251002124843_14a821ed-b16f-48ca-8e27-de085ea23e6f.sql`
5. `20251002124942_d69b597e-4203-49e9-8a34-2c4e21b5f50f.sql`
6. `20251002135357_ecf0ff73-c7b5-4116-9be4-56cc0d7cd396.sql`
7. `20251002135955_06e8d139-aed3-450a-bf78-8bcd30e4212d.sql`
8. `20251008004929_3a82aa8e-a021-4f85-b941-03162c860d30.sql` ⭐ Creates people/employees/customers
9. `20251008010119_9cfda1b8-d64a-40c9-aaf3-746e28eb0278.sql`
10. `20251008021444_8f828725-fef6-47b9-8c91-4f4881c42b0e.sql`
11. `20251008025630_88cc71c9-9378-4a93-9ca0-6300143854e9.sql` ⭐ Adds user_id to employees
12. `20251008031231_604300b0-37be-409d-93e0-3ae34faa8f1f.sql`
13. `20251008032231_553bbea0-5cfc-46f6-a6db-3994def13ca2.sql`
14. `20251008035411_edf4ea03-e2f4-46e9-ad96-8985465538ac.sql`
15. `20251008035809_3dc7ed17-884a-4bbf-b263-9392d1ceebb0.sql`
16. `20251008041214_aa2ec390-7225-48ac-9068-d84156957252.sql`
17. `20251008042211_7f85df08-153a-4fc0-aadc-d99b4caa64e8.sql`
18. `20251009000000_improve_sales_management.sql`
19. `20250110000000_enhance_erp_features.sql`
20. `20250111000000_add_tasks_and_chat_system.sql` ⭐ Creates tasks/departments/chat/notifications

## Verification

After applying migrations, verify everything is set up correctly:

### 1. Run the Verification Script

Copy and run `scripts/check-migrations.sql` in the Supabase SQL Editor. You should see:
- ✅ All critical tables exist
- ✅ `employees.user_id` column exists
- ✅ RLS is enabled on key tables

### 2. Test the Application

1. Refresh the application in your browser
2. Check the browser console (F12)
3. All 404 and 406 errors should be gone
4. The Dashboard should load without errors
5. Tasks, Notifications, and Chat features should work

### 3. Quick SQL Verification

Run this in Supabase SQL Editor to verify the key tables:

```sql
-- Should return all required tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'notifications', 'departments', 'tasks', 
    'chat_channels', 'employees'
  )
ORDER BY table_name;

-- Should return the user_id column
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'employees' 
  AND column_name = 'user_id';
```

Both queries should return results. If they don't, migrations were not applied correctly.

## Expected Results

After successfully applying migrations:

### Before (Current State)
```
❌ 404 Error: notifications table not found
❌ 404 Error: departments table not found  
❌ 404 Error: tasks table not found
❌ 404 Error: chat_channels table not found
❌ 406 Error: employees query fails (missing user_id)
```

### After (Fixed State)
```
✅ notifications table exists and queries succeed
✅ departments table exists and queries succeed
✅ tasks table exists and queries succeed  
✅ chat_channels table exists and queries succeed
✅ employees.user_id column exists and queries succeed
✅ Application loads without errors
✅ All features functional
```

## Troubleshooting

### "relation already exists" Error
This is normal and can be ignored. It means the table was already created (possibly from a previous partial migration attempt).

### "column already exists" Error  
Similar to above - the column was already added. This is safe to ignore.

### Still Getting 404 Errors After Migration
1. Verify migrations were actually applied: Run `scripts/check-migrations.sql`
2. Check you're connected to the correct Supabase project
3. Clear browser cache and refresh the application
4. Check browser console for the actual error details

### Still Getting 406 Errors
The 406 error specifically for employees usually means:
1. The `user_id` column wasn't added - Verify with: `SELECT column_name FROM information_schema.columns WHERE table_name = 'employees'`
2. RLS policies are blocking access - Check RLS policies in Supabase Dashboard

### Permission Denied Errors
Make sure:
1. You're using the service role key (not anon key) for migrations
2. Your database user has sufficient privileges
3. RLS policies are correctly configured

## Prevention

To prevent this in the future:

1. **Always apply migrations** when pulling new code that includes migration files
2. **Use CI/CD** to automatically apply migrations on deployment
3. **Document schema changes** so team members know when migrations are needed
4. **Use Supabase CLI** in development for automatic migration management

## Need Help?

If you're still experiencing issues after following this guide:

1. Run `scripts/check-migrations.sql` and share the output
2. Check the browser console for detailed error messages
3. Verify you're using the correct Supabase project URL
4. Check that you have network access to `htxtlyouzyxmbfbotbvf.supabase.co`

## Summary

**Problem:** Database tables/columns don't exist  
**Cause:** Migrations not applied  
**Solution:** Run `supabase db push` or manually apply migrations  
**Verification:** Run `scripts/check-migrations.sql`  
**Result:** All 404/406 errors resolved ✅
