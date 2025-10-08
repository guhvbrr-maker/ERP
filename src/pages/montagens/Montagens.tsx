import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Hammer, Clock, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const Montagens = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAssembly, setSelectedAssembly] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newAssemblyDialogOpen, setNewAssemblyDialogOpen] = useState(false);
  const [newAssembly, setNewAssembly] = useState<any>({
    product_id: "",
    product_name: "",
    is_showcase: true,
    scheduled_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const { data: assemblies = [] } = useQuery({
    queryKey: ["assemblies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assemblies")
        .select(`
          *,
          sales (
            id,
            sale_number,
            customer_name
          ),
          assembly_employee:employees!assembly_employee_id (
            id,
            person_id,
            people (
              name
            )
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          id,
          people (
            name
          )
        `)
        .order("people(name)");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku")
        .eq("active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const updateAssemblyMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from("assemblies")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assemblies"] });
      toast({
        title: "Montagem atualizada",
        description: "As informações da montagem foram atualizadas com sucesso.",
      });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar montagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createAssemblyMutation = useMutation({
    mutationFn: async (assembly: any) => {
      const { error } = await supabase
        .from("assemblies")
        .insert([assembly]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assemblies"] });
      toast({
        title: "Montagem criada",
        description: "A montagem foi criada com sucesso.",
      });
      setNewAssemblyDialogOpen(false);
      setNewAssembly({
        product_id: "",
        product_name: "",
        is_showcase: true,
        scheduled_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar montagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingCount = assemblies.filter((a: any) => a.status === "pending").length;
  const inProgressCount = assemblies.filter((a: any) => a.status === "in_progress").length;
  const completedCount = assemblies.filter((a: any) => a.status === "completed").length;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: "Pendente", variant: "secondary", icon: Clock },
      in_progress: { label: "Em Andamento", variant: "default", icon: Hammer },
      completed: { label: "Concluída", variant: "success", icon: CheckCircle2 },
      cancelled: { label: "Cancelada", variant: "destructive", icon: AlertCircle },
    };
    
    const statusInfo = statusMap[status] || statusMap.pending;
    const Icon = statusInfo.icon;
    
    return (
      <Badge variant={statusInfo.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Montagens</h1>
          <p className="text-muted-foreground">Gestão de montagens de produtos</p>
        </div>
        <Button onClick={() => setNewAssemblyDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Montagem
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Hammer className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Montagens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Montador</TableHead>
                <TableHead>Data Agendada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assemblies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma montagem encontrada
                  </TableCell>
                </TableRow>
              ) : (
                assemblies.map((assembly: any) => (
                  <TableRow key={assembly.id}>
                    <TableCell className="font-medium">{assembly.product_name}</TableCell>
                    <TableCell>
                      {assembly.sales?.sale_number || (
                        <Badge variant="outline">Mostruário</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {assembly.sales?.customer_name || "-"}
                    </TableCell>
                    <TableCell>
                      {assembly.is_showcase ? (
                        <Badge variant="secondary">Mostruário</Badge>
                      ) : (
                        <Badge variant="outline">Venda</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {assembly.assembly_employee?.people?.name || (
                        <span className="text-muted-foreground text-sm">Não atribuído</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assembly.scheduled_date
                        ? format(new Date(assembly.scheduled_date), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(assembly.status)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAssembly(assembly);
                          setEditDialogOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Montagem</DialogTitle>
          </DialogHeader>
          {selectedAssembly && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Montador</Label>
                <Select
                  value={selectedAssembly.assembly_employee_id || ""}
                  onValueChange={(value) =>
                    setSelectedAssembly({ ...selectedAssembly, assembly_employee_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o montador" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.people.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Comissão de Montagem (R$)</Label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedAssembly.assembly_commission_amount || 0}
                  onChange={(e) =>
                    setSelectedAssembly({
                      ...selectedAssembly,
                      assembly_commission_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Data Agendada</Label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedAssembly.scheduled_date || ""}
                  onChange={(e) =>
                    setSelectedAssembly({ ...selectedAssembly, scheduled_date: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedAssembly.status}
                  onValueChange={(value) =>
                    setSelectedAssembly({ ...selectedAssembly, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={selectedAssembly.notes || ""}
                  onChange={(e) =>
                    setSelectedAssembly({ ...selectedAssembly, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() =>
                    updateAssemblyMutation.mutate({
                      id: selectedAssembly.id,
                      updates: {
                        assembly_employee_id: selectedAssembly.assembly_employee_id,
                        assembly_commission_amount: selectedAssembly.assembly_commission_amount,
                        scheduled_date: selectedAssembly.scheduled_date,
                        status: selectedAssembly.status,
                        notes: selectedAssembly.notes,
                        started_at:
                          selectedAssembly.status === "in_progress" && !selectedAssembly.started_at
                            ? new Date().toISOString()
                            : selectedAssembly.started_at,
                        completed_at:
                          selectedAssembly.status === "completed" && !selectedAssembly.completed_at
                            ? new Date().toISOString()
                            : selectedAssembly.completed_at,
                      },
                    })
                  }
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={newAssemblyDialogOpen} onOpenChange={setNewAssemblyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Montagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select
                value={newAssembly.product_id}
                onValueChange={(value) => {
                  const product = products.find((p: any) => p.id === value);
                  setNewAssembly({
                    ...newAssembly,
                    product_id: value,
                    product_name: product?.name || "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_showcase"
                checked={newAssembly.is_showcase}
                onCheckedChange={(checked) =>
                  setNewAssembly({ ...newAssembly, is_showcase: checked })
                }
              />
              <Label htmlFor="is_showcase">Montagem para mostruário</Label>
            </div>

            <div className="space-y-2">
              <Label>Data Agendada</Label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md"
                value={newAssembly.scheduled_date}
                onChange={(e) =>
                  setNewAssembly({ ...newAssembly, scheduled_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={newAssembly.notes}
                onChange={(e) =>
                  setNewAssembly({ ...newAssembly, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setNewAssemblyDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createAssemblyMutation.mutate(newAssembly)}
                disabled={!newAssembly.product_id}
              >
                Criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Montagens;