import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";

interface CardFeesManagerProps {
  brandId: string;
  onClose: () => void;
}

export function CardFeesManager({ brandId, onClose }: CardFeesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newFee, setNewFee] = useState({
    installments: 1,
    fee_percentage: 0,
    fixed_fee: 0,
    days_to_receive: 30,
  });

  const { data: brand } = useQuery({
    queryKey: ["card-brand", brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_brands")
        .select("*")
        .eq("id", brandId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: fees } = useQuery({
    queryKey: ["card-fees", brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_fees")
        .select("*")
        .eq("card_brand_id", brandId)
        .order("installments");
      if (error) throw error;
      return data;
    },
  });

  const addFeeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("card_fees").insert([{
        card_brand_id: brandId,
        ...newFee,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-fees", brandId] });
      toast({ title: "Taxa adicionada" });
      setNewFee({
        installments: 1,
        fee_percentage: 0,
        fixed_fee: 0,
        days_to_receive: 30,
      });
    },
  });

  const deleteFeeMutation = useMutation({
    mutationFn: async (feeId: string) => {
      const { error } = await supabase.from("card_fees").delete().eq("id", feeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-fees", brandId] });
      toast({ title: "Taxa removida" });
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Taxas para {brand?.name}</h3>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parcelas</TableHead>
              <TableHead>Taxa (%)</TableHead>
              <TableHead>Taxa Fixa</TableHead>
              <TableHead>Dias p/ Receber</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fees?.map((fee) => (
              <TableRow key={fee.id}>
                <TableCell>{fee.installments}x</TableCell>
                <TableCell>{Number(fee.fee_percentage).toFixed(2)}%</TableCell>
                <TableCell>R$ {Number(fee.fixed_fee).toFixed(2)}</TableCell>
                <TableCell>{fee.days_to_receive} dias</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFeeMutation.mutate(fee.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            <TableRow>
              <TableCell>
                <Input
                  type="number"
                  min="1"
                  max="36"
                  value={newFee.installments}
                  onChange={(e) =>
                    setNewFee({ ...newFee, installments: parseInt(e.target.value) || 1 })
                  }
                  placeholder="Parcelas"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  value={newFee.fee_percentage}
                  onChange={(e) =>
                    setNewFee({ ...newFee, fee_percentage: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="%"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  value={newFee.fixed_fee}
                  onChange={(e) =>
                    setNewFee({ ...newFee, fixed_fee: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="R$"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={newFee.days_to_receive}
                  onChange={(e) =>
                    setNewFee({ ...newFee, days_to_receive: parseInt(e.target.value) || 30 })
                  }
                  placeholder="Dias"
                />
              </TableCell>
              <TableCell>
                <Button onClick={() => addFeeMutation.mutate()} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </div>
  );
}
