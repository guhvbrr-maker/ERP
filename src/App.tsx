import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Categorias from "./pages/produtos/Categorias";
import Catalogo from "./pages/produtos/Catalogo";
import FormularioProduto from "./pages/produtos/FormularioProduto";
import Configuracoes from "./pages/Configuracoes";
import Vendas from "./pages/vendas/Vendas";
import NovaVenda from "./pages/vendas/NovaVenda";
import DetalheVenda from "./pages/vendas/DetalheVenda";
import Estoque from "./pages/estoque/Estoque";
import ContasReceber from "./pages/financeiro/ContasReceber";
import Entregas from "./pages/entregas/Entregas";
import MainLayout from "./components/layout/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/produtos/categorias" element={<MainLayout><Categorias /></MainLayout>} />
          <Route path="/produtos/catalogo" element={<MainLayout><Catalogo /></MainLayout>} />
          <Route path="/produtos/catalogo/novo" element={<MainLayout><FormularioProduto /></MainLayout>} />
          <Route path="/produtos/catalogo/:id/editar" element={<MainLayout><FormularioProduto /></MainLayout>} />
          <Route path="/vendas" element={<MainLayout><Vendas /></MainLayout>} />
          <Route path="/vendas/nova" element={<MainLayout><NovaVenda /></MainLayout>} />
          <Route path="/vendas/:id" element={<MainLayout><DetalheVenda /></MainLayout>} />
          <Route path="/estoque" element={<MainLayout><Estoque /></MainLayout>} />
          <Route path="/financeiro/contas-receber" element={<MainLayout><ContasReceber /></MainLayout>} />
          <Route path="/entregas" element={<MainLayout><Entregas /></MainLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
