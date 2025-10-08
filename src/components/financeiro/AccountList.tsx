import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface AccountListProps {
  accounts: any[];
  isLoading: boolean;
  type: "receivable" | "payable";
  onEdit: (id: string) => void;
}

const STATUS_LABELS = {
  pending: "Pendente",
  partially_paid: "Pago Parcialmente",
  paid: "Pago",
  overdue: "Vencido",
  cancelled: "Cancelado",
};

const STATUS_COLORS = {
  pending: "bg-yellow-500",
  partially_paid: "bg-blue-500",
  paid: "bg-green-500",
  overdue: "bg-red-500",
  cancelled: "bg-gray-500",
};

export function AccountList({ accounts, isLoading, type, onEdit }: AccountListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead>Restante</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => {
            const isOverdue = new Date(account.due_date) < new Date() && account.status === 'pending';
            return (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.description}</TableCell>
                <TableCell>
                  {format(new Date(account.due_date), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>R$ {Number(account.amount).toFixed(2)}</TableCell>
                <TableCell>R$ {Number(account.paid_amount).toFixed(2)}</TableCell>
                <TableCell>R$ {Number(account.remaining_amount).toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[isOverdue ? 'overdue' : account.status as keyof typeof STATUS_COLORS]}`} />
                    <span className="text-sm">
                      {STATUS_LABELS[isOverdue ? 'overdue' : account.status as keyof typeof STATUS_LABELS]}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(account.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {account.status !== 'paid' && (
                      <Button variant="ghost" size="sm">
                        <DollarSign className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
