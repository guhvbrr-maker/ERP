import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, ShoppingBag, DollarSign, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function RelatoriosCompras() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: purchaseReport, refetch } = useQuery({
    queryKey: ["purchase-report", startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("purchases")
        .select(`
          id,
          purchase_number,
          purchase_date,
          expected_delivery_date,
          actual_delivery_date,
          status,
          total,
          people (
            name
          )
        `)
        .order("purchase_date", { ascending: false });

      if (startDate) query = query.gte("purchase_date", startDate);
      if (endDate) query = query.lte("purchase_date", endDate);

      const { data, error } = await query;
      if (error) throw error;

      // Get purchase items
      const purchaseIds = data.map(p => p.id);
      const { data: items, error: itemsError } = await supabase
        .from("purchase_items")
        .select(`
          purchase_id,
          product_name,
          quantity,
          unit_price
        `)
        .in("purchase_id", purchaseIds);

      if (itemsError) throw itemsError;

      // Calculate metrics
      const total = data.reduce((sum, p) => sum + Number(p.total || 0), 0);
      const count = data.length;
      const avgValue = count > 0 ? total / count : 0;

      // Group by status
      const byStatus: Record<string, { count: number; total: number }> = {};
      data.forEach(p => {
        if (!byStatus[p.status]) {
          byStatus[p.status] = { count: 0, total: 0 };
        }
        byStatus[p.status].count++;
        byStatus[p.status].total += Number(p.total || 0);
      });

      // Group by supplier
      const bySupplier: Record<string, { name: string; purchases: number; total: number }> = {};
      data.forEach(p => {
        const supplierId = p.people?.name || "Sem Fornecedor";
        if (!bySupplier[supplierId]) {
          bySupplier[supplierId] = { name: supplierId, purchases: 0, total: 0 };
        }
        bySupplier[supplierId].purchases++;
        bySupplier[supplierId].total += Number(p.total || 0);
      });

      // Top purchased products
      const productMap: Record<string, { quantity: number; value: number }> = {};
      items?.forEach(item => {
        if (!productMap[item.product_name]) {
          productMap[item.product_name] = { quantity: 0, value: 0 };
        }
        productMap[item.product_name].quantity += item.quantity;
        productMap[item.product_name].value += item.quantity * Number(item.unit_price || 0);
      });

      const topProducts = Object.entries(productMap)
        .sort(([, a], [, b]) => b.value - a.value)
        .slice(0, 10)
        .map(([name, data]) => ({ name, ...data }));

      return {
        purchases: data,
        metrics: { total, count, avgValue },
        byStatus,
        bySupplier: Object.values(bySupplier).sort((a, b) => b.total - a.total),
        topProducts
      };
    },
    enabled: false,
  });

  const handleGenerateReport = () => {
    refetch();
  };

  const handleExportCSV = () => {
    if (!purchaseReport?.purchases) return;

    const headers = ["Número", "Data", "Fornecedor", "Status", "Total"];
    const rows = purchaseReport.purchases.map(p => [
      p.purchase_number,
      format(new Date(p.purchase_date), "dd/MM/yyyy"),
      p.people?.name || "Sem fornecedor",
      p.status,
      Number(p.total || 0).toFixed(2)
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-compras-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const statusLabels: Record<string, string> = {
    draft: "Rascunho",
    sent: "Enviado",
    confirmed: "Confirmado",
    partially_received: "Parcialmente Recebido",
    received: "Recebido",
    cancelled: "Cancelado",
  };

  const statusColors: Record<string, string> = {
    draft: "secondary",
    sent: "default",
    confirmed: "info",
    partially_received: "warning",
    received: "success",
    cancelled: "destructive",
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
                  disabled={!purchaseReport}
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
      {purchaseReport && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total em Compras</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                    .format(purchaseReport.metrics.total)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Número de Compras</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {purchaseReport.metrics.count}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valor Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                    .format(purchaseReport.metrics.avgValue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {purchaseReport.bySupplier.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* By Supplier */}
          <Card>
            <CardHeader>
              <CardTitle>Compras por Fornecedor</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Compras</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseReport.bySupplier.map((supplier, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell className="text-right">{supplier.purchases}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                          .format(supplier.total)}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                          .format(supplier.total / supplier.purchases)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Produtos Comprados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseReport.topProducts.map((product, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">{product.quantity}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                          .format(product.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Purchase List */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento de Compras</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseReport.purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.purchase_number}</TableCell>
                      <TableCell>{format(new Date(purchase.purchase_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>{purchase.people?.name || "Sem fornecedor"}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[purchase.status] as any}>
                          {statusLabels[purchase.status] || purchase.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                          .format(Number(purchase.total || 0))}
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
