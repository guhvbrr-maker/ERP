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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  type: z.string(),
  bank_name: z.string().optional(),
  agency: z.string().optional(),
  account_number: z.string().optional(),
  initial_balance: z.number(),
  active: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface BankAccountFormProps {
  accountId?: string | null;
  onClose: () => void;
}

export function BankAccountForm({ accountId, onClose }: BankAccountFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "checking",
      bank_name: "",
      agency: "",
      account_number: "",
      initial_balance: 0,
      active: true,
    },
  });

  const { data: account } = useQuery({
    queryKey: ["bank-account", accountId],
    queryFn: async () => {
      if (!accountId) return null;
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("id", accountId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });

  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        type: account.type,
        bank_name: account.bank_name || "",
        agency: account.agency || "",
        account_number: account.account_number || "",
        initial_balance: Number(account.initial_balance),
        active: account.active,
      });
    }
  }, [account, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (accountId) {
        const { error } = await supabase
          .from("bank_accounts")
          .update(data)
          .eq("id", accountId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bank_accounts")
          .insert([{
            name: data.name,
            type: data.type,
            bank_name: data.bank_name,
            agency: data.agency,
            account_number: data.account_number,
            initial_balance: data.initial_balance,
            current_balance: data.initial_balance,
            active: data.active,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast({ title: "Sucesso", description: "Conta salva" });
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
                <Input {...field} placeholder="Ex: Caixa Principal, Banco XYZ" />
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
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="checking">Conta Corrente</SelectItem>
                  <SelectItem value="savings">Poupança</SelectItem>
                  <SelectItem value="cash">Caixa</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bank_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banco</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nome do banco" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="agency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agência</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="0000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="account_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="00000-0" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="initial_balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo Inicial</FormLabel>
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
          name="active"
          render={({ field }) => (
            <FormItem className="flex items-center gap-4 space-y-0">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <Label>Conta Ativa</Label>
            </FormItem>
          )}
        />

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
