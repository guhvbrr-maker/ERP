import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Briefcase, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PositionRolesManager } from "@/components/pessoas/PositionRolesManager";

interface PositionForm {
  name: string;
  code: string;
  description: string;
  has_sales_commission: boolean;
  has_assembly_commission: boolean;
  has_delivery_commission: boolean;
  has_revenue_commission: boolean;
  revenue_commission_rate: number;
  active: boolean;
}

interface CommissionRule {
  id?: string;
  category_id: string | null;
  commission_type: 'sales' | 'assembly' | 'delivery';
  rate: number;
}

export default function Cargos() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [configCommission, setConfigCommission] = useState<any>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, watch, setValue } = useForm<PositionForm>({
    defaultValues: {
      name: "",
      code: "",
      description: "",
      has_sales_commission: false,
      has_assembly_commission: false,
      has_delivery_commission: false,
      has_revenue_commission: false,
      revenue_commission_rate: 0,
      active: true,
    },
  });

  const { data: positions, isLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PositionForm) => {
      const { error } = await supabase.from("positions").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Cargo criado com sucesso!");
      setOpenDialog(false);
      reset();
    },
    onError: (error: any) => {
      toast.error("Erro ao criar cargo: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PositionForm }) => {
      const { error } = await supabase.from("positions").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Cargo atualizado com sucesso!");
      setOpenDialog(false);
      reset();
      setEditingPosition(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar cargo: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("positions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Cargo excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir cargo: " + error.message);
    },
  });

  const onSubmit = (data: PositionForm) => {
    if (editingPosition) {
      updateMutation.mutate({ id: editingPosition.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (position: any) => {
    setEditingPosition(position);
    Object.keys(position).forEach((key) => {
      setValue(key as any, position[key]);
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cargo?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleConfigCommission = (position: any) => {
    setConfigCommission(position);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Cargos</h1>
          <p className="text-muted-foreground">
            Gerencie os cargos e suas configurações de comissão
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPosition(null);
            reset();
            setOpenDialog(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Cargo
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {positions?.map((position: any) => (
            <Card key={position.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    {position.name}
                  </div>
                  {!position.active && (
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                      Inativo
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Código: {position.code}</p>
                  {position.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {position.description}
                    </p>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  {position.has_sales_commission && (
                    <p className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Comissão de Vendas
                    </p>
                  )}
                  {position.has_assembly_commission && (
                    <p className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Comissão de Montagem
                    </p>
                  )}
                  {position.has_delivery_commission && (
                    <p className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Comissão de Entrega
                    </p>
                  )}
                  {position.has_revenue_commission && (
                    <p className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Comissão sobre Faturamento: {position.revenue_commission_rate}%
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConfigCommission(position)}
                    className="flex-1"
                  >
                    Configurar Comissões
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(position)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(position.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? "Editar Cargo" : "Novo Cargo"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" {...register("name")} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input id="code" {...register("code")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" {...register("description")} />
            </div>

            <Tabs defaultValue="comissoes" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="comissoes">Comissões</TabsTrigger>
                <TabsTrigger value="permissoes">Permissões do Sistema</TabsTrigger>
              </TabsList>

              <TabsContent value="comissoes" className="space-y-3 border p-4 rounded-lg mt-4">
                <h3 className="font-medium">Tipos de Comissão</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="has_sales_commission">Comissão de Vendas</Label>
                  <Switch
                    id="has_sales_commission"
                    checked={watch("has_sales_commission")}
                    onCheckedChange={(checked) =>
                      setValue("has_sales_commission", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="has_assembly_commission">Comissão de Montagem</Label>
                  <Switch
                    id="has_assembly_commission"
                    checked={watch("has_assembly_commission")}
                    onCheckedChange={(checked) =>
                      setValue("has_assembly_commission", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="has_delivery_commission">Comissão de Entrega</Label>
                  <Switch
                    id="has_delivery_commission"
                    checked={watch("has_delivery_commission")}
                    onCheckedChange={(checked) =>
                      setValue("has_delivery_commission", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="has_revenue_commission">
                    Comissão sobre Faturamento Total
                  </Label>
                  <Switch
                    id="has_revenue_commission"
                    checked={watch("has_revenue_commission")}
                    onCheckedChange={(checked) =>
                      setValue("has_revenue_commission", checked)
                    }
                  />
                </div>

                {watch("has_revenue_commission") && (
                  <div className="space-y-2 ml-4">
                    <Label htmlFor="revenue_commission_rate">
                      Taxa de Comissão (%)
                    </Label>
                    <Input
                      id="revenue_commission_rate"
                      type="number"
                      step="0.01"
                      {...register("revenue_commission_rate")}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="permissoes" className="mt-4">
                <PositionRolesManager positionId={editingPosition?.id} />
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Ativo</Label>
              <Switch
                id="active"
                checked={watch("active")}
                onCheckedChange={(checked) => setValue("active", checked)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {configCommission && (
        <CommissionConfigDialog
          position={configCommission}
          categories={categories || []}
          onClose={() => setConfigCommission(null)}
        />
      )}
    </div>
  );
}

function CommissionConfigDialog({
  position,
  categories,
  onClose,
}: {
  position: any;
  categories: any[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("sales");

  const { data: commissionRules, isLoading } = useQuery({
    queryKey: ["commission_rules", position.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_rules")
        .select("*, categories(name)")
        .eq("position_id", position.id);
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      categoryId,
      type,
      rate,
    }: {
      categoryId: string | null;
      type: string;
      rate: number;
    }) => {
      const { error } = await supabase.from("commission_rules").upsert(
        {
          position_id: position.id,
          category_id: categoryId,
          commission_type: type,
          rate,
        },
        { onConflict: "position_id,category_id,commission_type" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission_rules", position.id] });
      toast.success("Comissão salva com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar comissão: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("commission_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission_rules", position.id] });
      toast.success("Regra de comissão removida!");
    },
  });

  const handleSave = (categoryId: string | null, rate: number) => {
    saveMutation.mutate({ categoryId, type: activeTab, rate });
  };

  const getRulesForType = (type: string) => {
    return commissionRules?.filter((rule: any) => rule.commission_type === type) || [];
  };

  const getRateForCategory = (categoryId: string | null, type: string) => {
    const rule = commissionRules?.find(
      (r: any) => r.category_id === categoryId && r.commission_type === type
    );
    return rule?.rate || 0;
  };

  const tabs = [];
  if (position.has_sales_commission) tabs.push({ value: "sales", label: "Vendas" });
  if (position.has_assembly_commission) tabs.push({ value: "assembly", label: "Montagem" });
  if (position.has_delivery_commission) tabs.push({ value: "delivery", label: "Entrega" });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Configurar Comissões - {position.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : tabs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Este cargo não possui tipos de comissão configurados.
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-4">Comissão Padrão (Todas as Categorias)</h3>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Taxa (%)"
                      defaultValue={getRateForCategory(null, tab.value)}
                      onBlur={(e) => handleSave(null, parseFloat(e.target.value) || 0)}
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        const rule = getRulesForType(tab.value).find(
                          (r: any) => r.category_id === null
                        );
                        if (rule) deleteMutation.mutate(rule.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Comissão por Categoria</h3>
                  {categories.map((category) => {
                    const currentRate = getRateForCategory(category.id, tab.value);
                    return (
                      <div
                        key={category.id}
                        className="flex items-center gap-2 border rounded-lg p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{category.name}</p>
                          {category.code && (
                            <p className="text-sm text-muted-foreground">{category.code}</p>
                          )}
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Taxa (%)"
                          className="w-32"
                          defaultValue={currentRate}
                          onBlur={(e) =>
                            handleSave(category.id, parseFloat(e.target.value) || 0)
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const rule = getRulesForType(tab.value).find(
                              (r: any) => r.category_id === category.id
                            );
                            if (rule) deleteMutation.mutate(rule.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        <div className="flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}