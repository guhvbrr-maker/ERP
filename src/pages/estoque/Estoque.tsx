import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Package, AlertTriangle, TrendingDown } from "lucide-react";

const Estoque = () => {
  const [search, setSearch] = useState("");

  const { data: stocks = [], isLoading } = useQuery({
    queryKey: ["stocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stocks")
        .select(`
          *,
          products (id, name, sku),
          warehouses (id, name)
        `)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredStocks = stocks.filter((stock: any) =>
    stock.products?.name.toLowerCase().includes(search.toLowerCase()) ||
    stock.products?.sku.toLowerCase().includes(search.toLowerCase())
  );

  const totalProducts = stocks.length;
  const lowStockItems = stocks.filter((s: any) => 
    s.available <= (s.min_quantity || 0)
  ).length;
  const outOfStockItems = stocks.filter((s: any) => s.available <= 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Controle de Estoque</h1>
        <p className="text-muted-foreground">Gerencie o estoque de produtos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos em Estoque</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredStocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum produto encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Depósito</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Reservado</TableHead>
                  <TableHead className="text-right">Disponível</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStocks.map((stock: any) => {
                  const available = stock.available || 0;
                  const minQty = stock.min_quantity || 0;
                  
                  let status = "normal";
                  let statusColor = "default";
                  
                  if (available <= 0) {
                    status = "Sem estoque";
                    statusColor = "destructive";
                  } else if (available <= minQty) {
                    status = "Estoque baixo";
                    statusColor = "warning";
                  } else {
                    status = "Normal";
                    statusColor = "success";
                  }

                  return (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">
                        {stock.products?.name}
                      </TableCell>
                      <TableCell>{stock.products?.sku}</TableCell>
                      <TableCell>{stock.warehouses?.name}</TableCell>
                      <TableCell className="text-right">
                        {Number(stock.quantity || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(stock.reserved || 0)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(available)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColor as any}>{status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Estoque;