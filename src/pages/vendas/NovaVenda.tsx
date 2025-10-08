import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus, Trash2, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SalePaymentManager, PaymentPlan } from "@/components/vendas/SalePaymentManager";
import { CustomerSelector } from "@/components/vendas/CustomerSelector";
import { DeliveryPreferences, DeliveryPreferencesData } from "@/components/vendas/DeliveryPreferences";
import { CepAddressForm } from "@/components/common/CepAddressForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const saleSchema = z.object({
  customer_name: z.string().min(1, "Nome do cliente é obrigatório"),
  customer_document: z.string().optional(),
  customer_email: z.string().email("Email inválido").optional().or(z.literal("")),
  customer_phone: z.string().optional(),
  sale_date: z.string(),
  employee_id: z.string().optional(),
  notes: z.string().optional(),
  // Endereço de entrega
  delivery_address: z.string().optional(),
  delivery_number: z.string().optional(),
  delivery_complement: z.string().optional(),
  delivery_neighborhood: z.string().optional(),
  delivery_city: z.string().optional(),
  delivery_state: z.string().optional(),
  delivery_zipcode: z.string().optional(),
});

type SaleForm = z.infer<typeof saleSchema>;

interface SaleItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  stock_warning?: string;
  available_stock?: number;
}

const NovaVenda = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<SaleItem[]>([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [payments, setPayments] = useState<PaymentPlan[]>([]);
  const [deliveryPreferences, setDeliveryPreferences] = useState<DeliveryPreferencesData | null>(null);

  const form = useForm<SaleForm>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customer_name: "",
      customer_document: "",
      customer_email: "",
      customer_phone: "",
      sale_date: new Date().toISOString().split("T")[0],
      employee_id: "",
      notes: "",
      delivery_address: "",
      delivery_number: "",
      delivery_complement: "",
      delivery_neighborhood: "",
      delivery_city: "",
      delivery_state: "",
      delivery_zipcode: "",
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, selling_price")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          id,
          people (
            name
          )
        `)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const addItem = async (product: any) => {
    const existingItem = items.find((i) => i.product_id === product.id);
    if (existingItem) {
      toast.error("Produto já adicionado");
      return;
    }

    // Check stock availability
    let stockWarning = undefined;
    let availableStock = undefined;
    
    try {
      const { data: stockData, error: stockError } = await supabase
        .from("stocks")
        .select("available")
        .eq("product_id", product.id)
        .maybeSingle();
      
      if (!stockError && stockData) {
        availableStock = Number(stockData.available);
        if (availableStock === 0) {
          stockWarning = "ESTOQUE ZERADO";
          toast.warning(`⚠️ ${product.name}: ESTOQUE ZERADO!`, {
            duration: 5000,
          });
        } else if (availableStock < 1) {
          stockWarning = "Estoque insuficiente";
          toast.warning(`⚠️ ${product.name}: Estoque baixo (${availableStock} disponível)`, {
            duration: 5000,
          });
        }
      } else {
        stockWarning = "Sem estoque cadastrado";
        availableStock = 0;
        toast.warning(`⚠️ ${product.name}: Produto sem estoque cadastrado`, {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error checking stock:", error);
    }

    const newItem: SaleItem = {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      quantity: 1,
      unit_price: Number(product.selling_price || 0),
      discount: 0,
      total: Number(product.selling_price || 0),
      stock_warning: stockWarning,
      available_stock: availableStock,
    };

    setItems([...items, newItem]);
    setShowProductSearch(false);
    setSearchProduct("");
  };

  const updateItem = async (index: number, field: keyof SaleItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    const item = newItems[index];
    item.total = item.quantity * item.unit_price - item.discount;
    
    // Re-check stock when quantity changes
    if (field === "quantity" && item.available_stock !== undefined) {
      if (item.available_stock === 0) {
        item.stock_warning = "ESTOQUE ZERADO";
      } else if (item.quantity > item.available_stock) {
        item.stock_warning = "Quantidade maior que estoque disponível";
      } else if (item.available_stock < 5) {
        item.stock_warning = "Estoque baixo";
      } else {
        item.stock_warning = undefined;
      }
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
  const total = subtotal - totalDiscount;

  const saveMutation = useMutation({
    mutationFn: async (data: SaleForm) => {
      if (items.length === 0) {
        throw new Error("Adicione pelo menos um produto");
      }

      // Validar que o total de pagamentos é igual ao total da venda
      const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
      if (Math.abs(totalPayments - total) > 0.01 && payments.length > 0) {
        throw new Error(`Total de pagamentos (${totalPayments.toFixed(2)}) difere do total da venda (${total.toFixed(2)})`);
      }

      // Gerar número da venda
      const { data: saleNumberData } = await supabase.rpc("generate_sale_number");
      const saleNumber = saleNumberData || `VND${Date.now()}`;

      // Criar venda
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            sale_number: saleNumber,
            customer_name: data.customer_name,
            customer_document: data.customer_document || null,
            customer_email: data.customer_email || null,
            customer_phone: data.customer_phone || null,
            sale_date: data.sale_date,
            employee_id: data.employee_id || null,
            subtotal,
            discount: totalDiscount,
            total,
            notes: data.notes || null,
            status: "pending",
            payment_status: payments.length > 0 ? "pending" : "pending",
            delivery_status: "pending",
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;

      // Criar itens
      const saleItems = items.map((item) => ({
        sale_id: sale.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Criar entrega automática quando há endereço
      if (data.delivery_address && data.delivery_city) {
        const { error: deliveryError } = await supabase
          .from("sale_deliveries")
          .insert([
            {
              sale_id: sale.id,
              address: `${data.delivery_address}, ${data.delivery_number || "S/N"}${
                data.delivery_complement ? ` - ${data.delivery_complement}` : ""
              }`,
              city: data.delivery_city,
              state: data.delivery_state || null,
              zipcode: data.delivery_zipcode || null,
              scheduled_date: data.sale_date,
              status: "pending",
              delivery_preferences: deliveryPreferences ? JSON.parse(JSON.stringify(deliveryPreferences)) : null,
              priority: deliveryPreferences?.priority || "normal",
              notes: deliveryPreferences?.notes || null,
            },
          ]);

        if (deliveryError) throw deliveryError;
      }

      // Criar contas a receber para cada pagamento
      if (payments.length > 0) {
        const financialAccounts = [];
        
        for (const payment of payments) {
          if (payment.installment_details && payment.installment_details.length > 0) {
            // Criar uma conta para cada parcela
            for (const installment of payment.installment_details) {
              financialAccounts.push({
                account_type: "receivable",
                description: `${saleNumber} - ${payment.payment_method_name} - ${installment.installment}/${payment.installments}`,
                amount: installment.amount,
                due_date: installment.due_date,
                status: "pending",
                payment_method_id: payment.payment_method_id,
                card_brand_id: payment.card_brand_id || null,
                installment_number: installment.installment,
                installments: payment.installments,
                fee_percentage: installment.fee_percentage,
                fee_amount: installment.fee_amount,
                net_amount: installment.net_amount,
                sale_id: sale.id,
                paid_amount: 0,
                remaining_amount: installment.amount,
              });
            }
          } else {
            // Pagamento único
            financialAccounts.push({
              account_type: "receivable",
              description: `${saleNumber} - ${payment.payment_method_name}`,
              amount: payment.amount,
              due_date: payment.due_date,
              status: "pending",
              payment_method_id: payment.payment_method_id,
              card_brand_id: payment.card_brand_id || null,
              installments: 1,
              installment_number: 1,
              fee_percentage: 0,
              fee_amount: 0,
              net_amount: payment.amount,
              sale_id: sale.id,
              paid_amount: 0,
              remaining_amount: payment.amount,
            });
          }
        }

        const { error: accountsError } = await supabase
          .from("financial_accounts")
          .insert(financialAccounts);

        if (accountsError) throw accountsError;
      }

      return sale.id;
    },
    onSuccess: (saleId) => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Venda criada com sucesso!");
      navigate(`/vendas/${saleId}`);
    },
    onError: (error: any) => {
      toast.error("Erro ao criar venda: " + error.message);
    },
  });

  const onSubmit = (data: SaleForm) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vendas")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Venda</h1>
          <p className="text-muted-foreground">Crie uma nova venda</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
              <div className="mt-2">
                <CustomerSelector
                  onSelect={(customer) => {
                    form.setValue("customer_name", customer.people.name);
                    form.setValue("customer_document", customer.people.document || "");
                    form.setValue("customer_email", customer.people.email || "");
                    form.setValue("customer_phone", customer.people.phone || "");
                    
                    // Preencher endereço de entrega com os dados do cliente
                    if (customer.people.address) {
                      form.setValue("delivery_address", customer.people.address);
                      form.setValue("delivery_number", customer.people.address_number || "");
                      form.setValue("delivery_complement", customer.people.address_complement || "");
                      form.setValue("delivery_neighborhood", customer.people.neighborhood || "");
                      form.setValue("delivery_city", customer.people.city || "");
                      form.setValue("delivery_state", customer.people.state || "");
                      form.setValue("delivery_zipcode", customer.people.zipcode || "");
                    }
                  }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customer_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cliente *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome completo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer_document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF/CNPJ</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="000.000.000-00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customer_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="email@exemplo.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="(00) 00000-0000" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sale_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Venda</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendedor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um vendedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {employees.map((employee: any) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.people.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço de Entrega</CardTitle>
              <p className="text-sm text-muted-foreground">
                Preencha caso seja diferente do endereço do cliente
              </p>
            </CardHeader>
            <CardContent>
              <CepAddressForm
                cep={form.watch("delivery_zipcode")}
                logradouro={form.watch("delivery_address")}
                numero={form.watch("delivery_number")}
                complemento={form.watch("delivery_complement")}
                bairro={form.watch("delivery_neighborhood")}
                cidade={form.watch("delivery_city")}
                uf={form.watch("delivery_state")}
                onCepChange={(value) => form.setValue("delivery_zipcode", value)}
                onLogradouroChange={(value) => form.setValue("delivery_address", value)}
                onNumeroChange={(value) => form.setValue("delivery_number", value)}
                onComplementoChange={(value) => form.setValue("delivery_complement", value)}
                onBairroChange={(value) => form.setValue("delivery_neighborhood", value)}
                onCidadeChange={(value) => form.setValue("delivery_city", value)}
                onUfChange={(value) => form.setValue("delivery_state", value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowProductSearch(!showProductSearch)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {showProductSearch && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar produto..."
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {searchProduct && (
                    <div className="max-h-48 overflow-y-auto border rounded-md">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addItem(product)}
                          className="w-full p-3 text-left hover:bg-accent flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.sku}
                            </div>
                          </div>
                          <div className="font-medium">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(Number(product.selling_price || 0))}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {items.some(item => item.stock_warning) && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Atenção: Problemas de Estoque</AlertTitle>
                  <AlertDescription>
                    Alguns produtos possuem estoque baixo ou zerado. A venda será criada, mas o estoque 
                    só será deduzido quando o status for alterado para "Confirmada" ou "Concluída".
                    {items.filter(item => item.stock_warning === "ESTOQUE ZERADO").length > 0 && (
                      <div className="mt-2 font-semibold">
                        ⚠️ {items.filter(item => item.stock_warning === "ESTOQUE ZERADO").length} produto(s) 
                        com ESTOQUE ZERADO!
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto adicionado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Estoque</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead>Desconto</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span>{item.product_name}</span>
                            {item.stock_warning && (
                              <Badge 
                                variant={item.stock_warning === "ESTOQUE ZERADO" ? "destructive" : "secondary"}
                                className="w-fit text-xs"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {item.stock_warning}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.product_sku}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            (item.available_stock ?? 0) === 0 ? "text-red-500" : 
                            (item.available_stock ?? 0) < 5 ? "text-yellow-600" : 
                            "text-green-600"
                          }`}>
                            {item.available_stock ?? "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", Number(e.target.value))
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateItem(index, "unit_price", Number(e.target.value))
                            }
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discount}
                            onChange={(e) =>
                              updateItem(index, "discount", Number(e.target.value))
                            }
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(item.total)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
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

              <div className="flex justify-end space-y-2 pt-4 border-t">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Desconto:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(totalDiscount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(total)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <SalePaymentManager
            totalAmount={total}
            payments={payments}
            onChange={setPayments}
          />

          <DeliveryPreferences
            value={deliveryPreferences || undefined}
            onChange={setDeliveryPreferences}
          />

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Observações sobre a venda..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/vendas")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Salvando..." : "Salvar Venda"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default NovaVenda;
