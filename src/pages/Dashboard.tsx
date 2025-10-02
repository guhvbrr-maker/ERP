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

const Dashboard = () => {
  const kpis = [
    {
      title: "Vendas do Mês",
      value: "R$ 287.450,00",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "Pedidos Ativos",
      value: "43",
      change: "+8 hoje",
      trend: "up",
      icon: ShoppingCart,
      color: "text-primary",
    },
    {
      title: "Entregas Pendentes",
      value: "18",
      change: "7 agendadas hoje",
      trend: "neutral",
      icon: Truck,
      color: "text-warning",
    },
    {
      title: "Itens em Estoque",
      value: "1.247",
      change: "23 abaixo do mínimo",
      trend: "down",
      icon: Package,
      color: "text-destructive",
    },
  ];

  const recentOrders = [
    { id: "#2451", client: "Maria Silva", value: "R$ 8.450,00", status: "Em Produção" },
    { id: "#2452", client: "João Santos", value: "R$ 3.200,00", status: "Aguardando Entrega" },
    { id: "#2453", client: "Ana Costa", value: "R$ 12.800,00", status: "Em Montagem" },
    { id: "#2454", client: "Carlos Oliveira", value: "R$ 5.600,00", status: "Confirmado" },
    { id: "#2455", client: "Juliana Lima", value: "R$ 9.200,00", status: "Orçamento" },
  ];

  const lowStockItems = [
    { product: "Sofá Retrátil Premium", category: "Sala", stock: 2, min: 5 },
    { product: "Guarda-Roupa Casal 6P", category: "Quarto", stock: 1, min: 3 },
    { product: "Mesa Jantar 6 Lugares", category: "Cozinha", stock: 3, min: 4 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema Móveis Karina</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Última atualização: Hoje, 14:32</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend === "up" ? TrendingUp : kpi.trend === "down" ? TrendingDown : null;
          
          return (
            <Card key={kpi.title} className="transition-all duration-base hover:shadow-medium">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                <div className="mt-1 flex items-center gap-1 text-sm">
                  {TrendIcon && <TrendIcon className={`h-4 w-4 ${kpi.color}`} />}
                  <span className={kpi.color}>{kpi.change}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Pedidos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                >
                  <div>
                    <p className="font-medium text-foreground">{order.id} - {order.client}</p>
                    <p className="text-sm text-muted-foreground">{order.status}</p>
                  </div>
                  <p className="font-semibold text-primary">{order.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alertas de Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.product}</p>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-warning">{item.stock}</p>
                    <p className="text-xs text-muted-foreground">Mín: {item.min}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Clientes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">847</p>
                <p className="text-sm text-muted-foreground">+32 este mês</p>
              </div>
              <Users className="h-12 w-12 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">68%</p>
                <p className="text-sm text-success">+5% vs. mês anterior</p>
              </div>
              <TrendingUp className="h-12 w-12 text-success opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground">R$ 6.687</p>
                <p className="text-sm text-success">+R$ 420</p>
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
