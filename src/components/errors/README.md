# Error Handling Components

This directory contains reusable error handling components for the ERP application, specifically designed to provide helpful feedback when database queries fail.

## Components

### DatabaseErrorFallback

A component that displays user-friendly error messages when database queries fail, with special handling for database schema issues (404/406 errors).

**Features:**
- Detects database schema errors (404, 406 status codes)
- Provides specific guidance for fixing migration issues
- Shows technical details in an expandable section
- Supports error boundary reset functionality

**Usage:**
```tsx
import { DatabaseErrorFallback } from "@/components/errors/DatabaseErrorFallback";

function MyComponent() {
  const { data, error, isError } = useQuery({
    queryKey: ["myData"],
    queryFn: fetchMyData,
  });

  if (isError) {
    return <DatabaseErrorFallback error={error} />;
  }

  // ... render data
}
```

### QueryErrorWrapper

A wrapper component that handles the common pattern of loading/error/success states in React Query components.

**Usage:**
```tsx
import { QueryErrorWrapper } from "@/components/errors/QueryErrorWrapper";

function MyComponent() {
  const { data, error, isError, isLoading } = useQuery({
    queryKey: ["myData"],
    queryFn: fetchMyData,
  });

  return (
    <QueryErrorWrapper
      error={error}
      isError={isError}
      isLoading={isLoading}
      loadingFallback={<div>Loading...</div>}
    >
      {/* Render your data here */}
      <div>{data?.map(item => ...)}</div>
    </QueryErrorWrapper>
  );
}
```

## Error Types Handled

### Database Schema Errors (404/406)

These errors indicate that database tables or columns don't exist. The component will:
- Display a prominent warning with database icon
- Explain that migrations need to be applied
- Provide step-by-step instructions
- Link to SOLUTION.md documentation

**Common causes:**
- Database migrations not applied
- Connecting to wrong Supabase project
- Tables were deleted or renamed

### Generic Errors

For other types of errors (network issues, permission errors, etc.), the component displays:
- A generic error card
- The error message
- A retry button (if resetErrorBoundary is provided)

## Integration with React Query

These components are designed to work seamlessly with React Query's error handling:

```tsx
const MyPage = () => {
  const query = useQuery({
    queryKey: ["data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("my_table")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <QueryErrorWrapper
      error={query.error}
      isError={query.isError}
      isLoading={query.isLoading}
    >
      {/* Your component content */}
    </QueryErrorWrapper>
  );
};
```

## Styling

Components use shadcn/ui components and Tailwind CSS classes for consistent styling:
- `Alert` component for warnings
- `Card` component for generic errors
- `Button` component for retry actions
- Proper color variants (`destructive`, `muted`, etc.)

## Customization

You can customize the error messages by:
1. Modifying the component directly
2. Creating a wrapper with custom props
3. Using the component as inspiration for your own error handlers

## Best Practices

1. **Always handle errors**: Use these components or similar patterns for all data fetching
2. **Provide context**: The error messages should help users understand what went wrong
3. **Offer solutions**: Tell users how to fix the problem (like applying migrations)
4. **Enable retry**: Include retry functionality where appropriate
5. **Log errors**: Consider logging errors to a service for debugging

## Example: Dashboard Integration

Here's how to integrate error handling in a dashboard component:

```tsx
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QueryErrorWrapper } from "@/components/errors/QueryErrorWrapper";

const Dashboard = () => {
  const salesQuery = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>
      
      <QueryErrorWrapper
        error={salesQuery.error}
        isError={salesQuery.isError}
        isLoading={salesQuery.isLoading}
      >
        {/* Your dashboard content */}
        <div>Total Sales: {salesQuery.data?.length}</div>
      </QueryErrorWrapper>
    </div>
  );
};
```

## Testing

When testing components that use these error handlers:

```tsx
// Simulate a 404 error
const error404 = new Error("404: Table not found");

// Simulate a 406 error  
const error406 = new Error("406: Not Acceptable - column doesn't exist");

// Test rendering
render(<DatabaseErrorFallback error={error404} />);
expect(screen.getByText(/banco de dados não configurado/i)).toBeInTheDocument();
```

## Related Documentation

- See `SOLUTION.md` in root for migration instructions
- See `MIGRATION_INSTRUCTIONS.md` for detailed migration steps
- See `scripts/` directory for helper scripts
