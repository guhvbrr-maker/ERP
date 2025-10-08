import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Clock, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function DashboardFinanceiro() {
  const { data: stats } = useQuery({
    queryKey: ["financial-stats"],
    queryFn: async () => {
      const [receivables, payables, accounts] = await Promise.all([
        supabase
          .from("financial_accounts")
          .select("amount, paid_amount, remaining_amount, status")
          .eq("account_type", "receivable"),
        supabase
          .from("financial_accounts")
          .select("amount, paid_amount, remaining_amount, status")
          .eq("account_type", "payable"),
        supabase.from("bank_accounts").select("current_balance"),
      ]);

      const receiveTotal = receivables.data?.reduce((sum, r) => sum + Number(r.remaining_amount || 0), 0) || 0;
      const payTotal = payables.data?.reduce((sum, p) => sum + Number(p.remaining_amount || 0), 0) || 0;
      const bankTotal = accounts.data?.reduce((sum, a) => sum + Number(a.current_balance || 0), 0) || 0;

      return {
        receiveTotal,
        payTotal,
        balance: receiveTotal - payTotal,
        bankTotal,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats?.receiveTotal.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Contas pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {stats?.payTotal.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Contas pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Projetado</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {stats?.balance.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Receber - Pagar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo em Conta</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {stats?.bankTotal.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Total em contas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
