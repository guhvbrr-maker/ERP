import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Phone, Mail, Briefcase, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormularioPessoa } from "@/components/pessoas/FormularioPessoa";
import { toast } from "sonner";

export default function Funcionarios() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const { data: employees, isLoading, refetch } = useQuery({
    queryKey: ["employees", search],
    queryFn: async () => {
      let query = supabase
        .from("people")
        .select(`
          *,
          employees (*)
        `)
        .eq("type", "employee")
        .order("name");

      if (search) {
        query = query.or(`name.ilike.%${search}%,document.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este funcionário?")) return;

    const { error } = await supabase.from("people").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir funcionário");
      return;
    }

    toast.success("Funcionário excluído com sucesso");
    refetch();
  };

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEmployee(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funcionários</h1>
          <p className="text-muted-foreground">Gerencie seus funcionários</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedEmployee(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Funcionário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedEmployee ? "Editar Funcionário" : "Novo Funcionário"}
              </DialogTitle>
            </DialogHeader>
            <FormularioPessoa
              type="employee"
              initialData={selectedEmployee}
              onSuccess={handleCloseDialog}
              onCancel={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, documento ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : employees && employees.length > 0 ? (
            <div className="space-y-4">
              {employees.map((employee: any) => (
                <Card key={employee.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{employee.name}</h3>
                          {!employee.active && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                          {employee.employees?.[0]?.position && (
                            <Badge variant="outline">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {employee.employees[0].position}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          {employee.document && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Doc:</span>
                              <span>{employee.document}</span>
                            </div>
                          )}
                          {employee.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{employee.phone}</span>
                            </div>
                          )}
                          {employee.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{employee.email}</span>
                            </div>
                          )}
                          {employee.employees?.[0]?.department && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Depto:</span>
                              <span>{employee.employees[0].department}</span>
                            </div>
                          )}
                        </div>

                        {employee.notes && (
                          <p className="text-sm text-muted-foreground italic mt-2">
                            {employee.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(employee.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum funcionário encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
