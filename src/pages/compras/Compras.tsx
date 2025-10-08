import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Package, TruckIcon, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Compras() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: purchases, isLoading } = useQuery({
    queryKey: ["purchases", search],
    queryFn: async () => {
      let query = supabase
        .from("purchases")
        .select(`
          *,
          people!purchases_supplier_id_fkey (
            name,
            document,
            phone,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(
          `purchase_number.ilike.%${search}%,people.name.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "outline" | "destructive", label: string, icon: any }
    > = {
      draft: { variant: "secondary", label: "Rascunho", icon: Package },
      sent: { variant: "default", label: "Enviado", icon: TruckIcon },
      confirmed: { variant: "default", label: "Confirmado", icon: CheckCircle2 },
      partially_received: { variant: "outline", label: "Parcialmente Recebido", icon: Package },
      received: { variant: "default", label: "Recebido", icon: CheckCircle2 },
      cancelled: { variant: "destructive", label: "Cancelado", icon: XCircle },
    };

    const { variant, label, icon: Icon } = variants[status] || variants.draft;
    
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compras</h1>
          <p className="text-muted-foreground">Gerencie seus pedidos de compra</p>
        </div>
        <Button onClick={() => navigate("/compras/nova")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Compra
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou fornecedor..."
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
          ) : purchases && purchases.length > 0 ? (
            <div className="space-y-4">
              {purchases.map((purchase: any) => (
                <Card
                  key={purchase.id}
                  className="hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/compras/${purchase.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            {purchase.purchase_number}
                          </h3>
                          {getStatusBadge(purchase.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Fornecedor:</span>
                            <p className="font-medium">{purchase.people?.name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Data:</span>
                            <p className="font-medium">
                              {format(new Date(purchase.purchase_date), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Previsão Entrega:</span>
                            <p className="font-medium">
                              {purchase.expected_delivery_date
                                ? format(new Date(purchase.expected_delivery_date), "dd/MM/yyyy", { locale: ptBR })
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total:</span>
                            <p className="font-medium text-primary">
                              R$ {parseFloat(purchase.total).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {purchase.notes && (
                          <p className="text-sm text-muted-foreground italic">
                            {purchase.notes}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/compras/${purchase.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma compra encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}