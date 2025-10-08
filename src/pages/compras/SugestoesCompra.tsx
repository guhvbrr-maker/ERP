import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function SugestoesCompra() {
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["purchase-suggestions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_suggestions")
        .select(`
          *,
          products (
            id,
            name,
            sku,
            cost_price,
            stocks (quantity)
          )
        `)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const generateSuggestions = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("calculate_purchase_suggestions");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sugestões geradas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["purchase-suggestions"] });
      setGenerating(false);
    },
    onError: (error: any) => {
      toast.error(`Erro ao gerar sugestões: ${error.message}`);
      setGenerating(false);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("purchase_suggestions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-suggestions"] });
      toast.success("Status atualizado!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const createPurchaseFromSuggestions = () => {
    const approvedSuggestions = suggestions?.filter((s) => s.status === "approved") || [];
    
    if (approvedSuggestions.length === 0) {
      toast.error("Nenhuma sugestão aprovada para criar pedido");
      return;
    }

    // Navigate to new purchase with suggestions
    navigate("/compras/nova", { 
      state: { suggestions: approvedSuggestions } 
    });
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: "destructive" | "default" | "secondary", icon: any }> = {
      urgent: { variant: "destructive", icon: AlertTriangle },
      high: { variant: "destructive", icon: AlertTriangle },
      normal: { variant: "default", icon: AlertTriangle },
      low: { variant: "secondary", icon: AlertTriangle },
    };

    const { variant, icon: Icon } = variants[priority] || variants.normal;
    
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {priority === "urgent" ? "Urgente" : priority === "high" ? "Alta" : priority === "normal" ? "Normal" : "Baixa"}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline", label: string }> = {
      pending: { variant: "secondary", label: "Pendente" },
      approved: { variant: "default", label: "Aprovada" },
      ordered: { variant: "outline", label: "Pedido Criado" },
      dismissed: { variant: "outline", label: "Dispensada" },
    };

    const { variant, label } = variants[status] || variants.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sugestões de Compra</h1>
          <p className="text-muted-foreground">
            Baseadas em vendas, estoque e tempo de entrega
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setGenerating(true);
              generateSuggestions.mutate();
            }}
            disabled={generating}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${generating ? "animate-spin" : ""}`} />
            Gerar Sugestões
          </Button>
          {suggestions?.some(s => s.status === "approved") && (
            <Button onClick={createPurchaseFromSuggestions}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Criar Pedido
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : suggestions && suggestions.length > 0 ? (
        <div className="grid gap-4">
          {suggestions.map((suggestion: any) => (
            <Card key={suggestion.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        {suggestion.products?.name}
                      </h3>
                      {getPriorityBadge(suggestion.priority)}
                      {getStatusBadge(suggestion.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">SKU:</span>
                        <p className="font-medium">{suggestion.products?.sku}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Estoque Atual:</span>
                        <p className="font-medium">
                          {suggestion.products?.stocks?.[0]?.quantity || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Qtd. Sugerida:</span>
                        <p className="font-medium text-primary">
                          {suggestion.suggested_quantity}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Custo Estimado:</span>
                        <p className="font-medium">
                          R$ {((suggestion.products?.cost_price || 0) * suggestion.suggested_quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                    </div>
                  </div>

                  {suggestion.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="default"
                        onClick={() => updateStatus.mutate({ id: suggestion.id, status: "approved" })}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateStatus.mutate({ id: suggestion.id, status: "dismissed" })}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma sugestão de compra no momento</p>
            <p className="text-sm mt-2">
              Clique em "Gerar Sugestões" para analisar seu estoque
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}