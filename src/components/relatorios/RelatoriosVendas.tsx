import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Filter, TrendingUp, Users, DollarSign, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function RelatoriosVendas() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [employeeId, setEmployeeId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const { data: employees } = useQuery({
    queryKey: ["employees-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, people(name)")
        .order("people(name)");
      if (error) throw error;
      return data;
    },
  });

  const { data: salesReport, refetch } = useQuery({
    queryKey: ["sales-report", startDate, endDate, employeeId, status],
    queryFn: async () => {
      let query = supabase
        .from("sales")
        .select(`
          id,
          sale_number,
          sale_date,
          customer_name,
          total,
          status,
          employees(id, people(name))
        `)
        .order("sale_date", { ascending: false });

      if (startDate) query = query.gte("sale_date", startDate);
      if (endDate) query = query.lte("sale_date", endDate);
      if (employeeId !== "all") query = query.eq("employee_id", employeeId);
      if (status !== "all") query = query.eq("status", status);

      const { data, error } = await query;
      if (error) throw error;

      // Calculate metrics
      const total = data.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
      const count = data.length;
      const avgTicket = count > 0 ? total / count : 0;

      // Group by employee
      const byEmployee: Record<string, { name: string; sales: number; total: number }> = {};
      data.forEach(sale => {
        const empId = sale.employees?.id || "sem-vendedor";
        const empName = sale.employees?.people?.name || "Sem Vendedor";
        if (!byEmployee[empId]) {
          byEmployee[empId] = { name: empName, sales: 0, total: 0 };
        }
        byEmployee[empId].sales++;
        byEmployee[empId].total += Number(sale.total || 0);
      });

      // Group by status
      const byStatus: Record<string, number> = {};
      data.forEach(sale => {
        byStatus[sale.status] = (byStatus[sale.status] || 0) + 1;
      });

      return {
        sales: data,
        metrics: { total, count, avgTicket },
        byEmployee: Object.entries(byEmployee).map(([id, data]) => ({ id, ...data })),
        byStatus
      };
    },
    enabled: false,
  });

  const handleGenerateReport = () => {
    refetch();
  };

  const handleExportCSV = () => {
    if (!salesReport?.sales) return;

    const headers = ["Número", "Data", "Cliente", "Vendedor", "Status", "Total"];
    const rows = salesReport.sales.map(sale => [
      sale.sale_number,
      format(new Date(sale.sale_date), "dd/MM/yyyy"),
      sale.customer_name,
      sale.employees?.people?.name || "Sem vendedor",
      sale.status === "pending" ? "Pendente" :
      sale.status === "confirmed" ? "Confirmada" :
      sale.status === "completed" ? "Concluída" : "Cancelada",
      Number(sale.total || 0).toFixed(2)
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-vendas-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmada",
    completed: "Concluída",
    cancelled: "Cancelada",
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
          <div className="grid gap-4 md:grid-cols-4">
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
            <div className="space-y-2">
              <Label>Vendedor</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.people?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleGenerateReport}>
              <Filter className="mr-2 h-4 w-4" />
              Gerar Relatório
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              disabled={!salesReport?.sales?.length}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      {salesReport && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total em Vendas</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                    .format(salesReport.metrics.total)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Número de Vendas</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesReport.metrics.count}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                    .format(salesReport.metrics.avgTicket)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Vendedores Ativos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesReport.byEmployee.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance by Employee */}
          <Card>
            <CardHeader>
              <CardTitle>Performance por Vendedor</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReport.byEmployee
                    .sort((a, b) => b.total - a.total)
                    .map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell className="text-right">{emp.sales}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                            .format(emp.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                            .format(emp.total / emp.sales)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Sales List */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReport.sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.sale_number}</TableCell>
                      <TableCell>{format(new Date(sale.sale_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>{sale.customer_name}</TableCell>
                      <TableCell>{sale.employees?.people?.name || "Sem vendedor"}</TableCell>
                      <TableCell>{statusLabels[sale.status] || sale.status}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                          .format(Number(sale.total || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
