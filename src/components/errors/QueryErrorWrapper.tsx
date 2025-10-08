import { ReactNode } from "react";
import { DatabaseErrorFallback } from "./DatabaseErrorFallback";

interface QueryErrorWrapperProps {
  error: Error | null;
  isError: boolean;
  isLoading?: boolean;
  loadingFallback?: ReactNode;
  children: ReactNode;
}

/**
 * Wrapper component for React Query results
 * Displays appropriate fallbacks for loading, error, and success states
 */
export function QueryErrorWrapper({
  error,
  isError,
  isLoading = false,
  loadingFallback = <div className="text-center py-8 text-muted-foreground">Carregando...</div>,
  children,
}: QueryErrorWrapperProps) {
  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (isError && error) {
    return <DatabaseErrorFallback error={error} />;
  }

  return <>{children}</>;
}
