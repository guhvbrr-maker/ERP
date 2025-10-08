import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const fabricSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  code: z.string().optional(),
  description: z.string().optional(),
  color_code: z.string().optional(),
});

type FabricForm = z.infer<typeof fabricSchema>;

interface Fabric {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  color_code: string | null;
  active: boolean;
}

export default function Tecidos() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFabric, setEditingFabric] = useState<Fabric | null>(null);
  const queryClient = useQueryClient();

  const { data: fabrics = [], isLoading } = useQuery({
    queryKey: ["fabrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fabrics")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Fabric[];
    },
  });

  const form = useForm<FabricForm>({
    resolver: zodResolver(fabricSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      color_code: "#ffffff",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FabricForm) => {
      const { error } = await supabase.from("fabrics").insert([{
        name: data.name,
        code: data.code || null,
        description: data.description || null,
        color_code: data.color_code || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fabrics"] });
      toast.success("Tecido criado com sucesso!");
      setOpenDialog(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Erro ao criar tecido: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FabricForm }) => {
      const { error } = await supabase.from("fabrics").update({
        name: data.name,
        code: data.code || null,
        description: data.description || null,
        color_code: data.color_code || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fabrics"] });
      toast.success("Tecido atualizado!");
      setOpenDialog(false);
      setEditingFabric(null);
      form.reset();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fabrics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fabrics"] });
      toast.success("Tecido excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const onSubmit = (data: FabricForm) => {
    if (editingFabric) {
      updateMutation.mutate({ id: editingFabric.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (fabric: Fabric) => {
    setEditingFabric(fabric);
    form.reset({
      name: fabric.name,
      code: fabric.code || "",
      description: fabric.description || "",
      color_code: fabric.color_code || "#ffffff",
    });
    setOpenDialog(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente excluir este tecido?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tecidos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os tecidos disponíveis para os produtos</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingFabric(null); form.reset(); }}>
              <Plus className="mr-2 h-4 w-4" /> Novo Tecido
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFabric ? "Editar Tecido" : "Novo Tecido"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Suede" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: SUD-001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <FormControl>
                          <Input {...field} type="color" />
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
                        <Textarea {...field} rows={3} placeholder="Descrição do tecido" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { setOpenDialog(false); setEditingFabric(null); form.reset(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingFabric ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : fabrics.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Nenhum tecido cadastrado</p>
            <Button onClick={() => setOpenDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Cadastrar Primeiro Tecido
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fabrics.map((fabric) => (
              <div key={fabric.id} className="p-4 rounded-lg border border-border hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {fabric.color_code && (
                      <div
                        className="w-8 h-8 rounded border border-border"
                        style={{ backgroundColor: fabric.color_code }}
                      />
                    )}
                    <div>
                      <div className="font-semibold text-foreground">{fabric.name}</div>
                      {fabric.code && <div className="text-xs text-muted-foreground">{fabric.code}</div>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(fabric)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(fabric.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {fabric.description && (
                  <p className="text-sm text-muted-foreground">{fabric.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
