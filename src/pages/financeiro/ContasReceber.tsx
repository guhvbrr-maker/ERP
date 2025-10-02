import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ContasReceber = () => {
  const { data: payments = [] } = useQuery({
    queryKey: ["sale_payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_payments")
        .select(`
          *,
          sales (
            id,
            sale_number,
            customer_name
          )
        `)
        .order("due_date", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const totalPending = payments
    .filter((p: any) => p.status === "pending")
    .reduce((sum, p: any) => sum + Number(p.amount), 0);

  const totalReceived = payments
    .filter((p: any) => p.status === "paid")
    .reduce((sum, p: any) => sum + Number(p.amount), 0);

  const totalOverdue = payments
    .filter((p: any) => p.status === "pending" && new Date(p.due_date) < new Date())
    .reduce((sum, p: any) => sum + Number(p.amount), 0);

  const pendingCount = payments.filter((p: any) => p.status === "pending").length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (payment: any) => {
    if (payment.status === "paid") {
      return <Badge variant="success">Pago</Badge>;
    }
    if (new Date(payment.due_date) < new Date()) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    return <Badge variant="warning">Pendente</Badge>;
  };

  const renderPaymentsTable = (filteredPayments: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Venda</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Forma Pagamento</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredPayments.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              Nenhum pagamento encontrado
            </TableCell>
          </TableRow>
        ) : (
          filteredPayments.map((payment: any) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">
                {payment.sales?.sale_number}
              </TableCell>
              <TableCell>{payment.sales?.customer_name}</TableCell>
              <TableCell className="capitalize">
                {payment.payment_method?.replace("_", " ")}
              </TableCell>
              <TableCell>
                {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(Number(payment.amount))}
              </TableCell>
              <TableCell>{getStatusBadge(payment)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contas a Receber</h1>
        <p className="text-muted-foreground">Gestão financeira de pagamentos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingCount} pagamentos pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalReceived)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalOverdue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPending + totalReceived)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="overdue">Vencidos</TabsTrigger>
              <TabsTrigger value="paid">Pagos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {renderPaymentsTable(payments)}
            </TabsContent>
            
            <TabsContent value="pending">
              {renderPaymentsTable(
                payments.filter((p: any) => 
                  p.status === "pending" && new Date(p.due_date) >= new Date()
                )
              )}
            </TabsContent>
            
            <TabsContent value="overdue">
              {renderPaymentsTable(
                payments.filter((p: any) => 
                  p.status === "pending" && new Date(p.due_date) < new Date()
                )
              )}
            </TabsContent>
            
            <TabsContent value="paid">
              {renderPaymentsTable(
                payments.filter((p: any) => p.status === "paid")
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContasReceber;