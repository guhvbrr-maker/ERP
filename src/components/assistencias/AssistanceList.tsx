import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Search, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AssistanceListProps {
  onEdit: (id: string) => void;
}

const STATUS_LABELS = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  waiting_parts: "Aguardando Peças",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_COLORS = {
  pending: "bg-yellow-500",
  in_progress: "bg-blue-500",
  waiting_parts: "bg-orange-500",
  completed: "bg-green-500",
  cancelled: "bg-gray-500",
};

export function AssistanceList({ onEdit }: AssistanceListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: assistances, isLoading } = useQuery({
    queryKey: ["technical-assistances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technical_assistances")
        .select(`
          *,
          sales(sale_number, sale_date),
          employees(person_id, people(name))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredAssistances = assistances?.filter((assistance) => {
    const matchesSearch =
      assistance.assistance_number.toLowerCase().includes(search.toLowerCase()) ||
      assistance.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      assistance.product_name.toLowerCase().includes(search.toLowerCase()) ||
      (assistance.sales?.sale_number || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || assistance.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, cliente, produto ou venda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="waiting_parts">Aguardando Peças</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Venda</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Data Abertura</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssistances?.map((assistance) => (
              <TableRow key={assistance.id}>
                <TableCell className="font-medium">{assistance.assistance_number}</TableCell>
                <TableCell>{assistance.customer_name}</TableCell>
                <TableCell>{assistance.product_name}</TableCell>
                <TableCell>
                  {assistance.sales ? (
                    <Badge variant="outline">{assistance.sales.sale_number}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[assistance.status as keyof typeof STATUS_COLORS]}`} />
                    <span className="text-sm">
                      {STATUS_LABELS[assistance.status as keyof typeof STATUS_LABELS]}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {assistance.employees?.people ? (
                    <span className="text-sm">{assistance.employees.people.name}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">Não atribuído</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {format(new Date(assistance.opened_date), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={assistance.priority === "urgent" ? "destructive" : "secondary"}>
                    {assistance.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(assistance.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
