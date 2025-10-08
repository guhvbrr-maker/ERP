import { AlertCircle, Database, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DatabaseErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
}

/**
 * Component to display when database queries fail
 * Provides helpful guidance for common database issues
 */
export function DatabaseErrorFallback({ error, resetErrorBoundary }: DatabaseErrorFallbackProps) {
  const errorMessage = error?.message || "";
  const is404Error = errorMessage.includes("404") || errorMessage.includes("not found");
  const is406Error = errorMessage.includes("406") || errorMessage.includes("Not Acceptable");
  const isDatabaseError = is404Error || is406Error;

  if (!isDatabaseError) {
    // Generic error - not a database schema issue
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Erro ao carregar dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Ocorreu um erro ao carregar as informações. Por favor, tente novamente.
          </p>
          <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted p-2 rounded">
            {errorMessage}
          </p>
          {resetErrorBoundary && (
            <Button onClick={resetErrorBoundary} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Database schema issue - provide specific guidance
  return (
    <Alert variant="destructive" className="my-6">
      <Database className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold mb-2">
        Banco de dados não configurado
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-3">
          <p className="text-sm">
            {is404Error && "Algumas tabelas do banco de dados não foram encontradas."}
            {is406Error && "O esquema do banco de dados está incompleto."}
          </p>
          
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm font-semibold mb-2">Para resolver este problema:</p>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>As migrações do banco de dados precisam ser aplicadas</li>
              <li>Execute: <code className="bg-background px-1 py-0.5 rounded">supabase db push</code></li>
              <li>Ou consulte o arquivo <code className="bg-background px-1 py-0.5 rounded">SOLUTION.md</code> na raiz do projeto</li>
            </ol>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer font-medium mb-1">Detalhes técnicos</summary>
            <div className="bg-background p-2 rounded font-mono text-xs overflow-auto">
              {errorMessage}
            </div>
          </details>

          {resetErrorBoundary && (
            <Button onClick={resetErrorBoundary} variant="outline" size="sm" className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
