import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentMethodForm } from "./PaymentMethodForm";

export function FormasPagamento() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const { data: methods, isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Formas de Pagamento</h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Forma
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Parcelamento</TableHead>
              <TableHead>Taxas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {methods?.map((method) => (
              <TableRow key={method.id}>
                <TableCell className="font-medium">{method.name}</TableCell>
                <TableCell>{method.type}</TableCell>
                <TableCell>
                  <Badge variant={method.has_installments ? "default" : "secondary"}>
                    {method.has_installments ? "Sim" : "Não"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={method.has_fees ? "default" : "secondary"}>
                    {method.has_fees ? "Sim" : "Não"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={method.active ? "default" : "secondary"}>
                    {method.active ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedMethod(method.id);
                      setIsFormOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMethod ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}
            </DialogTitle>
          </DialogHeader>
          <PaymentMethodForm
            methodId={selectedMethod}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedMethod(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
