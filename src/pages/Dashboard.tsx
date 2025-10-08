import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  Truck,
  Package,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: salesThisMonth } = useQuery({
    queryKey: ["sales-this-month"],
    queryFn: async () => {
      const startDate = startOfMonth(new Date()).toISOString();
      const endDate = endOfMonth(new Date()).toISOString();

      const { data, error } = await supabase
        .from("sales")
        .select("total")
        .gte("sale_date", startDate)
        .lte("sale_date", endDate)
        .neq("status", "cancelled");

      if (error) throw error;

      const total = data.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
      return total;
    },
  });

  const { data: salesLastMonth } = useQuery({
    queryKey: ["sales-last-month"],
    queryFn: async () => {
      const lastMonth = subMonths(new Date(), 1);
      const startDate = startOfMonth(lastMonth).toISOString();
      const endDate = endOfMonth(lastMonth).toISOString();

      const { data, error } = await supabase
        .from("sales")
        .select("total")
        .gte("sale_date", startDate)
        .lte("sale_date", endDate)
        .neq("status", "cancelled");

      if (error) throw error;

      const total = data.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
      return total;
    },
  });

  const { data: activeSales } = useQuery({
    queryKey: ["active-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("id, created_at")
        .in("status", ["confirmed", "in_production", "ready_for_delivery"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      const today = new Date().toISOString().split("T")[0];
      const todayCount = data.filter(s => s.created_at.startsWith(today)).length;

      return { total: data.length, today: todayCount };
    },
  });

  const { data: pendingDeliveries } = useQuery({
    queryKey: ["pending-deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_deliveries")
        .select("id, scheduled_date, status")
        .in("status", ["pending", "scheduled"])
        .order("scheduled_date");

      if (error) throw error;

      const today = new Date().toISOString().split("T")[0];
      const todayCount = data.filter(d => d.scheduled_date === today).length;

      return { total: data.length, today: todayCount };
    },
  });

  const { data: stockStatus } = useQuery({
    queryKey: ["stock-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stocks")
        .select("id, available, min_quantity");

      if (error) throw error;

      const lowStock = data.filter(s =>
        s.available <= (s.min_quantity || 0) && s.available > 0
      ).length;

      return { total: data.length, lowStock };
    },
  });

  const { data: recentSales } = useQuery({
    queryKey: ["recent-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("id, sale_number, customer_name, total, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const { data: lowStockProducts } = useQuery({
    queryKey: ["low-stock-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stocks")
        .select(`
          id,
          available,
          min_quantity,
          products (
            name,
            categories (
              name
            )
          )
        `)
        .order("available", { ascending: true })
        .limit(5);

      if (error) throw error;

      return data.filter(s => s.available <= (s.min_quantity || 0));
    },
  });

  const { data: customersCount } = useQuery({
    queryKey: ["customers-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, created_at");

      if (error) throw error;

      const startOfThisMonth = startOfMonth(new Date()).toISOString();
      const newThisMonth = data.filter(c => c.created_at >= startOfThisMonth).length;

      return { total: data.length, newThisMonth };
    },
  });

  const salesChange = salesLastMonth && salesThisMonth
    ? ((salesThisMonth - salesLastMonth) / salesLastMonth * 100).toFixed(1)
    : "0";

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Orçamento",
      confirmed: "Confirmado",
      in_production: "Em Produção",
      ready_for_delivery: "Aguardando Entrega",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return statusMap[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema Móveis Karina</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Última atualização: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-base hover:shadow-medium cursor-pointer" onClick={() => navigate("/vendas")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas do Mês
            </CardTitle>
            <DollarSign className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(salesThisMonth || 0)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm">
              {Number(salesChange) >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className={Number(salesChange) >= 0 ? "text-success" : "text-destructive"}>
                {salesChange}% vs. mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-base hover:shadow-medium cursor-pointer" onClick={() => navigate("/vendas")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos Ativos
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {activeSales?.total || 0}
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-primary">
                {activeSales?.today || 0} hoje
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-base hover:shadow-medium cursor-pointer" onClick={() => navigate("/entregas")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Entregas Pendentes
            </CardTitle>
            <Truck className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {pendingDeliveries?.total || 0}
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm text-warning">
              {pendingDeliveries?.today || 0} agendadas hoje
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-base hover:shadow-medium cursor-pointer" onClick={() => navigate("/estoque")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Itens em Estoque
            </CardTitle>
            <Package className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stockStatus?.total || 0}
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-destructive">
                {stockStatus?.lowStock || 0} abaixo do mínimo
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Pedidos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!recentSales || recentSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum pedido recente
              </div>
            ) : (
              <div className="space-y-4">
                {recentSales.map((sale: any) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted cursor-pointer"
                    onClick={() => navigate(`/vendas/${sale.id}`)}
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {sale.sale_number} - {sale.customer_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getStatusLabel(sale.status)}
                      </p>
                    </div>
                    <p className="font-semibold text-primary">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(sale.total || 0))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alertas de Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!lowStockProducts || lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum alerta de estoque
              </div>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:bg-muted"
                    onClick={() => navigate("/estoque")}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {item.products?.name || "Produto sem nome"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.products?.categories?.name || "Sem categoria"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-warning">
                        {item.available}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Mín: {item.min_quantity || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/pessoas/clientes")}>
          <CardHeader>
            <CardTitle className="text-base">Clientes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {customersCount?.total || 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  +{customersCount?.newThisMonth || 0} este mês
                </p>
              </div>
              <Users className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/vendas")}>
          <CardHeader>
            <CardTitle className="text-base">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {activeSales && customersCount
                    ? Math.round((activeSales.total / Math.max(customersCount.total, 1)) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-success">Pedidos / Clientes</p>
              </div>
              <TrendingUp className="h-12 w-12 text-success opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/vendas")}>
          <CardHeader>
            <CardTitle className="text-base">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {activeSales && salesThisMonth
                    ? new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(salesThisMonth / Math.max(activeSales.total, 1))
                    : "R$ 0,00"}
                </p>
                <p className="text-sm text-muted-foreground">Média do mês</p>
              </div>
              <DollarSign className="h-12 w-12 text-accent opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
