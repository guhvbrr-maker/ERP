import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Shield,
  Building2,
  Users,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Organization {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  subscription_status: string;
  subscription_expires_at: string | null;
  max_users: number;
  max_products: number;
  max_sales_per_month: number;
  created_at: string;
}

interface OrgStats {
  organization_id: string;
  user_count: number;
  product_count: number;
  sales_count: number;
  total_sales_value: number;
}

export default function SuperAdmin() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgEmail, setNewOrgEmail] = useState("");

  // Check if user has super_admin role
  const { data: isSuperAdmin, isLoading: checkingRole } = useQuery({
    queryKey: ["is_super_admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .single();

      return !!data;
    },
  });

  // Fetch all organizations
  const { data: organizations = [], isLoading: loadingOrgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Organization[];
    },
    enabled: isSuperAdmin === true,
  });

  // Fetch organization statistics
  const { data: orgStats = [] } = useQuery({
    queryKey: ["organization_stats"],
    queryFn: async () => {
      const stats: OrgStats[] = [];
      
      for (const org of organizations) {
        // Count users
        const { count: userCount } = await supabase
          .from("organization_users")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", org.id);

        // Count products
        const { count: productCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", org.id);

        // Count sales and total value
        const { data: sales } = await supabase
          .from("sales")
          .select("total_amount")
          .eq("organization_id", org.id);

        const salesCount = sales?.length || 0;
        const totalSalesValue = sales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

        stats.push({
          organization_id: org.id,
          user_count: userCount || 0,
          product_count: productCount || 0,
          sales_count: salesCount,
          total_sales_value: totalSalesValue,
        });
      }

      return stats;
    },
    enabled: isSuperAdmin === true && organizations.length > 0,
  });

  // Toggle organization active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ orgId, isActive }: { orgId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("organizations")
        .update({ is_active: isActive })
        .eq("id", orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Status da organização atualizado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar organização: " + error.message);
    },
  });

  // Create new organization
  const createOrgMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      const { error } = await supabase
        .from("organizations")
        .insert({
          name: data.name,
          slug: slug,
          email: data.email,
          is_active: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Organização criada com sucesso!");
      setIsCreateDialogOpen(false);
      setNewOrgName("");
      setNewOrgEmail("");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar organização: " + error.message);
    },
  });

  if (checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-destructive" />
              Acesso Negado
            </CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStats = (orgId: string) => {
    return orgStats.find(s => s.organization_id === orgId) || {
      user_count: 0,
      product_count: 0,
      sales_count: 0,
      total_sales_value: 0,
    };
  };

  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter(o => o.is_active).length;
  const totalUsers = orgStats.reduce((sum, s) => sum + s.user_count, 0);
  const totalSales = orgStats.reduce((sum, s) => sum + s.total_sales_value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Painel Super Admin
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerenciamento central do sistema ERP
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Organização
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Organização</DialogTitle>
              <DialogDescription>
                Adicione uma nova empresa ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="org-name">Nome da Organização</Label>
                <Input
                  id="org-name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Nome da empresa"
                />
              </div>
              <div>
                <Label htmlFor="org-email">Email de Contato</Label>
                <Input
                  id="org-email"
                  type="email"
                  value={newOrgEmail}
                  onChange={(e) => setNewOrgEmail(e.target.value)}
                  placeholder="contato@empresa.com"
                />
              </div>
              <Button
                onClick={() => createOrgMutation.mutate({ name: newOrgName, email: newOrgEmail })}
                disabled={!newOrgName || !newOrgEmail || createOrgMutation.isPending}
                className="w-full"
              >
                {createOrgMutation.isPending ? "Criando..." : "Criar Organização"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Organizações</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrgs}</div>
            <p className="text-xs text-muted-foreground">
              {activeOrgs} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Em todas as organizações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orgStats.reduce((sum, s) => sum + s.sales_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Todas as organizações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalSales)}
            </div>
            <p className="text-xs text-muted-foreground">
              Todas as organizações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Organizations List */}
      <Card>
        <CardHeader>
          <CardTitle>Organizações Cadastradas</CardTitle>
          <CardDescription>
            Gerencie o acesso e visualize estatísticas de cada organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingOrgs ? (
            <div className="text-center py-8">Carregando...</div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma organização cadastrada ainda
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org) => {
                const stats = getStats(org.id);
                return (
                  <div
                    key={org.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{org.name}</h3>
                          <Badge variant={org.is_active ? "default" : "secondary"}>
                            {org.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                          <Badge variant="outline">
                            {org.subscription_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {org.email || "Sem email"} • Criada em{" "}
                          {new Date(org.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {org.is_active ? "Ativa" : "Inativa"}
                        </span>
                        <Switch
                          checked={org.is_active}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({
                              orgId: org.id,
                              isActive: checked,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 pt-3 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Usuários</p>
                        <p className="text-lg font-semibold">
                          {stats.user_count} / {org.max_users}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Produtos</p>
                        <p className="text-lg font-semibold">
                          {stats.product_count} / {org.max_products}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Vendas</p>
                        <p className="text-lg font-semibold">{stats.sales_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Faturamento</p>
                        <p className="text-lg font-semibold">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            notation: 'compact',
                          }).format(stats.total_sales_value)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
