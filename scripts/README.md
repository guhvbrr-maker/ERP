# Database Migration Scripts

This directory contains helper scripts for managing and applying database migrations to your Supabase instance.

## Files

### `check-migrations.sql`
A SQL script that verifies which tables and columns exist in your database. Run this in the Supabase SQL Editor to diagnose missing migrations.

**Usage:**
1. Go to https://app.supabase.com/project/htxtlyouzyxmbfbotbvf/sql/new
2. Copy the contents of `check-migrations.sql`
3. Paste into the SQL Editor
4. Click "Run"

The script will show you:
- Which critical tables exist (✅) or are missing (❌)
- Whether the `employees.user_id` column exists
- All tables in your database
- RLS (Row Level Security) status

### `apply-migrations.js`
A Node.js script that applies all migrations programmatically. Requires the Supabase service role key.

**Usage:**
```bash
# Get your service role key from Supabase Dashboard
# https://app.supabase.com/project/htxtlyouzyxmbfbotbvf/settings/api

# Run the script
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node scripts/apply-migrations.js
```

**Note:** This is an alternative to using the Supabase CLI. The recommended approach is still to use `supabase db push` if you have the CLI installed.

## Quick Start

If you're seeing 404/406 errors in the application, follow these steps:

1. **Verify the problem** - Run `check-migrations.sql` in Supabase SQL Editor
2. **Apply migrations** - Use one of these methods:
   - **Recommended**: Supabase CLI (`supabase db push`)
   - Alternative: `apply-migrations.js` script with service role key
   - Manual: Copy/paste each migration file in the SQL Editor

3. **Verify fix** - Run `check-migrations.sql` again to confirm tables exist

## Common Issues

### "relation already exists" errors
This is normal if you're re-running migrations. The tables already exist. Most migrations use `CREATE TABLE IF NOT EXISTS` to handle this gracefully.

### Permission errors
Make sure you're using the service role key (not the anon/publishable key) when using the Node.js script or CLI.

### Some tables exist, but not all
You may have partially applied migrations. Check the migration order in `MIGRATION_INSTRUCTIONS.md` and apply missing ones.

## Related Documentation

- See `MIGRATION_INSTRUCTIONS.md` in the root directory for detailed migration instructions
- See `FIX_SUMMARY.md` for previous fixes applied to the codebase
