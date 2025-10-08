import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Truck, Calendar, CheckCircle2, Clock, Hammer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Entregas = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
          ),
          delivery_employee:employees!delivery_employee_id (
            id,
            person_id,
            people (
              name
            )
          )
        `)
        .order("scheduled_date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          id,
          people (
            name
          )
        `)
        .order("people(name)");
      
      if (error) throw error;
      return data;
    },
  });

  const updateDeliveryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from("sale_deliveries")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale_deliveries"] });
      toast({
        title: "Entrega atualizada",
        description: "As informações da entrega foram atualizadas com sucesso.",
      });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar entrega",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createAssemblyMutation = useMutation({
    mutationFn: async (deliveryId: string) => {
      // Get delivery and sale items info
      const { data: delivery, error: deliveryError } = await supabase
        .from("sale_deliveries")
        .select(`
          *,
          sales (
            id,
            sale_items (
              product_id,
              product_name
            )
          )
        `)
        .eq("id", deliveryId)
        .single();
      
      if (deliveryError) throw deliveryError;

      // Create assemblies for each product
      const assemblies = delivery.sales.sale_items.map((item: any) => ({
        sale_id: delivery.sale_id,
        sale_delivery_id: deliveryId,
        product_id: item.product_id,
        product_name: item.product_name,
        status: "pending",
      }));

      const { error } = await supabase
        .from("assemblies")
        .insert(assemblies);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale_deliveries"] });
      toast({
        title: "Montagem criada",
        description: "As montagens foram criadas com sucesso.",
      });
      navigate("/montagens");
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar montagem",
        description: error.message,
        variant: "destructive",
      });
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
          <TableHead>Entregador / Prioridade</TableHead>
          <TableHead>Montagem</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredDeliveries.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
               <TableCell>
                 <div className="space-y-1">
                   {delivery.delivery_employee?.people?.name || (
                     <span className="text-muted-foreground text-sm">Não atribuído</span>
                   )}
                   {delivery.priority && delivery.priority !== "normal" && (
                     <div>
                       <Badge
                         variant={
                           delivery.priority === "urgent"
                             ? "destructive"
                             : delivery.priority === "high"
                             ? "warning"
                             : "secondary"
                         }
                       >
                         {delivery.priority === "urgent"
                           ? "Urgente"
                           : delivery.priority === "high"
                           ? "Alta"
                           : delivery.priority === "low"
                           ? "Baixa"
                           : "Normal"}
                       </Badge>
                     </div>
                   )}
                 </div>
               </TableCell>
              <TableCell>
                {delivery.requires_assembly ? (
                  <Badge variant="secondary">
                    <Hammer className="h-3 w-3 mr-1" />
                    Requer
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">Não requer</span>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(delivery.status)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedDelivery(delivery);
                      setEditDialogOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  {delivery.requires_assembly && (
                    <Button
                      size="sm"
                      onClick={() => createAssemblyMutation.mutate(delivery.id)}
                    >
                      <Hammer className="h-4 w-4 mr-1" />
                      Criar Montagem
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Entregas e Montagens</h1>
          <p className="text-muted-foreground">Gestão de entregas e agendamentos</p>
        </div>
        <Button onClick={() => navigate("/montagens")}>
          <Hammer className="h-4 w-4 mr-2" />
          Ver Montagens
        </Button>
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Entrega</DialogTitle>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              {/* Mostrar preferências de entrega se existirem */}
              {selectedDelivery.delivery_preferences && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <Label className="text-sm font-medium">Preferências de Entrega do Cliente:</Label>
                  <div className="text-sm space-y-1">
                    {selectedDelivery.delivery_preferences.days
                      ?.filter((d: any) => d.enabled)
                      .map((day: any) => (
                        <div key={day.day} className="flex items-center gap-2">
                          <span className="font-medium">
                            {
                              {
                                monday: "Segunda",
                                tuesday: "Terça",
                                wednesday: "Quarta",
                                thursday: "Quinta",
                                friday: "Sexta",
                                saturday: "Sábado",
                                sunday: "Domingo",
                              }[day.day]
                            }
                            :
                          </span>
                          <span>
                            {day.timeSlots
                              ?.map((slot: any) => {
                                if (slot.period === "custom") {
                                  return `${slot.customStart || ""}-${slot.customEnd || ""}`;
                                }
                                return {
                                  morning: "Manhã",
                                  afternoon: "Tarde",
                                  evening: "Noite",
                                }[slot.period];
                              })
                              .join(", ")}
                          </span>
                        </div>
                      ))}
                    {selectedDelivery.delivery_preferences.notes && (
                      <div className="text-muted-foreground italic">
                        Obs: {selectedDelivery.delivery_preferences.notes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Entregador</Label>
                <Select
                  value={selectedDelivery.delivery_employee_id || ""}
                  onValueChange={(value) =>
                    setSelectedDelivery({ ...selectedDelivery, delivery_employee_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o entregador" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.people.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Comissão de Entrega (R$)</Label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedDelivery.delivery_commission_amount || 0}
                  onChange={(e) =>
                    setSelectedDelivery({
                      ...selectedDelivery,
                      delivery_commission_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requires_assembly"
                  checked={selectedDelivery.requires_assembly || false}
                  onCheckedChange={(checked) =>
                    setSelectedDelivery({ ...selectedDelivery, requires_assembly: checked })
                  }
                />
                <Label htmlFor="requires_assembly">Requer montagem</Label>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={selectedDelivery.priority || "normal"}
                  onValueChange={(value) =>
                    setSelectedDelivery({ ...selectedDelivery, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedDelivery.status}
                  onValueChange={(value) =>
                    setSelectedDelivery({ ...selectedDelivery, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="scheduled">Agendado</SelectItem>
                    <SelectItem value="in_transit">Em Trânsito</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() =>
                    updateDeliveryMutation.mutate({
                      id: selectedDelivery.id,
                      updates: {
                        delivery_employee_id: selectedDelivery.delivery_employee_id,
                        delivery_commission_amount: selectedDelivery.delivery_commission_amount,
                        requires_assembly: selectedDelivery.requires_assembly,
                        priority: selectedDelivery.priority,
                        status: selectedDelivery.status,
                      },
                    })
                  }
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Entregas;