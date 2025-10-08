-- ============================================================================
-- MIGRATION VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to check which tables/columns exist
-- ============================================================================

-- 1. Check if critical tables exist
SELECT 
  'Table Check' as check_type,
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
  VALUES 
    ('people'),
    ('employees'),
    ('customers'),
    ('departments'),
    ('tasks'),
    ('task_assignments'),
    ('task_comments'),
    ('chat_channels'),
    ('chat_channel_members'),
    ('chat_messages'),
    ('notifications'),
    ('activity_log'),
    ('technical_assistances'),
    ('sales'),
    ('purchases')
) AS required_tables(table_name)
LEFT JOIN information_schema.tables t 
  ON t.table_name = required_tables.table_name 
  AND t.table_schema = 'public'
ORDER BY required_tables.table_name;

-- 2. Check if employees table has user_id column (critical for 406 error)
SELECT 
  'Column Check' as check_type,
  'employees.user_id' as column_reference,
  CASE 
    WHEN column_name IS NOT NULL THEN '✅ EXISTS' 
    ELSE '❌ MISSING - Apply migration 20251008025630'
  END as status,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'employees'
  AND column_name = 'user_id';

-- 3. List all public tables (to see what's actually in the database)
SELECT 
  'All Tables' as info,
  table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 4. Check employees table structure
SELECT 
  'Employees Structure' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'employees'
ORDER BY ordinal_position;

-- 5. Check if RLS is enabled on critical tables
SELECT 
  'RLS Status' as info,
  tablename as table_name,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED' 
    ELSE '⚠️ DISABLED' 
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('employees', 'departments', 'tasks', 'notifications', 'chat_channels')
ORDER BY tablename;
