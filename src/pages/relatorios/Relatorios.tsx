import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RelatoriosVendas } from "@/components/relatorios/RelatoriosVendas";
import { RelatoriosFinanceiro } from "@/components/relatorios/RelatoriosFinanceiro";
import { RelatoriosEstoque } from "@/components/relatorios/RelatoriosEstoque";
import { RelatoriosCompras } from "@/components/relatorios/RelatoriosCompras";
import { DashboardAnalytics } from "@/components/relatorios/DashboardAnalytics";
import { BarChart3 } from "lucide-react";

export default function Relatorios() {
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Business Intelligence</h1>
            <p className="text-muted-foreground mt-1">
              Relatórios gerenciais e análise avançada de dados
            </p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
            <TabsTrigger value="compras">Compras</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardAnalytics />
          </TabsContent>

          <TabsContent value="vendas">
            <RelatoriosVendas />
          </TabsContent>

          <TabsContent value="financeiro">
            <RelatoriosFinanceiro />
          </TabsContent>

          <TabsContent value="estoque">
            <RelatoriosEstoque />
          </TabsContent>

          <TabsContent value="compras">
            <RelatoriosCompras />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
