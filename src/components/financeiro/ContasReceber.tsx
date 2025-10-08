import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AccountForm } from "./AccountForm";
import { AccountList } from "./AccountList";

export function ContasReceber() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["receivable-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_accounts")
        .select("*")
        .eq("account_type", "receivable")
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contas a Receber</h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      <AccountList
        accounts={accounts || []}
        isLoading={isLoading}
        type="receivable"
        onEdit={(id) => {
          setSelectedAccount(id);
          setIsFormOpen(true);
        }}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAccount ? "Editar Conta a Receber" : "Nova Conta a Receber"}
            </DialogTitle>
          </DialogHeader>
          <AccountForm
            accountId={selectedAccount}
            accountType="receivable"
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
