import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Calendar, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface TaskListProps {
  tasks: any[];
  onEditTask: (task: any) => void;
}

const priorityColors = {
  low: "bg-gray-500",
  normal: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const priorityLabels = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const statusLabels = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  blocked: "Bloqueado",
  review: "Em Revisão",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export function TaskList({ tasks, onEditTask }: TaskListProps) {
  const isOverdue = (dueDate: string | null, status: string) => {
    return dueDate && new Date(dueDate) < new Date() && status !== "completed";
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Departamento</TableHead>
            <TableHead>Atribuído</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Nenhuma tarefa encontrada
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id} className={isOverdue(task.due_date, task.status) ? "bg-red-50" : ""}>
                <TableCell>
                  <div>
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {task.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {statusLabels[task.status as keyof typeof statusLabels]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                    {priorityLabels[task.priority as keyof typeof priorityLabels]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.department ? (
                    <span className="text-sm">{task.department.name}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.assigned_employee ? (
                    <div className="flex items-center gap-1 text-sm">
                      <User className="h-3 w-3" />
                      <span>{task.assigned_employee.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Não atribuído</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.due_date ? (
                    <div className={`flex items-center gap-1 text-sm ${isOverdue(task.due_date, task.status) ? "text-red-600 font-semibold" : ""}`}>
                      {isOverdue(task.due_date, task.status) && <AlertCircle className="h-4 w-4" />}
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(task.due_date), "dd/MM/yyyy")}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEditTask(task)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
