# Database Migration Instructions

## Problem

The application is experiencing 404 and 406 errors because the database migrations have not been applied to the Supabase instance. The errors include:

- **404 Errors**: Tables don't exist (`notifications`, `departments`, `tasks`, `chat_channels`)
- **406 Errors**: Columns don't exist (`user_id` in `employees` table)

## Root Cause

The migration files exist in the repository (`supabase/migrations/`) but have not been executed against the Supabase database at `htxtlyouzyxmbfbotbvf.supabase.co`.

## Solution

You need to apply the migrations to your Supabase database. There are several ways to do this:

### Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link to your project**:
   ```bash
   cd /path/to/ERP
   supabase link --project-ref htxtlyouzyxmbfbotbvf
   ```

4. **Push migrations to the database**:
   ```bash
   supabase db push
   ```

### Option 2: Using Supabase Dashboard (Manual)

1. Go to your Supabase Dashboard: https://app.supabase.com/project/htxtlyouzyxmbfbotbvf
2. Navigate to **SQL Editor**
3. Execute each migration file in chronological order (by filename):
   - Open each `.sql` file from `supabase/migrations/`
   - Copy the entire content
   - Paste into SQL Editor
   - Click **Run**
   - Repeat for all migration files in order

### Option 3: Reset Database (Development Only)

⚠️ **Warning**: This will delete all existing data!

```bash
supabase db reset
```

## Migration Files Order

The migrations should be applied in this order (already ordered by filename):

1. `20251002124536_64305a90-df9a-489b-9f26-3be017af4ccc.sql` - Base schema
2. `20251002124802_4025581a-f673-4ed6-9759-12139676ed84.sql`
3. `20251002124823_4e34174a-71dd-4a26-b875-0470817aec86.sql`
4. `20251002124843_14a821ed-b16f-48ca-8e27-de085ea23e6f.sql`
5. `20251002124942_d69b597e-4203-49e9-8a34-2c4e21b5f50f.sql`
6. `20251002135357_ecf0ff73-c7b5-4116-9be4-56cc0d7cd396.sql`
7. `20251002135955_06e8d139-aed3-450a-bf78-8bcd30e4212d.sql`
8. `20251008004929_3a82aa8e-a021-4f85-b941-03162c860d30.sql` - People/Employees/Customers
9. `20251008010119_9cfda1b8-d64a-40c9-aaf3-746e28eb0278.sql`
10. `20251008021444_8f828725-fef6-47b9-8c91-4f4881c42b0e.sql`
11. `20251008025630_88cc71c9-9378-4a93-9ca0-6300143854e9.sql` - **Adds user_id to employees**
12. `20251008031231_604300b0-37be-409d-93e0-3ae34faa8f1f.sql`
13. `20251008032231_553bbea0-5cfc-46f6-a6db-3994def13ca2.sql` - Financial accounts
14. `20251008035411_edf4ea03-e2f4-46e9-ad96-8985465538ac.sql`
15. `20251008035809_3dc7ed17-884a-4bbf-b263-9392d1ceebb0.sql`
16. `20251008041214_aa2ec390-7225-48ac-9068-d84156957252.sql`
17. `20251008042211_7f85df08-153a-4fc0-aadc-d99b4caa64e8.sql`
18. `20251009000000_improve_sales_management.sql`
19. `20250110000000_enhance_erp_features.sql` - SLA, Commissions, Production Orders
20. `20250111000000_add_tasks_and_chat_system.sql` - **Tasks, Departments, Chat, Notifications**

## Verification

After applying the migrations, verify that all tables exist:

```sql
-- Run this in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables (among others):
- ✅ `chat_channels`
- ✅ `chat_messages`
- ✅ `departments`
- ✅ `employees` (with `user_id` column)
- ✅ `notifications`
- ✅ `tasks`

## Additional Verification

Check if the `employees` table has the `user_id` column:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

You should see `user_id` in the results.

## After Migration

Once migrations are applied:
1. Refresh your application
2. All 404 errors should be resolved (tables will exist)
3. All 406 errors should be resolved (columns will exist)
4. The application should function normally

## Troubleshooting

### Error: "relation already exists"
This means some tables were already created. You can either:
- Skip migrations that cause this error (tables already exist)
- Use `CREATE TABLE IF NOT EXISTS` syntax (most migrations already do this)

### Error: "column already exists"
Similar to above - the migration was partially applied. Skip that statement.

### Permission Errors
Make sure you're using a database user with sufficient privileges. The Supabase service role should have full access.

## Contact

If you need help applying these migrations, contact your Supabase administrator or database team.
