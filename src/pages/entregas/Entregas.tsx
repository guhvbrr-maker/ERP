import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Calendar, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Entregas = () => {
  const { data: deliveries = [] } = useQuery({
    queryKey: ["sale_deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_deliveries")
        .select(`
          *,
          sales (
            id,
            sale_number,
            customer_name
          )
        `)
        .order("scheduled_date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const pendingCount = deliveries.filter((d: any) => d.status === "pending").length;
  const scheduledCount = deliveries.filter((d: any) => d.status === "scheduled").length;
  const inTransitCount = deliveries.filter((d: any) => d.status === "in_transit").length;
  const deliveredCount = deliveries.filter((d: any) => d.status === "delivered").length;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: "Pendente", variant: "secondary" },
      scheduled: { label: "Agendado", variant: "default" },
      in_transit: { label: "Em Trânsito", variant: "warning" },
      delivered: { label: "Entregue", variant: "success" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    
    const status_info = statusMap[status] || statusMap.pending;
    return <Badge variant={status_info.variant}>{status_info.label}</Badge>;
  };

  const renderDeliveriesTable = (filteredDeliveries: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Venda</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Endereço</TableHead>
          <TableHead>Data Agendada</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredDeliveries.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
              Nenhuma entrega encontrada
            </TableCell>
          </TableRow>
        ) : (
          filteredDeliveries.map((delivery: any) => (
            <TableRow key={delivery.id}>
              <TableCell className="font-medium">
                {delivery.sales?.sale_number}
              </TableCell>
              <TableCell>{delivery.sales?.customer_name}</TableCell>
              <TableCell>
                <div className="max-w-xs truncate">{delivery.address}</div>
                {delivery.city && delivery.state && (
                  <div className="text-sm text-muted-foreground">
                    {delivery.city} - {delivery.state}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(delivery.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>{getStatusBadge(delivery.status)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Entregas e Montagens</h1>
        <p className="text-muted-foreground">Gestão de entregas e agendamentos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{scheduledCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
            <Truck className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inTransitCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{deliveredCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entregas</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="scheduled">Agendadas</TabsTrigger>
              <TabsTrigger value="in_transit">Em Trânsito</TabsTrigger>
              <TabsTrigger value="delivered">Entregues</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {renderDeliveriesTable(deliveries)}
            </TabsContent>
            
            <TabsContent value="pending">
              {renderDeliveriesTable(
                deliveries.filter((d: any) => d.status === "pending")
              )}
            </TabsContent>
            
            <TabsContent value="scheduled">
              {renderDeliveriesTable(
                deliveries.filter((d: any) => d.status === "scheduled")
              )}
            </TabsContent>
            
            <TabsContent value="in_transit">
              {renderDeliveriesTable(
                deliveries.filter((d: any) => d.status === "in_transit")
              )}
            </TabsContent>
            
            <TabsContent value="delivered">
              {renderDeliveriesTable(
                deliveries.filter((d: any) => d.status === "delivered")
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Entregas;