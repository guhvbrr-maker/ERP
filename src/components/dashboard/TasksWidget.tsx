import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, Calendar, User, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export function TasksWidget() {
  const navigate = useNavigate();

  const { data: myTasks, isLoading } = useQuery({
    queryKey: ["dashboardTasks"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get employee ID for current user
      const { data: employee } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!employee) return [];

      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          department:departments(name)
        `)
        .eq("assigned_to", employee.id)
        .in("status", ["pending", "in_progress", "blocked"])
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const priorityColors = {
    low: "bg-gray-500",
    normal: "bg-blue-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  };

  const statusLabels = {
    pending: "Pendente",
    in_progress: "Em Andamento",
    blocked: "Bloqueado",
  };

  const isOverdue = (dueDate: string | null) => {
    return dueDate && new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Minhas Tarefas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground py-4">
            Carregando...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Minhas Tarefas
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/tarefas")}
            className="text-xs"
          >
            Ver todas
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!myTasks || myTasks.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            🎉 Você não tem tarefas pendentes!
          </div>
        ) : (
          <div className="space-y-3">
            {myTasks.map((task) => (
              <div
                key={task.id}
                className={`p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                  isOverdue(task.due_date) ? "border-red-500 bg-red-50/50" : ""
                }`}
                onClick={() => navigate("/tarefas")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={`${
                          priorityColors[task.priority as keyof typeof priorityColors]
                        } text-xs`}
                      >
                        {task.priority === "urgent" && "🚨"}
                        {task.priority === "high" && "⚠️"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {statusLabels[task.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm truncate">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {task.department && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{task.department.name}</span>
                        </div>
                      )}
                      {task.due_date && (
                        <div
                          className={`flex items-center gap-1 ${
                            isOverdue(task.due_date) ? "text-red-600 font-semibold" : ""
                          }`}
                        >
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(task.due_date), "dd/MM")}</span>
                          {isOverdue(task.due_date) && " - Vencida"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
