import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SaleSearch } from "./SaleSearch";
import { Loader2, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  sale_id: z.string().nullable(),
  customer_name: z.string().min(1, "Nome do cliente é obrigatório"),
  customer_phone: z.string().optional(),
  customer_email: z.string().email("Email inválido").optional().or(z.literal("")),
  product_id: z.string().nullable(),
  product_name: z.string().min(1, "Nome do produto é obrigatório"),
  product_sku: z.string().optional(),
  defect_description: z.string().min(1, "Descrição do defeito é obrigatória"),
  solution_description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "waiting_parts", "completed", "cancelled"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  assigned_to: z.string().nullable(),
  opened_date: z.string(),
  expected_date: z.string().optional(),
  completed_date: z.string().optional(),
  warranty_status: z.boolean(),
  service_cost: z.number().min(0),
  parts_cost: z.number().min(0),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AssistanceFormProps {
  assistanceId?: string | null;
  onClose: () => void;
}

export function AssistanceForm({ assistanceId, onClose }: AssistanceFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSaleSearch, setShowSaleSearch] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sale_id: null,
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      product_id: null,
      product_name: "",
      product_sku: "",
      defect_description: "",
      solution_description: "",
      status: "pending",
      priority: "normal",
      assigned_to: null,
      opened_date: new Date().toISOString().split("T")[0],
      expected_date: "",
      completed_date: "",
      warranty_status: false,
      service_cost: 0,
      parts_cost: 0,
      notes: "",
    },
  });

  // Load existing assistance
  const { data: assistance } = useQuery({
    queryKey: ["technical-assistance", assistanceId],
    queryFn: async () => {
      if (!assistanceId) return null;
      const { data, error } = await supabase
        .from("technical_assistances")
        .select("*")
        .eq("id", assistanceId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!assistanceId,
  });

  // Load employees
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, person_id, people(name)")
        .order("people(name)");

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (assistance) {
      form.reset({
        sale_id: assistance.sale_id,
        customer_name: assistance.customer_name,
        customer_phone: assistance.customer_phone || "",
        customer_email: assistance.customer_email || "",
        product_id: assistance.product_id,
        product_name: assistance.product_name,
        product_sku: assistance.product_sku || "",
        defect_description: assistance.defect_description,
        solution_description: assistance.solution_description || "",
        status: assistance.status as any,
        priority: assistance.priority as any,
        assigned_to: assistance.assigned_to,
        opened_date: assistance.opened_date,
        expected_date: assistance.expected_date || "",
        completed_date: assistance.completed_date || "",
        warranty_status: assistance.warranty_status,
        service_cost: Number(assistance.service_cost),
        parts_cost: Number(assistance.parts_cost),
        notes: assistance.notes || "",
      });
    }
  }, [assistance, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const total_cost = data.service_cost + data.parts_cost;
      
      if (assistanceId) {
        const { error } = await supabase
          .from("technical_assistances")
          .update({
            sale_id: data.sale_id,
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            customer_email: data.customer_email,
            product_id: data.product_id,
            product_name: data.product_name,
            product_sku: data.product_sku,
            defect_description: data.defect_description,
            solution_description: data.solution_description,
            status: data.status,
            priority: data.priority,
            assigned_to: data.assigned_to,
            opened_date: data.opened_date,
            expected_date: data.expected_date || null,
            completed_date: data.completed_date || null,
            warranty_status: data.warranty_status,
            service_cost: data.service_cost,
            parts_cost: data.parts_cost,
            total_cost,
            notes: data.notes,
          })
          .eq("id", assistanceId);

        if (error) throw error;
      } else {
        const { data: numberData } = await supabase.rpc("generate_assistance_number");
        
        const { error } = await supabase
          .from("technical_assistances")
          .insert({
            assistance_number: numberData,
            sale_id: data.sale_id,
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            customer_email: data.customer_email,
            product_id: data.product_id,
            product_name: data.product_name,
            product_sku: data.product_sku,
            defect_description: data.defect_description,
            solution_description: data.solution_description,
            status: data.status,
            priority: data.priority,
            assigned_to: data.assigned_to,
            opened_date: data.opened_date,
            expected_date: data.expected_date || null,
            completed_date: data.completed_date || null,
            warranty_status: data.warranty_status,
            service_cost: data.service_cost,
            parts_cost: data.parts_cost,
            total_cost,
            notes: data.notes,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technical-assistances"] });
      toast({
        title: "Sucesso",
        description: assistanceId
          ? "Assistência atualizada com sucesso"
          : "Assistência criada com sucesso",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a assistência",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const handleSaleSelect = (sale: any, product?: any) => {
    form.setValue("sale_id", sale.id);
    form.setValue("customer_name", sale.customer_name);
    form.setValue("customer_phone", sale.customer_phone || "");
    form.setValue("customer_email", sale.customer_email || "");
    
    if (product) {
      form.setValue("product_id", product.id);
      form.setValue("product_name", product.product_name);
      form.setValue("product_sku", product.product_sku);
    }
    
    setShowSaleSearch(false);
  };

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Informações da Venda</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSaleSearch(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            Buscar Venda
          </Button>
        </div>

        {showSaleSearch && (
          <SaleSearch
            onSelect={handleSaleSelect}
            onClose={() => setShowSaleSearch(false)}
          />
        )}

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customer_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome do cliente" />
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
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="product_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Produto *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome do produto" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="product_sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Código do produto" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="defect_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do Defeito *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Descreva o problema relatado pelo cliente"
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="solution_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Solução Aplicada</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Descreva a solução ou procedimentos realizados"
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="waiting_parts">Aguardando Peças</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assigned_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsável</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um técnico" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.people?.name || "Sem nome"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="warranty_status"
            render={({ field }) => (
              <FormItem className="flex items-center gap-4 space-y-0 mt-8">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <Label>Em Garantia</Label>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="opened_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Abertura</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expected_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previsão</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="completed_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conclusão</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="service_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custo de Serviço</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parts_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custo de Peças</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
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
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Notas internas sobre a assistência"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {assistanceId ? "Atualizar" : "Criar"} Assistência
          </Button>
        </div>
      </form>
    </Form>
  );
}
