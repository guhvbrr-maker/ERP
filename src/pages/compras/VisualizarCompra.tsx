import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function VisualizarCompra() {
  const { token } = useParams();

  const { data: purchase, isLoading } = useQuery({
    queryKey: ["public-purchase", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          *,
          people!purchases_supplier_id_fkey (name, document, phone, email)
        `)
        .eq("access_token", token)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ["public-purchase-items", purchase?.id],
    queryFn: async () => {
      if (!purchase?.id) return [];
      const { data, error } = await supabase
        .from("purchase_items")
        .select("*")
        .eq("purchase_id", purchase.id);

      if (error) throw error;
      return data;
    },
    enabled: !!purchase?.id,
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!purchase) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Pedido não encontrado ou link expirado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">Pedido {purchase.purchase_number}</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Data: {format(new Date(purchase.purchase_date), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">
                {purchase.status === "sent" ? "Aguardando Confirmação" :
                 purchase.status === "confirmed" ? "Confirmado" :
                 purchase.status === "received" ? "Recebido" : "Em Análise"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {purchase.expected_delivery_date && (
                <div>
                  <p className="text-muted-foreground">Previsão de Entrega</p>
                  <p className="font-medium">
                    {format(new Date(purchase.expected_delivery_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              )}
              {purchase.payment_terms && (
                <div>
                  <p className="text-muted-foreground">Condições de Pagamento</p>
                  <p className="font-medium">{purchase.payment_terms}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>R$ {Number(purchase.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-primary">R$ {Number(purchase.total).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Itens do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Preço Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.product_sku}</TableCell>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">R$ {Number(item.unit_price).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">R$ {Number(item.total).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {purchase.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{purchase.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}