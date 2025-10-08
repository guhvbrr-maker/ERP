import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Filter, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function RelatoriosFinanceiro() {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const { data: financialReport, refetch } = useQuery({
    queryKey: ["financial-report", startDate, endDate],
    queryFn: async () => {
      // Receivables
      const { data: receivables, error: recError } = await supabase
        .from("financial_accounts")
        .select("*")
        .eq("account_type", "receivable")
        .gte("due_date", startDate)
        .lte("due_date", endDate)
        .order("due_date");

      if (recError) throw recError;

      // Payables
      const { data: payables, error: payError } = await supabase
        .from("financial_accounts")
        .select("*")
        .eq("account_type", "payable")
        .gte("due_date", startDate)
        .lte("due_date", endDate)
        .order("due_date");

      if (payError) throw payError;

      // Calculate metrics
      const totalReceivable = receivables.reduce((sum, acc) => sum + Number(acc.amount || 0), 0);
      const paidReceivable = receivables.reduce((sum, acc) => sum + Number(acc.paid_amount || 0), 0);
      const pendingReceivable = totalReceivable - paidReceivable;

      const totalPayable = payables.reduce((sum, acc) => sum + Number(acc.amount || 0), 0);
      const paidPayable = payables.reduce((sum, acc) => sum + Number(acc.paid_amount || 0), 0);
      const pendingPayable = totalPayable - paidPayable;

      const cashFlow = pendingReceivable - pendingPayable;
      const profit = totalReceivable - totalPayable;

      // Group by date for chart
      const dateMap: Record<string, { date: string; receber: number; pagar: number }> = {};
      
      receivables.forEach(acc => {
        const date = format(new Date(acc.due_date), "dd/MM");
        if (!dateMap[date]) dateMap[date] = { date, receber: 0, pagar: 0 };
        dateMap[date].receber += Number(acc.remaining_amount || 0);
      });

      payables.forEach(acc => {
        const date = format(new Date(acc.due_date), "dd/MM");
        if (!dateMap[date]) dateMap[date] = { date, receber: 0, pagar: 0 };
        dateMap[date].pagar += Number(acc.remaining_amount || 0);
      });

      const chartData = Object.values(dateMap).sort((a, b) => {
        const [dayA, monthA] = a.date.split('/').map(Number);
        const [dayB, monthB] = b.date.split('/').map(Number);
        return monthA === monthB ? dayA - dayB : monthA - monthB;
      });

      return {
        receivables,
        payables,
        metrics: {
          totalReceivable,
          paidReceivable,
          pendingReceivable,
          totalPayable,
          paidPayable,
          pendingPayable,
          cashFlow,
          profit
        },
        chartData
      };
    },
    enabled: false,
  });

  const handleGenerateReport = () => {
    refetch();
  };

  const handleExportCSV = () => {
    if (!financialReport) return;

    const headers = ["Tipo", "Descrição", "Valor", "Pago", "Restante", "Vencimento", "Status"];
    
    const receivableRows = financialReport.receivables.map(acc => [
      "Receber",
      acc.description,
      Number(acc.amount || 0).toFixed(2),
      Number(acc.paid_amount || 0).toFixed(2),
      Number(acc.remaining_amount || 0).toFixed(2),
      format(new Date(acc.due_date), "dd/MM/yyyy"),
      acc.status === "paid" ? "Pago" : acc.status === "partial" ? "Parcial" : "Pendente"
    ]);

    const payableRows = financialReport.payables.map(acc => [
      "Pagar",
      acc.description,
      Number(acc.amount || 0).toFixed(2),
      Number(acc.paid_amount || 0).toFixed(2),
      Number(acc.remaining_amount || 0).toFixed(2),
      format(new Date(acc.due_date), "dd/MM/yyyy"),
      acc.status === "paid" ? "Pago" : acc.status === "partial" ? "Parcial" : "Pendente"
    ]);

    const csv = [headers, ...receivableRows, ...payableRows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-financeiro-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex items-end">
              <div className="flex gap-2 w-full">
                <Button onClick={handleGenerateReport} className="flex-1">
                  <Filter className="mr-2 h-4 w-4" />
                  Gerar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleExportCSV}
                  disabled={!financialReport}
                >
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      {financialReport && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                    .format(financialReport.metrics.pendingReceivable)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pago: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                    .format(financialReport.metrics.paidReceivable)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                    .format(financialReport.metrics.pendingPayable)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pago: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                    .format(financialReport.metrics.paidPayable)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Fluxo de Caixa</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${financialReport.metrics.cashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                    .format(financialReport.metrics.cashFlow)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Receber - Pagar</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Resultado</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${financialReport.metrics.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                    .format(financialReport.metrics.profit)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total período</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Fluxo Diário - Contas a Receber e Pagar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financialReport.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => 
                      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
                    }
                  />
                  <Legend />
                  <Bar dataKey="receber" fill="#22c55e" name="A Receber" />
                  <Bar dataKey="pagar" fill="#ef4444" name="A Pagar" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tables */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contas a Receber</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Restante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialReport.receivables.map((acc) => (
                      <TableRow key={acc.id}>
                        <TableCell className="font-medium">{acc.description}</TableCell>
                        <TableCell>{format(new Date(acc.due_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                            .format(Number(acc.remaining_amount || 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contas a Pagar</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Restante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialReport.payables.map((acc) => (
                      <TableRow key={acc.id}>
                        <TableCell className="font-medium">{acc.description}</TableCell>
                        <TableCell>{format(new Date(acc.due_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                            .format(Number(acc.remaining_amount || 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
