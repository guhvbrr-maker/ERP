import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Printer, Edit, Loader2, AlertTriangle } from "lucide-react";
import { ImpressaoVenda } from "@/components/vendas/ImpressaoVenda";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusColors = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

const statusLabels = {
  pending: "Pendente",
  confirmed: "Confirmada",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const DetalheVenda = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: sale, isLoading } = useQuery({
    queryKey: ["sale", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          employees (
            id,
            people (
              name
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["sale_items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_items")
        .select("*")
        .eq("sale_id", id)
        .order("created_at");

      if (error) throw error;
      return data;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["financial_accounts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_accounts")
        .select(`
          *,
          payment_methods(name),
          card_brands(name)
        `)
        .eq("sale_id", id)
        .order("due_date");

      if (error) throw error;
      return data;
    },
  });

  const { data: delivery } = useQuery({
    queryKey: ["sale_delivery", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_deliveries")
        .select("*")
        .eq("sale_id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string; value: string }) => {
      const { error } = await supabase
        .from("sales")
        .update({ [field]: value })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale", id] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Status atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !sale) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ImpressaoVenda 
        sale={sale}
        items={items || []}
        payments={payments || []}
        delivery={delivery}
      />
      
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/vendas")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Venda {sale.sale_number}</h1>
            <p className="text-muted-foreground">
              {new Date(sale.sale_date).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <Alert className="print:hidden">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Gerenciamento Automático de Estoque</AlertTitle>
        <AlertDescription>
          Ao alterar o status para "Confirmada" ou "Concluída", o estoque será automaticamente deduzido. 
          Se cancelar uma venda confirmada, o estoque será restaurado.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-3 gap-4 print:hidden">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status da Venda</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={sale.status}
              onValueChange={(value) =>
                updateStatusMutation.mutate({ field: "status", value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={sale.payment_status}
              onValueChange={(value) =>
                updateStatusMutation.mutate({ field: "payment_status", value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={sale.delivery_status}
              onValueChange={(value) =>
                updateStatusMutation.mutate({ field: "delivery_status", value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="scheduled">Agendada</SelectItem>
                <SelectItem value="in_transit">Em trânsito</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="geral" className="print:hidden">
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="entregas">Entregas</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Nome</div>
                <div className="font-medium">{sale.customer_name}</div>
              </div>
              {sale.customer_document && (
                <div>
                  <div className="text-sm text-muted-foreground">Documento</div>
                  <div className="font-medium">{sale.customer_document}</div>
                </div>
              )}
              {sale.customer_email && (
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{sale.customer_email}</div>
                </div>
              )}
              {sale.customer_phone && (
                <div>
                  <div className="text-sm text-muted-foreground">Telefone</div>
                  <div className="font-medium">{sale.customer_phone}</div>
                </div>
              )}
              {sale.employees && (
                <div>
                  <div className="text-sm text-muted-foreground">Vendedor</div>
                  <div className="font-medium">{sale.employees.people.name}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Itens da Venda</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Preço Unit.</TableHead>
                    <TableHead className="text-right">Desconto</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.product_sku}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(item.unit_price))}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(item.discount))}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(item.total))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end mt-4 pt-4 border-t">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(sale.subtotal))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Desconto:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(sale.discount))}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(sale.total))}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {sale.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{sale.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pagamentos">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Receber</CardTitle>
              <p className="text-sm text-muted-foreground">
                Parcelas e pagamentos vinculados a esta venda
              </p>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma conta a receber registrada para esta venda
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Taxa</TableHead>
                      <TableHead>Líquido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead>Restante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="font-medium">{payment.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {payment.payment_methods?.name}
                            {payment.card_brands && ` - ${payment.card_brands.name}`}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(payment.due_date).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(payment.amount))}
                        </TableCell>
                        <TableCell>
                          {payment.fee_amount > 0 ? (
                            <span className="text-red-500">
                              -{new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(Number(payment.fee_amount))}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(payment.net_amount || payment.amount))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === "paid"
                                ? "default"
                                : payment.status === "partially_paid"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {payment.status === "paid"
                              ? "Pago"
                              : payment.status === "partially_paid"
                              ? "Parcial"
                              : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(payment.paid_amount || 0))}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(payment.remaining_amount || payment.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entregas">
          <Card>
            <CardHeader>
              <CardTitle>Entregas</CardTitle>
            </CardHeader>
            <CardContent>
              {!delivery ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma entrega agendada
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium">
                        Data Agendada:{" "}
                        {new Date(delivery.scheduled_date).toLocaleDateString("pt-BR")}
                      </div>
                      {delivery.delivery_date && (
                        <div className="text-sm text-muted-foreground">
                          Entregue em:{" "}
                          {new Date(delivery.delivery_date).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={delivery.status === "delivered" ? "default" : "outline"}
                    >
                      {delivery.status === "delivered"
                        ? "Entregue"
                        : delivery.status === "in_transit"
                        ? "Em trânsito"
                        : delivery.status === "scheduled"
                        ? "Agendada"
                        : "Pendente"}
                    </Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <div>{delivery.address}</div>
                    {delivery.city && delivery.state && (
                      <div>
                        {delivery.city} - {delivery.state}
                        {delivery.zipcode && ` - CEP: ${delivery.zipcode}`}
                      </div>
                    )}
                    {delivery.notes && (
                      <div className="text-muted-foreground mt-2">{delivery.notes}</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DetalheVenda;
