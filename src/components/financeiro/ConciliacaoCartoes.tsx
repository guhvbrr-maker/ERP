import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ConciliacaoCartoes() {
  const { data: reconciliations, isLoading } = useQuery({
    queryKey: ["card-reconciliations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_reconciliations")
        .select("*, card_brands(name)")
        .order("reference_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Conciliação de Cartões</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conciliação
        </Button>
      </div>

      <div className="grid gap-4">
        {reconciliations?.map((rec) => (
          <Card key={rec.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {rec.card_brands?.name} - {format(new Date(rec.reference_date), "MMMM/yyyy", { locale: ptBR })}
                </CardTitle>
                <Badge variant={rec.status === "reconciled" ? "default" : "secondary"}>
                  {rec.status === "reconciled" ? "Conciliado" : "Pendente"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Esperado</p>
                  <p className="font-semibold">R$ {Number(rec.expected_amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Recebido</p>
                  <p className="font-semibold">R$ {Number(rec.received_amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Diferença</p>
                  <p className={`font-semibold ${Number(rec.difference) !== 0 ? "text-red-600" : "text-green-600"}`}>
                    R$ {Number(rec.difference).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
