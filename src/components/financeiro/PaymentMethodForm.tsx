import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  type: z.string().min(1, "Tipo obrigatório"),
  has_installments: z.boolean(),
  has_fees: z.boolean(),
  active: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface PaymentMethodFormProps {
  methodId?: string | null;
  onClose: () => void;
}

export function PaymentMethodForm({ methodId, onClose }: PaymentMethodFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      has_installments: false,
      has_fees: false,
      active: true,
    },
  });

  const { data: method } = useQuery({
    queryKey: ["payment-method", methodId],
    queryFn: async () => {
      if (!methodId) return null;
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("id", methodId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!methodId,
  });

  useEffect(() => {
    if (method) {
      form.reset(method);
    }
  }, [method, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (methodId) {
        const { error } = await supabase
          .from("payment_methods")
          .update(data)
          .eq("id", methodId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payment_methods").insert([{
          name: data.name,
          type: data.type,
          has_installments: data.has_installments,
          has_fees: data.has_fees,
          active: data.active,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast({ title: "Sucesso", description: "Forma de pagamento salva" });
      onClose();
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: PIX, Cartão de Crédito" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: pix, credit_card, cash" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <FormField
            control={form.control}
            name="has_installments"
            render={({ field }) => (
              <FormItem className="flex items-center gap-4 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <Label>Permite Parcelamento</Label>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="has_fees"
            render={({ field }) => (
              <FormItem className="flex items-center gap-4 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <Label>Possui Taxas</Label>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-4 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <Label>Ativo</Label>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </form>
    </Form>
  );
}
