import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardFinanceiro } from "@/components/financeiro/DashboardFinanceiro";
import { ContasReceber } from "@/components/financeiro/ContasReceber";
import { ContasPagar } from "@/components/financeiro/ContasPagar";
import { ContasBancarias } from "@/components/financeiro/ContasBancarias";
import { FormasPagamento } from "@/components/financeiro/FormasPagamento";
import { BandeirasCartao } from "@/components/financeiro/BandeirasCartao";
import { ConciliacaoCartoes } from "@/components/financeiro/ConciliacaoCartoes";

export default function Financeiro() {
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão Financeira</h1>
          <p className="text-muted-foreground mt-1">
            Controle completo de contas, pagamentos e conciliação
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="receber">A Receber</TabsTrigger>
            <TabsTrigger value="pagar">A Pagar</TabsTrigger>
            <TabsTrigger value="contas">Contas/Caixa</TabsTrigger>
            <TabsTrigger value="pagamento">Formas</TabsTrigger>
            <TabsTrigger value="bandeiras">Bandeiras</TabsTrigger>
            <TabsTrigger value="conciliacao">Conciliação</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardFinanceiro />
          </TabsContent>

          <TabsContent value="receber">
            <ContasReceber />
          </TabsContent>

          <TabsContent value="pagar">
            <ContasPagar />
          </TabsContent>

          <TabsContent value="contas">
            <ContasBancarias />
          </TabsContent>

          <TabsContent value="pagamento">
            <FormasPagamento />
          </TabsContent>

          <TabsContent value="bandeiras">
            <BandeirasCartao />
          </TabsContent>

          <TabsContent value="conciliacao">
            <ConciliacaoCartoes />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
