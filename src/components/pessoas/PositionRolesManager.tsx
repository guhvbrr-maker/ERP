import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Shield, Info } from "lucide-react";

const systemRoles = [
  { value: "admin", label: "Administrador", description: "Acesso total ao sistema" },
  { value: "manager", label: "Gerente", description: "Gerenciar vendas, funcionários e fornecedores" },
  { value: "salesperson", label: "Vendedor", description: "Criar vendas e gerenciar clientes" },
  { value: "accountant", label: "Financeiro", description: "Gerenciar pagamentos e fornecedores" },
  { value: "warehouse", label: "Estoque", description: "Gerenciar estoque e produtos" },
];

interface PositionRolesManagerProps {
  positionId?: string;
}

export function PositionRolesManager({ positionId }: PositionRolesManagerProps) {
  const queryClient = useQueryClient();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const { data: positionRoles, isLoading } = useQuery({
    queryKey: ["position_roles", positionId],
    queryFn: async () => {
      if (!positionId) return [];
      const { data, error } = await supabase
        .from("position_roles")
        .select("*")
        .eq("position_id", positionId);
      if (error) throw error;
      setSelectedRoles(data.map((pr: any) => pr.role));
      return data;
    },
    enabled: !!positionId,
  });

  const saveMutation = useMutation({
    mutationFn: async (roles: string[]) => {
      if (!positionId) throw new Error("Position ID is required");

      // Delete existing roles
      await supabase
        .from("position_roles")
        .delete()
        .eq("position_id", positionId);

      // Insert new roles
      if (roles.length > 0) {
        const { error } = await supabase.from("position_roles").insert(
          roles.map((role) => ({
            position_id: positionId,
            role: role as "admin" | "manager" | "salesperson" | "accountant" | "warehouse",
          }))
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["position_roles", positionId] });
      toast.success("Permissões atualizadas com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar permissões: " + error.message);
    },
  });

  const handleToggleRole = (roleValue: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleValue)
        ? prev.filter((r) => r !== roleValue)
        : [...prev, roleValue]
    );
  };

  const handleSave = () => {
    saveMutation.mutate(selectedRoles);
  };

  if (!positionId) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <Info className="h-5 w-5 mr-2" />
        Salve o cargo primeiro para configurar as permissões
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5" />
        <div>
          <h3 className="font-medium">Permissões do Sistema</h3>
          <p className="text-sm text-muted-foreground">
            Funcionários com este cargo terão as permissões selecionadas
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {systemRoles.map((role) => (
          <div
            key={role.value}
            className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              id={role.value}
              checked={selectedRoles.includes(role.value)}
              onCheckedChange={() => handleToggleRole(role.value)}
            />
            <div className="flex-1">
              <Label
                htmlFor={role.value}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {role.label}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {role.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Salvando..." : "Salvar Permissões"}
        </Button>
      </div>
    </div>
  );
}
