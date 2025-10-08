import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

interface PurchaseItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export default function NovaCompra() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const suggestions = location.state?.suggestions || [];

  const [supplierId, setSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [discount, setDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [otherCosts, setOtherCosts] = useState(0);
  const [notes, setNotes] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("people")
        .select("id, name, document")
        .eq("type", "supplier")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products-for-purchase"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, cost_price")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Load suggestions into items on mount
  useEffect(() => {
    if (suggestions.length > 0) {
      const suggestionItems: PurchaseItem[] = suggestions.map((s: any) => ({
        product_id: s.products.id,
        product_name: s.products.name,
        product_sku: s.products.sku,
        quantity: s.suggested_quantity,
        unit_price: s.products.cost_price || 0,
        discount: 0,
        total: (s.suggested_quantity * (s.products.cost_price || 0)),
      }));
      setItems(suggestionItems);
    }
  }, [suggestions]);

  const addItem = () => {
    setItems([
      ...items,
      {
        product_id: "",
        product_name: "",
        product_sku: "",
        quantity: 1,
        unit_price: 0,
        discount: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    
    if (field === "product_id") {
      const product = products?.find((p) => p.id === value);
      if (product) {
        newItems[index].product_id = product.id;
        newItems[index].product_name = product.name;
        newItems[index].product_sku = product.sku;
        newItems[index].unit_price = product.cost_price || 0;
      }
    } else {
      newItems[index][field] = value as never;
    }

    // Recalculate total
    const item = newItems[index];
    item.total = (item.quantity * item.unit_price) - item.discount;

    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal - discount + shippingCost + otherCosts;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!supplierId) {
        throw new Error("Selecione um fornecedor");
      }
      if (items.length === 0) {
        throw new Error("Adicione pelo menos um item");
      }

      // Get purchase number
      const { data: numberData, error: numberError } = await supabase.rpc(
        "generate_purchase_number"
      );
      if (numberError) throw numberError;

      // Create purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          purchase_number: numberData,
          supplier_id: supplierId,
          purchase_date: purchaseDate,
          expected_delivery_date: expectedDeliveryDate || null,
          subtotal,
          discount,
          shipping_cost: shippingCost,
          other_costs: otherCosts,
          total,
          notes: notes || null,
          payment_terms: paymentTerms || null,
          status: "draft",
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create purchase items
      const { error: itemsError } = await supabase.from("purchase_items").insert(
        items.map((item) => ({
          purchase_id: purchase.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          total: item.total,
        }))
      );

      if (itemsError) throw itemsError;

      // Update suggestion statuses if came from suggestions
      if (suggestions.length > 0) {
        const suggestionIds = suggestions.map((s: any) => s.id);
        await supabase
          .from("purchase_suggestions")
          .update({ status: "ordered" })
          .in("id", suggestionIds);
      }

      return purchase;
    },
    onSuccess: (purchase) => {
      toast.success("Compra criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-suggestions"] });
      navigate(`/compras/${purchase.id}`);
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar compra: ${error.message}`);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Compra</h1>
          <p className="text-muted-foreground">Crie um novo pedido de compra</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/compras")}>
            Cancelar
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Fornecedor *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                      {supplier.document && ` - ${supplier.document}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Data da Compra</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_delivery">Previsão de Entrega</Label>
                <Input
                  id="expected_delivery"
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_terms">Condições de Pagamento</Label>
              <Textarea
                id="payment_terms"
                placeholder="Ex: 30/60/90 dias"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações adicionais..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Desconto</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping">Frete</Label>
              <Input
                id="shipping"
                type="number"
                step="0.01"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="other_costs">Outros Custos</Label>
              <Input
                id="other_costs"
                type="number"
                step="0.01"
                value={otherCosts}
                onChange={(e) => setOtherCosts(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="pt-4 space-y-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto:</span>
                <span className="font-medium text-destructive">- R$ {discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frete:</span>
                <span className="font-medium">+ R$ {shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Outros:</span>
                <span className="font-medium">+ R$ {otherCosts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-primary">R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Itens da Compra</CardTitle>
            <Button onClick={addItem} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum item adicionado. Clique em "Adicionar Item" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="w-24">Quantidade</TableHead>
                  <TableHead className="w-32">Preço Unit.</TableHead>
                  <TableHead className="w-32">Desconto</TableHead>
                  <TableHead className="w-32">Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => updateItem(index, "product_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.sku} - {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", parseInt(e.target.value) || 1)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(index, "unit_price", parseFloat(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) =>
                          updateItem(index, "discount", parseFloat(e.target.value) || 0)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">R$ {item.total.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}