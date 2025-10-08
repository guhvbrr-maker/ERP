import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Package, Users, AlertTriangle, CheckCircle 
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function DashboardAnalytics() {
  // Sales by month (last 6 months)
  const { data: salesByMonth } = useQuery({
    queryKey: ["analytics-sales-by-month"],
    queryFn: async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date).toISOString();
        const end = endOfMonth(date).toISOString();
        
        const { data, error } = await supabase
          .from("sales")
          .select("total")
          .gte("sale_date", start)
          .lte("sale_date", end)
          .neq("status", "cancelled");
        
        if (error) throw error;
        
        const total = data.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
        months.push({
          month: format(date, "MMM/yy", { locale: ptBR }),
          vendas: total
        });
      }
      return months;
    },
  });

  // Sales by status
  const { data: salesByStatus } = useQuery({
    queryKey: ["analytics-sales-by-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("status, total");
      
      if (error) throw error;
      
      const statusMap: Record<string, { name: string; value: number }> = {};
      data.forEach(sale => {
        if (!statusMap[sale.status]) {
          statusMap[sale.status] = { name: sale.status, value: 0 };
        }
        statusMap[sale.status].value += Number(sale.total || 0);
      });
      
      return Object.values(statusMap).map(item => ({
        name: item.name === "pending" ? "Pendente" :
              item.name === "confirmed" ? "Confirmada" :
              item.name === "completed" ? "Concluída" : "Cancelada",
        value: item.value
      }));
    },
  });

  // Top selling products
  const { data: topProducts } = useQuery({
    queryKey: ["analytics-top-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_items")
        .select(`
          product_name,
          quantity,
          sales!inner(status)
        `);
      
      if (error) throw error;
      
      const productMap: Record<string, number> = {};
      data.forEach(item => {
        if (item.sales.status !== "cancelled") {
          productMap[item.product_name] = (productMap[item.product_name] || 0) + item.quantity;
        }
      });
      
      return Object.entries(productMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, quantity]) => ({ produto: name, quantidade: quantity }));
    },
  });

  // Financial metrics
  const { data: financialMetrics } = useQuery({
    queryKey: ["analytics-financial-metrics"],
    queryFn: async () => {
      const startOfThisMonth = startOfMonth(new Date()).toISOString();
      const startOfThisYear = startOfYear(new Date()).toISOString();
      
      // Receivables
      const { data: receivables } = await supabase
        .from("financial_accounts")
        .select("amount, paid_amount, status")
        .eq("account_type", "receivable");
      
      const totalReceivable = receivables?.reduce((sum, acc) => 
        sum + Number(acc.amount || 0), 0) || 0;
      const paidReceivable = receivables?.reduce((sum, acc) => 
        sum + Number(acc.paid_amount || 0), 0) || 0;
      
      // Payables
      const { data: payables } = await supabase
        .from("financial_accounts")
        .select("amount, paid_amount, status")
        .eq("account_type", "payable");
      
      const totalPayable = payables?.reduce((sum, acc) => 
        sum + Number(acc.amount || 0), 0) || 0;
      const paidPayable = payables?.reduce((sum, acc) => 
        sum + Number(acc.paid_amount || 0), 0) || 0;
      
      // Sales this month
      const { data: salesMonth } = await supabase
        .from("sales")
        .select("total")
        .gte("sale_date", startOfThisMonth)
        .neq("status", "cancelled");
      
      const salesThisMonth = salesMonth?.reduce((sum, sale) => 
        sum + Number(sale.total || 0), 0) || 0;
      
      // Sales this year
      const { data: salesYear } = await supabase
        .from("sales")
        .select("total")
        .gte("sale_date", startOfThisYear)
        .neq("status", "cancelled");
      
      const salesThisYear = salesYear?.reduce((sum, sale) => 
        sum + Number(sale.total || 0), 0) || 0;
      
      return {
        totalReceivable,
        paidReceivable,
        pendingReceivable: totalReceivable - paidReceivable,
        totalPayable,
        paidPayable,
        pendingPayable: totalPayable - paidPayable,
        cashFlow: (totalReceivable - paidReceivable) - (totalPayable - paidPayable),
        salesThisMonth,
        salesThisYear
      };
    },
  });

  // Inventory alerts
  const { data: inventoryAlerts } = useQuery({
    queryKey: ["analytics-inventory-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stocks")
        .select(`
          id,
          available,
          min_quantity,
          products(name)
        `);
      
      if (error) throw error;
      
      const lowStock = data.filter(s => s.available <= (s.min_quantity || 0) && s.available > 0).length;
      const outOfStock = data.filter(s => s.available === 0).length;
      const adequate = data.filter(s => s.available > (s.min_quantity || 0)).length;
      
      return { lowStock, outOfStock, adequate, total: data.length };
    },
  });

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                .format(financialMetrics?.salesThisMonth || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ano: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                .format(financialMetrics?.salesThisYear || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                .format(financialMetrics?.pendingReceivable || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                .format(financialMetrics?.totalReceivable || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                .format(financialMetrics?.pendingPayable || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                .format(financialMetrics?.totalPayable || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fluxo de Caixa</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(financialMetrics?.cashFlow || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
                .format(financialMetrics?.cashFlow || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receber - Pagar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Status */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estoque Adequado</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {inventoryAlerts?.adequate || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">produtos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {inventoryAlerts?.lowStock || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">produtos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {inventoryAlerts?.outOfStock || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">produtos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventoryAlerts?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">cadastrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales by Month */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Vendas (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => 
                    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
                  }
                />
                <Legend />
                <Line type="monotone" dataKey="vendas" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {salesByStatus?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => 
                    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top 10 Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="produto" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantidade" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
