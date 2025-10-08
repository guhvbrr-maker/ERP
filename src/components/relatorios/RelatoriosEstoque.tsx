import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export function RelatoriosEstoque() {
  const { data: stockReport } = useQuery({
    queryKey: ["stock-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stocks")
        .select(`
          id,
          available,
          reserved,
          min_quantity,
          max_quantity,
          products (
            name,
            sku,
            cost_price,
            selling_price,
            categories (
              name
            )
          ),
          warehouses (
            name
          )
        `)
        .order("available", { ascending: true });

      if (error) throw error;

      // Calculate metrics
      const total = data.length;
      const lowStock = data.filter(s => s.available <= (s.min_quantity || 0) && s.available > 0).length;
      const outOfStock = data.filter(s => s.available === 0).length;
      const adequate = data.filter(s => s.available > (s.min_quantity || 0)).length;

      const totalValue = data.reduce((sum, s) => {
        const cost = Number(s.products?.cost_price || 0);
        return sum + (cost * s.available);
      }, 0);

      const totalSellingValue = data.reduce((sum, s) => {
        const price = Number(s.products?.selling_price || 0);
        return sum + (price * s.available);
      }, 0);

      const potentialProfit = totalSellingValue - totalValue;

      // Group by category
      const byCategory: Record<string, { items: number; quantity: number; value: number }> = {};
      data.forEach(s => {
        const cat = s.products?.categories?.name || "Sem Categoria";
        if (!byCategory[cat]) {
          byCategory[cat] = { items: 0, quantity: 0, value: 0 };
        }
        byCategory[cat].items++;
        byCategory[cat].quantity += s.available;
        byCategory[cat].value += (Number(s.products?.cost_price || 0) * s.available);
      });

      return {
        stocks: data,
        metrics: { total, lowStock, outOfStock, adequate, totalValue, totalSellingValue, potentialProfit },
        byCategory: Object.entries(byCategory).map(([name, data]) => ({ name, ...data }))
      };
    },
  });

  const handleExportCSV = () => {
    if (!stockReport?.stocks) return;

    const headers = ["Produto", "SKU", "Categoria", "Depósito", "Disponível", "Reservado", "Mínimo", "Máximo", "Custo Unit.", "Valor Total"];
    const rows = stockReport.stocks.map(s => [
      s.products?.name || "",
      s.products?.sku || "",
      s.products?.categories?.name || "",
      s.warehouses?.name || "",
      s.available,
      s.reserved,
      s.min_quantity || 0,
      s.max_quantity || 0,
      Number(s.products?.cost_price || 0).toFixed(2),
      (Number(s.products?.cost_price || 0) * s.available).toFixed(2)
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-estoque-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const getStockStatus = (available: number, minQuantity: number | null) => {
    if (available === 0) {
      return { label: "Sem Estoque", color: "destructive", icon: XCircle };
    }
    if (available <= (minQuantity || 0)) {
      return { label: "Estoque Baixo", color: "warning", icon: AlertTriangle };
    }
    return { label: "Adequado", color: "success", icon: CheckCircle };
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockReport?.metrics.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estoque Adequado</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stockReport?.metrics.adequate || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">produtos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stockReport?.metrics.lowStock || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">produtos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stockReport?.metrics.outOfStock || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">produtos</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Valor em Estoque (Custo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                .format(stockReport?.metrics.totalValue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Valor de Venda Potencial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                .format(stockReport?.metrics.totalSellingValue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Lucro Potencial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                .format(stockReport?.metrics.potentialProfit || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Category */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Estoque por Categoria</CardTitle>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Itens</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockReport?.byCategory
                .sort((a, b) => b.value - a.value)
                .map((cat) => (
                  <TableRow key={cat.name}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-right">{cat.items}</TableCell>
                    <TableCell className="text-right">{cat.quantity}</TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                        .format(cat.value)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento do Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Depósito</TableHead>
                <TableHead className="text-right">Disponível</TableHead>
                <TableHead className="text-right">Reservado</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockReport?.stocks.map((stock) => {
                const status = getStockStatus(stock.available, stock.min_quantity);
                const StatusIcon = status.icon;
                return (
                  <TableRow key={stock.id}>
                    <TableCell className="font-medium">{stock.products?.name}</TableCell>
                    <TableCell>{stock.products?.sku}</TableCell>
                    <TableCell>{stock.products?.categories?.name || "-"}</TableCell>
                    <TableCell>{stock.warehouses?.name || "-"}</TableCell>
                    <TableCell className="text-right">{stock.available}</TableCell>
                    <TableCell className="text-right">{stock.reserved}</TableCell>
                    <TableCell className="text-right">{stock.min_quantity || 0}</TableCell>
                    <TableCell>
                      <Badge variant={status.color as any} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                        .format((Number(stock.products?.cost_price || 0) * stock.available))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
