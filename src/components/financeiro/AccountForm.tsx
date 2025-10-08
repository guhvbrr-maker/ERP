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
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  due_date: z.string(),
  payment_method_id: z.string().nullable(),
  card_brand_id: z.string().nullable(),
  installments: z.number().min(1).max(36),
  recurrence_type: z.enum(["none", "installment", "monthly", "biweekly", "annual"]),
  recurrence_end_date: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AccountFormProps {
  accountId?: string | null;
  accountType: "receivable" | "payable";
  onClose: () => void;
}

export function AccountForm({ accountId, accountType, onClose }: AccountFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: 0,
      due_date: new Date().toISOString().split("T")[0],
      payment_method_id: null,
      card_brand_id: null,
      installments: 1,
      recurrence_type: "none",
      recurrence_end_date: "",
      category: "",
      notes: "",
    },
  });

  // Load payment methods and card brands
  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_methods").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: cardBrands } = useQuery({
    queryKey: ["card-brands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("card_brands").select("*");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const accountData = {
        account_type: accountType,
        description: data.description,
        amount: data.amount,
        remaining_amount: data.amount,
        due_date: data.due_date,
        payment_method_id: data.payment_method_id,
        card_brand_id: data.card_brand_id,
        installments: data.installments,
        recurrence_type: data.recurrence_type,
        recurrence_end_date: data.recurrence_end_date || null,
        category: data.category,
        notes: data.notes,
      };

      if (accountId) {
        const { error } = await supabase
          .from("financial_accounts")
          .update(accountData)
          .eq("id", accountId);
        if (error) throw error;
      } else {
        // Create account with recurrence if needed
        const { error } = await supabase
          .from("financial_accounts")
          .insert(accountData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivable-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["payable-accounts"] });
      toast({
        title: "Sucesso",
        description: accountId ? "Conta atualizada" : "Conta criada",
      });
      onClose();
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Venda #12345, Fornecedor XPTO" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor *</FormLabel>
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
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vencimento *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="payment_method_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma de Pagamento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paymentMethods?.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
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
            name="recurrence_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recorrência</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sem recorrência</SelectItem>
                    <SelectItem value="installment">Parcelado</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                  </SelectContent>
                </Select>
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
                <Textarea {...field} rows={3} placeholder="Notas adicionais" />
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
            {accountId ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
