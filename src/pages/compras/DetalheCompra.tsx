import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Package,
  TruckIcon,
  CheckCircle2,
  XCircle,
  Send,
  Link2,
  Copy,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function DetalheCompra() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [receivingDialogOpen, setReceivingDialogOpen] = useState(false);

  const { data: purchase, isLoading } = useQuery({
    queryKey: ["purchase", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          *,
          people!purchases_supplier_id_fkey (
            name,
            document,
            phone,
            email,
            address,
            city,
            state
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ["purchase-items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_items")
        .select("*")
        .eq("purchase_id", id)
        .order("created_at");

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from("purchases")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado!");
      queryClient.invalidateQueries({ queryKey: ["purchase", id] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const generateAccessToken = useMutation({
    mutationFn: async () => {
      const { data: token, error: tokenError } = await supabase.rpc(
        "generate_purchase_access_token"
      );
      if (tokenError) throw tokenError;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      const { error } = await supabase
        .from("purchases")
        .update({
          access_token: token,
          token_expires_at: expiresAt.toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      return token;
    },
    onSuccess: () => {
      toast.success("Link de acesso gerado!");
      queryClient.invalidateQueries({ queryKey: ["purchase", id] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao gerar link: ${error.message}`);
    },
  });

  const updateItemReceived = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const { error } = await supabase
        .from("purchase_items")
        .update({ received_quantity: quantity })
        .eq("id", itemId);

      if (error) throw error;

      // Check if all items are fully received
      const { data: allItems } = await supabase
        .from("purchase_items")
        .select("quantity, received_quantity")
        .eq("purchase_id", id);

      const allReceived = allItems?.every(
        (item: any) => item.received_quantity >= item.quantity
      );
      const partiallyReceived = allItems?.some(
        (item: any) => item.received_quantity > 0
      );

      if (allReceived) {
        await supabase
          .from("purchases")
          .update({ 
            status: "received",
            actual_delivery_date: new Date().toISOString().split('T')[0]
          })
          .eq("id", id);
      } else if (partiallyReceived) {
        await supabase
          .from("purchases")
          .update({ status: "partially_received" })
          .eq("id", id);
      }
    },
    onSuccess: () => {
      toast.success("Quantidade recebida atualizada!");
      queryClient.invalidateQueries({ queryKey: ["purchase-items", id] });
      queryClient.invalidateQueries({ queryKey: ["purchase", id] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const copyAccessLink = () => {
    if (purchase?.access_token) {
      const link = `${window.location.origin}/compras/visualizar/${purchase.access_token}`;
      navigator.clipboard.writeText(link);
      toast.success("Link copiado!");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "outline" | "destructive"; label: string; icon: any }
    > = {
      draft: { variant: "secondary", label: "Rascunho", icon: Package },
      sent: { variant: "default", label: "Enviado", icon: TruckIcon },
      confirmed: { variant: "default", label: "Confirmado", icon: CheckCircle2 },
      partially_received: { variant: "outline", label: "Parcialmente Recebido", icon: Package },
      received: { variant: "default", label: "Recebido", icon: CheckCircle2 },
      cancelled: { variant: "destructive", label: "Cancelado", icon: XCircle },
    };

    const { variant, label, icon: Icon } = variants[status] || variants.draft;

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!purchase) {
    return <div className="text-center py-8">Compra não encontrada</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/compras")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {purchase.purchase_number}
            </h1>
            <p className="text-muted-foreground">{purchase.people?.name}</p>
          </div>
          {getStatusBadge(purchase.status)}
        </div>

        <div className="flex gap-2">
          {purchase.status === "draft" && (
            <Button onClick={() => updateStatusMutation.mutate("sent")}>
              <Send className="mr-2 h-4 w-4" />
              Enviar ao Fornecedor
            </Button>
          )}
          {purchase.status === "sent" && !purchase.access_token && (
            <Button onClick={() => generateAccessToken.mutate()}>
              <Link2 className="mr-2 h-4 w-4" />
              Gerar Link de Acesso
            </Button>
          )}
          {purchase.access_token && (
            <Button onClick={copyAccessLink} variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Copiar Link
            </Button>
          )}
          <Dialog open={receivingDialogOpen} onOpenChange={setReceivingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Receber Mercadoria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Recebimento de Mercadoria</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {items?.map((item: any) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.product_sku}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Pedido</p>
                            <p className="font-medium">{item.quantity}</p>
                          </div>
                          <div className="w-32">
                            <Label htmlFor={`received-${item.id}`}>Recebido</Label>
                            <Input
                              id={`received-${item.id}`}
                              type="number"
                              min="0"
                              max={item.quantity}
                              defaultValue={item.received_quantity}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value);
                                if (value !== item.received_quantity) {
                                  updateItemReceived.mutate({
                                    itemId: item.id,
                                    quantity: value,
                                  });
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Fornecedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="font-medium">{purchase.people?.name}</p>
              {purchase.people?.document && (
                <p className="text-muted-foreground">CNPJ: {purchase.people.document}</p>
              )}
            </div>
            {purchase.people?.phone && (
              <p className="text-muted-foreground">Tel: {purchase.people.phone}</p>
            )}
            {purchase.people?.email && (
              <p className="text-muted-foreground">Email: {purchase.people.email}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Datas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-muted-foreground">Data do Pedido</p>
              <p className="font-medium">
                {format(new Date(purchase.purchase_date), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            {purchase.expected_delivery_date && (
              <div>
                <p className="text-muted-foreground">Previsão de Entrega</p>
                <p className="font-medium">
                  {format(new Date(purchase.expected_delivery_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
            {purchase.actual_delivery_date && (
              <div>
                <p className="text-muted-foreground">Data de Recebimento</p>
                <p className="font-medium">
                  {format(new Date(purchase.actual_delivery_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Valores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>R$ {Number(purchase.subtotal).toFixed(2)}</span>
            </div>
            {Number(purchase.discount) > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Desconto:</span>
                <span>- R$ {Number(purchase.discount).toFixed(2)}</span>
              </div>
            )}
            {Number(purchase.shipping_cost) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete:</span>
                <span>R$ {Number(purchase.shipping_cost).toFixed(2)}</span>
              </div>
            )}
            {Number(purchase.other_costs) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outros:</span>
                <span>R$ {Number(purchase.other_costs).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total:</span>
              <span className="text-primary">R$ {Number(purchase.total).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Itens</TabsTrigger>
          <TabsTrigger value="info">Informações Adicionais</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd. Pedida</TableHead>
                    <TableHead className="text-right">Qtd. Recebida</TableHead>
                    <TableHead className="text-right">Preço Unit.</TableHead>
                    <TableHead className="text-right">Desconto</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.product_sku}</TableCell>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            item.received_quantity >= item.quantity
                              ? "default"
                              : item.received_quantity > 0
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {item.received_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {parseFloat(item.unit_price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {parseFloat(item.discount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {parseFloat(item.total).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Condições de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {purchase.payment_terms || "Não informado"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {purchase.notes || "Nenhuma observação"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      {purchase.status !== "cancelled" && purchase.status !== "received" && (
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Select
                onValueChange={(value) => updateStatusMutation.mutate(value)}
                value={purchase.status}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Alterar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="partially_received">Parcialmente Recebido</SelectItem>
                  <SelectItem value="received">Recebido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}