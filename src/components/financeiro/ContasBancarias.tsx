import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BankAccountForm } from "./BankAccountForm";
import { Badge } from "@/components/ui/badge";

export function ContasBancarias() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contas e Caixas</h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts?.map((account) => (
          <Card key={account.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{account.name}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedAccount(account.id);
                  setIsFormOpen(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Atual</p>
                <p className="text-2xl font-bold">
                  R$ {Number(account.current_balance).toFixed(2)}
                </p>
              </div>
              {account.bank_name && (
                <p className="text-sm text-muted-foreground">
                  {account.bank_name} - Ag: {account.agency} / Conta: {account.account_number}
                </p>
              )}
              <Badge variant={account.active ? "default" : "secondary"}>
                {account.active ? "Ativa" : "Inativa"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAccount ? "Editar Conta" : "Nova Conta/Caixa"}
            </DialogTitle>
          </DialogHeader>
          <BankAccountForm
            accountId={selectedAccount}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedAccount(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
