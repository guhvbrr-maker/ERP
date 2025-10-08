import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Save, Plus, Trash2, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const productSchema = z.object({
  sku: z.string().min(1, "SKU é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  category_id: z.string().nullable(),
  type: z.enum(["simple", "parent", "variant"]),
  parent_id: z.string().nullable(),

  // Fiscal
  ncm: z.string().min(8, "NCM deve ter 8 dígitos"),
  cest: z.string().optional(),
  cfop: z.string().default("5102"),
  origin: z.string().default("0"),
  ean: z.string().optional(),

  // Tributação
  icms_cst: z.string().optional(),
  icms_aliquota: z.coerce.number().optional(),
  ipi_cst: z.string().optional(),
  ipi_aliquota: z.coerce.number().optional(),
  pis_cst: z.string().optional(),
  pis_aliquota: z.coerce.number().optional(),
  cofins_cst: z.string().optional(),
  cofins_aliquota: z.coerce.number().optional(),

  // Ficha Técnica
  material_id: z.string().nullable(),
  fabric_id: z.string().nullable(),
  width_cm: z.coerce.number().optional(),
  height_cm: z.coerce.number().optional(),
  depth_cm: z.coerce.number().optional(),
  weight_kg: z.coerce.number().optional(),

  // Preços
  cost_price: z.coerce.number().optional(),
  selling_price: z.coerce.number().optional(),
  promotional_price: z.coerce.number().optional(),

  // Controle
  active: z.boolean().default(true),
  is_kit: z.boolean().default(false),
  requires_assembly: z.boolean().default(false),
  assembly_time_minutes: z.coerce.number().optional(),

  // Metadados
  brand: z.string().optional(),
  collection: z.string().optional(),
  manufacturer: z.string().optional(),
  warranty_months: z.coerce.number().default(12),
  notes: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function FormularioProduto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      category_id: null,
      type: "simple",
      parent_id: null,
      ncm: "",
      cfop: "5102",
      origin: "0",
      active: true,
      is_kit: false,
      requires_assembly: false,
      warranty_months: 12,
    },
  });

  // Carregar dados do produto se estiver editando
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  // Carregar categorias
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Carregar materiais
  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Carregar tecidos
  const { data: fabrics = [] } = useQuery({
    queryKey: ["fabrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fabrics")
        .select("id, name")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Carregar fornecedores
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("people")
        .select("id, name")
        .eq("type", "supplier")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Carregar produtos pai (para variações)
  const { data: parentProducts = [] } = useQuery({
    queryKey: ["parentProducts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku")
        .eq("type", "parent")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Carregar configurações de SKU automático
  const { data: skuSettings } = useQuery({
    queryKey: ["settings", "sku_auto_generate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("key", "sku_auto_generate")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !isEditing, // Só carrega se for novo produto
  });

  // Gerar SKU automático para novos produtos
  useEffect(() => {
    if (!isEditing && skuSettings?.value) {
      const settings = skuSettings.value as any;
      if (settings.enabled && !form.getValues("sku")) {
        const nextNumber = settings.current_number || 1;
        const sku = `${settings.prefix}${nextNumber.toString().padStart(6, "0")}`;
        form.setValue("sku", sku);
      }
    }
  }, [skuSettings, isEditing, form]);

  useEffect(() => {
    if (product && isEditing) {
      form.reset({
        ...product,
        type: product.type as "simple" | "parent" | "variant",
      });
    }
  }, [product, isEditing, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const productData = {
        sku: data.sku,
        name: data.name,
        description: data.description || null,
        category_id: data.category_id || null,
        type: data.type,
        parent_id: data.parent_id || null,
        ncm: data.ncm,
        cest: data.cest || null,
        cfop: data.cfop,
        origin: data.origin,
        ean: data.ean || null,
        icms_cst: data.icms_cst || null,
        icms_aliquota: data.icms_aliquota || null,
        ipi_cst: data.ipi_cst || null,
        ipi_aliquota: data.ipi_aliquota || null,
        pis_cst: data.pis_cst || null,
        pis_aliquota: data.pis_aliquota || null,
        cofins_cst: data.cofins_cst || null,
        cofins_aliquota: data.cofins_aliquota || null,
        material_id: data.material_id || null,
        fabric_id: data.fabric_id || null,
        width_cm: data.width_cm || null,
        height_cm: data.height_cm || null,
        depth_cm: data.depth_cm || null,
        weight_kg: data.weight_kg || null,
        cost_price: data.cost_price || null,
        selling_price: data.selling_price || null,
        promotional_price: data.promotional_price || null,
        active: data.active,
        is_kit: data.is_kit,
        requires_assembly: data.requires_assembly,
        assembly_time_minutes: data.assembly_time_minutes || null,
        brand: data.brand || null,
        collection: data.collection || null,
        manufacturer: data.manufacturer || null,
        warranty_months: data.warranty_months,
        notes: data.notes || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert([productData]);
        if (error) throw error;
        
        // Incrementar contador de SKU se estiver usando geração automática
        if (skuSettings?.value) {
          const settings = skuSettings.value as any;
          if (settings.enabled) {
            const newSettings = {
              ...settings,
              current_number: (settings.current_number || 1) + 1,
            };
            await supabase
              .from("settings")
              .update({ value: newSettings as any })
              .eq("key", "sku_auto_generate");
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success(isEditing ? "Produto atualizado!" : "Produto criado!");
      navigate("/produtos/catalogo");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  const onSubmit = (data: ProductForm) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">Carregando produto...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/produtos/catalogo")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditing ? "Editar Produto" : "Novo Produto"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Preencha todos os campos necessários para emissão de NF-e
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="fiscal">Dados Fiscais</TabsTrigger>
              <TabsTrigger value="ficha">Ficha Técnica</TabsTrigger>
              <TabsTrigger value="precos">Preços</TabsTrigger>
              <TabsTrigger value="outros">Outros</TabsTrigger>
            </TabsList>

            {/* ABA GERAL */}
            <TabsContent value="geral" className="space-y-4">
              <Card className="p-6 space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Campos marcados com * são obrigatórios
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Produto *</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2">
                            <option value="simple">Produto Simples</option>
                            <option value="parent">Produto Pai (com variações)</option>
                            <option value="variant">Variação</option>
                          </select>
                        </FormControl>
                        <FormDescription>
                          Simples: produto único | Pai: gera variações | Variação: pertence a um pai
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("type") === "variant" && (
                    <FormField
                      control={form.control}
                      name="parent_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Produto Pai *</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value || null)}
                              className="w-full rounded-md border border-input bg-background px-3 py-2"
                            >
                              <option value="">Selecione o produto pai</option>
                              {parentProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Ex: SOF-001"
                            readOnly={!isEditing && skuSettings?.value && (skuSettings.value as any).enabled}
                          />
                        </FormControl>
                        {!isEditing && skuSettings?.value && (skuSettings.value as any).enabled && (
                          <FormDescription className="text-xs text-muted-foreground">
                            SKU gerado automaticamente
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Nome do Produto *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Sofá Retrátil 3 Lugares" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} placeholder="Descrição detalhada do produto" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                          >
                            <option value="">Selecione uma categoria</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 pt-8">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Produto Ativo</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            </TabsContent>

            {/* ABA DADOS FISCAIS */}
            <TabsContent value="fiscal" className="space-y-4">
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Informações para NF-e</h3>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="ncm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NCM *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="00000000" maxLength={8} />
                        </FormControl>
                        <FormDescription>8 dígitos</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEST</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="0000000" maxLength={7} />
                        </FormControl>
                        <FormDescription>7 dígitos</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cfop"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CFOP</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="5102" maxLength={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full rounded-md border border-input bg-background px-3 py-2">
                            <option value="0">0 - Nacional</option>
                            <option value="1">1 - Estrangeira - Importação direta</option>
                            <option value="2">2 - Estrangeira - Adquirida no mercado interno</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ean"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>EAN/GTIN</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Código de barras" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h4 className="font-semibold pt-4">Tributação</h4>

                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="icms_cst"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ICMS CST</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icms_aliquota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ICMS Alíquota (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="18.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ipi_cst"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IPI CST</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ipi_aliquota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IPI Alíquota (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="pis_cst"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PIS CST</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pis_aliquota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PIS Alíquota (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="1.65" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cofins_cst"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>COFINS CST</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="01" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cofins_aliquota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>COFINS Alíquota (%)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="7.60" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            </TabsContent>

            {/* ABA FICHA TÉCNICA */}
            <TabsContent value="ficha" className="space-y-4">
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Especificações Técnicas</h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="material_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Material</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                          >
                            <option value="">Selecione um material</option>
                            {materials.map((mat) => (
                              <option key={mat.id} value={mat.id}>
                                {mat.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fabric_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tecido</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value || null)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                          >
                            <option value="">Selecione um tecido</option>
                            {fabrics.map((fab) => (
                              <option key={fab.id} value={fab.id}>
                                {fab.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <h4 className="font-semibold pt-4">Dimensões</h4>

                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="width_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Largura (cm)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="height_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Altura (cm)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="depth_cm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profundidade (cm)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight_kg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso (kg)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.001" placeholder="0.000" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            </TabsContent>

            {/* ABA PREÇOS */}
            <TabsContent value="precos" className="space-y-4">
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Preços e Promoções</h3>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cost_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Custo</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" />
                        </FormControl>
                        <FormDescription>Custo unitário do produto</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="selling_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Venda</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" />
                        </FormControl>
                        <FormDescription>Preço ao cliente</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="promotional_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Promocional</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" />
                        </FormControl>
                        <FormDescription>Opcional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("cost_price") && form.watch("selling_price") && (
                  <div className="p-4 bg-sidebar-accent rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Margem Bruta:</span>
                        <div className="text-lg font-semibold text-primary">
                          {(
                            ((Number(form.watch("selling_price")) - Number(form.watch("cost_price"))) /
                              Number(form.watch("selling_price"))) *
                            100
                          ).toFixed(2)}
                          %
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Markup:</span>
                        <div className="text-lg font-semibold text-primary">
                          {(Number(form.watch("selling_price")) / Number(form.watch("cost_price"))).toFixed(2)}x
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lucro Unit.:</span>
                        <div className="text-lg font-semibold text-primary">
                          R$ {(Number(form.watch("selling_price")) - Number(form.watch("cost_price"))).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* ABA OUTROS */}
            <TabsContent value="outros" className="space-y-4">
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Informações Adicionais</h3>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Móveis Karina" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="collection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coleção</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Verão 2024" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor/Fabricante</FormLabel>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um fornecedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers.map((supplier: any) => (
                              <SelectItem key={supplier.id} value={supplier.name}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="warranty_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Garantia (meses)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assembly_time_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo de Montagem (min)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="60" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="is_kit"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">É um kit (conjunto de produtos)?</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requires_assembly"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Requer montagem?</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações Internas</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} placeholder="Anotações, instruções especiais, etc." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>
            </TabsContent>
          </Tabs>

          {/* Botões de Ação */}
          <Card className="p-4">
            <div className="flex justify-between items-center">
              <Button type="button" variant="outline" onClick={() => navigate("/produtos/catalogo")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? "Salvando..." : isEditing ? "Atualizar Produto" : "Criar Produto"}
              </Button>
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
}
