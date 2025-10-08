# Fix Summary: Database Query Errors and SelectItem Validation Issues

## Issues Fixed

### 1. Dashboard.tsx - Incorrect Table Name
**Problem:** The Dashboard was querying a non-existent `assistances` table.

**Error Message:**
```
htxtlyouzyxmbfbotbvf.supabase.co/rest/v1/assistances?select=id%2Cstatus%2Ccreated_at%2Cscheduled_date:1
Failed to load resource: the server responded with a status of 404
```

**Solution:**
- Changed from `assistances` to `technical_assistances` (the correct table name)
- Updated status filter from `"open"` to `"pending"` to match the table's enum values
- Changed field from `scheduled_date` to `opened_date` to match the actual schema

**Files Modified:**
- `src/pages/Dashboard.tsx`

### 2. Tarefas.tsx - Incorrect Employee Query
**Problem:** The employee query was trying to select `name` and filter by `active` directly on the `employees` table, but these fields exist in the related `people` table.

**Error Message:**
```
htxtlyouzyxmbfbotbvf.supabase.co/rest/v1/employees?select=*&active=eq.true&order=name.asc:1
Failed to load resource: the server responded with a status of 400
```

**Solution:**
- Modified the query to properly join with the `people` table
- Filter active employees using `people.active`
- Sort by `people.name`
- Transform the result to flatten the structure for easier consumption

**Files Modified:**
- `src/pages/tarefas/Tarefas.tsx`

### 3. SelectItem Empty Value Props
**Problem:** Multiple SelectItem components had empty string values (`value=""`), which is not allowed in Radix UI Select component.

**Error Message:**
```
Error: A <Select.Item /> must have a value prop that is not an empty string. 
This is because the Select value can be set to an empty string to clear the selection and show the placeholder.
```

**Solution:**
- Replaced empty string values with meaningful placeholders:
  - `""` → `"none"` for department selection
  - `""` → `"unassigned"` for employee assignment
  - `""` → `"all"` for filter selections
- Added conversion logic to transform these placeholder values back to empty strings when needed for database queries

**Files Modified:**
- `src/components/tarefas/TaskDialog.tsx` (2 instances)
- `src/components/tarefas/TaskFilters.tsx` (4 instances)

## Database Tables Verified

The following tables exist in the migrations and are correctly referenced in the code:
- ✅ `technical_assistances` (not `assistances`)
- ✅ `notifications`
- ✅ `departments`
- ✅ `tasks`
- ✅ `chat_channels`
- ✅ `employees` (with proper join to `people` table)

## Testing

- **Build:** ✅ Successfully built with `npm run build`
- **Type Safety:** ✅ TypeScript compilation passed
- **Linting:** ⚠️ Pre-existing `@typescript-eslint/no-explicit-any` warnings (not related to these fixes)

## Notes

The 404 errors in the original problem statement suggest that:
1. The Supabase database may not have the migrations applied
2. The application code now correctly references the right tables
3. Running the migrations should resolve the remaining 404 errors

The 406 error for the employees query is now fixed by properly joining with the `people` table.
