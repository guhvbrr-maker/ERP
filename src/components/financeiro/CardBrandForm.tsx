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
  code: z.string().optional(),
  icon_url: z.string().optional(),
  active: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface CardBrandFormProps {
  brandId?: string | null;
  onClose: () => void;
}

export function CardBrandForm({ brandId, onClose }: CardBrandFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      icon_url: "",
      active: true,
    },
  });

  const { data: brand } = useQuery({
    queryKey: ["card-brand", brandId],
    queryFn: async () => {
      if (!brandId) return null;
      const { data, error } = await supabase
        .from("card_brands")
        .select("*")
        .eq("id", brandId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!brandId,
  });

  useEffect(() => {
    if (brand) {
      form.reset(brand);
    }
  }, [brand, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (brandId) {
        const { error } = await supabase
          .from("card_brands")
          .update(data)
          .eq("id", brandId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("card_brands").insert([{
          name: data.name,
          code: data.code,
          icon_url: data.icon_url,
          active: data.active,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-brands"] });
      toast({ title: "Sucesso", description: "Bandeira salva" });
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
                <Input {...field} placeholder="Ex: Visa, Mastercard" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: visa, mastercard" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL do Ícone</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://..." />
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
              <Label>Ativa</Label>
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
